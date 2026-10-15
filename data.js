// Totais preservados conforme a imagem; quantidades exibidas podem estar arredondadas.
const raw=[
['Enfermarias','UI Clínica Médica (2º Andar)',999.23,2460104.26,90,90,2462],
['Enfermarias','UI Clínica Cirúrgica (3º Andar)',999.23,3198535.23,117,90,3201],
['Enfermarias','UI Clínica Cirúrgica (4º andar)',999.23,2870787.79,105,90,2873],
['Enfermarias','UI Pop. Privad. Liberd. (4º andar)',1340.88,122020.08,6,50,91],
['Enfermarias','PS Observação',784.58,214974.92,18,50,274,'observation'],
...[[10,887227.11],[20,1774454.22],[10,887227.11],[20,1774454.22],[10,887227.11]].map(([beds,total],i)=>['UTI',`UTI Adulto ${i+1}`,3069.99,total,beds,95,beds===10?289:578]),
['Emergência','Pronto Atendimento',1175.08,3041107.04,2588],
['Hospital dia','Leito-dia',308,112420,365],
['Atendimento ambulatorial','Consulta Médica',138.99,472566,3400],
['Atendimento ambulatorial','Consulta Não Médica',72.24,122808,1700],
['Atendimento ambulatorial','Procedimentos ambulatoriais',181.55,51741.75,285],
['Cirurgias','Cirurgias alto custo',2994.47,539004.60,30,6],
['Cirurgias','Demais cirurgias',2182.18,4366542.18,1053,1.9],
...[
['Agência transfusional',801,376.25,301376.25],['Anatomia patológica',239,105.37,25183.43],['Análises clínicas',59206,9.47,560680.82],['Broncoscopia',14,3109.37,43531.18],['Colonoscopia',10,570.20,5702],['Ecocardiograma',229,175.93,40287.97],['Ecodoppler',48,203.58,9771.84],['Eletrocardiograma',38,38.45,1461.10],['Eletroencefalograma',50,355.62,17781],['Endoscopia',136,570.20,77547.20],['Raio X',4858,69.61,338165.38],['Tomografia Computadorizada',5523,169.10,933939.30],['Ultrassonografia',138,109.41,15098.58],['Fisioterapia',14476,33.59,486248.84],['Fonoaudiologia',1062,51.65,54852.30],['Hemodiálise',244,579.61,141424.84],['Psicologia',1289,46.77,60286.53],['Terapia ocupacional',35,79.70,2789.50],['Odontologia Hospitalar',1589,112.09,178111.01]
].map(([name,qty,unit,total])=>['SADT interno',name,unit,total,qty]),
...[[ 'Colonoscopia',100,570.20,57020],['Ecodoppler',80,203.58,16286.40],['Endoscopia',100,570.20,57020],['Tomografia Computadorizada',125,169.10,21137.50],['Ultrassonografia',60,109.41,6564.60]].map(([name,qty,unit,total])=>['SADT externo',name,unit,total,qty]),
['Escritório de gestão de altas','Escritório de gestão de altas',5153.41,25767.05,5]
];
export const rows=raw.map(([group,name,unit,total,qty,factor,patientDays,bedType],id)=>({id,group,name,unit,total,qty,factor,patientDays,kind:patientDays?'bed':group==='Cirurgias'?'surgery':'service',bedType:patientDays?(bedType??(group==='UTI'?'icu':'ward')):null}));
export const reference=27261236.24;
export function cost(row,state){if(!state.enabled)return 0;return row.total*(state.qty/row.qty)*(state.unit/row.unit)*(row.factor===undefined?1:state.factor/row.factor);}
export function initial(){return rows.map(r=>({enabled:true,qty:r.qty,unit:r.unit,factor:r.factor}));}
// Shared by every scenario: observation positions affect costs, never bed counts.
export function bedTotals(state, scenarioRows = rows) {
  let ward = 0, icu = 0;
  for (const row of scenarioRows) {
    if (!state[row.id].enabled) continue;
    if (row.bedType === 'icu') icu += state[row.id].qty;
    if (row.bedType === 'ward') ward += state[row.id].qty;
  }
  return { ward, icu, total: ward + icu };
}
