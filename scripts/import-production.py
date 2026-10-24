"""Import only the HUGO - ATUAL sheet approved for values and production.

Usage: python scripts/import-production.py /path/to/workbook.xlsx [--basis rebalance --sheet NAME]
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
parser.add_argument('--basis', choices=['production', 'rebalance'], default='production')
parser.add_argument('--sheet')
args = parser.parse_args()
path = Path(args.workbook)
if args.basis == 'rebalance' and not args.sheet:
    parser.error('Select the approved HUGO - ATUAL version with --sheet.')
sheet_name = args.sheet or 'HUGO - ATUAL'
values = openpyxl.load_workbook(path, data_only=True)[sheet_name]
formulas = openpyxl.load_workbook(path, data_only=False)[sheet_name]
groups = [(6, 10, 'Enfermarias'), (13, 17, 'UTI'), (22, 22, 'Emergência'),
          (25, 25, 'Hospital dia'), (28, 30, 'Atendimento ambulatorial'),
          (34, 35, 'Cirurgias'), (39, 57, 'SADT interno'),
          (61, 65, 'SADT externo'), (69, 69, 'Escritório de gestão de altas')]
total_cell = 'P71'
period_label = 'Agosto/2025 a julho/2026'
base_name = 'HUGO - Atualização valores e produção Ago/25 - Jul/26'
reference_caption = 'Sobre a base de valores e produção'
if args.basis == 'rebalance':
    groups = [(6, 10, 'Enfermarias'), (13, 16, 'UTI'), (21, 21, 'Emergência'),
              (24, 24, 'Hospital dia'), (27, 29, 'Atendimento ambulatorial'),
              (33, 34, 'Cirurgias'), (38, 56, 'SADT interno'),
              (60, 64, 'SADT externo'), (68, 68, 'Escritório de gestão de altas')]
    total_cell = 'P70'
    period_label = 'Janeiro a dezembro/2025'
    base_name = 'Reequilíbrio - Atualização valores e produção Jan/25 - Dez/25'
    reference_caption = 'Sobre a base de reequilíbrio Jan/25 - Dez/25'


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
        # Three rows in the rebalance source have a pink fill across all prices.
        # Their explicit cost formula still selects one percentile unambiguously.
        if selected != [match[1]] and not (args.basis == 'rebalance' and not selected):
            raise ValueError(f'Green selection and formula differ at P{index}: {selected}, {formula}')
        unit_cell = match[1]
        criterion = str(values[f'D{index}'].value).strip()
        name = str(values[f'C{index}'].value).strip()
        kind = 'bed' if criterion == 'Paciente-dia' else 'surgery' if criterion == 'Hora Cirúrgica' else 'service'
        row = dict(id=f'{args.basis}-{index}', name=name, group=group, criterion=criterion, kind=kind,
                   qty=values[f'{"H" if kind != "service" else "J"}{index}'].value,
                   unit=values[unit_cell].value, sourceVolume=values[f'J{index}'].value,
                   sourceTotalCents=cents(values[f'P{index}'].value), sourceRow=index,
                   sourceCell=f'P{index}', sourceSheet=sheet_name, sourceUnitCell=unit_cell,
                   sourceGreenCell=selected[0] if selected else None, sourceFormula=formula, countedInWorkbook=True,
                   unitBasis={'K': 'P25', 'L': 'P50', 'M': 'P75'}[unit_cell[0]])
        if kind != 'service':
            factor = values[f'I{index}'].value
            row.update(factor=float(Decimal(str(factor)) * (100 if kind == 'bed' else 1)), volumeRounding='nearest')
        if kind == 'bed':
            row['bedType'] = 'observation' if name == 'PS Observação' else 'icu' if group == 'UTI' else 'ward'
        rows.append(row)

total = cents(values[total_cell].value)
assert sum(row['sourceTotalCents'] for row in rows) == total
payload = dict(fileName=path.name, sha256=hashlib.sha256(path.read_bytes()).hexdigest(),
               sourceSheet=sheet_name, periodLabel=period_label,
               bases={'new': rows}, increments=[], subtotalIssue=None,
               baseNames={'new': base_name}, referenceCaption=reference_caption,
               presets=[dict(id=args.basis, name=base_name, base='new',
                             selected=[], sourceSheet=sheet_name, sourceCell=total_cell, sourceTotalCents=total)])
target = Path(__file__).resolve().parents[1] / f'{args.basis}-source.js'
if args.basis == 'rebalance':
    payload['pricingAudit'] = {'greenRows': sum(bool(row['sourceGreenCell']) for row in rows),
                               'formulaOnlyRows': [row['id'] for row in rows if not row['sourceGreenCell']]}
comment = '// Approved worksheet prices, checked against green selections when present.\n' if args.basis == 'rebalance' else '// Approved green percentile cells, checked against worksheet formulas.\n'
target.write_text(comment + 'export const ' + args.basis + 'Source = ' + json.dumps(payload, ensure_ascii=False, indent=2) + ';\n')
print(f'{len(rows)} rows, prices checked against formulas, total {total / 100:.2f} -> {target.name}')
