"""Extract only approved scenario sheets; never evaluate workbook formulas.

Usage: python scripts/import-hugol.py /path/to/workbook.xlsx [--basis hugol|hugo|updated]
Requires openpyxl for this one-time import, not for running the dashboard.
"""
import argparse
import hashlib
import json
import re
from decimal import Decimal, ROUND_HALF_UP
from pathlib import Path

import openpyxl

HUGOL_SHEETS = [
    ('HUGO - BASE HUGOL', 'HUGO - BASE HUGOL (Sem aumento)'),
    ('HUGO - SEM BANCO DE SANGUE', 'HUGO - (Novo Prédio - Saídas)'),
    ('HUGO - SEM RESSONÂNCIA', 'HUGO - (Com banco de sangue)'),
    ('HUGO - SEM SAD E HEMODINÂMICA', 'HUGO - (Com banco e ressoância)'),
    ('HUGO - SEM HEMODINÂMICA', 'HUGO(com banco, ressonância SAD'),
    ('HUGO - MESMOS LEITOS', 'HUGO - banc, ress, SAD, Hemodin'),
    ('HUGO - FINAL', 'HUGO - + adequaçãode leitos'),
]
HUGO_SHEETS = ['HUGO - SEM BANCO DE SANGUE', 'HUGO - SEM RESSONÂNCIA', 'HUGO - SEM SAD E HEMODINÂMICA', 'HUGO - SEM HEMODINÂMICA', 'HUGO - MENOS LEITOS', 'HUGO - FINAL']
INCREMENTS = [
    ('blood', 'Banco de sangue', '750 bolsas de sangue total e 25 bolsas de plaquetas por aférese.'),
    ('mri', 'Ressonância magnética', '100 exames internos e 300 externos por mês.'),
    ('sad', 'SAD', '120 atendimentos domiciliares por mês.'),
    ('hemodynamics', 'Hemodinâmica', '250 procedimentos por mês.'),
    ('beds', 'Adequação de leitos', '+35 leitos de UI e +20 de UTI, com ajuste dos volumes de SADT.'),
]
NEW_GROUPS = [
    (6, 11, 'Enfermarias'), (16, 18, 'UTI'), (23, 23, 'Emergência'),
    (26, 26, 'Serviço de desospitalização'), (29, 29, 'Hospital dia'),
    (32, 34, 'Atendimento ambulatorial'), (38, 42, 'Cirurgias'),
    (46, 65, 'SADT interno'), (69, 76, 'SADT externo'),
    (80, 80, 'Hemodinâmica'), (83, 84, 'Hemoterapia'),
    (87, 87, 'Escritório de gestão de altas'),
]
SAME_GROUPS = [
    (6, 10, 'Enfermarias'), (13, 17, 'UTI'), (22, 22, 'Emergência'),
    (25, 25, 'Hospital dia'), (28, 30, 'Atendimento ambulatorial'),
    (34, 35, 'Cirurgias'), (39, 57, 'SADT interno'),
    (61, 65, 'SADT externo'), (69, 69, 'Escritório de gestão de altas'),
]


def cents(value):
    return int(Decimal(str(value)).quantize(Decimal('.01'), rounding=ROUND_HALF_UP) * 100)


def extract(values, formulas, same=False, prefix='', updated=False):
    result = []
    groups = SAME_GROUPS if same else NEW_GROUPS
    total_column = ('P' if updated else 'I') if same else 'S' if updated else 'P'
    if not same:
        subtotal_formula = formulas[f'{total_column}12'].value.replace(' ', '').upper()
        subtotal_range = re.fullmatch(rf'=SUM\({total_column}(\d+):{total_column}(\d+)\)', subtotal_formula)
        if not subtotal_range:
            raise ValueError(f'Unsupported ward subtotal: {subtotal_formula}')
        financial_ward_rows = range(int(subtotal_range[1]), int(subtotal_range[2]) + 1)
    for start, end, group in groups:
        for index in range(start, end + 1):
            def cell(column):
                return values[f'{column}{index}'].value
            name = str(cell('C')).strip()
            criterion = str(cell('D')).strip()
            kind = 'bed' if criterion == 'Paciente-dia' else 'surgery' if criterion == 'Hora Cirúrgica' else 'service'
            quantity_column = ('H' if updated else 'E') if same else 'I'
            volume_column = ('J' if updated else 'G') if same else 'K'
            qty_column = quantity_column if kind in ('bed', 'surgery') else volume_column
            unit_cell = f"{'H' if same else 'M'}{index}"
            if updated:
                price_formula = formulas[f'{total_column}{index}'].value.replace(' ', '').upper()
                pattern = rf'=ROUND\(J{index}\*([KLM]\d+),2\)' if same else rf'=K{index}\*([MNO]\d+)'
                unit_reference = re.fullmatch(pattern, price_formula)
                if not unit_reference:
                    raise ValueError(f'Unsupported estimated cost formula at {values.title}!{total_column}{index}: {price_formula}')
                unit_cell = unit_reference[1]
            factor_column = ('I' if updated else 'F') if same else 'J'
            factor = cell(factor_column) if kind in ('bed', 'surgery') else None
            if kind == 'bed':
                factor = float(Decimal(str(factor)) * 100)
            item = {
                'id': f"{prefix}{'same' if same else 'new'}-{index}",
                'name': name, 'group': group, 'criterion': criterion, 'kind': kind,
                'qty': cell(qty_column), 'unit': values[unit_cell].value,
                'sourceVolume': cell(volume_column), 'sourceTotalCents': cents(cell(total_column)),
                'sourceRow': index, 'sourceCell': f'{total_column}{index}',
                'countedInWorkbook': same or group != 'Enfermarias' or index in financial_ward_rows,
            }
            if updated:
                percentiles = dict(zip('KLM' if same else 'MNO', ['P25', 'P50', 'P75']))
                item.update(sourceUnitCell=unit_cell, unitBasis=percentiles[unit_cell[0]], sourceFormula=price_formula)
            if factor is not None:
                item['factor'] = factor
            if kind == 'bed':
                item['bedType'] = 'observation' if name == 'PS Observação' else 'icu' if group == 'UTI' else 'ward'
                item['volumeRounding'] = 'nearest' if same else 'up'
            elif kind == 'surgery':
                item['volumeRounding'] = 'nearest' if same else 'none'
            result.append(item)
    return result


parser = argparse.ArgumentParser()
parser.add_argument('workbook')
parser.add_argument('--basis', choices=['hugol', 'hugo', 'updated'], default='hugol')
args = parser.parse_args()
is_hugol = args.basis == 'hugol'
is_updated = args.basis == 'updated'
prefix = '' if is_hugol else 'updated-' if is_updated else 'hugo-'
new_total_column = 'S' if is_updated else 'P'
path = Path(args.workbook)
values = openpyxl.load_workbook(path, data_only=True)
formulas = openpyxl.load_workbook(path, data_only=False)
SHEETS = [next(name for name in alternatives if name in values.sheetnames) for alternatives in HUGOL_SHEETS] if is_hugol else HUGO_SHEETS
same_sheet = SHEETS[0] if is_hugol else 'HUGO - ATUAL' if is_updated else None
same = extract(values[same_sheet], formulas[same_sheet], same=True, prefix=prefix, updated=is_updated) if same_sheet else []
same_total_cell = 'P71' if is_updated else 'I71'
new_sheets = SHEETS[1:] if is_hugol else SHEETS
versions = [extract(values[name], formulas[name], prefix=prefix, updated=is_updated) for name in new_sheets]
new_totals = [cents(values[name][f'{new_total_column}89'].value) for name in new_sheets]
sheet_totals = ([cents(values[same_sheet][same_total_cell].value)] if same_sheet else []) + new_totals
increments = []
for index, (key, label, description) in enumerate(INCREMENTS):
    patches = {}
    for before, after in zip(versions[index], versions[index + 1]):
        assert before['id'] == after['id']
        patch = {field: value for field, value in after.items() if value != before.get(field)}
        if patch:
            patches[after['id']] = patch
    increments.append({
        'id': key, 'name': label, 'description': description,
        'amountCents': new_totals[index + 1] - new_totals[index],
        'sourceSheet': new_sheets[index + 1], 'patches': patches,
    })

presets = [{
    'id': 'same', 'name': 'HUGO - Base atualizada' if is_updated else 'HUGO · Base HUGOL (sem aumento)', 'base': 'same',
    'selected': [], 'sourceSheet': same_sheet, 'sourceCell': same_total_cell, 'sourceTotalCents': sheet_totals[0],
}] if same_sheet else []
labels = ['Novo Prédio - Base', '+ Banco de sangue', '+ Banco e ressonância', '+ Banco, ressonância e SAD', '+ Banco, ressonância, SAD e hemodinâmica', '+ Todos e adequação de leitos']
if is_updated:
    labels[0] = 'Novo Prédio - Base Ago/25 - Jul/26'
for index, (name, rows) in enumerate(zip(new_sheets, versions)):
    presets.append({
        'id': f'new-{index}', 'name': labels[index], 'base': 'new',
        'selected': [item[0] for item in INCREMENTS[:index]],
        'sourceSheet': name, 'sourceCell': f'{new_total_column}89', 'sourceTotalCents': new_totals[index],
    })

payload = {
    'fileName': path.name, 'sha256': hashlib.sha256(path.read_bytes()).hexdigest(),
    'bases': ({'same': same} if same_sheet else {}) | {'new': versions[0]}, 'increments': increments,
    'presets': presets,
    'bedAdequacy': {
        'referenceBeds': values[new_sheets[0]]['X4' if is_updated else 'U4'].value,
        'baseBeds': values[new_sheets[0]]['Y4' if is_updated else 'V4'].value,
        'sadtBaseQuantities': {
            row['id']: values[new_sheets[0]][f"{'V' if is_updated else 'S'}{row['sourceRow']}"].value
            for row in versions[0] if row['id'] in increments[-1]['patches'] and row['group'].startswith('SADT')
        },
    },
    'subtotalIssue': ({
        'rowId': prefix + 'new-11', 'name': 'UI Clínica Cirúrgica Geral Adulto (2º Andar)',
        'beds': 40, 'amountCents': next(row['sourceTotalCents'] for row in versions[0] if row['sourceRow'] == 11), 'formulaCell': 'P12', 'formula': '=SUM(P6:P10)',
    } if any(not row['countedInWorkbook'] for row in versions[0]) else None),
}
if is_updated:
    payload.update(periodLabel='Agosto/2025 a julho/2026', pricingLabel='Custo Total Estimado', totalColumn='S',
                   referenceBase='same', baseNames={'same': 'HUGO - Base atualizada', 'new': 'Novo Prédio - Base Ago/25 - Jul/26'},
                   referenceCaption='Sobre a base HUGO atualizada')
for preset in presets:
    rows = same if preset['base'] == 'same' else versions[int(preset['id'].split('-')[1])]
    expected = sum(row['sourceTotalCents'] for row in rows if row['countedInWorkbook'])
    assert expected == preset['sourceTotalCents'], (preset['id'], expected, preset['sourceTotalCents'])
target = Path(__file__).resolve().parents[1] / f'{args.basis}-source.js'
target.write_text(f'// Approved worksheet values and incremental changes. Generated by scripts/import-hugol.py.\nexport const {args.basis}Source = ' + json.dumps(payload, ensure_ascii=False, indent=2) + ';\n')
print(f'{len(same)} + {len(versions[0])} service rows, {len(increments)} independent increments, {len(presets)} checked worksheet totals -> {target.name}')
