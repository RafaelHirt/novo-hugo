import test from 'node:test';
import assert from 'node:assert/strict';
import {rows,initial,cost,reference,bedTotals} from '../data.js';
test('A referência reproduz o total da planilha e os 406 leitos',()=>{const state=initial();assert.ok(Math.abs(rows.reduce((sum,r)=>sum+cost(r,state[r.id]),0)-reference)<0.01);assert.equal(rows.filter(r=>r.kind==='bed').reduce((a,r)=>a+r.qty,0),406);});
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
test('Leitos distinguem enfermarias com PS Observação de UTI e somam somente os serviços ativos', () => {
  const state = initial();
  assert.deepEqual(bedTotals(state), { ward: 336, icu: 70, total: 406 });
  state[4].enabled = false;
  assert.deepEqual(bedTotals(state), { ward: 318, icu: 70, total: 388 });
  state[5].qty = 5;
  assert.deepEqual(bedTotals(state), { ward: 318, icu: 65, total: 383 });
  state[0].factor = 0;
  assert.equal(bedTotals(state).ward, 318);
});
