import { currency, signedCurrency, number, escapeHtml as h } from './format.js';
import { buildComparison } from './comparison-model.js';
import { icon } from './icons.js';

const snapshots = {};
const definitions = [
  { id:'current', label:'4 T.A (Atual)', title:'4 T.A (Atual)', subtitle:'Contrato vigente', totalId:'comparison-current-total', footerId:'comparison-footer-total' },
  { id:'hugol', label:'5º T.A · Base R$ HUGOL', title:'5º T.A HUGO', subtitle:'Base R$ HUGOL', totalId:'comparison-hugol-total', footerId:'comparison-hugol-footer-total' },
  { id:'hugoBase', label:'5º T.A · Base R$ HUGO', title:'5º T.A HUGO', subtitle:'Base R$ HUGO', totalId:'comparison-hugo-total', footerId:'comparison-hugo-footer-total' },
  { id:'updated', label:'5º T.A · Atualização de valores', title:'5º T.A HUGO', subtitle:'Atualização de valores', totalId:'comparison-updated-total', footerId:'comparison-updated-footer-total' },
  { id:'production', label:'5º T.A · Atualização valores e produção', title:'5º T.A HUGO', subtitle:'Atualização valores e produção', totalId:'comparison-production-total', footerId:'comparison-production-footer-total' },
  { id:'rebalance', label:'Reequilíbrio · Jan/25 - Dez/25', title:'Reequilíbrio', subtitle:'Atualização valores e produção · Jan/25 - Dez/25', totalId:'comparison-rebalance-total', footerId:'comparison-rebalance-footer-total' },
];
let referenceId = 'current', annual = false, initialized = false;
const $ = selector => document.querySelector(selector);
const percent = value => value === null ? 'Sem custo na referência' : `${Math.round(value*10)/10>0?'+':''}${number(Math.round(value*10)/10 || 0)}%`;
const direction = delta => delta>0?'increase':delta<0?'decrease':'neutral';
const modifiedCount = snapshot => snapshot.modifiedIds?.length ?? snapshot.rows.filter(row => ['enabled','qty','unit','factor'].some(key => snapshot.state[row.id][key] !== (key==='enabled'?true:row[key]))).length;

export function renderComparison(snapshot) { snapshots.current=snapshot; refresh(); }
export function setHugolComparison(snapshot) { snapshots.hugol=snapshot; refresh(); }
export function setHugoComparison(snapshot) { snapshots.hugoBase=snapshot; refresh(); }
export function setUpdatedComparison(snapshot) { snapshots.updated=snapshot; refresh(); }
export function setProductionComparison(snapshot) { snapshots.production=snapshot; refresh(); }
export function setRebalanceComparison(snapshot) { snapshots.rebalance=snapshot; refresh(); }

function init() {
  if (initialized) return;
  initialized=true;
  $('#comparison-reference').addEventListener('change',event=>{referenceId=event.target.value;refresh();});
  $('#comparison-differences').addEventListener('change',refresh);
  $('#comparison-search').addEventListener('input',refresh);
  for (const button of document.querySelectorAll('[data-comparison-period]')) button.addEventListener('click',()=>{annual=button.dataset.comparisonPeriod==='annual';refresh();});
  $('#comparison-export').addEventListener('click',()=>{
    const view=buildComparison(available(),{referenceId,annual,differencesOnly:false});
    const decimal=value=>value.toFixed(2).replace('.',',');
    const lines=[['Referência',view.referenceLabel],['Período',annual?'Anual':'Mensal'],[],['Categoria',...view.scenarios.flatMap(item=>[item.label,'Diferença de '+item.label])],...view.groups.map(row=>[row.group,...row.cells.flatMap(cell=>[decimal(cell.amount),decimal(cell.delta)])]),['TOTAL',...view.scenarios.flatMap(item=>[decimal(item.amount),decimal(item.delta)])]];
    const csv=lines.map(row=>row.map(value=>'"'+String(value).replaceAll('"','""')+'"').join(';')).join('\r\n');
    const url=URL.createObjectURL(new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'}));
    const link=document.createElement('a');link.href=url;link.download='novo-hugo-comparativo-'+(annual?'anual':'mensal')+'.csv';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  });
}
function available() { return definitions.filter(item=>snapshots[item.id]).map(item=>({...item,snapshot:snapshots[item.id]})); }
function deltaMarkup(cell) {
  return cell.isReference ? '<small class="cell-reference">Referência</small>' : `<small class="cell-delta" data-direction="${direction(cell.delta)}">${signedCurrency(cell.delta)} <span>(${percent(cell.percent)})</span></small>`;
}
function refresh() {
  if (!snapshots.current) return;
  init();
  const view=buildComparison(available(),{referenceId,annual,differencesOnly:$('#comparison-differences').checked,query:$('#comparison-search').value});
  $('#comparison-reference').value=view.referenceId;
  for (const button of document.querySelectorAll('[data-comparison-period]')) button.setAttribute('aria-pressed',String((button.dataset.comparisonPeriod==='annual')===annual));
  $('#comparison-cards').innerHTML=view.scenarios.map(item=>{
    const {snapshot}=item, modified=modifiedCount(snapshot);
    const chips=snapshot.selected?.length?snapshot.selected.map(entry=>{
      const row=entry.id==='hemodynamics'?snapshot.rows.find(row=>row.group==='Hemodinâmica'):null;
      return row?`${entry.name} · ${number(snapshot.state[row.id].enabled?snapshot.state[row.id].qty:0)}/mês`:entry.name;
    }):[item.id==='current'?'Base vigente':snapshot.baseName];
    if (snapshot.periodLabel) chips.push(snapshot.periodLabel);
    return `<article class="compare-scenario ${item.isReference?'is-reference':''}" data-scenario="${item.id}"><div class="compare-scenario-heading"><div><small>${h(item.title)}</small><h3>${h(item.subtitle)}</h3></div>${item.isReference?'<span class="reference-badge">Referência</span>':icon('document')}</div><strong id="${item.totalId}" class="compare-scenario-total">${currency(item.amount)}</strong><span class="compare-period-caption">${annual?'Custeio anual · '+currency(snapshot.total)+' / mês':'Custeio mensal · '+currency(snapshot.total*12)+' / ano'}</span><div class="compare-scenario-delta" data-direction="${direction(item.delta)}">${item.isReference?'Base para as diferenças':`<strong>${signedCurrency(item.delta)}</strong><span>${percent(item.percent)} vs. ${h(view.referenceLabel)}</span>`}</div><div class="compare-capacity"><div><small>Enfermaria</small><strong>${number(snapshot.beds.ward)}</strong></div><div><small>UTI</small><strong>${number(snapshot.beds.icu)}</strong></div><div><small>Total de leitos</small><strong>${number(snapshot.beds.total)}</strong></div></div><div class="comparison-chips">${chips.map(label=>`<span>${h(label)}</span>`).join('')}${modified?`<span>${modified} ${modified===1?'ajuste manual':'ajustes manuais'}</span>`:''}</div></article>`;
  }).join('');
  const head=label=>`<tr><th scope="col">${label}</th>${view.scenarios.map(item=>`<th scope="col" class="${item.isReference?'reference-column':''}">${h(item.title)}<small>${h(item.subtitle)}${item.isReference?' · Referência':''}</small></th>`).join('')}</tr>`;
  $('#comparison-group-head').innerHTML=head('Categoria');
  $('#comparison-service-head').innerHTML=head('Serviço');
  $('#comparison-caption').textContent=`Valores ${annual?'anuais':'mensais'}. Diferenças em relação a ${view.referenceLabel}; maiores impactos primeiro.`;
  $('#comparison-group-count').textContent=`${view.groups.length} de ${view.allGroupCount} categorias`;
  $('#comparison-groups').innerHTML=view.groups.map(row=>`<tr><th scope="row">${h(row.group)}</th>${row.cells.map(cell=>`<td data-label="${h(view.scenarios.find(item=>item.id===cell.id).label)}" class="compare-value ${cell.isReference?'reference-column':''}"><span class="compare-cell-main">${currency(cell.amount)}</span>${deltaMarkup(cell)}</td>`).join('')}</tr>`).join('') || `<tr class="comparison-empty"><td colspan="${view.scenarios.length+1}">Os custos das categorias coincidem nos cenários selecionados.</td></tr>`;
  $('#comparison-footer').innerHTML=`<tr><th scope="row">Total dos cenários</th>${view.scenarios.map(item=>`<td id="${item.footerId}" data-label="${h(item.label)}" class="${item.isReference?'reference-column':''}"><span class="compare-cell-main">${currency(item.amount)}</span>${deltaMarkup(item)}</td>`).join('')}</tr>`;
  $('#comparison-services').innerHTML=view.services.map(row=>`<tr><th scope="row">${h(row.name)}<small>${h(row.group)}</small></th>${row.cells.map(cell=>{
    const quantityLabel=cell.row?.bedType==='observation'?'Leitos de observação':cell.row?.kind==='bed'?'Leitos':'Quantidade';
    const caption=!cell.present?'Sem este serviço':`${quantityLabel}: ${number(cell.quantity)}${cell.enabled?'':cell.row?.available===false?' · Não selecionado':' · Retirado'}${cell.excluded?' · Fora do subtotal':''}`;
    return `<td data-label="${h(view.scenarios.find(item=>item.id===cell.id).label)}" class="compare-value ${cell.isReference?'reference-column':''}"><span class="compare-cell-main">${cell.present?currency(cell.amount):'—'}</span><small class="comparison-quantity">${h(caption)}${cell.row?.unitBasis ? `<br>Percentil de origem: ${h(cell.row.unitBasis)}` : ''}</small>${deltaMarkup(cell)}</td>`;
  }).join('')}</tr>`).join('') || `<tr class="comparison-empty"><td colspan="${view.scenarios.length+1}">Nenhum serviço encontrado para os filtros selecionados.</td></tr>`;
}
