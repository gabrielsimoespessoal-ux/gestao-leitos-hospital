(()=>{
'use strict';
const frame=document.getElementById('appFrame');if(!frame)return;
const TZ='America/Maceio';
const excluded=/ESPERA VIRTUAL|SALAS OPERAT[OÓ]RIAS|^SRPA$|URGENCIA|URGÊNCIA/i;
let wired=false,writing=false,lastAttempt='',daily={},loadingKey='',loadVersion=0;
let saveError='';
const dateKey=dt=>{
 const parts=new Intl.DateTimeFormat('en-US',{timeZone:TZ,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(dt);
 const o={};parts.forEach(p=>o[p.type]=p.value);return o.year+'-'+o.month+'-'+o.day;
};
const periodDays=(a,b)=>{
 if(!/^\d{4}-\d{2}-\d{2}$/.test(a)||!/^\d{4}-\d{2}-\d{2}$/.test(b)||a>b)return [];
 const out=[],t0=Date.parse(a+'T12:00:00Z'),t1=Date.parse(b+'T12:00:00Z');
 if(!Number.isFinite(t0)||!Number.isFinite(t1)||t1-t0>366*864e5)return [];
 for(let t=t0;t<=t1;t+=864e5)out.push(new Date(t).toISOString().slice(0,10));
 return out;
};
function counts(sectors){
 return (sectors||[]).filter(s=>s&&!s.virtual&&!excluded.test(String(s.nome||''))).map(s=>{
  const beds=(s.leitos||[]),blocked=beds.filter(l=>l.status==='bloqueado').length;
  const operational=beds.length-blocked,occupied=beds.filter(l=>l.status==='ocupado').length;
  return {setor:String(s.nome||''),ocupados:occupied,operacionais:operational,bloqueados:blocked,capacidade:beds.length};
 });
}
function selector(win,doc){
 const section=doc.getElementById('indicadores');if(!section)return null;
 const from=doc.getElementById('filtro-data-inicio')?.value||'',to=doc.getElementById('filtro-data-fim')?.value||'';
 const chosen=[...doc.querySelectorAll('#checkboxes-setores-container input:checked')].map(el=>el.value);
 const all=!chosen.length||chosen.includes('GERAL');
 return {section,from,to,chosen,all,days:periodDays(from,to)};
}
function getParts(win,doc){return {db:win.db,mod:win.firebaseModules,select:selector(win,doc)}}
function activeSource(win){
 return Boolean(win.hsjAuthReady&&win.db&&win.firebaseModules?.getDoc&&win.firebaseModules?.runTransaction);
}
function panel(doc){
 let el=doc.getElementById('hsj-ocupacao-censo-verificavel');
 const root=doc.getElementById('indicadores');if(!root)return null;
 if(!el){
  el=doc.createElement('section');el.id='hsj-ocupacao-censo-verificavel';
  el.style.cssText='background:white;padding:15px;margin:12px 0;border:1px solid #b7d4e7;border-radius:10px;color:#123955';
  const head=doc.createElement('div');head.innerHTML='<h3 style="margin:0 0 5px;font-size:16px">Ocupação por censo diário — automática</h3><p style="font-size:12px;color:#536b80;margin:0 0 8px">Pacientes-dia ÷ leitos operacionais-dia. Não confundir com admissões, reservas ou ocupação atual.</p>';
  el.appendChild(head);
  const result=doc.createElement('div');result.id='hsj-ocupacao-resultado';el.appendChild(result);
  const footer=doc.createElement('p');footer.id='hsj-ocupacao-cobertura';footer.style.cssText='font-size:12px;color:#52677d;margin-top:7px';el.appendChild(footer);
  const anchor=root.querySelector('#kpi-container')||root.querySelector('.page-header');
  if(anchor)anchor.before(el);else root.prepend(el);
 }
 return el;
}
function pct(num,den){return den>0?(100*num/den).toFixed(2).replace('.',',')+'%':'N/D'}
function esc(x){return String(x??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function eligible(row,s){
 if(s.all)return true;
 return s.chosen.includes(row.setor);
}
function render(win,doc){
 const s=selector(win,doc),holder=panel(doc);if(!s||!holder)return;
 const main=holder.querySelector('#hsj-ocupacao-resultado'),footer=holder.querySelector('#hsj-ocupacao-cobertura');
 const days=s.days;
 if(!days.length){main.textContent='Selecione um período válido de até 366 dias para consultar a ocupação diária.';footer.textContent='';return}
 let occ=0,capacity=0,covered=0,complete=0;
 const bySector=new Map(),missing=[];
 for(const day of days){
  const item=daily[day];
  if(!item||!Array.isArray(item.setores)){missing.push(day);continue}
  covered++;if(item.fechado===true)complete++;
  const ds=item.setores.filter(x=>eligible(x,s));
  for(const x of ds){
   occ+=x.ocupados;capacity+=x.operacionais;
   const state=bySector.get(x.setor)||{occupied:0,operational:0,days:0};
   state.occupied+=x.ocupados;state.operational+=x.operacionais;state.days++;
   bySector.set(x.setor,state);
  }
 }
 const fullyCovered=covered===days.length;
 const certified=fullyCovered&&complete===days.length;
 const shown=capacity?pct(occ,capacity):'N/D';
 const label=certified?'Taxa mensal validada':fullyCovered?'Taxa mensal por censos registrados (provisória)':'Taxa parcial por censos registrados';
 main.innerHTML='<div style="display:flex;gap:10px;flex-wrap:wrap;margin:6px 0">'+
  '<div style="border:1px solid #cad9e9;background:#f1f7ff;border-radius:8px;padding:9px 13px;min-width:175px"><small>'+label+'</small><div style="font-size:24px;font-weight:700">'+esc(shown)+'</div></div>'+
  '<div style="border:1px solid #cad9e9;border-radius:8px;padding:9px 13px"><small>Pacientes-dia registrados</small><div style="font-size:20px;font-weight:700">'+occ+'</div></div>'+
  '<div style="border:1px solid #cad9e9;border-radius:8px;padding:9px 13px"><small>Leitos operacionais-dia registrados</small><div style="font-size:20px;font-weight:700">'+capacity+'</div></div>'+
  '<div style="border:1px solid #cad9e9;border-radius:8px;padding:9px 13px"><small>Dias com censo</small><div style="font-size:20px;font-weight:700">'+covered+' / '+days.length+'</div></div></div>'+
  '<details style="font-size:12px"><summary style="cursor:pointer;font-weight:600">Ver ocupação por setor</summary><div style="overflow-x:auto;margin-top:6px"><table style="border-collapse:collapse;width:100%;font-size:12px"><thead><tr><th style="text-align:left">Setor</th><th>Pacientes-dia</th><th>Leitos-dia</th><th>Taxa</th><th>Dias</th></tr></thead><tbody>'+
   [...bySector].sort((a,b)=>a[0].localeCompare(b[0],'pt-BR')).map(([name,v])=>'<tr><td style="padding:5px;border-bottom:1px solid #eee">'+esc(name)+'</td><td style="text-align:center">'+v.occupied+'</td><td style="text-align:center">'+v.operational+'</td><td style="text-align:center">'+pct(v.occupied,v.operational)+'</td><td style="text-align:center">'+v.days+'</td></tr>').join('')+'</tbody></table></div></details>';
 footer.textContent=(certified?'Todos os censos do período foram fechados.':fullyCovered?'Todos os dias têm registro, mas há censos ainda não fechados; resultado provisório.':'Faltam '+missing.length+' dia(s) de censo no período; resultado parcial, não utilizar como taxa mensal oficial.')+
  ' · Excluídos: espera virtual, salas operatórias, SRPA e urgências. Leitos bloqueados não entram no denominador.'+
  (saveError?' · ALERTA: não foi possível gravar censo diário: '+saveError:'');
 // Legacy accumulated occupancy is not evidence-based: suppress it, never fill with approximations.
 const kpi=doc.getElementById('kpi-container');
 if(kpi)for(const card of kpi.children){
  if(/ocupação.*acum/i.test(card.querySelector('h4')?.textContent||'')){
   const value=card.querySelector('.kpi-value');if(value)value.textContent=fullyCovered?shown:'N/D';
   card.title=certified?'Censo diário fechado para todas as datas':fullyCovered?'Valor provisório: todos os dias têm censo, sem fechamento formal':'Faltam censos diários; taxa mensal indisponível';
  }
 }
 const table=doc.getElementById('tabela-indicadores-detalhada');
 if(table){
  [...table.rows].forEach(tr=>{
   const cells=tr.cells;if(cells.length<10)return;
   const sector=cells[0].textContent.trim(),item=bySector.get(sector);
   cells[3].textContent=fullyCovered&&item&&item.days===days.length?pct(item.occupied,item.operational):'N/D';
   cells[5].textContent=fullyCovered&&item&&item.days===days.length&&item.operational>0?pct(item.operational-item.occupied,item.operational):'N/D';
   cells[7].textContent=fullyCovered&&item&&item.days===days.length?String(item.occupied):'N/D';
  });
 }
}
async function loadRange(win,doc){
 if(!activeSource(win))return;
 const s=selector(win,doc);if(!s)return;
 const key=s.from+'|'+s.to;
 if(!s.days.length){render(win,doc);return}
 if(key===loadingKey)return;
 loadingKey=key;const version=++loadVersion;
 const {doc:ref,getDoc}=win.firebaseModules;
 // Per-day documents preserve historical results independently of the live bed board.
 for(let i=0;i<s.days.length;i+=12){
  const batch=s.days.slice(i,i+12);
  await Promise.all(batch.map(async day=>{
   try{
    const snap=await getDoc(ref(win.db,'hospital','censo_'+day.replace(/-/g,'_')));
    if(version===loadVersion&&snap.exists())daily[day]=snap.data();
   }catch(err){if(version===loadVersion)saveError='Leitura dos censos: '+String(err.code||err.message||err)}
  }));
  if(version!==loadVersion)return;
  render(win,doc);
 }
}
async function capture(win,doc,snapshot){
 if(writing||!activeSource(win)||!snapshot||snapshot.metadata?.fromCache||snapshot.metadata?.hasPendingWrites||!snapshot.exists())return;
 const source=snapshot.data();
 if(!Array.isArray(source.setoresData))return;
 const revision=Number(source._meta?.revision||0),day=dateKey(new Date());
 const snapshotCounts=counts(source.setoresData);
 const signature=day+'|'+revision+'|'+JSON.stringify(snapshotCounts);
 if(signature===lastAttempt)return;
 writing=true;
 try{
  const {doc:ref,runTransaction}=win.firebaseModules;
  const destination=ref(win.db,'hospital','censo_'+day.replace(/-/g,'_'));
  const record=await runTransaction(win.db,async tx=>{
   const existing=await tx.get(destination);
   const prev=existing.exists()?existing.data():null;
   if(prev?.fechado===true)return prev;
   const now=new Date();
   const current={dia:day,atualizadoEm:now.toISOString(),versaoFonte:revision,
    setores:snapshotCounts,fechado:false,criterio:'Ultimo estado confirmado do banco no dia; censo provisorio'};
   if(prev&&Number(prev.versaoFonte)>revision)return prev;
   tx.set(destination,current);return current;
  });
  daily[day]=record;lastAttempt=signature;saveError='';
  render(win,doc);
 }catch(err){saveError=String(err.code||err.message||err);render(win,doc)}
 finally{writing=false}
}
function init(){
 let win,doc;try{win=frame.contentWindow;doc=frame.contentDocument}catch{return}
 if(!win||!doc||!doc.getElementById('indicadores')||!win.firebaseModules?.onSnapshot||!win.db)return;
 panel(doc);
 if(!wired){
  wired=true;
  const ref=win.firebaseModules.doc(win.db,'hospital','dados');
  win.firebaseModules.onSnapshot(ref,snap=>capture(win,doc,snap),err=>{saveError=String(err.code||err.message||err);render(win,doc)});
  const previous=win.renderizarIndicadores;
  if(typeof previous==='function')win.renderizarIndicadores=function(){
   const output=previous.apply(this,arguments);
   render(win,doc);loadRange(win,doc).catch(err=>console.warn('Censos:',err));return output;
  };
  const dates=['filtro-data-inicio','filtro-data-fim'];
  dates.forEach(id=>doc.getElementById(id)?.addEventListener('change',()=>{loadRange(win,doc).catch(()=>{});render(win,doc)}));
  setInterval(()=>{
   if(!frame.isConnected)return;
   loadingKey='';
   loadRange(win,doc).catch(()=>{});
   render(win,doc);
  },120000);
  // Detect day rollover even if no hospital movement has occurred.
  let lastDay=dateKey(new Date());
  setInterval(async()=>{
   if(!frame.isConnected||!activeSource(win))return;
   const now=dateKey(new Date());
   if(now===lastDay)return;
   lastDay=now;
   try{
    const snap=await win.firebaseModules.getDoc(win.firebaseModules.doc(win.db,'hospital','dados'));
    await capture(win,doc,snap);
   }catch(err){saveError='Censo na mudança de dia: '+String(err.code||err.message||err);render(win,doc)}
  },60000);
 }
 loadRange(win,doc).catch(()=>{});render(win,doc);
}
frame.addEventListener('load',()=>{wired=false;daily={};loadingKey='';setTimeout(init,1100)});
setInterval(init,2500);init();
})();