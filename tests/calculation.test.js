import test from 'node:test';
import assert from 'node:assert/strict';
import {rows,initial,cost,reference,bedTotals,projectedPatientDays} from '../data.js';
test('A referência mantém o custo da planilha e conta 388 leitos sem PS Observação',()=>{const state=initial();assert.ok(Math.abs(rows.reduce((sum,r)=>sum+cost(r,state[r.id]),0)-reference)<0.01);assert.deepEqual(bedTotals(state),{ward:318,icu:70,total:388});});
test('Retirada, leitos, ocupação e custo unitário alteram o custeio da UI em centavos',()=>{const r=rows[0],s=initial()[0];assert.equal(cost(r,{...s,enabled:false}),0);for(const change of [{qty:45},{factor:45},{unit:r.unit/2}])assert.equal(Math.round(cost(r,{...s,...change})*100),123005213);});
test('Horas médias e número de cirurgias determinam o custo',()=>{const r=rows.find(r=>r.kind==='surgery'),s=initial()[r.id];assert.equal(cost(r,{...s,factor:3}),r.total/2);assert.equal(cost(r,{...s,qty:0}),0);});
test('Subtotais da imagem e total geral fecham em centavos', () => {
  const subtotal = group => rows.filter(row => row.group === group)
    .reduce((sum, row) => sum + Math.round(row.total * 100), 0);
  assert.equal(subtotal('Enfermarias') + subtotal('UTI'), 1507701205);
  assert.equal(subtotal('Atendimento ambulatorial'), 64711575);
  assert.equal(subtotal('Cirurgias'), 490554678);
  assert.equal(subtotal('SADT interno'), 329423907);
  assert.equal(subtotal('SADT externo'), 15802850);
  assert.equal(rows.reduce((sum, row) => sum + Math.round(row.total * 100), 0), 2726123624);
});
test('PS Observação afeta o custeio, mas nunca a contagem de leitos', () => {
  const state = initial();
  const observation = rows.find(row => row.bedType === 'observation');
  assert.equal(cost(observation, state[observation.id]), 214974.92);
  state[observation.id].qty = 180;
  assert.deepEqual(bedTotals(state), { ward: 318, icu: 70, total: 388 });
  assert.equal(Math.round(cost(observation, state[observation.id]) * 100), 214661088);
  state[observation.id].enabled = false;
  assert.deepEqual(bedTotals(state), { ward: 318, icu: 70, total: 388 });
  assert.equal(cost(observation, state[observation.id]), 0);
});
test('Somente UI e UTI ativas entram nos leitos; ocupação não altera a capacidade', () => {
  const state = initial();
  state[5].qty = 5;
  assert.deepEqual(bedTotals(state), { ward: 318, icu: 65, total: 383 });
  state[0].factor = 0;
  assert.equal(bedTotals(state).ward, 318);
  state[0].enabled = false;
  assert.deepEqual(bedTotals(state), { ward: 228, icu: 65, total: 293 });
});
test('A regra de leitos é compartilhada com outras bases de cenário', () => {
  const state = initial();
  state[4].qty = 100;
  state[0].qty = 100;
  const otherScenario = rows.map(row => ({ ...row }));
  assert.deepEqual(bedTotals(state, otherScenario), { ward: 328, icu: 70, total: 398 });
});
test('Ocupação de 80% reproduz os 2.189 pacientes-dia e R$ 2.187.314,47 da planilha', () => {
  const state = initial()[0];
  assert.equal(projectedPatientDays(rows[0], { ...state, factor: 80 }), 2189);
  assert.equal(Math.round(cost(rows[0], { ...state, factor: 80 }) * 100), 218731447);
});
test('As dez linhas de internação reproduzem seus pacientes-dia e custos originais', () => {
  const state = initial();
  const bedRows = rows.filter(row => row.kind === 'bed');
  assert.equal(bedRows.length, 10);
  for (const row of bedRows) {
    assert.equal(projectedPatientDays(row, state[row.id]), row.patientDays, row.name);
    assert.equal(Math.round(cost(row, state[row.id]) * 100), Math.round(row.total * 100), row.name);
  }
});
test('Pacientes-dia são inteiros, seguem a ocupação e zeram com serviço retirado', () => {
  const row = rows[0], state = initial()[0];
  assert.equal(projectedPatientDays(row, { ...state, qty: 1, factor: 31.25 }), 10);
  assert.equal(projectedPatientDays(row, { ...state, factor: 0 }), 0);
  assert.equal(cost(row, { ...state, factor: 0 }), 0);
  assert.equal(projectedPatientDays(row, { ...state, factor: 100 }), 2736);
  assert.equal(projectedPatientDays(row, { ...state, enabled: false }), 0);
  assert.equal(cost(row, { ...state, factor: 80, unit: 1000 }), 2189000);
});
