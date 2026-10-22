import test from 'node:test';
import assert from 'node:assert/strict';
import { model, migrateSavedConfig } from '../updated-model.js';
import { updatedSource } from '../updated-source.js';
import { model as hugo } from '../hugo-model.js';
import { buildComparison } from '../comparison-model.js';

const policy={includeOmittedWard:false};
const cents=value=>Math.round(value*100);
const baseTotalCents=2914461037;
const golden=[3072961155,3097537830,3113298630,3132171750,3223525000,3559564839];

test('Atualização reproduz P71 de HUGO - ATUAL e os seis totais S89 do novo prédio',()=>{
  assert.deepEqual(model.workbookAudit(policy).map(item=>cents(item.dashboardTotal)),[baseTotalCents,...golden]);
  assert.ok(model.workbookAudit(policy).every(item=>item.difference===0));
  for(const preset of model.presets){
    assert.equal(preset.sourceCell,preset.id==='same'?'P71':'S89');
    const snapshot=model.snapshot(model.presetState(preset.id),policy);
    assert.equal(snapshot.rows.length,preset.id==='same'?42:52);
    assert.equal(cents(snapshot.baseTotal),baseTotalCents);
    assert.equal(cents(snapshot.delta),preset.sourceTotalCents-baseTotalCents);
    for(const row of snapshot.rows){
      assert.equal(cents(snapshot.rawValues[row.id]),row.sourceTotalCents,`${preset.id} ${row.name}`);
      assert.equal(model.volume(row,snapshot.state[row.id]),row.sourceVolume,`${preset.id} volume de ${row.name}`);
    }
  }
});

test('Base atualizada usa os quantitativos H/J, preços L/M e os 18 leitos de PS Observação',()=>{
  const snapshot=model.snapshot(model.presetState('same'),policy);
  assert.equal(snapshot.total,29144610.37);
  assert.equal(snapshot.delta,0);
  assert.equal(snapshot.baseName,'HUGO - Base atualizada');
  assert.deepEqual(snapshot.beds,{ward:336,icu:70,total:406});
  const row=id=>snapshot.rows.find(item=>item.id==='updated-same-'+id);
  assert.equal(row(6).qty,90);assert.equal(row(6).unit,1079.46);assert.equal(row(6).sourceUnitCell,'L6');
  assert.equal(row(9).unit,1402.63);assert.equal(row(9).unitBasis,'P75');
  assert.equal(row(10).bedType,'observation');assert.equal(row(10).qty,18);
  assert.equal(row(13).unit,3301.57);assert.equal(row(13).sourceUnitCell,'M13');
  assert.equal(row(22).sourceUnitCell,'M23');assert.equal(snapshot.values['updated-same-22'],3041779.92);
  assert.equal(row(35).qty,1053);assert.equal(row(35).sourceVolume,2001);
  assert.equal(row(69).qty,5);
  assert.equal(model.volume(row(13),{...snapshot.state[row(13).id],factor:80}),243);
  assert.throws(()=>model.setIncrement(model.presetState('same'),'blood',true),/indisponível/);
});

test('Atualização usa os percentis das fórmulas e preserva a referência O24 do pronto atendimento',()=>{
  const snapshot=model.snapshot(model.presetState('new-0'),policy);
  const row=id=>snapshot.rows.find(item=>item.id==='updated-new-'+id);
  assert.equal(row(6).unit,1079.46);assert.equal(row(6).unitBasis,'P50');
  assert.equal(row(16).unit,3301.57);assert.equal(row(16).unitBasis,'P75');
  assert.equal(row(23).sourceUnitCell,'O24');assert.equal(row(23).unit,1175.34);
  assert.equal(snapshot.values['updated-new-23'],3041779.92);
  assert.equal(row(41).unit,3117.87);assert.equal(row(41).unitBasis,'P75');
  assert.equal(snapshot.state['updated-new-42'].qty,763);
  assert.equal(snapshot.state['updated-new-87'].qty,10);
  assert.equal(updatedSource.periodLabel,'Agosto/2025 a julho/2026');
  assert.equal(updatedSource.subtotalIssue,null);
});

test('As 64 combinações atualizadas fecham com UI/UTI separadas e hemodinâmica 250/450',()=>{
  const services=[24576675,15760800,18873120,91353250],beds=[0,130387920,205611727,336039839];
  for(let mask=0;mask<64;mask++){
    const selected=model.increments.filter((item,index)=>mask&(1<<index)).map(item=>item.id);
    const config={base:'new',selected,edits:{}},snapshot=model.snapshot(config,policy);
    const expected=golden[0]+services.reduce((sum,value,index)=>sum+(mask&(1<<index)?value:0),0)+beds[mask>>4];
    assert.equal(cents(snapshot.total),expected,`mask ${mask}`);
    assert.deepEqual(snapshot.beds,{ward:336+(mask&16?35:0),icu:70+(mask&32?20:0),total:406+(mask&16?35:0)+(mask&32?20:0)});
    if(mask&8){const alternative=model.snapshot(model.setHemodynamicsVolume(config,450),policy);assert.equal(cents(alternative.total),expected+73082600);assert.equal(alternative.values['updated-new-80'],1644358.50);}
  }
});

test('Novos ajustes não modificam a base HUGO vigente e o comparativo usa a base selecionada',()=>{
  const base=model.snapshot(model.presetState('same'),policy),previous=hugo.snapshot(hugo.presetState('new-0'),policy);
  const config={...model.presetState('new-0'),edits:{'updated-new-6':{qty:50}}};
  assert.equal(model.snapshot(config,policy).beds.total,400);
  assert.equal(model.snapshot(model.presetState('new-0'),policy).total,30729611.55);
  assert.equal(previous.total,28665201.56);
  const view=buildComparison([{id:'hugoBase',label:'Base HUGO',snapshot:previous},{id:'updated',label:'Valores atualizados',snapshot:base}],{referenceId:'hugoBase'});
  assert.equal(view.scenarios[1].delta,479408.81);
  const annual=buildComparison([{id:'hugoBase',label:'Base HUGO',snapshot:previous},{id:'updated',label:'Valores atualizados',snapshot:base}],{referenceId:'updated',annual:true});
  assert.equal(annual.scenarios[1].amount,349735324.44);
  assert.equal(annual.scenarios[1].isReference,true);
});

test('Correção migra apenas a seleção inicial antiga e preserva escolhas e ajustes manuais',()=>{
  const initial=model.presetState('new-0');
  assert.deepEqual(migrateSavedConfig(initial),model.presetState('same'));
  for(const saved of [
    {...initial,version:2},
    model.presetState('new-1'),
    {...initial,edits:{'updated-new-6':{qty:50}}},
    model.presetState('same'),
    null,
  ])assert.deepEqual(migrateSavedConfig(saved),saved);
});
