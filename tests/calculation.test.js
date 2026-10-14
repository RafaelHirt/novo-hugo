import test from 'node:test';
import assert from 'node:assert/strict';
import {rows,initial,cost,reference} from '../data.js';
test('A referência reproduz o total da planilha e os 406 leitos',()=>{const state=initial();assert.ok(Math.abs(rows.reduce((sum,r)=>sum+cost(r,state[r.id]),0)-reference)<0.01);assert.equal(rows.filter(r=>r.kind==='bed').reduce((a,r)=>a+r.qty,0),406);});
test('Retirar serviço e reduzir leitos, ocupação e custo altera o custeio proporcionalmente',()=>{const r=rows[0],s=initial()[0];assert.equal(cost(r,{...s,enabled:false}),0);assert.equal(cost(r,{...s,qty:45}),r.total/2);assert.equal(cost(r,{...s,factor:45}),r.total/2);assert.equal(cost(r,{...s,unit:r.unit/2}),r.total/2);});
test('Horas médias e número de cirurgias determinam o custo',()=>{const r=rows.find(r=>r.kind==='surgery'),s=initial()[r.id];assert.equal(cost(r,{...s,factor:3}),r.total/2);assert.equal(cost(r,{...s,qty:0}),0);});
