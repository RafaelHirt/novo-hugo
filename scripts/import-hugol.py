"""Extract only the seven approved sheets; never evaluate workbook formulas.

Usage: python scripts/import-hugol.py /path/to/workbook.xlsx
Requires openpyxl for this one-time import, not for running the dashboard.
"""
import hashlib
import json
import sys
from decimal import Decimal, ROUND_HALF_UP
from pathlib import Path

import openpyxl

SHEETS = [
    'HUGO - BASE HUGOL (Sem aumento)',
    'HUGO - (Novo Prédio - Saídas)',
    'HUGO - (Com banco de sangue)',
    'HUGO - (Com banco e ressoância)',
    'HUGO(com banco, ressonância SAD',
    'HUGO - banc, ress, SAD, Hemodin',
    'HUGO - + adequaçãode leitos',
]
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


def extract(values, formulas, same=False):
    result = []
    groups = SAME_GROUPS if same else NEW_GROUPS
    for start, end, group in groups:
        for index in range(start, end + 1):
            def cell(column):
                return values[f'{column}{index}'].value
            name = str(cell('C')).strip()
            criterion = str(cell('D')).strip()
            kind = 'bed' if criterion == 'Paciente-dia' else 'surgery' if criterion == 'Hora Cirúrgica' else 'service'
            qty_column = ('E' if same else 'I') if kind in ('bed', 'surgery') else ('G' if same else 'K')
            total_column, volume_column = ('I', 'G') if same else ('P', 'K')
            factor = cell('F' if same else 'J') if kind in ('bed', 'surgery') else None
            if kind == 'bed':
                factor = float(Decimal(str(factor)) * 100)
            item = {
                'id': f"{'same' if same else 'new'}-{index}",
                'name': name, 'group': group, 'criterion': criterion, 'kind': kind,
                'qty': cell(qty_column), 'unit': cell('H' if same else 'M'),
                'sourceVolume': cell(volume_column), 'sourceTotalCents': cents(cell(total_column)),
                'sourceRow': index, 'sourceCell': f'{total_column}{index}',
                'countedInWorkbook': same or index != 11,
            }
            if factor is not None:
                item['factor'] = factor
            if kind == 'bed':
                item['bedType'] = 'observation' if name == 'PS Observação' else 'icu' if group == 'UTI' else 'ward'
                item['volumeRounding'] = 'nearest' if same else 'up'
            elif kind == 'surgery':
                item['volumeRounding'] = 'nearest' if same else 'none'
            result.append(item)
    return result


path = Path(sys.argv[1])
values = openpyxl.load_workbook(path, data_only=True)
formulas = openpyxl.load_workbook(path, data_only=False)
same = extract(values[SHEETS[0]], formulas[SHEETS[0]], same=True)
versions = [extract(values[name], formulas[name]) for name in SHEETS[1:]]
sheet_totals = [cents(values[SHEETS[0]]['I71'].value)] + [cents(values[name]['P89'].value) for name in SHEETS[1:]]
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
        'amountCents': sheet_totals[index + 2] - sheet_totals[index + 1],
        'sourceSheet': SHEETS[index + 2], 'patches': patches,
    })

presets = [{
    'id': 'same', 'name': 'HUGO · Base HUGOL (sem aumento)', 'base': 'same',
    'selected': [], 'sourceSheet': SHEETS[0], 'sourceCell': 'I71', 'sourceTotalCents': sheet_totals[0],
}]
labels = ['Novo prédio · Sem incrementos', '+ Banco de sangue', '+ Banco e ressonância', '+ Banco, ressonância e SAD', '+ Banco, ressonância, SAD e hemodinâmica', '+ Todos e adequação de leitos']
for index, (name, rows) in enumerate(zip(SHEETS[1:], versions)):
    presets.append({
        'id': f'new-{index}', 'name': labels[index], 'base': 'new',
        'selected': [item[0] for item in INCREMENTS[:index]],
        'sourceSheet': name, 'sourceCell': 'P89', 'sourceTotalCents': sheet_totals[index + 1],
    })

payload = {
    'fileName': path.name, 'sha256': hashlib.sha256(path.read_bytes()).hexdigest(),
    'bases': {'same': same, 'new': versions[0]}, 'increments': increments,
    'presets': presets,
    'subtotalIssue': {
        'rowId': 'new-11', 'name': 'UI Clínica Cirúrgica Geral Adulto (2º Andar)',
        'beds': 40, 'amountCents': 130886445, 'formulaCell': 'P12', 'formula': '=SUM(P6:P10)',
    },
}
for preset in presets:
    rows = same if preset['base'] == 'same' else versions[int(preset['id'].split('-')[1])]
    expected = sum(row['sourceTotalCents'] for row in rows if row['countedInWorkbook'])
    assert expected == preset['sourceTotalCents'], (preset['id'], expected, preset['sourceTotalCents'])
target = Path(__file__).resolve().parents[1] / 'hugol-source.js'
target.write_text('// Approved worksheet values and incremental changes. Generated by scripts/import-hugol.py.\nexport const hugolSource = ' + json.dumps(payload, ensure_ascii=False, indent=2) + ';\n')
print(f'{len(same)} + {len(versions[0])} service rows, {len(increments)} independent increments, {len(presets)} checked worksheet totals -> {target.name}')
