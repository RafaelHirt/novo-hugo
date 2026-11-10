// Browser regression check: node scripts/check-pdf-layout.mjs
// Uses the managed environment's Chromium/Playwright and Poppler, not app dependencies.
import { chromium } from '/opt/codex/cua_node/lib/node_modules/playwright-core/index.mjs';
import { createAppServer } from '../server.js';
import { once } from 'node:events';
import { randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdir, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import assert from 'node:assert/strict';

const password = randomUUID();
const server = createAppServer({ password }).listen(0, '127.0.0.1');
await once(server, 'listening');
const browser = await chromium.launch({ executablePath:'/usr/bin/chromium', args:['--no-sandbox'] });
const output = process.env.PDF_CHECK_OUTPUT || await mkdtemp(join(tmpdir(), 'hugo-pdf-layout-'));
await mkdir(output, { recursive:true });
try {
  const page = await browser.newPage({ viewport:{width:1440,height:1000} });
  await page.goto('http://127.0.0.1:' + server.address().port);
  await page.locator('#password').fill(password); await page.locator('.submit').click();
  await page.locator('#total').waitFor();
  const variants = [
    { name:'Organizado', width:1440 },
    { name:'Celular', width:360 },
    { name:'Com_cabecalhos_do_navegador', width:1440, nativeHeaders:true },
    { name:'Todas_as_colunas', width:1440, allColumns:true, estimated:true },
    { name:'Selecao_parcial', width:1440, partial:true },
    { name:'Categoria_longa', width:1440, stress:true },
  ];
  for (const variant of variants) {
    await page.setViewportSize({width:variant.width,height:1000});
    const result = await page.evaluate(async variant => {
      const {model} = await import('/production-model.js');
      const {createScenarioReport, renderScenarioReport, pdfColumns} = await import('/pdf-model.js');
      const {paginateScenarioReport} = await import('/pdf-pagination.js');
      const config = model.presetState(variant.estimated ? 'new-5' : 'production');
      if (!variant.estimated) for (const [id,factor] of [[6,90],[7,90],[8,90],[9,50],[10,50],[13,95],[14,95],[15,95],[16,95],[17,95]]) config.edits['production-'+id] = {factor};
      const snapshot = model.snapshot(config, {includeOmittedWard:false});
      snapshot.bedMap = variant.estimated ? snapshot.beds : {ward:318,icu:70,total:388};
      const report = createScenarioReport({title:'5º T.A HUGO - Atualização valores e produção',snapshot,volume:model.volume});
      if (variant.stress) {
        report.title='TESTE DE PAGINAÇÃO · DADOS SIMULADOS';
        report.rows=Array.from({length:125},(_,i)=>({...report.rows[0],id:'stress-'+i,group:'Categoria longa de teste',name:`Serviço de teste ${i+1} · nome extenso para verificar quebras de linha e paginação`,reference:'Referência extensa para testar a distribuição das colunas'}));
        report.total=report.rows.reduce((cents,row)=>cents+Math.round(row.amount*100),0)/100;
      }
      const options = variant.allColumns ? {columns:pdfColumns.map(item=>item.key),sections:['total','beds','base','delta','scenario']} : {};
      if (variant.partial) options.selectedIds = ['production-6','production-13'];
      document.querySelector('#scenario-pdf-document')?.remove();
      const root = document.createElement('article');root.id='scenario-pdf-document';root.className='pdf-print-document';
      root.innerHTML=renderScenarioReport(report,options);document.body.append(root);document.body.dataset.pdfPreparing='';
      const pageCount=paginateScenarioReport(root), seen=[], issues=[], placements={};
      for (const [index,sheet] of [...root.children].entries()) {
        const body=sheet.querySelector('.pdf-sheet-body'), bounds=body.getBoundingClientRect();
        if (body.scrollHeight>body.clientHeight+1) issues.push('body overflow '+index);
        for (const row of body.querySelectorAll('tr[data-pdf-service]')) {
          seen.push(row.dataset.pdfService);placements[row.dataset.pdfService]=index;
          const rect=row.getBoundingClientRect();
          if (rect.bottom>bounds.bottom+1 || rect.top<bounds.top-1 || rect.right>bounds.right+1 || rect.left<bounds.left-1) issues.push('row outside page '+row.dataset.pdfService);
          for (const cell of row.children) if (cell.scrollWidth>cell.clientWidth+1) issues.push('cell overflow '+row.dataset.pdfService);
        }
        if (index && body.querySelector('.pdf-continuation:not([hidden])') && !body.querySelector('thead .pdf-category-heading')) issues.push('missing category on continuation');
      }
      const expected=variant.partial ? options.selectedIds : report.rows.filter(row=>row.enabled).map(row=>row.id);
      if (new Set(seen).size!==expected.length || seen.length!==expected.length || expected.some(id=>!seen.includes(id))) issues.push('lost or duplicated rows');
      const last=root.lastElementChild;
      if (last.querySelector('.pdf-report-subtotal') && !last.querySelector('[data-pdf-service]')) issues.push('isolated total');
      document.body.removeAttribute('data-pdf-preparing');document.body.dataset.pdfExport='';
      return {pageCount, issues, placements, rowCount:seen.length, continuationCount:root.querySelectorAll('.pdf-continuation:not([hidden])').length};
    }, variant);
    assert.deepEqual(result.issues, [], variant.name);
    if (!variant.stress && !variant.partial) {
      const ids=variant.estimated ? [16,17,18].map(n=>'production-increment-new-'+n) : [13,14,15,16,17].map(n=>'production-'+n);
      assert.ok(ids.every(id=>result.placements[id]!==undefined));
      assert.equal(new Set(ids.map(id=>result.placements[id])).size,1,'UTI split');
    }
    if (variant.stress) assert.ok(result.continuationCount>0);
    const file=join(output, 'HUGO_Relatorio_'+variant.name+'.pdf');
    await page.pdf({path:file,preferCSSPageSize:true,printBackground:true,displayHeaderFooter:!!variant.nativeHeaders,
      headerTemplate:'<div style="font-size:8px">Cabeçalho opcional do navegador</div>',
      footerTemplate:'<div style="font-size:8px">Rodapé opcional do navegador</div>'});
    const text=execFileSync('pdftotext',['-layout',file,'-'],{encoding:'utf8'}).replace(/\s+/g,' ');
    const info=execFileSync('pdfinfo',[file],{encoding:'utf8'});
    assert.equal(Number(info.match(/Pages:\s+(\d+)/)[1]),result.pageCount,'extra/blank page');
    if (!variant.nativeHeaders) {
      assert.ok(!text.includes('Cabeçalho opcional do navegador'));assert.ok(!text.includes('Rodapé opcional do navegador'));
    }
    assert.ok(text.includes(`Página ${result.pageCount} de ${result.pageCount}`));
    if (variant.name==='Organizado') {
      assert.equal(result.rowCount,42);assert.ok(result.pageCount<=3);
      assert.ok(text.includes('28.178.607,12'));assert.ok(!text.includes('26.618.281,37'));assert.ok(text.includes('Continuação'));
    }
    await page.evaluate(()=>{delete document.body.dataset.pdfExport;document.querySelector('#scenario-pdf-document').remove();});
    console.log(`${variant.name}: ${result.rowCount} linhas, ${result.pageCount} páginas, sem cortes, perdas ou duplicações.`);
  }
  console.log('PDFs conferidos em '+output);
} finally {
  await browser.close();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));
}
