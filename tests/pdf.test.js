import test from 'node:test';
import assert from 'node:assert/strict';
import { model } from '../production-model.js';
import { currency } from '../format.js';
import { createScenarioReport, renderScenarioReport, selectedReportRows, selectedReportTotal } from '../pdf-model.js';

function example() {
  const config = model.presetState('production');
  for (const [id, factor] of [[6,90],[7,90],[8,90],[9,50],[10,50],[13,95],[14,95],[15,95],[16,95],[17,95]]) config.edits['production-'+id] = { factor };
  config.edits['production-22'] = { unit: 1175 };
  const snapshot = model.snapshot(config, { includeOmittedWard:false });
  snapshot.bedMap = { ward:318, icu:70, total:388 };
  return { snapshot, config };
}
const build = snapshot => createScenarioReport({ title:'Atualização valores e produção', snapshot, volume:model.volume, createdAt:new Date('2026-11-10T18:00:00Z') });

test('PDF captura os valores editados e o mapa exibido, preservando o cenário e suas linhas', () => {
  const {snapshot} = example(), before = structuredClone(snapshot), report = build(snapshot);
  assert.equal(report.total,29720267.52); assert.equal(report.baseTotal,26618281.37);
  assert.deepEqual(report.beds,{ward:318,icu:70,total:388});
  assert.equal(report.rows.find(row=>row.id==='production-22').unit,1175);
  assert.equal(report.rows.find(row=>row.id==='production-22').reference,'P75 (preço editado)');
  assert.equal(selectedReportTotal(selectedReportRows(report)),report.total);
  assert.deepEqual(snapshot,before);
  snapshot.state['production-22'].unit=1;
  assert.equal(report.rows.find(row=>row.id==='production-22').unit,1175);
});

test('PDF omite variação e base de referência por padrão, inclusive os seus valores', () => {
  const {snapshot}=example(), report=build(snapshot), html=renderScenarioReport(report);
  assert.ok(html.includes('Total mensal do cenário')); assert.ok(html.includes('388 leitos'));
  assert.ok(!html.includes('Variação sobre a base')); assert.ok(!html.includes('Base de referência'));
  assert.ok(!html.includes(currency(report.baseTotal))); assert.ok(!html.includes(currency(report.delta)));
});

test('Escolher duas linhas imprime apenas essas linhas e seu subtotal, sem expor o total completo', () => {
  const report=build(example().snapshot);
  const options={selectedIds:new Set(['production-6','production-13']),sections:[],columns:['quantity','amount']};
  const rows=selectedReportRows(report,options.selectedIds), html=renderScenarioReport(report,options);
  assert.equal(rows.length,2); assert.equal(selectedReportTotal(rows),3611784.25);
  assert.ok(html.includes('UI Clínica Médica')); assert.ok(html.includes('UTI Adulto 1'));
  assert.ok(!html.includes('UTI Adulto 2')); assert.ok(!html.includes('Pronto Atendimento'));
  assert.ok(html.includes('Subtotal dos serviços selecionados'));
  assert.ok(html.includes(currency(3611784.25))); assert.ok(!html.includes(currency(report.total)));
  assert.ok(!html.includes('Custo unitário')); assert.ok(!html.includes('Referência do custo'));
});

test('Resumo pode ser impresso sem serviços e permite incluir explicitamente base e variação', () => {
  const report=build(example().snapshot), html=renderScenarioReport(report,{selectedIds:[],sections:['base','delta'],columns:[]});
  assert.ok(!html.includes('<table')); assert.ok(!html.includes('Mapa de leitos'));
  assert.ok(html.includes('Base de referência')); assert.ok(html.includes(currency(report.baseTotal)));
  assert.ok(html.includes('Variação sobre a base'));
});

test('Ocultar colunas financeiras e indicadores permite um relatório sem valores em reais', () => {
  const report=build(example().snapshot), html=renderScenarioReport(report,{sections:['beds'],columns:['quantity'],selectedIds:['production-6']});
  assert.ok(!html.includes('R$')); assert.ok(!html.includes('Subtotal')); assert.ok(html.includes('388 leitos'));
});

test('Seleção e renderização escapam texto da fonte e preservam serviços desativados com custo zero', () => {
  const config=model.presetState('production');config.edits={'production-6':{enabled:false}};
  const snapshot=model.snapshot(config,{includeOmittedWard:false}), report=build(snapshot);
  report.title='<script>teste</script>';report.rows[0].name='<img src=x onerror=alert(1)>';
  assert.equal(selectedReportRows(report).length,41);
  const html=renderScenarioReport(report,{sections:[],selectedIds:['production-6'],columns:['amount']});
  assert.ok(html.includes('&lt;script&gt;')); assert.ok(!html.includes('<script>'));
  assert.ok(html.includes('&lt;img')); assert.ok(!html.includes('<img'));
  assert.ok(html.includes('Não incluído no cenário')); assert.ok(html.includes(currency(0)));
});
