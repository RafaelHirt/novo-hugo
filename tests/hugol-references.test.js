import test from 'node:test';
import assert from 'node:assert/strict';
import { hugolSource } from '../hugol-source.js';
import { hugolSnapshot, presetState } from '../hugol-model.js';
import { describePriceReference } from '../format.js';
import { buildComparison } from '../comparison-model.js';

const row = id => Object.values(hugolSource.bases).flat().find(item => item.id === id);

test('Conferência da imagem HUGOL distingue preços iguais, divergentes e serviços ausentes', () => {
  for (const [base, expected] of Object.entries({ same: { match:34, different:1, not_listed:7 }, new: { match:46, different:1, not_listed:5 } })) {
    const counts = { match:0, different:0, not_listed:0 };
    for (const item of hugolSource.bases[base]) counts[describePriceReference(item,item.unit).status]++;
    assert.deepEqual(counts,expected);
    assert.deepEqual(hugolSource.imageReference.audit[base],expected);
  }
});

test('Gestão de altas mantém o preço da planilha e mostra o P50 divergente da imagem', () => {
  for (const id of ['same-69','new-87']) {
    const item=row(id), description=describePriceReference(item,item.unit);
    assert.equal(item.unit,5153.41);
    assert.equal(item.unitBasis,null);
    assert.equal(item.priceReference.unit,4948.21);
    assert.equal(item.priceReference.percentile,'P50');
    assert.equal(description.status,'different');
    assert.equal(description.percentile,'');
    assert.match(description.detail,/P50: R\$\s4\.948,21/);
  }
});

test('Percentil segue a coluna verde, inclusive com preços iguais, e não é inferido em serviços ausentes', () => {
  assert.equal(row('new-83').unitBasis,'P50');
  assert.equal(row('new-84').unitBasis,'P50');
  assert.equal(row('new-38').priceReference.items,'3.1');
  assert.equal(row('new-40').priceReference.items,'3.2');
  assert.equal(row('new-41').priceReference.items,'3.4');
  assert.equal(row('new-41').unitBasis,'P75');
  assert.equal(row('same-9').unit,row('same-6').unit);
  assert.equal(describePriceReference(row('same-9'),1195.31).status,'not_listed');
  assert.equal(describePriceReference(row('same-9'),1195.31).percentile,'');
  const missing=describePriceReference(row('new-51'),185.36);
  assert.equal(missing.status,'not_listed');
  assert.equal(missing.percentile,'');
  assert.equal(missing.edited,true);
});

test('SADT externo documenta os vínculos de preço com as linhas internas da planilha', () => {
  for (const [base, rows] of Object.entries(hugolSource.bases)) {
    for (const item of rows.filter(item=>item.group==='SADT externo' && item.unitBasis)) {
      const formula=item.priceReference.linkedPriceFormula;
      assert.match(formula,base==='new'?/^=M\d+$/:/^=H\d+$/);
      const linked=rows.find(entry=>entry.sourceRow===Number(formula.slice(2)));
      assert.equal(linked.group,'SADT interno');
      assert.equal(item.priceReference.items,linked.priceReference.items);
      assert.equal(item.unit,linked.unit);
    }
  }
});

test('Alterações de preço e comparativo não apresentam como confirmado um valor diferente da referência', () => {
  const item=row('new-87');
  const corrected=describePriceReference(item,4948.21);
  assert.equal(corrected.status,'match');
  assert.equal(corrected.percentile,'P50');
  assert.equal(corrected.edited,true);
  const changed=describePriceReference(row('new-6'),1200);
  assert.equal(changed.status,'different');
  assert.equal(changed.percentile,'');
  assert.match(changed.exportLabel,/Diverge.*P75.*preço editado/);
  const config=presetState('new-0');
  config.edits['new-87']={unit:4948.21};
  const snapshot=hugolSnapshot(config,{includeOmittedWard:false});
  const comparison=buildComparison([{id:'hugol',label:'HUGOL',snapshot}],{differencesOnly:false});
  const cell=comparison.services.find(service=>service.name===item.name).cells[0];
  assert.equal(cell.unit,4948.21);
  assert.equal(describePriceReference(cell.row,cell.unit).status,'match');
});

test('Referências contratuais e percentis das outras bases mantêm sua identificação', () => {
  const contract=describePriceReference({unit:999,unitReference:'Valor contratual',unitBasis:null},999);
  assert.equal(contract.label,'Valor contratual');
  assert.equal(contract.percentile,'');
  const percentile=describePriceReference({unit:999,unitBasis:'P50'},1000);
  assert.equal(percentile.label,'Editado · ref. P50');
  assert.equal(percentile.exportLabel,'P50 (preço editado)');
});
