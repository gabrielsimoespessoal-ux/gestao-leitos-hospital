/* SIGMA: bundle 5/5; ordem original preservada, fontes individuais intactas */
;/* FILE: patch-indicadores-historico-comprovado-20261104.js */
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
 '<p style="font-size:11px;color:#64748b;margin-top:5px">Os valores iniciais são exemplos: confira no relatório de origem. Para usar estes dados na ocupação, os 6 leitos transitórios da Urgência Particular, SRPA, salas operatórias e espera virtual devem estar excluídos dos pacientes-dia e leitos-dia. Esse total só vale para a visão geral.</p></details>'+
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
  if(!confirm('Confirma que '+patientDays+' pacientes-dia e '+bedDays+' leitos-dia correspondem ao relatório original de '+begin+' a '+end+'? Confirma também que os cálculos já EXCLUEM os 6 leitos da Urgência Particular, SRPA, salas operatórias e espera virtual? Esta gravação será identificada como fonte externa.'))return;
  busy=true;box.querySelector('#hsj-hist-save').disabled=true;
  try{
   const mods=w.firebaseModules,reference=mods.doc(w.db,'hospital',PATH);
   const now=new Date().toISOString(),entry={inicio:begin,fim:end,pacientesDia:patientDays,leitosDia:bedDays,fonte:source,confirmadoEm:now,escopo:'GERAL',metodo:'agregado_externo',leitosTransitoriosExcluidos:true};
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
 const matches=cache.filter(x=>windowDays.has(x.inicio)&&windowDays.has(x.fim)&&general&&x.leitosTransitoriosExcluidos===true);
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
  cache.map(x=>'<div style="margin-top:4px">Fonte: '+esc(x.fonte)+' — '+esc(x.inicio)+' a '+esc(x.fim)+' — '+(x.leitosTransitoriosExcluidos===true?pct(x.pacientesDia,x.leitosDia):'N/D — confirmar exclusão de áreas transitórias')+'</div>').join('');
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
;
;/* FILE: patch-conferencia-diaria-indicadores-20261104.js */
(()=>{
'use strict';
const frame=document.getElementById('appFrame');
if(!frame)return;
const TZ='America/Maceio';
const today=()=>{
 const p=new Intl.DateTimeFormat('en-US',{timeZone:TZ,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
 const d={};p.forEach(x=>d[x.type]=x.value);return d.year+'-'+d.month+'-'+d.day;
};
const dateOf=m=>{
 const raw=m.dataIso||m.dataDesfechoObj||m.data||'';
 if(raw&&typeof raw.toDate==='function')return dateOf({dataIso:raw.toDate().toISOString()});
 const s=String(raw);
 const iso=s.match(/^(\d{4})-(\d{2})-(\d{2})(?:T([\d:.]+)(Z|[+-]\d\d:?\d\d)?)?/);
 if(iso){
  if(iso[4]&&iso[5]){
   const dt=new Date(s);if(Number.isFinite(dt.getTime())){
    const p=new Intl.DateTimeFormat('en-US',{timeZone:TZ,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(dt);
    const o={};p.forEach(x=>o[x.type]=x.value);return o.year+'-'+o.month+'-'+o.day;
   }
  }
  return iso[1]+'-'+iso[2]+'-'+iso[3];
 }
 const br=s.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
 return br?br[3]+'-'+br[2]+'-'+br[1]:'';
};
const norm=x=>String(x??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','"':'&quot;',"'":'&#39;'}[c]));
const category=m=>{
 const a=norm(m.acao),ind=norm(m.tipoIndicador);
 if(a.includes('transferencia interna'))return 'Transferência interna';
 if(a.includes('transferencia externa'))return 'Transferência externa';
 if(a.includes('solicitacao de transferencia')||a.includes('cancelamento de transferencia'))return 'Solicitação / cancelamento';
 if(a==='admissao'||a.startsWith('admissao '))return 'Admissão';
 if(a.includes('obito')||a.includes('falecimento'))return 'Óbito';
 if(a.includes('alta hospitalar')||a==='alta'||a.includes('alta a pedido')||a.includes('evasao'))return 'Alta';
 if(a.includes('alta')&&ind.includes('alta'))return 'Alta';
 return 'Outros';
};
const keyDay=(value,delta)=>{
 const dt=new Date(value+'T12:00:00Z');dt.setUTCDate(dt.getUTCDate()+delta);return dt.toISOString().slice(0,10)
};
function init(){
 let w,d;try{w=frame.contentWindow;d=frame.contentDocument}catch{return}
 if(!w||!d||!Array.isArray(w.movimentacoesHistorico)||!d.getElementById('indicadores'))return;
 if(d.getElementById('hsj-indicadores-conferencia-diaria'))return;
 const section=d.getElementById('indicadores');
 const block=d.createElement('section');
 block.id='hsj-indicadores-conferencia-diaria';
 block.style.cssText='margin:12px 0;padding:15px;background:#fff;border:1px solid #b4ccdf;border-radius:10px;color:#193b54';
 block.innerHTML='<h3 style="margin:0 0 5px;font-size:17px">Conferência diária de indicadores</h3>'+
 '<p style="font-size:12px;color:#607086;margin-bottom:10px">Consulte admissões, altas, óbitos e transferências por data, com identificação dos eventos para auditoria. Contagens separadas por confirmação.</p>'+
 '<div style="display:flex;flex-wrap:wrap;gap:9px;align-items:end;margin-bottom:12px">'+
 '<label style="font-size:12px;font-weight:700">Dia para conferência<input type="date" id="hsj-conf-day" style="display:block;padding:8px;border:1px solid #b7cade;border-radius:5px;min-width:165px"></label>'+
 '<button type="button" class="btn" id="hsj-conf-prev">Dia anterior</button><button type="button" class="btn" id="hsj-conf-next">Dia seguinte</button>'+
 '<label style="font-size:12px;font-weight:700">Movimentação<select id="hsj-conf-type" style="display:block;padding:8px;border:1px solid #b7cade;border-radius:5px"><option value="">Todas as 4 categorias</option><option>Admissão</option><option>Alta</option><option>Óbito</option><option>Transferência interna</option><option>Transferência externa</option></select></label>'+
 '<label style="font-size:12px;font-weight:700">Setor<select id="hsj-conf-sector" style="display:block;padding:8px;border:1px solid #b7cade;border-radius:5px;max-width:270px"><option value="">Todos os setores</option></select></label>'+
 '<button type="button" class="btn" id="hsj-conf-csv">Exportar conferência CSV</button><button type="button" class="btn" id="hsj-conf-print">Imprimir</button></div>'+
 '<div id="hsj-conf-summary"></div><div style="margin:8px 0;font-size:12px;color:#63768b" id="hsj-conf-status"></div>'+
 '<div style="overflow-x:auto"><table style="border-collapse:collapse;width:100%;min-width:900px;font-size:12px"><thead><tr style="background:#eaf2f9"><th style="padding:8px;text-align:left">Data e hora</th><th style="padding:8px;text-align:left">Paciente</th><th style="padding:8px;text-align:left">Prontuário</th><th style="padding:8px;text-align:left">Movimentação</th><th style="padding:8px;text-align:left">Setor / origem</th><th style="padding:8px;text-align:left">Destino</th><th style="padding:8px;text-align:left">Classificação</th><th style="padding:8px;text-align:left">Indicador</th></tr></thead><tbody id="hsj-conf-rows"></tbody></table></div>';
 const anchor=section.querySelector('#hsj-indicadores-auditaveis')||section.querySelector('.page-header');
 if(anchor)anchor.after(block);else section.prepend(block);
 const get=id=>block.querySelector('#'+id);
 get('hsj-conf-day').value=today();
 get('hsj-conf-prev').onclick=()=>{get('hsj-conf-day').value=keyDay(get('hsj-conf-day').value||today(),-1);render()};
 get('hsj-conf-next').onclick=()=>{get('hsj-conf-day').value=keyDay(get('hsj-conf-day').value||today(),1);render()};
 ['hsj-conf-day','hsj-conf-type','hsj-conf-sector'].forEach(id=>get(id).addEventListener('change',render));
 let exportRows=[];
 get('hsj-conf-csv').onclick=()=>{
  const fields=['data','paciente','prontuario','movimentacao','origem','destino','classificacao','indicador'];
  const quote=v=>'"'+String(v??'').replace(/"/g,'""')+'"';
  const content='\ufeff'+[fields.join(';'),...exportRows.map(x=>fields.map(k=>quote(x[k])).join(';'))].join('\r\n');
  const url=URL.createObjectURL(new Blob([content],{type:'text/csv;charset=utf-8'}));
  const a=d.createElement('a');a.href=url;a.download='SIGMA_conferencia_diaria_'+get('hsj-conf-day').value+'.csv';d.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);
 };
 get('hsj-conf-print').onclick=()=>{
  const popup=window.open('','_blank','width=1100,height=850');
  if(!popup){alert('Permita a janela de impressão do SIGMA.');return}
  const clone=block.cloneNode(true);
  [...clone.querySelectorAll('button,input,select')].forEach(n=>n.remove());
  popup.document.write('<!doctype html><html><head><title>Conferência de indicadores</title><meta charset="utf-8"><style>body{font:12px Arial;padding:20px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:5px;text-align:left}</style></head><body><h2>Conferência diária: '+esc(get('hsj-conf-day').value)+'</h2>'+clone.innerHTML+'</body></html>');
  popup.document.close();popup.focus();popup.print();
 };
 function render(){
  const value=get('hsj-conf-day').value||today(),rows=w.movimentacoesHistorico||[];
  const dayRows=rows.filter(m=>dateOf(m)===value);
  const sectors=[...new Set(dayRows.flatMap(m=>[m.origem,m.destino,m.setor]).map(x=>String(x||'').replace(/\s+\(Leito.*$/i,'').trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'pt-BR'));
  const sector=get('hsj-conf-sector'),chosen=sector.value;
  sector.innerHTML='<option value="">Todos os setores</option>'+sectors.map(x=>'<option value="'+esc(x)+'">'+esc(x)+'</option>').join('');
  sector.value=sectors.includes(chosen)?chosen:'';
  const selected=sector.value,type=get('hsj-conf-type').value;
  const match=dayRows.filter(m=>{
   const cat=category(m);
   return ['Admissão','Alta','Óbito','Transferência interna','Transferência externa'].includes(cat)
    &&(!type||cat===type)
    &&(!selected||[m.origem,m.destino,m.setor].some(v=>norm(v).includes(norm(selected))));
  });
  const metrics=['Admissão','Alta','Óbito','Transferência interna','Transferência externa'];
  const counts=metrics.map(cat=>{
   const relevant=match.filter(m=>category(m)===cat);
   return {cat,total:relevant.length,confirmed:relevant.filter(m=>m.contabilizarIndicadores===true).length,
    excluded:relevant.filter(m=>m.contabilizarIndicadores===false).length,
    legacy:relevant.filter(m=>m.contabilizarIndicadores!==true&&m.contabilizarIndicadores!==false).length};
  });
  get('hsj-conf-summary').innerHTML='<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px">'+counts.map(x=>
   '<div style="background:#f0f6fc;border:1px solid #d4e2ed;border-radius:8px;padding:10px"><b>'+esc(x.cat)+'</b><div style="font-size:23px;font-weight:700">'+x.total+'</div><small>Confirmados: '+x.confirmed+' · Não computados: '+x.excluded+' · Sem confirmação: '+x.legacy+'</small></div>'
  ).join('')+'</div>';
  exportRows=match.map(m=>({
   data:String(m.dataIso||m.dataDesfechoObj||m.data||''),paciente:String(m.paciente||''),
   prontuario:String(m.atendimento||m.prontuario||''),movimentacao:String(m.acao||''),
   origem:String(m.origem||m.setor||''),destino:String(m.destino||''),
   classificacao:String(m.tipoIndicador||'Não classificado'),
   indicador:m.contabilizarIndicadores===true?'Sim':m.contabilizarIndicadores===false?'Não':'Sem confirmação'
  }));
  get('hsj-conf-rows').innerHTML=exportRows.map(row=>'<tr>'+['data','paciente','prontuario','movimentacao','origem','destino','classificacao','indicador'].map(k=>'<td style="border-bottom:1px solid #dce7f1;padding:7px">'+esc(row[k])+'</td>').join('')+'</tr>').join('')||'<tr><td colspan="8" style="text-align:center;padding:12px">Nenhum evento dessas categorias na data e filtros selecionados.</td></tr>';
  get('hsj-conf-status').textContent='Movimentações do dia no histórico: '+dayRows.length+' · Eventos nas categorias selecionadas: '+match.length+' · Atualização automática com os dados sincronizados do SIGMA. Solicitações ainda não concluídas não são contadas como transferências realizadas.';
 }
 render();
 const timer=w.setInterval(()=>{if(!block.isConnected){w.clearInterval(timer);return}if(d.hidden||!d.getElementById('indicadores')?.classList.contains('active'))return;render()},15000);
}
frame.addEventListener('load',()=>setTimeout(init,1300));
setInterval(init,3000);init();
})();
;
;/* FILE: patch-matriz-auditavel-indicadores-20261104.js */
(()=>{
const frame=document.getElementById('appFrame');if(!frame)return;
const norm=x=>String(x||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const date=x=>{const s=String(x.dataIso||x.dataDesfechoObj||x.data||'');const iso=s.match(/^\d{4}-\d{2}-\d{2}/);if(iso)return iso[0];const br=s.match(/^(\d{2})\/(\d{2})\/(\d{4})/);return br?br[3]+'-'+br[2]+'-'+br[1]:''};
const q=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let docRef=null;
function start(){
let w,d;try{w=frame.contentWindow;d=frame.contentDocument}catch{return}
const host=d?.getElementById('indicadores');if(!host||!Array.isArray(w.movimentacoesHistorico))return;
if(docRef===d&&d.getElementById('hsj-matriz-auditavel'))return;docRef=d;
const root=d.createElement('section');root.id='hsj-matriz-auditavel';root.style.cssText='background:white;padding:14px;margin:13px 0;border:1px solid #c7d7e7;border-radius:9px';
root.innerHTML='<h3>Matriz de indicadores — conferência e rastreabilidade</h3><p style="font-size:12px">Apuração por período, usando somente registros confirmados. Métricas que exigem dados externos ou censos completos permanecem pendentes.</p><div id="hsj-matriz-kpis"></div>';
const anchor=host.querySelector('#hsj-indicadores-conferencia-diaria')||host.querySelector('.page-header');anchor?.after(root);
function draw(){
const a=d.getElementById('filtro-data-inicio')?.value||'',b=d.getElementById('filtro-data-fim')?.value||'';
const selected=[...d.querySelectorAll('#checkboxes-setores-container input:checked')].map(el=>el.value),general=!selected.length||selected.includes('GERAL');
const events=(w.movimentacoesHistorico||[]).filter(m=>{const dt=date(m);return dt&&(!a||dt>=a)&&(!b||dt<=b)&&(general||selected.some(s=>[m.setor,m.origem,m.destino].some(v=>norm(v).includes(norm(s)))))});
const adm=events.filter(m=>norm(m.acao)==='admissao'),alta=events.filter(m=>/alta hospitalar|alta a pedido|evasao/.test(norm(m.acao))),ob=events.filter(m=>/obito/.test(norm(m.acao))),ti=events.filter(m=>/transferencia interna/.test(norm(m.acao))),te=events.filter(m=>/transferencia externa/.test(norm(m.acao)));
const confirmed=x=>x.filter(m=>m.contabilizarIndicadores===true).length,unknown=x=>x.filter(m=>typeof m.contabilizarIndicadores!=='boolean').length;
const items=[['Admissões',adm],['Altas hospitalares',alta],['Óbitos',ob],['Transferências internas',ti],['Transferências externas',te]];
const summary=items.map(([n,x])=>({nome:n,valor:confirmed(x),pendentes:unknown(x),eventos:x}));
summary.push({nome:'Altas + transferências externas',valor:confirmed(alta)+confirmed(te),pendentes:unknown([...alta,...te]),eventos:[...alta,...te]});
summary.push({nome:'Altas + transferências externas + óbitos',valor:confirmed(alta)+confirmed(te)+confirmed(ob),pendentes:unknown([...alta,...te,...ob]),eventos:[...alta,...te,...ob]});
const exits=confirmed(alta)+confirmed(te)+confirmed(ob);summary.push({nome:'Mortalidade entre saídas confirmadas',valor:exits?(100*confirmed(ob)/exits).toFixed(2).replace('.',',')+'%':'N/D',pendentes:unknown([...alta,...te,...ob]),eventos:[...alta,...te,...ob]});
const pending=['Óbitos após 24h','Número e taxa de reinternações','Pacientes-dia e taxa de ocupação','Tempo médio de permanência','Giro de leitos','Pacientes residentes ≥ 90 dias','Cirurgias agendadas e realizadas','Suspensões cirúrgicas e taxa','Solicitações de UTI pós-operatória'];
const el=root.querySelector('#hsj-matriz-kpis');
el.innerHTML='<p style="font-size:12px">Período: '+q(a)+' a '+q(b)+' · Eventos encontrados: '+events.length+'</p><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:8px">'+summary.map((x,i)=>'<button type="button" data-audit="'+i+'" style="text-align:left;border:1px solid #dae4ee;border-radius:8px;padding:10px;background:#f5f9ff;cursor:pointer"><b>'+q(x.nome)+'</b><div style="font-size:21px;font-weight:700">'+x.valor+'</div><small>Sem confirmação: '+x.pendentes+' · Ver registros</small></button>').join('')+'</div><p style="font-size:12px;margin-top:9px"><b>Dependem de fonte ou validação adicional:</b> '+pending.map(q).join(' · ')+'</p><div id="hsj-audit-details" style="max-height:280px;overflow:auto"></div>';
el.querySelectorAll('[data-audit]').forEach(btn=>btn.onclick=()=>{
const row=summary[Number(btn.dataset.audit)];
el.querySelector('#hsj-audit-details').innerHTML='<h4>'+q(row.nome)+'</h4><table style="font-size:12px;width:100%"><tr><th>Data</th><th>Prontuário</th><th>Paciente</th><th>Movimentação</th><th>Contabilizar</th></tr>'+row.eventos.map(m=>'<tr>'+[date(m),m.atendimento||'',m.paciente||'',m.acao||'',m.contabilizarIndicadores===true?'Sim':m.contabilizarIndicadores===false?'Não':'Sem confirmação'].map(v=>'<td style="border-bottom:1px solid #eee;padding:5px">'+q(v)+'</td>').join('')+'</tr>').join('')+'</table>'});
}
draw();const t=setInterval(()=>{if(!root.isConnected){clearInterval(t);return}if(d.hidden||!d.getElementById('indicadores')?.classList.contains('active'))return;draw()},8000);
}
frame.addEventListener('load',()=>setTimeout(start,1500));setInterval(start,3500);start();
})();
;
;/* FILE: patch-relatorio-saidas-uti-20261104.js */
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
;