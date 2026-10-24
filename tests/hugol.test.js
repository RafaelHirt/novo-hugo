import test from 'node:test';
import assert from 'node:assert/strict';
import { hugolSource } from '../hugol-source.js';
import { createIncrementModel } from '../increment-model.js';
import { hugolSnapshot, presetState, increments, presets, setIncrement, workbookAudit } from '../hugol-model.js';

const policy = { includeOmittedWard: false };
const cents = amount => Math.round(amount * 100);

test('Os sete cenários HUGOL aplicam a correção de gestão de altas e preservam a importação original', () => {
  assert.equal(presets.length, 7);
  assert.deepEqual(workbookAudit(policy).map(item => cents(item.dashboardTotal)), [2596350696,2738156079,2756200029,2770450029,2793789429,2905462929,3203895233]);
  assert.deepEqual(workbookAudit(policy).map(item => item.difference), [-1026,-2052,-2052,-2052,-2052,-2052,-2052]);
  assert.ok(createIncrementModel(hugolSource,'Original').workbookAudit(policy).every(item => item.difference === 0));
  assert.ok(presets.every(item => !['Azul','HUGO - ATUAL','RESUMO'].includes(item.sourceSheet)));
});

test('A nova fórmula do subtotal inclui a UI do 2º andar no custeio', () => {
  const snapshot = hugolSnapshot(presetState('new-0'), policy);
  assert.equal(snapshot.values['new-11'],1308864.45);
  assert.equal(snapshot.excludedAmount,0);
  assert.equal(hugolSource.subtotalIssue,null);
  assert.ok(workbookAudit({includeOmittedWard:true}).every(item => item.corrected));
});

test('As 64 combinações dos seis incrementos fecham, inclusive adequações isoladas de UI e UTI', () => {
  const bedCosts = [0,140074147,158312132,298432304];
  for (let mask=0; mask<64; mask++) {
    const selected = increments.filter((item,index) => mask & (1 << index));
    const snapshot = hugolSnapshot({base:'new',selected:selected.map(item=>item.id),edits:{}},policy);
    const serviceCost = selected.filter(item=>!item.addedBeds).reduce((sum,item)=>sum+item.amountCents,0);
    assert.equal(cents(snapshot.total),2738156079 + serviceCost + bedCosts[mask >> 4],`mask ${mask}`);
    assert.deepEqual(snapshot.beds,{ward:336+(mask&16?35:0),icu:70+(mask&32?20:0),total:406+(mask&16?35:0)+(mask&32?20:0)});
    assert.equal(cents(snapshot.totals.reduce((sum,item)=>sum+item.total,0)),cents(snapshot.total));
  }
});

test('Banco com SAD e ressonância com hemodinâmica funcionam sem outros incrementos', () => {
  const bloodSad = hugolSnapshot({base:'new',selected:['blood','sad'],edits:{}},policy);
  assert.equal(cents(bloodSad.total),2779539429);
  assert.equal(bloodSad.state['new-57'].enabled,false);
  const mriHemodynamics = hugolSnapshot({base:'new',selected:['mri','hemodynamics'],edits:{}},policy);
  assert.equal(cents(mriHemodynamics.total),2864079579);
  assert.equal(mriHemodynamics.state['new-83'].enabled,false);
});

test('Adequações separadas alteram apenas seus leitos e recalculam SADT pela fórmula da planilha', () => {
  const ui = hugolSnapshot({base:'new',selected:['wardBeds'],edits:{}},policy);
  const icu = hugolSnapshot({base:'new',selected:['icuBeds'],edits:{}},policy);
  const both = hugolSnapshot({base:'new',selected:['wardBeds','icuBeds'],edits:{}},policy);
  assert.equal(ui.state['new-6'].qty,91);
  assert.equal(ui.state['new-17'].qty,30);
  assert.equal(ui.state['new-48'].qty,61464);
  assert.equal(icu.state['new-6'].qty,56);
  assert.equal(icu.state['new-17'].qty,50);
  assert.equal(icu.state['new-48'].qty,59208);
  assert.equal(both.state['new-48'].qty,64283);
  assert.equal(cents(both.delta),298432304);
  const uiOption = increments.find(item=>item.id==='wardBeds'), icuOption = increments.find(item=>item.id==='icuBeds');
  assert.equal(uiOption.bedAmountCents,114391167);
  assert.equal(icuOption.bedAmountCents,143906685);
});

test('A capacidade inclui os 18 de PS Observação, com 336 enfermaria + 70 UTI', () => {
  for (const id of ['same','new-0']) {
    const snapshot=hugolSnapshot(presetState(id),policy);
    assert.deepEqual(snapshot.beds,{ward:336,icu:70,total:406});
  }
  const snapshot=hugolSnapshot(presetState('new-0'),policy);
  assert.equal(snapshot.rows.filter(row=>row.bedType==='ward').reduce((sum,row)=>sum+snapshot.state[row.id].qty,0),336);
  assert.equal(snapshot.total,27381560.79);
});

test('Editar ou retirar linhas atualiza custo e capacidade; alternar pacote preserva outras edições', () => {
  let config={base:'new',selected:['blood'],edits:{'new-6':{qty:50},'new-83':{qty:900}}};
  assert.equal(hugolSnapshot(config,policy).beds.ward,330);
  config=setIncrement(config,'blood',false);
  assert.deepEqual(config.edits,{'new-6':{qty:50}});
  assert.equal(hugolSnapshot(config,policy).state['new-83'].enabled,false);
  const disabled=hugolSnapshot({...config,edits:{'new-6':{enabled:false}}},policy);
  assert.equal(disabled.beds.total,350);
  assert.equal(disabled.values['new-6'],0);
});

test('Todas as linhas preservam o arquivo, exceto a correção explícita de gestão de altas', () => {
  for (const preset of presets) {
    const snapshot=hugolSnapshot(presetState(preset.id),policy);
    for (const row of snapshot.rows) {
      const correction = row.unitCorrection ? (preset.base === 'same' ? 102600 : 205200) : 0;
      assert.equal(cents(snapshot.rawValues[row.id]),row.sourceTotalCents-correction,`${preset.id} ${row.name}`);
      if (row.unitCorrection) assert.equal(row.unit,4948.21);
    }
  }
  assert.equal(hugolSource.bases.new.length,52);
  assert.equal(hugolSource.bases.same.length,42);
});
