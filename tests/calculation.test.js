import test from 'node:test';
import assert from 'node:assert/strict';
import {rows,initial,cost,reference,bedTotals} from '../data.js';
test('A referência mantém o custo da planilha e conta 388 leitos sem PS Observação',()=>{const state=initial();assert.ok(Math.abs(rows.reduce((sum,r)=>sum+cost(r,state[r.id]),0)-reference)<0.01);assert.deepEqual(bedTotals(state),{ward:318,icu:70,total:388});});
test('Retirar serviço e reduzir leitos, ocupação e custo altera o custeio proporcionalmente',()=>{const r=rows[0],s=initial()[0];assert.equal(cost(r,{...s,enabled:false}),0);assert.equal(cost(r,{...s,qty:45}),r.total/2);assert.equal(cost(r,{...s,factor:45}),r.total/2);assert.equal(cost(r,{...s,unit:r.unit/2}),r.total/2);});
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
  assert.equal(cost(observation, state[observation.id]), 2149749.20);
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
test('Reduzir ocupação de 90% para 80% reduz proporcionalmente o custo da UI', () => {
  const state = initial()[0];
  assert.equal(Math.round(cost(rows[0], { ...state, factor: 80 }) * 100), 218675934);
});
