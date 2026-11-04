(()=>{
'use strict';
const frame=document.getElementById('appFrame');if(!frame)return;
const TZ='America/Maceio';
let activeDoc=null;
const norm=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().trim();
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const isUti=s=>/\bUTI\b/.test(norm(s));
const localeDay=()=>{
 const p=new Intl.DateTimeFormat('en-US',{timeZone:TZ,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date()),o={};
 p.forEach(x=>o[x.type]=x.value);return o.year+'-'+o.month+'-'+o.day;
};
function timestamp(m){
 const val=m.dataIso||m.dataDesfechoObj||m.data||'';
 if(val&&typeof val.toDate==='function')return val.toDate();
 if(val instanceof Date)return val;
 const s=String(val);
 if(/^\d{4}-\d{2}-\d{2}T/.test(s)){const d=new Date(s);if(!isNaN(+d))return d}
 const br=s.match(/^(\d{2})\/(\d{2})\/(\d{4})(?:[, ]+(\d{2}):(\d{2})(?::(\d{2}))?)?/);
 if(br){const d=new Date(Number(br[3]),Number(br[2])-1,Number(br[1]),Number(br[4]||0),Number(br[5]||0),Number(br[6]||0));if(!isNaN(+d))return d}
 const iso=s.match(/^(\d{4})-(\d{2})-(\d{2})/);
 return iso?new Date(Number(iso[1]),Number(iso[2])-1,Number(iso[3])):null;
}
function dateInfo(m){
 const d=timestamp(m);
 if(!d||isNaN(+d))return {date:'',time:'',sort:0};
 const parts=new Intl.DateTimeFormat('en-US',{timeZone:TZ,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(d);
 const x={};parts.forEach(z=>x[z.type]=z.value);
 return {date:x.year+'-'+x.month+'-'+x.day,time:x.hour+':'+x.minute+':'+x.second,sort:+d};
}
function eventDetails(m){
 const act=norm(m.acao);
 const origin=String(m.origem||'');
 const dest=String(m.destino||'');
 const sector=String(m.setor||'').replace(/\s+\(Leito.*$/i,'').trim();
 const originUti=isUti(origin),sectorUti=isUti(sector),destUti=isUti(dest);
 let kind='',destination='',reason='';
 if(/TRANSFERENCIA INTERNA/.test(act)){
  if(originUti&&!destUti&&dest.trim()){
   kind='Transferência interna';destination=dest;
  }else if(originUti&&destUti)reason='Transferência interna à própria UTI (não é saída)';
  else reason='Transferência interna sem origem UTI e destino externo identificados';
 }else if(/TRANSFERENCIA EXTERNA/.test(act)){
  if(originUti||sectorUti){
   if(destUti||!dest.trim())reason='Destino externo não confirmado ou inconsistente';
   else if(originUti){kind='Transferência externa';destination=dest}
   else reason='Origem cadastrada fora da UTI: conferir dados da transferência';
  }
 }else if(/OBITO|FALECIMENTO/.test(act)){
  if(sectorUti||originUti){kind='Óbito na UTI';destination='Óbito'}
 }else if(/ALTA HOSPITALAR|ALTA A PEDIDO|EVASAO/.test(act)){
  if(sectorUti||originUti){kind='Alta hospitalar';destination='Saída hospitalar'}
 }
 return {kind,destination,reason,origin,sector,dest};
}
function collect(w,from,to,utiOnly){
 const entries=[],review=[];
 for(const m of w.movimentacoesHistorico||[]){
  const when=dateInfo(m);if(!when.date||when.date<from||when.date>to)continue;
  const info=eventDetails(m);
  const relevant=isUti(info.origin)||isUti(info.sector);
  if(!relevant)continue;
  if(utiOnly&&![info.origin,info.sector].some(s=>norm(s)===norm(utiOnly)))continue;
  const entry={m,when,...info};
  if(info.kind){
   if(m.contabilizarIndicadores===false){entry.status='Não computado';review.push(entry)}
   else if(m.contabilizarIndicadores===true){entry.status='Confirmado';entries.push(entry)}
   else{entry.status='Sem confirmação';review.push(entry)}
  }else if(info.reason&&(/TRANSFERENCIA|ALTA|OBITO|EVASAO/.test(norm(m.acao)))){entry.status='Revisar';review.push(entry)}
 }
 entries.sort((a,b)=>b.when.sort-a.when);review.sort((a,b)=>b.when.sort-a.when);
 return {entries,review};
}
const csvEscape=x=>'"'+String(x??'').replace(/"/g,'""')+'"';
function install(){
 let w,d;try{w=frame.contentWindow;d=frame.contentDocument}catch{return}
 const host=d?.getElementById('indicadores');
 if(!w||!host||!Array.isArray(w.movimentacoesHistorico))return;
 if(activeDoc===d&&d.getElementById('hsj-relatorio-saidas-uti'))return;
 activeDoc=d;
 const root=d.createElement('section');
 root.id='hsj-relatorio-saidas-uti';root.style.cssText='background:#fff;border:1px solid #b5cde2;border-radius:10px;padding:15px;margin:14px 0;color:#163952';
 root.innerHTML='<h3 style="font-size:18px;margin:0 0 5px">Relatório de saídas da UTI — pacientes e destinos</h3>'+
  '<p style="font-size:12px;color:#576b81;margin:0 0 11px">Contabiliza somente saídas registradas para fora da UTI: transferências para outros setores, transferências externas, altas e óbitos. Solicitações, reservas e mudanças de leito dentro da UTI não são saídas.</p>'+
  '<div style="display:flex;flex-wrap:wrap;gap:9px;align-items:end;margin-bottom:12px">'+
  '<label style="font-size:12px;font-weight:600">De<input id="hsj-uti-from" type="date" style="display:block;padding:8px;border:1px solid #c3d3e2;border-radius:6px"></label>'+
  '<label style="font-size:12px;font-weight:600">Até<input id="hsj-uti-to" type="date" style="display:block;padding:8px;border:1px solid #c3d3e2;border-radius:6px"></label>'+
  '<label style="font-size:12px;font-weight:600">UTI de origem<select id="hsj-uti-unit" style="display:block;padding:8px;border:1px solid #c3d3e2;border-radius:6px"><option value="">Todas as UTIs</option></select></label>'+
  '<label style="font-size:12px;font-weight:600">Tipo de saída<select id="hsj-uti-type" style="display:block;padding:8px;border:1px solid #c3d3e2;border-radius:6px"><option value="">Todos</option><option>Transferência interna</option><option>Transferência externa</option><option>Alta hospitalar</option><option>Óbito na UTI</option></select></label>'+
  '<button id="hsj-uti-search" type="button" class="btn">Consultar</button><button id="hsj-uti-export" type="button" class="btn">Exportar CSV</button><button id="hsj-uti-print" type="button" class="btn">Imprimir</button></div>'+
  '<div id="hsj-uti-counts"></div><div id="hsj-uti-summary" style="font-size:12px;margin:10px 0;color:#536980"></div>'+
  '<div style="overflow-x:auto"><table style="border-collapse:collapse;width:100%;min-width:1020px;font-size:12px"><thead><tr style="background:#eaf2fa"><th style="padding:8px;text-align:left">Data / hora</th><th style="padding:8px;text-align:left">Paciente</th><th style="padding:8px;text-align:left">Prontuário</th><th style="padding:8px;text-align:left">UTI de origem</th><th style="padding:8px;text-align:left">Leito</th><th style="padding:8px;text-align:left">Tipo de saída</th><th style="padding:8px;text-align:left">Destino</th><th style="padding:8px;text-align:left">Classificação</th></tr></thead><tbody id="hsj-uti-rows"></tbody></table></div>'+
  '<details style="margin-top:11px;font-size:12px"><summary style="cursor:pointer;font-weight:700">Auditoria: registros não computados, pendentes ou inconsistentes (<span id="hsj-uti-audit-count">0</span>)</summary><div style="max-height:300px;overflow:auto"><table style="width:100%;min-width:800px;font-size:12px"><thead><tr><th>Data</th><th>Paciente</th><th>Movimentação</th><th>Origem</th><th>Destino</th><th>Motivo / status</th></tr></thead><tbody id="hsj-uti-audit-rows"></tbody></table></div></details>';
 const anchor=host.querySelector('#hsj-indicadores-conferencia-diaria')||host.querySelector('.page-header');
 if(anchor)anchor.after(root);else host.prepend(root);
 const get=id=>root.querySelector('#'+id);
 const now=localeDay();get('hsj-uti-from').value=now.slice(0,8)+'01';get('hsj-uti-to').value=now;
 let current=[];
 function draw(){
  const from=get('hsj-uti-from').value,to=get('hsj-uti-to').value;
  if(!from||!to||from>to){get('hsj-uti-summary').textContent='Informe um período válido.';return}
  const units=[...new Set((w.setoresData||[]).map(s=>s.nome).filter(isUti))];
  const unit=get('hsj-uti-unit'),selected=unit.value;
  unit.innerHTML='<option value="">Todas as UTIs</option>'+units.map(s=>'<option value="'+esc(s)+'">'+esc(s)+'</option>').join('');
  unit.value=units.includes(selected)?selected:'';
  const {entries,review}=collect(w,from,to,unit.value);
  const type=get('hsj-uti-type').value;
  current=entries.filter(x=>!type||x.kind===type);
  const audit=review.filter(x=>!type||x.kind===type||!x.kind&&type.includes('Transferência')&&norm(x.m.acao).includes('TRANSFERENCIA'));
  const count=kind=>current.filter(x=>x.kind===kind).length;
  const kpis=[['Total de saídas',current.length],['Para outros setores',count('Transferência interna')],['Transferências externas',count('Transferência externa')],['Altas hospitalares',count('Alta hospitalar')],['Óbitos',count('Óbito na UTI')]];
  get('hsj-uti-counts').innerHTML='<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(155px,1fr));gap:8px">'+kpis.map(([label,n])=>'<div style="border:1px solid #dae6f0;background:#f1f7fc;border-radius:8px;padding:9px"><small>'+label+'</small><div style="font-size:22px;font-weight:bold">'+n+'</div></div>').join('')+'</div>';
  const destinations=new Map();
  current.forEach(x=>destinations.set(x.destination,(destinations.get(x.destination)||0)+1));
  get('hsj-uti-summary').textContent='Período: '+from+' a '+to+' · Destinos: '+([...destinations].sort((a,b)=>b[1]-a[1]).map(([n,v])=>n+' ('+v+')').join(' · ')||'nenhuma saída confirmada')+' · '+audit.length+' registro(s) para auditoria.';
  get('hsj-uti-rows').innerHTML=current.map(x=>{
   const m=x.m,values=[x.when.date+' '+x.when.time,m.paciente||'',m.atendimento||m.prontuario||'',isUti(x.origin)?x.origin:x.sector,String(m.setor||'').match(/\(Leito\s*([^)]+)\)/i)?.[1]||m.leitoOrigem||'',x.kind,x.destination,m.tipoIndicador||'Sem classificação'];
   return '<tr>'+values.map(v=>'<td style="padding:7px;border-bottom:1px solid #dfe8ef">'+esc(v)+'</td>').join('')+'</tr>';
  }).join('')||'<tr><td colspan="8" style="padding:12px;text-align:center">Nenhuma saída confirmada para os filtros.</td></tr>';
  get('hsj-uti-audit-count').textContent=audit.length;
  get('hsj-uti-audit-rows').innerHTML=audit.map(x=>'<tr>'+[x.when.date+' '+x.when.time,x.m.paciente||'',x.m.acao||'',x.origin||x.sector,x.dest||'',x.reason||x.status].map(v=>'<td style="padding:6px;border-bottom:1px solid #e6edf3">'+esc(v)+'</td>').join('')+'</tr>').join('')||'<tr><td colspan="6">Nenhum registro inconsistente encontrado.</td></tr>';
 }
 get('hsj-uti-search').onclick=draw;
 ['hsj-uti-from','hsj-uti-to','hsj-uti-unit','hsj-uti-type'].forEach(id=>get(id).addEventListener('change',draw));
 get('hsj-uti-export').onclick=()=>{
  draw();const fields=['Data','Hora','Paciente','Prontuário','UTI de origem','Leito','Tipo de saída','Destino','Classificação','Status'];
  const rows=current.map(x=>{const m=x.m;return [x.when.date,x.when.time,m.paciente||'',m.atendimento||m.prontuario||'',isUti(x.origin)?x.origin:x.sector,String(m.setor||'').match(/\(Leito\s*([^)]+)\)/i)?.[1]||m.leitoOrigem||'',x.kind,x.destination,m.tipoIndicador||'',x.status]});
  const csv='\ufeff'+[fields,...rows].map(row=>row.map(csvEscape).join(';')).join('\r\n');
  const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));
  const a=d.createElement('a');a.href=url;a.download='SIGMA_saidas_UTI_'+get('hsj-uti-from').value+'_'+get('hsj-uti-to').value+'.csv';d.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);
 };
 get('hsj-uti-print').onclick=()=>{
  draw();const popup=window.open('','_blank','width=1200,height=900');
  if(!popup){alert('Autorize a janela de impressão do navegador.');return}
  const html=root.cloneNode(true);
  html.querySelectorAll('button,input,select,details').forEach(e=>e.remove());
  popup.document.write('<!doctype html><html><head><meta charset="utf-8"><title>Saídas da UTI</title><style>body{font:12px Arial;padding:20px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:5px;text-align:left}</style></head><body>'+html.innerHTML+'</body></html>');
  popup.document.close();popup.focus();popup.print();
 };
 draw();
 const timer=setInterval(()=>{if(!root.isConnected){clearInterval(timer);return}draw()},12000);
}
frame.addEventListener('load',()=>setTimeout(install,1300));
setInterval(install,3500);install();
})();