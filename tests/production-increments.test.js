import test from 'node:test';
import assert from 'node:assert/strict';
import { model, productionScenarioSource, migrateSavedConfig } from '../production-model.js';
import { productionSource } from '../production-source.js';
import { hugoSource } from '../hugo-source.js';
import { describePriceReference } from '../format.js';
import { buildComparison } from '../comparison-model.js';

const policy={includeOmittedWard:false};
const snapshot=config=>model.snapshot(config,policy);
const initial=()=>model.presetState('new-0');
const cents=value=>Math.round(value*100);
// Deliberately synthetic prices: these are supplied only inside tests.
const suppliedPrices={blood:100,platelets:200,mri:300,sad:400,hemodynamics:500};
function withPrices(config=initial()) {
  for(const [key,value] of Object.entries(suppliedPrices)) config=model.setIncrementPrice(config,key,value);
  return config;
}

test('Novo prédio usa a distribuição aprovada e somente os preços mapeados de valores e produção',()=>{
  const s=snapshot(initial());
  assert.equal(s.rows.length,52);assert.equal(s.total,29304814.03);assert.equal(s.baseTotal,26618281.37);
  assert.deepEqual(s.beds,{ward:336,icu:70,total:406});
  for(const row of s.rows){
    const quantities=hugoSource.bases.new.find(item=>item.sourceRow===row.sourceRow);
    assert.equal(row.qty,quantities.qty);assert.equal(row.factor,quantities.factor);
    assert.equal(row.volumeRounding,quantities.volumeRounding);
    if(row.priceSource){
      const price=productionSource.bases.new.find(item=>item.sourceRow===row.priceSource.row);
      assert.equal(row.unit,price.unit);assert.equal(row.unitBasis,price.unitBasis);
      assert.equal(row.priceSource.cell,price.sourceUnitCell);
    } else {assert.equal(row.unit,null);assert.equal(row.unitBasis,null);assert.equal(s.state[row.id].enabled,false);}
  }
  assert.equal(s.rows.filter(row=>row.unit===null).length,6);
  assert.equal(model.priceInputs.length,5);
  assert.equal(model.workbookAudit(policy).length,1);
  assert.equal(model.workbookAudit(policy)[0].difference,0);
  assert.equal(productionScenarioSource.presets[1].isSimulation,true);
});

test('Custos ausentes bloqueiam seleção e importação de cenários incompletos, sem usar zero como preço',()=>{
  const config=initial();
  for(const id of ['blood','mri','sad','hemodynamics']){
    assert.equal(model.canSelectIncrement(config,id),false);
    assert.throws(()=>model.setIncrement(config,id,true),/custos unitários pendentes/);
    assert.throws(()=>snapshot({...config,selected:[id]}),/custos unitários pendentes/);
  }
  assert.equal(model.canSelectIncrement(config,'wardBeds'),true);
  assert.equal(model.canSelectIncrement(config,'icuBeds'),true);
  const row=snapshot(config).rows.find(row=>row.id==='production-new-80');
  assert.equal(describePriceReference(row,null).label,'Custo atualizado pendente');
  assert.equal(describePriceReference(row,500).label,'Informado para simulação');
  for(const value of [-1,NaN,Infinity]) assert.throws(()=>model.setIncrementPrice(config,'hemodynamics',value),/válido/);
  assert.equal(model.canSelectIncrement({...config,edits:{'production-new-80':{unit:-1}}},'hemodynamics'),false);
  const explicitZero=model.setIncrementPrice(config,'hemodynamics',0);
  assert.equal(model.canSelectIncrement(explicitZero,'hemodynamics'),true);
});

test('Adequações têm leitos e SADT separados, com total conjunto conforme os arredondamentos',()=>{
  for(const [selected,total,beds] of [
    [['wardBeds'],30608693.23,{ward:371,icu:70,total:441}],
    [['icuBeds'],31360931.30,{ward:336,icu:90,total:426}],
    [['wardBeds','icuBeds'],32665212.42,{ward:371,icu:90,total:461}],
  ]){
    const s=snapshot({...initial(),selected});assert.equal(s.total,total);assert.deepEqual(s.beds,beds);
  }
  assert.deepEqual(model.increments.filter(item=>item.addedBeds).map(item=>[item.bedAmountCents,item.sadtAmountCents]),[[103304322,27083598],[190500589,15111138]]);
});

test('As 64 combinações e hemodinâmica 250/450 usam exclusivamente os preços fornecidos',()=>{
  const services=[8000000,12000000,4800000,12500000],beds=[0,130387920,205611727,336039839];
  for(let mask=0;mask<64;mask++){
    let config=withPrices();
    for(const [index,item] of model.increments.entries()) if(mask&(1<<index)) config=model.setIncrement(config,item.id,true);
    const s=snapshot(config),expected=2930481403+services.reduce((sum,amount,index)=>sum+(mask&(1<<index)?amount:0),0)+beds[mask>>4];
    assert.equal(cents(s.total),expected,`mask ${mask}`);
    assert.equal(cents(s.totals.reduce((sum,item)=>sum+item.total,0)),expected);
    if(mask&8) assert.equal(cents(snapshot(model.setHemodynamicsVolume(config,450)).total),expected+10000000);
  }
  assert.equal(model.incrementQuote(withPrices(),'blood',policy),80000);
  assert.equal(model.incrementQuote(initial(),'blood',policy),null);
  assert.equal(snapshot(withPrices()).total,29304814.03);
});

test('Restaurar bloco e alternar incrementos preservam preços informados e outros ajustes',()=>{
  let config=model.setIncrement(withPrices(),'hemodynamics',true);
  config={...config,edits:{...config.edits,'production-new-80':{unit:500,qty:450},'production-new-6':{factor:80}}};
  const restored=model.restoreGroup(config,'Hemodinâmica'),s=snapshot(restored);
  assert.equal(s.state['production-new-80'].qty,250);assert.equal(s.state['production-new-80'].unit,500);
  assert.equal(s.state['production-new-6'].factor,80);
  assert.equal(s.modifiedIds.includes('production-new-80'),false);
  const toggled=model.setIncrement(model.setIncrement(restored,'hemodynamics',false),'hemodynamics',true);
  assert.equal(snapshot(toggled).state['production-new-80'].unit,500);
  assert.equal(snapshot(toggled).state['production-new-80'].qty,250);
});

test('Migração preserva ajustes da produção atual; novos cenários e comparação permanecem independentes',()=>{
  const legacy={version:1,base:'new',selected:[],edits:{'production-6':{factor:80}}};
  const migrated=migrateSavedConfig(legacy);
  assert.equal(migrated.base,'same');assert.deepEqual(migrated.edits,legacy.edits);
  assert.equal(snapshot(migrated).state['production-6'].factor,80);
  const fresh={...withPrices(),version:2};assert.deepEqual(migrateSavedConfig(fresh),fresh);
  const current=snapshot(model.presetState('production')),next=snapshot({...initial(),selected:['wardBeds']});
  assert.equal(current.total,26618281.37);
  const comparison=buildComparison([{id:'current',label:'Atual',snapshot:current},{id:'production',label:'Novo prédio',snapshot:next}],{annual:true});
  assert.equal(comparison.scenarios[1].amount,367304318.76);
  assert.equal(snapshot(model.presetState('production')).total,26618281.37);
});
