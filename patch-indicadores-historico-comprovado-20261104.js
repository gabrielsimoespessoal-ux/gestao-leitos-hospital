(()=>{
'use strict';
const frame=document.getElementById('appFrame');if(!frame)return;
const PATH='ocupacao_historica_periodos';
let cache=[],busy=false,lastLoad=0,error='',boundDoc=null;
const dates=(a,b)=>{if(!/^\d{4}-\d{2}-\d{2}$/.test(a)||!/^\d{4}-\d{2}-\d{2}$/.test(b)||a>b)return [];
const result=[],start=Date.parse(a+'T12:00:00Z'),end=Date.parse(b+'T12:00:00Z');
if(end-start>366*86400000)return [];
for(let t=start;t<=end;t+=86400000)result.push(new Date(t).toISOString().slice(0,10));
return result};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','"':'&#39;'}[c]));
const pct=(a,b)=>b>0?(a*100/b).toFixed(2).replace('.',',')+'%':'N/D';
const allowed=w=>Boolean(w?.hsjAuthReady&&w.firebaseModules?.getDoc&&w.firebaseModules?.runTransaction&&w.db);
function ui(w,d){
 const holder=d.getElementById('hsj-ocupacao-censo-verificavel');if(!holder)return;
 let box=d.getElementById('hsj-ocupacao-historico-verified');
 if(box)return box;
 box=d.createElement('div');box.id='hsj-ocupacao-historico-verified';
 box.style.cssText='margin-top:12px;padding:12px;background:#f7faff;border:1px solid #cbd9e8;border-radius:8px';
 box.innerHTML='<strong>Períodos históricos comprovados</strong><p style="font-size:12px;margin:5px 0">Registre apenas pacientes-dia e leitos-dia de relatórios conferidos. Cada período é identificado pela fonte; não se presume ocupação nos dias sem informação.</p>'+
 '<details id="hsj-ocupacao-import-dialog"><summary style="cursor:pointer;color:#07598c;font-weight:700;font-size:12px">Adicionar período histórico validado</summary>'+
 '<div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:10px"><label>Início<input id="hsj-hist-from" type="date" value="2026-10-01"></label><label>Fim<input id="hsj-hist-to" type="date" value="2026-10-05"></label>'+
 '<label>Pacientes-dia<input id="hsj-hist-pd" type="number" min="0" step="1" value="240" style="width:100px"></label>'+
 '<label>Leitos-dia<input id="hsj-hist-ld" type="number" min="1" step="1" value="1000" style="width:100px"></label>'+
 '<label>Fonte<input id="hsj-hist-source" type="text" maxlength="160" value="Relatório do sistema externo — Hospital São José" style="width:260px"></label>'+
 '<button id="hsj-hist-save" type="button" class="btn">Conferir e registrar</button></div>'+
 '<p style="font-size:11px;color:#64748b;margin-top:5px">Os valores iniciais 240 e 1.000 vêm do relatório de 01 a 05/10 enviado. Confirme a fonte antes de gravar. Esse total só vale para a visão geral do hospital.</p></details>'+
 '<div id="hsj-hist-result" style="margin-top:9px;font-size:12px"></div>';
 holder.appendChild(box);
 box.querySelector('#hsj-hist-save').onclick=async()=>{
  if(busy)return;
  if(!allowed(w)){alert('Sessão Firebase não autenticada.');return}
  const get=id=>box.querySelector('#'+id).value.trim();
  const begin=get('hsj-hist-from'),end=get('hsj-hist-to'),patientDays=Number(get('hsj-hist-pd')),bedDays=Number(get('hsj-hist-ld')),source=get('hsj-hist-source');
  const days=dates(begin,end);
  if(!days.length||days.length>366||!Number.isSafeInteger(patientDays)||!Number.isSafeInteger(bedDays)||bedDays<1||patientDays<0||patientDays>bedDays||source.length<8){
   alert('Informe datas válidas, totais inteiros (pacientes-dia entre zero e leitos-dia) e a fonte comprovada.');return
  }
  if(!confirm('Confirma que '+patientDays+' pacientes-dia e '+bedDays+' leitos-dia correspondem ao relatório original de '+begin+' a '+end+'? Esta gravação será identificada como fonte externa.'))return;
  busy=true;box.querySelector('#hsj-hist-save').disabled=true;
  try{
   const mods=w.firebaseModules,reference=mods.doc(w.db,'hospital',PATH);
   const now=new Date().toISOString(),entry={inicio:begin,fim:end,pacientesDia:patientDays,leitosDia:bedDays,fonte:source,confirmadoEm:now,escopo:'GERAL',metodo:'agregado_externo'};
   await mods.runTransaction(w.db,async tx=>{
    const snap=await tx.get(reference),prev=snap.exists()?snap.data():{},all=Array.isArray(prev.periodos)?prev.periodos:[];
    const conflicting=all.find(r=>!(end<r.inicio||begin>r.fim));
    if(conflicting)throw Error('O período coincide com outro registro histórico. Não é permitido somar duas vezes os mesmos dias.');
    tx.set(reference,{periodos:[...all,entry],atualizadoEm:now});
   });
   await load(w,true);render(w,d);
   alert('Período histórico registrado com origem identificada. Os indicadores serão recalculados.');
  }catch(e){error=e.message||String(e);alert('Não foi possível registrar o período: '+error)}
  finally{busy=false;box.querySelector('#hsj-hist-save').disabled=false}
 };
 return box;
}
async function load(w,force=false){
 if(!allowed(w)||busy&&!force)return;
 if(!force&&Date.now()-lastLoad<30000)return;
 const mod=w.firebaseModules,snap=await mod.getDoc(mod.doc(w.db,'hospital',PATH));
 cache=snap.exists()&&Array.isArray(snap.data().periodos)?snap.data().periodos:[];
 w.__hsjHistoricOccupancyVerified=cache;
 lastLoad=Date.now();error='';
 if(typeof w.renderizarIndicadores==='function')w.renderizarIndicadores();
}
function render(w,d){
 const box=ui(w,d);if(!box)return;
 const out=box.querySelector('#hsj-hist-result'),from=d.getElementById('filtro-data-inicio')?.value||'',to=d.getElementById('filtro-data-fim')?.value||'';
 const selected=[...d.querySelectorAll('#checkboxes-setores-container input:checked')].map(x=>x.value);
 const general=!selected.length||selected.includes('GERAL'),days=dates(from,to),windowDays=new Set(days);
 if(!days.length){out.textContent='Selecione um intervalo válido.';return}
 const matches=cache.filter(x=>windowDays.has(x.inicio)&&windowDays.has(x.fim)&&general);
 let aggregatePD=0,aggregateLD=0,aggregateDays=0,excluded=[],already=[];
 for(const x of matches){
  const segment=dates(x.inicio,x.fim);
  if(segment.some(day=>already.includes(day))){excluded.push('Período duplicado em fonte histórica');continue}
  already.push(...segment);aggregatePD+=Number(x.pacientesDia);aggregateLD+=Number(x.leitosDia);aggregateDays+=segment.length;
 }
 const coveredCount=Math.min(days.length,aggregateDays);
 out.innerHTML='<div><b>Histórico externo incluído no filtro:</b> '+matches.length+' período(s), '+aggregatePD+' pacientes-dia, '+aggregateLD+' leitos-dia, '+coveredCount+' dia(s) comprovado(s). '+(aggregateLD?'<b>Taxa nesses períodos: '+pct(aggregatePD,aggregateLD)+'</b>':'')+'</div>'+
  '<div style="margin-top:5px;color:#566778">'+(general?'Os dados externos são consolidados para o hospital; não permitem taxa por setor.':'Visão setorial: dados agregados externos não são aplicados, pois não identificam cada setor.')+
  ' Para o mês completo é necessário completar os demais dias com censos diários, sem sobreposição.</div>'+
  (error?'<div style="color:#a33">'+esc(error)+'</div>':'')+
  cache.map(x=>'<div style="margin-top:4px">Fonte: '+esc(x.fonte)+' — '+esc(x.inicio)+' a '+esc(x.fim)+' — '+pct(x.pacientesDia,x.leitosDia)+'</div>').join('');
 // Never falsely combine a historical aggregate with a daily record for the same day.
 const primary=d.getElementById('hsj-ocupacao-cobertura');
 if(primary&&aggregateDays&&general)primary.title='Há '+aggregateDays+' dias agregados externos verificados. A taxa total só pode incluir estes dias se não houver sobreposição com os censos diários.';
}
function init(){
 let w,d;try{w=frame.contentWindow;d=frame.contentDocument}catch{return}
 if(!d?.getElementById('indicadores')||!w||!w.firebaseModules)return;
 if(boundDoc!==d){boundDoc=d;cache=[];lastLoad=0}
 const box=ui(w,d);if(!box)return;
 if(allowed(w)&&Date.now()-lastLoad>30000)load(w).then(()=>render(w,d)).catch(e=>{error=e.message||String(e);render(w,d)});
 render(w,d);
}
frame.addEventListener('load',()=>{boundDoc=null;setTimeout(init,1200)});
setInterval(init,4500);init();
})();