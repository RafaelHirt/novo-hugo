"""Import only the HUGO - ATUAL sheet approved for values and production.

Usage: python scripts/import-production.py /path/to/workbook.xlsx
Reads cached values and checks selected green cells against cost formulas.
"""
import argparse
import hashlib
import json
import re
from decimal import Decimal, ROUND_HALF_UP
from pathlib import Path

import openpyxl

parser = argparse.ArgumentParser()
parser.add_argument('workbook')
args = parser.parse_args()
path = Path(args.workbook)
sheet_name = 'HUGO - ATUAL'
values = openpyxl.load_workbook(path, data_only=True)[sheet_name]
formulas = openpyxl.load_workbook(path, data_only=False)[sheet_name]
groups = [(6, 10, 'Enfermarias'), (13, 17, 'UTI'), (22, 22, 'Emergência'),
          (25, 25, 'Hospital dia'), (28, 30, 'Atendimento ambulatorial'),
          (34, 35, 'Cirurgias'), (39, 57, 'SADT interno'),
          (61, 65, 'SADT externo'), (69, 69, 'Escritório de gestão de altas')]


def cents(value):
    return int(Decimal(str(value)).quantize(Decimal('.01'), rounding=ROUND_HALF_UP) * 100)


rows = []
assert [values[f'{column}3'].value for column in 'KLM'] == ['P25', 'P50', 'P75']
green = values['L6'].fill.fgColor
for first, last, group in groups:
    for index in range(first, last + 1):
        formula = formulas[f'P{index}'].value.replace(' ', '').upper()
        match = re.fullmatch(rf'=ROUND\(J{index}\*([KLM]{index}),2\)', formula)
        if not match:
            raise ValueError(f'Unsupported cost formula at P{index}: {formula}')
        selected = [f'{column}{index}' for column in 'KLM'
                    if values[f'{column}{index}'].fill.patternType == 'solid'
                    and values[f'{column}{index}'].fill.fgColor == green]
        if selected != [match[1]]:
            raise ValueError(f'Green selection and formula differ at P{index}: {selected}, {formula}')
        unit_cell = match[1]
        criterion = str(values[f'D{index}'].value).strip()
        name = str(values[f'C{index}'].value).strip()
        kind = 'bed' if criterion == 'Paciente-dia' else 'surgery' if criterion == 'Hora Cirúrgica' else 'service'
        row = dict(id=f'production-{index}', name=name, group=group, criterion=criterion, kind=kind,
                   qty=values[f'{"H" if kind != "service" else "J"}{index}'].value,
                   unit=values[unit_cell].value, sourceVolume=values[f'J{index}'].value,
                   sourceTotalCents=cents(values[f'P{index}'].value), sourceRow=index,
                   sourceCell=f'P{index}', sourceSheet=sheet_name, sourceUnitCell=unit_cell,
                   sourceGreenCell=selected[0], sourceFormula=formula, countedInWorkbook=True,
                   unitBasis={'K': 'P25', 'L': 'P50', 'M': 'P75'}[unit_cell[0]])
        if kind != 'service':
            factor = values[f'I{index}'].value
            row.update(factor=float(Decimal(str(factor)) * (100 if kind == 'bed' else 1)), volumeRounding='nearest')
        if kind == 'bed':
            row['bedType'] = 'observation' if name == 'PS Observação' else 'icu' if group == 'UTI' else 'ward'
        rows.append(row)

total = cents(values['P71'].value)
assert sum(row['sourceTotalCents'] for row in rows) == total
payload = dict(fileName=path.name, sha256=hashlib.sha256(path.read_bytes()).hexdigest(),
               sourceSheet=sheet_name, periodLabel='Agosto/2025 a julho/2026',
               bases={'new': rows}, increments=[], subtotalIssue=None,
               baseNames={'new': 'HUGO - Valores e produção Ago/25 - Jul/26'},
               referenceCaption='Sobre a base de valores e produção',
               presets=[dict(id='production', name='HUGO - Valores e produção Ago/25 - Jul/26', base='new',
                             selected=[], sourceSheet=sheet_name, sourceCell='P71', sourceTotalCents=total)])
target = Path(__file__).resolve().parents[1] / 'production-source.js'
target.write_text('// Approved green percentile cells, checked against worksheet formulas.\nexport const productionSource = ' + json.dumps(payload, ensure_ascii=False, indent=2) + ';\n')
print(f'{len(rows)} rows, green selections checked, total {total / 100:.2f} -> {target.name}')
