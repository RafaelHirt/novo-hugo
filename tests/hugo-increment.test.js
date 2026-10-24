import test from 'node:test';
import assert from 'node:assert/strict';
import { model } from '../hugo-model.js';
import { hugoSource } from '../hugo-source.js';

const policy = { includeOmittedWard: false };
const cents = value => Math.round(value * 100);

test('Referências HUGO usam os percentis do contrato e não atribuem P25 à célula mesclada do PS',()=>{
  const rows=hugoSource.bases.new;
  assert.deepEqual(rows.reduce((map,row)=>(map[row.unitBasis||'Contratual']=(map[row.unitBasis||'Contratual']||0)+1,map),{}),{P50:41,P75:4,Contratual:7});
  const row=index=>rows.find(item=>item.id==='hugo-new-'+index);
  assert.equal(row(6).unitBasis,'P50');assert.equal(row(6).unit,999.23);
  assert.equal(row(16).unitBasis,'P75');assert.equal(row(16).unit,3069.99);
  assert.equal(row(38).unitBasis,'P50');assert.equal(row(41).unitBasis,'P75');
  assert.equal(row(23).unitBasis,null);assert.equal(row(23).unitReference,'Valor contratual');
  assert.deepEqual(row(23).sourcePercentileCells,['K22']);
  for(const index of [26,57,80,83,84])assert.equal(row(index).unitBasis,null);
  assert.equal(hugoSource.percentileReference.fileName,'02 NOVO HUGO - BASE HUGO VIGENTE CORRETA.xlsx');
  for(const preset of model.presets){
    const snapshot=model.snapshot(model.presetState(preset.id),policy);
    for(const item of snapshot.rows)assert.equal(item.unitBasis,row(item.sourceRow).unitBasis);
  }
});

test('Os seis cenários da nova base HUGO reproduzem a planilha em centavos', () => {
  const audit = model.workbookAudit(policy);
  assert.deepEqual(audit.map(item => cents(item.dashboardTotal)), [2866520156,2884564106,2898814106,2922153506,3033827006,3346998097]);
  assert.ok(audit.every(item => item.difference === 0));
  for (const preset of model.presets) {
    const snapshot = model.snapshot(model.presetState(preset.id), policy);
    for (const row of snapshot.rows) assert.equal(cents(snapshot.rawValues[row.id]), row.sourceTotalCents, `${preset.id}: ${row.name}`);
  }
});

test('As 64 combinações da base HUGO incluem adequações separadas de UI e UTI', () => {
  assert.deepEqual(model.increments.map(item => item.amountCents), [18043950,14250000,23339400,111673500,121483137,191641855]);
  for (let mask=0; mask<64; mask++) {
    const selected = model.increments.filter((item, index) => mask & (1 << index));
    const result = model.snapshot({ base:'new', selected:selected.map(item => item.id), edits:{} }, policy);
    assert.equal(cents(result.total), 2866520156 + selected.filter(item=>!item.addedBeds).reduce((sum,item) => sum + item.amountCents,0) + [0,121483137,191641855,313171091][mask >> 4]);
    assert.equal(result.beds.total, 406 + (mask & 16 ? 35 : 0) + (mask & 32 ? 20 : 0));
    assert.equal(cents(result.totals.reduce((sum,item) => sum + item.total,0)), cents(result.total));
  }
});

test('A base HUGO usa preços próprios e preserva a referência após editar uma linha', () => {
  const config = model.presetState('new-0');
  const result = model.snapshot(config, policy);
  assert.equal(result.state['hugo-new-6'].unit,999.23);
  assert.equal(result.state['hugo-new-16'].unit,3069.99);
  assert.equal(hugoSource.bases.new.length,52);
  assert.deepEqual(config.selected,[]);
  assert.equal(model.snapshot({...config,edits:{'hugo-new-6':{qty:50}}},policy).beds.total,400);
  assert.equal(model.snapshot(config,policy).beds.total,406);
  assert.equal(hugoSource.bases.new[0].qty,56);
});

test('A revisão HUGO inclui a UI do 2º andar no subtotal sem alterar a capacidade física', () => {
  const result = model.snapshot(model.presetState('new-0'), policy);
  assert.equal(hugoSource.subtotalIssue,null);
  assert.equal(result.values['hugo-new-11'],1094156.85);
  assert.equal(result.excludedAmount,0);
  assert.deepEqual(result.beds,{ward:336,icu:70,total:406});
  assert.equal(result.total,28665201.56);
});
