/* SIGMA: bundle 4/5; ordem original preservada, fontes individuais intactas */
;/* FILE: patch-indicadores-exclusivos-transferencias-20261028.js */
(()=>{
const frame=document.getElementById('appFrame');if(!frame)return;
function attach(){
 let w,d;try{w=frame.contentWindow;d=frame.contentDocument}catch{return false}
 if(!w||!d||!d.getElementById('transferencias')||typeof w.atualizarTabelasTransferencias!=='function')return false;
 if(w.__hsjIndicadoresTransferenciaExterna20261028)return true;
 w.__hsjIndicadoresTransferenciaExterna20261028=true;
 const root=d.createElement('section');root.id='hsj-indicadores-transferencias-externas';root.style.cssText='background:#fff;border:1px solid #cbd5e1;border-radius:12px;padding:16px;margin:18px 0;max-width:100%;overflow:auto;color:#19324d';
 const panel=d.getElementById('transferencias');
 const title=d.createElement('h3');title.textContent='📊 Indicadores exclusivos — Transferências externas concluídas';root.appendChild(title);
 const row=d.createElement('div');row.style.cssText='display:flex;gap:12px;align-items:end;flex-wrap:wrap;margin:12px 0';
 const mk=(label,type)=>{const l=d.createElement('label');l.textContent=label;l.style.cssText='font-size:12px;font-weight:bold';const input=d.createElement('input');input.type=type;input.style.cssText='display:block;padding:9px;border:1px solid #cbd5e1;border-radius:6px';l.appendChild(input);row.appendChild(l);return input};
 const initial=new Date();const today=initial.toLocaleDateString('en-CA',{timeZone:'America/Araguaina'});const start=mk('Data de conclusão — de','date'),end=mk('Até','date');start.value=today.slice(0,7)+'-01';end.value=today;
 const profile=mk('Filtrar perfil','text'),destination=mk('Filtrar instituição/local destino','text');profile.placeholder='Todos os perfis';destination.placeholder='Todos os destinos';
 root.appendChild(row);
 const status=d.createElement('p');status.style.cssText='font-size:12px;color:#475569';root.appendChild(status);
 const cards=d.createElement('div');cards.style.cssText='display:flex;gap:12px;flex-wrap:wrap;margin:12px 0';root.appendChild(cards);
 const tables=d.createElement('div');root.appendChild(tables);
 const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const date=t=>{const z=new Date(t||'');return Number.isFinite(z.getTime())?z:null};
 const day=t=>t?new Intl.DateTimeFormat('en-CA',{timeZone:'America/Araguaina',year:'numeric',month:'2-digit',day:'2-digit'}).format(t):'';
 const norm=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 function table(heading,items,secondary){const section=d.createElement('div');section.style.margin='18px 0';const h=d.createElement('h4');h.textContent=heading;section.appendChild(h);const t=d.createElement('table');t.style.cssText='border-collapse:collapse;width:100%;font-size:13px';const hr=t.insertRow();for(const label of [secondary?'Local de origem':'Categoria','Transferências','Tempo médio (horas)']){const th=d.createElement('th');th.textContent=label;th.style.cssText='padding:9px;text-align:left;background:#edf2f7;border:1px solid #dbe3eb';hr.appendChild(th)}for(const [key,arr] of items){const tr=t.insertRow();const times=arr.map(x=>x.hours).filter(Number.isFinite);for(const value of [key,arr.length,times.length?(times.reduce((a,b)=>a+b,0)/times.length).toFixed(1):'N/D']){const td=tr.insertCell();td.textContent=value;td.style.cssText='padding:9px;border:1px solid #dbe3eb'}}section.appendChild(t);return section}
 function group(rows,key){const map=new Map();rows.forEach(x=>{const k=String(x[key]||'Não informado').trim()||'Não informado';if(!map.has(k))map.set(k,[]);map.get(k).push(x)});return [...map].sort((a,b)=>b[1].length-a[1].length)}
 function render(){
  const list=Array.isArray(w.transferenciasFinalizadas)?w.transferenciasFinalizadas:[];
  const all=list.filter(t=>/finalizada\s*\/\s*baixada/i.test(t.statusFinal||'')&&!!t.setorOrigem&&t.setorOrigem!=='Sem leito ocupado');
  const invalid=all.filter(x=>!date(x.dataFinalizacao));
  const filtered=all.filter(t=>{const finish=date(t.dataFinalizacao);if(!finish)return false;const dateStr=day(finish);return(!start.value||dateStr>=start.value)&&(!end.value||dateStr<=end.value)&&norm(t.perfil).includes(norm(profile.value))&&norm(t.destino).includes(norm(destination.value))});
  const rows=filtered.map(t=>{const finish=date(t.dataFinalizacao),begin=date(t.dataIso)||date(t.data);let hours=begin&&finish?(finish-begin)/36e5:NaN;if(hours<0)hours=NaN;return {perfil:t.perfil||'Não informado',destino:t.destino||'Não informado',origem:t.setorOrigem||'Não informado',hours}});
  const valid=rows.map(x=>x.hours).filter(Number.isFinite);
  const avg=valid.length?valid.reduce((a,b)=>a+b,0)/valid.length:NaN;
  status.textContent='Fonte: somente Transferências Finalizadas (Baixadas) com leito de origem identificado. Solicitações ativas, canceladas e baixas administrativas sem leito não entram nesta apuração. Registros sem data válida de baixa: '+invalid.length+'.';
  cards.replaceChildren();
  for(const [name,val] of [['Transferências externas concluídas',rows.length],['Destinos diferentes',new Set(rows.map(x=>x.destino)).size],['Tempo médio de transferência',Number.isFinite(avg)?avg.toFixed(1)+' h':'N/D'],['Sem dados suficientes de duração',rows.length-valid.length]]){
   const c=d.createElement('div');c.style.cssText='background:#eef4fc;border:1px solid #dbe6f4;border-radius:9px;padding:12px;min-width:180px';const small=d.createElement('div');small.textContent=name;small.style.fontSize='12px';const b=d.createElement('b');b.textContent=String(val);b.style.fontSize='23px';c.append(small,b);cards.appendChild(c)
  }
  tables.replaceChildren(table('Transferências por perfil',group(rows,'perfil')),table('Transferências por instituição / local de destino',group(rows,'destino')),table('Transferências por setor de origem',group(rows,'origem'),true));
  const n=d.createElement('p');n.style.cssText='font-size:12px;color:#52657b';n.textContent='Tempo de transferência = baixa confirmada − solicitação registrada. N/D indica ausência de datas suficientes; não há estimativas. Período filtrado pela data da baixa.';tables.appendChild(n);
 }
 [start,end,profile,destination].forEach(el=>el.addEventListener(el.type==='date'?'change':'input',render));
 const header=panel.querySelector('.page-header');if(header)header.after(root);else panel.prepend(root);
 const original=w.atualizarTabelasTransferencias;
 w.atualizarTabelasTransferencias=function(...args){const result=original.apply(this,args);render();return result};
 render();setInterval(()=>{if(!d.hidden&&panel.classList.contains('active'))render()},12000);
 return true;
}
frame.addEventListener('load',()=>setTimeout(attach,500));let k=0;const timer=setInterval(()=>{if(attach()||++k>100)clearInterval(timer)},250);
})();
;
;/* FILE: patch-separar-indicadores-transferencias-20261028.js */
(()=>{
 const frame=document.getElementById('appFrame');if(!frame)return;
 function install(){
  let w,d;try{w=frame.contentWindow;d=frame.contentDocument}catch{return}
  if(!w||!d||typeof w.renderizarIndicadores!=='function'||w.__hsjSeparacaoTransferencia20261028)return;
  w.__hsjSeparacaoTransferencia20261028=true;
  const normalize=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  function clean(){
   const host=d.getElementById('indicadores');if(!host)return;
   for(const card of host.querySelectorAll('#kpi-container .kpi-card,#hsj-indicadores-auditaveis .hsj-evento')){
    const label=normalize(card.querySelector('h4,small')?.textContent);
    if(label.includes('transferencia'))card.remove();
   }
   for(const table of host.querySelectorAll('table')){
    const row=table.querySelector('thead tr');if(!row)continue;
    const indexes=[...row.children].map((cell,i)=>normalize(cell.textContent).includes('transferencia')?i:-1).filter(i=>i>=0);
    if(!indexes.length)continue;
    for(const tr of table.querySelectorAll('tr')){
     const cells=[...tr.children];
     for(const i of indexes.sort((a,b)=>b-a))cells[i]?.remove();
    }
   }
  }
  const prior=w.renderizarIndicadores;
  w.renderizarIndicadores=function(...args){const result=prior.apply(this,args);clean();return result};
  clean();
 }
 frame.addEventListener('load',()=>setTimeout(install,450));let n=0;const timer=setInterval(()=>{install();if(frame.contentWindow?.__hsjSeparacaoTransferencia20261028||++n>100)clearInterval(timer)},250);
})();
;
;/* FILE: patch-perfis-pediatricos-identificacao-20261028.js */
(()=>{
const frame=document.getElementById('appFrame');if(!frame)return;
function install(){
 let d,w;try{d=frame.contentDocument;w=frame.contentWindow}catch{return false}
 if(!d||!w||!Array.isArray(w.setoresData)||typeof w.renderizarPainelLeitos!=='function')return false;
 if(w.__hsjPerfisPediatricos20261028)return true;
 w.__hsjPerfisPediatricos20261028=true;
 const profiles=['Enfermaria Clínica Pediátrica','Enfermaria Cirúrgica Pediátrica'];
 const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
 const css=d.createElement('style');
 css.textContent='#painel-setores-detalhado .leito-pill.hsj-ped-perfil{box-shadow:inset 0 0 0 2px #d97706!important;overflow:visible!important;position:relative!important}#painel-setores-detalhado .hsj-perfil-ped-icon{position:absolute;left:50%;bottom:-10px;transform:translateX(-50%);font-size:9px;font-weight:900;padding:2px 5px;border-radius:8px;background:#f59e0b;color:#422006;border:2px solid #fff;z-index:15;white-space:nowrap;box-shadow:0 1px 4px #0004}';
 d.head.appendChild(css);
 function ensureOptions(){for(const select of d.querySelectorAll('select')){if(![...select.options].some(o=>norm(o.value)==='enfermaria cirurgica'))continue;for(const name of profiles){if(![...select.options].some(o=>norm(o.value)===norm(name)))select.add(new Option(name,name))}}}
 function draw(){
  ensureOptions();
  const grid=d.getElementById('painel-setores-detalhado');if(!grid)return;
  for(const card of grid.querySelectorAll('.sector-box')){
   const sectorName=norm(card.querySelector('.sector-title-row h3')?.textContent);
   const sector=w.setoresData.find(s=>norm(s.nome)===sectorName);if(!sector)continue;
   for(const pill of card.querySelectorAll('.leito-pill')){
    const number=String(pill.firstChild?.textContent||'').trim();
    const bed=(sector.leitos||[]).find(l=>String(l.n)===number);
    pill.querySelector('.hsj-perfil-ped-icon')?.remove();pill.classList.remove('hsj-ped-perfil');
    if(!bed||!['ocupado','reservado'].includes(bed.status))continue;
    const record=w.basePacientesCadastrados?.[bed.prontuario]||{};
    const profile=norm(record.perfil||record.perfilVaga||bed.perfil||'');
    if(!profiles.some(p=>norm(p)===profile))continue;
    pill.classList.add('hsj-ped-perfil');
    const badge=d.createElement('span');badge.className='hsj-perfil-ped-icon';badge.textContent='PED';badge.title=profile.includes('cirurgica')?'Enfermaria Cirúrgica Pediátrica':'Enfermaria Clínica Pediátrica';badge.setAttribute('aria-label',badge.title);pill.appendChild(badge);
   }
  }
 }
 const old=w.renderizarPainelLeitos;
 w.renderizarPainelLeitos=function(...args){const r=old.apply(this,args);w.setTimeout(draw,50);return r};
 let queued=false;const grid=d.getElementById('painel-setores-detalhado');
 if(grid){const obs=new MutationObserver(()=>{if(queued)return;queued=true;w.setTimeout(()=>{queued=false;draw()},150)});obs.observe(grid,{childList:true,subtree:true})}
 draw();return true;
}
frame.addEventListener('load',()=>setTimeout(install,400));let n=0;const t=setInterval(()=>{if(install()||++n>120)clearInterval(t)},250);
})();
;
;/* FILE: patch-drawer-unificado-20261028.js */
(()=>{
const frame=document.getElementById('appFrame');if(!frame)return;
function init(){
 let w,d;try{w=frame.contentWindow;d=frame.contentDocument}catch{return false}
 const wrap=d?.getElementById('hsj-drawer-wrap'),panel=d?.getElementById('hsj-drawer'),body=d?.getElementById('hsj-drawer-body');
 if(!w||!wrap||!panel||!body||typeof w.abrirHistoricoPacienteLeito!=='function')return false;
 if(w.__hsjDrawerUnificado20261028)return true;
 w.__hsjDrawerUnificado20261028=true;
 const css=d.createElement('style');css.textContent='#hsj-drawer-wrap[style*="flex"] #hsj-drawer-body{display:block!important;visibility:visible!important;opacity:1!important;min-height:400px!important;overflow:visible!important}#hsj-drawer-wrap[style*="flex"] #box-form-mov{display:block!important;visibility:visible!important;opacity:1!important;content-visibility:visible!important;min-height:300px!important;height:auto!important;position:static!important;clip-path:none!important;transform:none!important}#hsj-drawer-wrap[style*="flex"] #box-form-mov .form-grid{display:grid!important;visibility:visible!important}';d.head.appendChild(css);
 let busy=false;
 function restore(){
  if(busy||wrap.style.display!=='flex')return;
  busy=true;
  try{
   const form=d.getElementById('box-form-mov');
   let notice=d.getElementById('hsj-drawer-erro-unificado');
   if(!form){
    if(!notice){notice=d.createElement('p');notice.id='hsj-drawer-erro-unificado';body.prepend(notice)}
    notice.textContent='O formulário de gerenciamento não foi encontrado. Não realize movimentações.';
   }else{
    if(form.parentNode!==body)body.appendChild(form);
    for(const el of [body,form]){el.hidden=false;el.removeAttribute('inert');el.style.setProperty('display','block','important');el.style.setProperty('visibility','visible','important');el.style.setProperty('opacity','1','important')}
    const grid=form.querySelector('.form-grid');if(grid){grid.hidden=false;grid.style.setProperty('display','grid','important')}
    for(const g of form.querySelectorAll('.form-group')){g.hidden=false;g.style.setProperty('display','block','important')}
    const key=['mov-setor','mov-leito','mov-acao'].map(id=>d.getElementById(id));
    const valid=key.every(el=>el?.getBoundingClientRect().height>5);
    if(!valid){
     if(!notice){notice=d.createElement('p');notice.id='hsj-drawer-erro-unificado';body.prepend(notice)}
     notice.textContent='Os campos do leito continuam indisponíveis. Não execute movimentações. Feche e atualize a página.';
    }else notice?.remove();
   }
   if(notice)notice.style.cssText='display:block!important;visibility:visible!important;opacity:1!important;background:#fff7ed;color:#92400e;padding:16px;margin:12px;border:2px solid #f59e0b;position:relative;z-index:99';
  }finally{busy=false}
 }
 const open=w.abrirHistoricoPacienteLeito;
 w.abrirHistoricoPacienteLeito=function(...args){const result=open.apply(this,args);w.setTimeout(restore,0);w.setTimeout(restore,120);return result};
 const watch=new MutationObserver(()=>{if(wrap.style.display==='flex')w.setTimeout(restore,0)});
 watch.observe(wrap,{attributes:true,attributeFilter:['style']});
 restore();return true;
}
frame.addEventListener('load',()=>setTimeout(init,350));
let count=0;const timer=setInterval(()=>{if(init()||++count>100)clearInterval(timer)},250);
})();
;
;/* FILE: patch-plantao-historico-20261103.js */
(()=>{
const frame=document.getElementById('appFrame');if(!frame)return;
let mounted=false;
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=x=>String(x??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const display=x=>{let t=new Date(x);return isNaN(t)?'Data não informada':t.toLocaleString('pt-BR')};
const dateOf=x=>{let t=new Date(x?.dataIso||x?.dataDesfechoObj||'');return t.getTime()};
function start(){
let w,d;try{w=frame.contentWindow;d=frame.contentDocument}catch{return}
if(!w||!d||!w.db||!w.firebaseModules?.runTransaction||!Array.isArray(w.setoresData)||!d.getElementById('plantao')||!w.switchTab)return;
if(w.__hsjPlantaoHistorico20261103)return;w.__hsjPlantaoHistorico20261103=true;mounted=true;
const {doc,getDoc,runTransaction}=w.firebaseModules,root=d.getElementById('plantao');
const style=d.createElement('style');style.textContent='#plantao .hsj-bloco{background:white;border:1px solid #cbd5e1;padding:15px;border-radius:10px;margin:12px 0}#plantao table{width:100%;border-collapse:collapse;font-size:13px}#plantao td,#plantao th{padding:8px;border-bottom:1px solid #e2e8f0;text-align:left;vertical-align:top}#plantao input,#plantao textarea{padding:10px;border:1px solid #94a3b8;border-radius:7px;max-width:100%}#plantao .hsj-nums{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:8px}#plantao .hsj-num{padding:12px;background:#f1f5f9;border-radius:8px}#plantao .hsj-num b{font-size:24px;display:block;color:#075985}#plantao h3{margin-bottom:12px;color:#123f69}#plantao .hsj-help{color:#64748b;font-size:12px;margin:8px 0}';
d.head.appendChild(style);
root.innerHTML='<div class="page-header"><div><h2>Passagem de plantão — NIR</h2><p>Resumo dos setores, movimentações e transferências pendentes.</p></div></div><section class="hsj-bloco" id="hsj-plantao-acumulado-dia"><h3>Admissões do dia — acumulado confirmado</h3><p class="hsj-help">Consultando a última passagem liberada...</p></section><section class="hsj-bloco" id="hsj-plantao-resumo"></section><section class="hsj-bloco" id="hsj-plantao-pendentes"></section><section class="hsj-bloco"><h3>Registrar e liberar passagem</h3><label><strong>Nome completo de quem libera *</strong></label><div><input id="hsj-plantao-autor" maxlength="120" style="width:min(480px,100%)" placeholder="Nome do profissional responsável"></div><p class="hsj-help">O login é compartilhado; o nome é obrigatório.</p><label><strong>Observações para o próximo plantão</strong></label><div><textarea id="hsj-plantao-obs" rows="5" maxlength="12000" style="width:100%" placeholder="Intercorrências, avisos, prioridades..."></textarea></div><p class="hsj-help">O relatório será arquivado como retrato do momento e não alterará leitos ou indicadores.</p><button class="btn btn-success" id="hsj-plantao-gravar">Liberar e arquivar passagem</button><p id="hsj-plantao-status" role="status"></p></section><section class="hsj-bloco"><h3>Histórico de passagens anteriores</h3><label>Mês <input type="month" id="hsj-plantao-mes"></label> <button class="btn" id="hsj-plantao-consultar">Consultar</button> <button type="button" class="btn btn-success" id="hsj-plantao-imprimir-historico">Imprimir passagem marcada (A4)</button><p class="hsj-help">Histórico a partir desta atualização; registros antigos não são inventados.</p><div id="hsj-plantao-historico"></div></section>';
const $=id=>d.getElementById(id),period=()=>{let z=new Date();return z.getFullYear()+'-'+String(z.getMonth()+1).padStart(2,'0')};
$('hsj-plantao-mes').value=period();
const refMonth=m=>doc(w.db,'hospital','passagens_plantao_'+m.replace('-','_'));

/* Pendências de plantão: persistência ocorre na mesma transação que arquiva a passagem. */
const pendRef=doc(w.db,'hospital','pendencias_plantao');
let pendLoaded=false,pendBusy=false,pendRevision=0,pendFrom=[],pendDraft=[],pendDecisions=new Map(),pendDirty=false;
const pendAll=()=>pendFrom.concat(pendDraft);
const pendMsg=msg=>{const el=$('hsj-pend-msg');if(el)el.textContent=msg};
const pendHtml=()=>{let all=pendAll(),done=all.filter(x=>pendDecisions.get(x.id)?.acao==='resolver').length,next=all.filter(x=>pendDecisions.get(x.id)?.acao==='transferir').length;return {all,done,next,missing:all.length-done-next}};
const pendBlocked=()=>!w.hsjAuthReady||w.usuarioAtual?.perfil==='Visitante';
const pendSection=d.createElement('section');pendSection.id='hsj-plantao-acompanhamento';pendSection.className='hsj-bloco';
pendSection.innerHTML='<div class="hp-head"><div><small>CONTINUIDADE ASSISTENCIAL · NIR</small><h3>Central de pendências do plantão</h3><p>Uma pendência por registro. Toda pendência deve ser resolvida ou transferida para o próximo turno.</p></div><button type="button" class="btn" id="hsj-pend-atualizar">↻ Atualizar</button></div>'+
'<div class="hp-stats" id="hsj-pend-kpis"></div><div class="hp-form"><label>Nova pendência (uma por vez)<textarea id="hsj-pend-descricao" rows="2" maxlength="600" placeholder="Descreva o que precisa ser acompanhado..."></textarea></label><div class="hp-form-row"><label>Prioridade<select id="hsj-pend-prio"><option>Normal</option><option>Alta</option><option>Crítica</option></select></label><label>Setor / referência<input id="hsj-pend-setor" maxlength="80" placeholder="Opcional"></label><button type="button" class="btn btn-success" id="hsj-pend-incluir">+ Adicionar pendência</button></div></div>'+
'<div id="hsj-pend-itens" class="hp-itens"></div><div class="hp-status"><span id="hsj-pend-msg" role="status">Consultando servidor...</span><span>Desfechos obrigatórios: <b>Resolvida</b> ou <b>Próximo turno</b></span></div>';
$('hsj-plantao-gravar').closest('.hsj-bloco').before(pendSection);
const pendCSS=d.createElement('style');
pendCSS.textContent='#hsj-plantao-acompanhamento{background:linear-gradient(180deg,#f2faff,#fff 150px);border:1px solid #bedbeb;border-radius:12px;padding:18px!important}#hsj-plantao-acompanhamento .hp-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}#hsj-plantao-acompanhamento .hp-head small{font-size:10px;letter-spacing:.09em;font-weight:800;color:#0c8096}#hsj-plantao-acompanhamento .hp-head h3{font-size:19px;margin:4px 0;color:#164b79}#hsj-plantao-acompanhamento .hp-head p{font-size:12px;color:#617084;margin:0}#hsj-plantao-acompanhamento .hp-stats{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:9px;margin:15px 0}#hsj-plantao-acompanhamento .hp-stat{background:white;border:1px solid #d5e6f1;border-radius:9px;padding:9px;font-size:11px;color:#546b7d}#hsj-plantao-acompanhamento .hp-stat strong{display:block;color:#12608e;font-size:25px}#hsj-plantao-acompanhamento .hp-stat.missing strong{color:#b76608}#hsj-plantao-acompanhamento .hp-form{background:#eaf5ff;border:1px solid #cbdfee;border-radius:10px;padding:13px;margin-bottom:14px}#hsj-plantao-acompanhamento .hp-form>label{display:block;font-size:12px;font-weight:800;color:#234969}#hsj-plantao-acompanhamento textarea,#hsj-plantao-acompanhamento input,#hsj-plantao-acompanhamento select{display:block;box-sizing:border-box;width:100%;max-width:100%;background:#fff;border:1px solid #bccddd;border-radius:7px;padding:9px;font:inherit;font-size:12px}#hsj-plantao-acompanhamento textarea{resize:vertical}#hsj-plantao-acompanhamento .hp-form>label textarea{margin-top:6px}#hsj-plantao-acompanhamento .hp-form-row{display:flex;gap:10px;flex-wrap:wrap;align-items:end;margin-top:10px}#hsj-plantao-acompanhamento .hp-form-row label{flex:1 1 130px;font-size:11px;font-weight:700;color:#365875}#hsj-plantao-acompanhamento .hp-form-row label:nth-child(2){flex:2 1 200px}#hsj-plantao-acompanhamento .hp-form-row button{min-height:38px}#hsj-plantao-acompanhamento .hp-itens{display:grid;gap:10px}#hsj-plantao-acompanhamento .hp-card{background:#fff;border:1px solid #d7e3ed;border-left:4px solid #e7a33e;padding:12px;border-radius:9px}#hsj-plantao-acompanhamento .hp-card.resolver{border-left-color:#148b68}#hsj-plantao-acompanhamento .hp-card.transferir{border-left-color:#237fbc}#hsj-plantao-acompanhamento .hp-cardtop{display:flex;align-items:start;justify-content:space-between;gap:10px}#hsj-plantao-acompanhamento .hp-cardtop b{font-size:14px;color:#1a4167;white-space:pre-wrap;overflow-wrap:anywhere}#hsj-plantao-acompanhamento .hp-pill{font-size:10px;font-weight:bold;background:#e4f0fb;color:#1f5c88;padding:3px 7px;border-radius:5px}#hsj-plantao-acompanhamento .hp-pill.Alta{background:#fff0d3;color:#9b5710}#hsj-plantao-acompanhamento .hp-pill.Crítica{background:#ffe6e6;color:#ab2727}#hsj-plantao-acompanhamento .hp-meta{font-size:11px;color:#6a8093;margin:8px 0}#hsj-plantao-acompanhamento .hp-actions{display:flex;gap:7px;flex-wrap:wrap;margin-bottom:8px}#hsj-plantao-acompanhamento .hp-choice{background:#fff;border:1px solid #bdcede;border-radius:7px;padding:8px 10px;font-size:12px;font-weight:700;cursor:pointer;color:#355672}#hsj-plantao-acompanhamento .hp-choice[aria-pressed=true][data-acao=resolver]{background:#def8eb;border-color:#2ca579;color:#086b48}#hsj-plantao-acompanhamento .hp-choice[aria-pressed=true][data-acao=transferir]{background:#e3f1ff;border-color:#2690c8;color:#0c6193}#hsj-plantao-acompanhamento .hp-delete{background:none;border:0;color:#a32b37;cursor:pointer;font-size:12px}#hsj-plantao-acompanhamento .hp-empty{padding:18px;text-align:center;border:1px dashed #bed3e2;border-radius:8px;background:#fff;color:#536c7e;font-size:13px}#hsj-plantao-acompanhamento .hp-status{display:flex;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-top:12px;padding-top:10px;border-top:1px solid #dce7f2;font-size:11px;color:#516a80}#hsj-plantao-acompanhamento #hsj-pend-msg{font-weight:700;color:#126087}@media(max-width:780px){#hsj-plantao-acompanhamento .hp-stats{grid-template-columns:repeat(2,1fr)}#hsj-plantao-acompanhamento .hp-head{flex-wrap:wrap}}@media print{#hsj-plantao-acompanhamento{display:none!important}}';
d.head.appendChild(pendCSS);
function pendRender(){
 const {all,done,next,missing}=pendHtml();
 $('hsj-pend-kpis').innerHTML=[['Recebidas',pendFrom.length],['Novas',pendDraft.length],['Resolvidas',done],['Transferidas',next],['Sem desfecho',missing]].map(([k,n],i)=>'<div class="hp-stat '+(i===4&&n?'missing':'')+'">'+k+'<strong>'+n+'</strong></div>').join('');
 $('hsj-pend-incluir').disabled=!pendLoaded||pendBusy||pendBlocked();
 $('hsj-pend-atualizar').disabled=pendBusy;
 $('hsj-pend-itens').innerHTML=!pendLoaded?'<div class="hp-empty">Sem confirmação do servidor. Atualize para continuar.</div>':!all.length?'<div class="hp-empty">✓ Nenhuma pendência aberta. Adicione uma nova, se necessário.</div>':
 all.map((x,i)=>{
  const choice=pendDecisions.get(x.id)||{},act=choice.acao||'',isNew=pendDraft.some(y=>y.id===x.id);
  const meta=isNew?'Criada nesta passagem':'Incluída por '+(x.criadoPor||'Não informado')+' em '+display(x.criadoEm);
  return '<article class="hp-card '+act+'"><div class="hp-cardtop"><b>'+esc(i+1+'. '+x.texto)+'</b><span class="hp-pill '+esc(x.prioridade||'Normal')+'">'+esc(x.prioridade||'Normal')+'</span></div><div class="hp-meta">'+esc(meta)+(x.setor?' · '+esc(x.setor):'')+(x.vezesTransferida?' · Repassada '+esc(x.vezesTransferida)+' vez(es)':'')+(x.ultimaOrientacao?' · Última orientação: '+esc(x.ultimaOrientacao):'')+'</div><div class="hp-actions"><button type="button" class="hp-choice" data-id="'+esc(x.id)+'" data-acao="resolver" aria-pressed="'+(act==='resolver')+'">✓ Resolvida</button><button type="button" class="hp-choice" data-id="'+esc(x.id)+'" data-acao="transferir" aria-pressed="'+(act==='transferir')+'">→ Próximo turno</button>'+(isNew?'<button type="button" class="hp-delete" data-remove="'+esc(x.id)+'">Remover rascunho</button>':'')+'</div><textarea class="hp-note" maxlength="400" data-nota="'+esc(x.id)+'" rows="1" placeholder="Orientação ou justificativa do desfecho (opcional)">'+esc(choice.nota||'')+'</textarea></article>';
 }).join('');
 if(!pendLoaded)pendMsg('Pendências indisponíveis; liberação bloqueada até confirmar conexão.');
 else if(missing)pendMsg(missing+' pendência(s) aguardando desfecho obrigatório.');
 else pendMsg('✓ Pendências revisadas. Salve junto com a liberação do plantão.');
}
async function pendRead(force){
 if(pendBusy||(pendDirty&&!force))return;
 pendBusy=true;
 try{
  const snap=await getDoc(pendRef);
  if(snap.metadata?.fromCache)throw Error('Consulta sem confirmação do servidor.');
  const data=snap.exists()?snap.data():{};
  if(snap.exists()&&!Array.isArray(data.itens))throw Error('Formato de pendências inválido.');
  const rev=Number(data.revisao||0);if(!Number.isInteger(rev)||rev<0)throw Error('Revisão inválida.');
  pendFrom=Array.isArray(data.itens)?data.itens:[];pendRevision=rev;pendLoaded=true;pendDraft=[];pendDecisions.clear();pendDirty=false;
 }catch(e){pendLoaded=false;pendMsg('Erro de sincronização: '+String(e.message||e))}
 finally{pendBusy=false;pendRender()}
}
$('hsj-pend-incluir').onclick=()=>{
 if(!pendLoaded||pendBlocked())return;
 const input=$('hsj-pend-descricao'),texto=input.value.trim().replace(/\s+/g,' ');
 if(texto.length<8){pendMsg('Descreva a pendência com pelo menos 8 caracteres.');input.focus();return}
 if(pendAll().length>=100){pendMsg('Limite de 100 pendências nesta passagem.');return}
 const id='p'+Date.now().toString(36)+Math.random().toString(36).slice(2,11);
 pendDraft.push({id,texto,prioridade:$('hsj-pend-prio').value,setor:$('hsj-pend-setor').value.trim()});pendDirty=true;
 input.value='';$('hsj-pend-setor').value='';$('hsj-pend-prio').value='Normal';pendRender();
};
$('hsj-pend-itens').addEventListener('click',e=>{
 const b=e.target.closest('button');if(!b||pendBlocked()||!pendLoaded)return;
 if(b.dataset.remove){pendDraft=pendDraft.filter(x=>x.id!==b.dataset.remove);pendDecisions.delete(b.dataset.remove);pendDirty=true;pendRender();return}
 if(!b.dataset.id||!['resolver','transferir'].includes(b.dataset.acao))return;
 pendDecisions.set(b.dataset.id,{...pendDecisions.get(b.dataset.id),acao:b.dataset.acao});pendDirty=true;pendRender();
});
$('hsj-pend-itens').addEventListener('input',e=>{
 const id=e.target.dataset.nota;if(!id)return;
 pendDecisions.set(id,{...pendDecisions.get(id),nota:e.target.value});pendDirty=true;
});
$('hsj-pend-atualizar').onclick=()=>{
 if(pendDirty&&!w.confirm('Descartar rascunhos e escolhas não liberadas para carregar a versão atual?'))return;
 pendRead(true);
};
function pendPrepare(){
 if(!pendLoaded||pendBusy)throw Error('As pendências ainda não foram confirmadas pelo servidor. Clique em Atualizar.');
 if(pendBlocked())throw Error('Sem autorização para liberar pendências.');
 const all=pendAll();
 const missing=all.filter(x=>!['resolver','transferir'].includes(pendDecisions.get(x.id)?.acao));
 if(missing.length){$('hsj-pend-itens').querySelector('.hp-card:not(.resolver):not(.transferir)')?.scrollIntoView({block:'center',behavior:'smooth'});throw Error('Defina o desfecho de '+missing.length+' pendência(s) antes de liberar.')}
 return {revisao:pendRevision,novas:pendDraft.map(x=>({...x})),acoes:all.map(x=>({id:x.id,acao:pendDecisions.get(x.id).acao,nota:String(pendDecisions.get(x.id).nota||'').trim()}))};
}
pendRender();pendRead(true);
function calculate(state,start,end){
const setores=(state.setoresData||[]).filter(s=>!s.virtual&&s.nome!=='ESPERA VIRTUAL INTERNA');
const ocupacao=setores.map(s=>({nome:s.nome,internos:(s.leitos||[]).filter(l=>l.status==='ocupado').length}));
const mov=(state.movimentacoesHistorico||[]).filter(m=>m.contabilizarIndicadores!==false&&dateOf(m)>start&&dateOf(m)<=end);
const isInterna=m=>norm(m.acao).includes('transferencia interna')&&norm(m.origem)!==norm(m.destino);
const intern=mov.filter(isInterna),adm=mov.filter(m=>norm(m.acao)==='admissao');
const altas=mov.filter(m=>{let a=norm(m.acao);return a.includes('alta hospitalar')||a.includes('alta a pedido')||a.includes('alta para casa')||a.includes('alta com assistencia domiciliar')||a.includes('alta administrativa')||a.includes('transferencia externa')||a==='evasao'});
const obitos=mov.filter(m=>norm(m.acao).includes('obito'));
const admSetorial=ocupacao.map(s=>({nome:s.nome,total:adm.filter(m=>norm(m.destino)===norm(s.nome)||norm(m.setor).startsWith(norm(s.nome))).length+intern.filter(m=>norm(m.destino)===norm(s.nome)).length}));
const pendentes=(state.transferenciasAtivas||[]).map(t=>{
 const matches=(state.setoresData||[]).flatMap(s=>(s.leitos||[]).filter(l=>l.status==='ocupado'&&String(l.prontuario||'')===String(t.atendimento||'')).map(l=>({setor:s.nome,leito:String(l.n)})));
 const pos=matches.length===1?matches[0]:null;
 return {paciente:String(t.paciente||''),atendimento:String(t.atendimento||''),origemSetor:pos?.setor||'',origemLeito:pos?.leito||'',destino:String(t.destino||''),status:String(t.status||''),pendencias:String(t.pendencias||''),dusv:String(t.dusv||''),data:String(t.dataIso||t.data||'')};
});
return {ocupacao,admSetorial,admissoes:adm.length,altas:altas.length,obitos:obitos.length,internas:intern.length,altasUti:intern.filter(m=>norm(m.origem).includes('uti')&&!norm(m.destino).includes('uti')).length,pendentes};
}
function table(headers,rows){return '<div style="overflow:auto"><table><thead><tr>'+headers.map(h=>'<th>'+esc(h)+'</th>').join('')+'</tr></thead><tbody>'+rows.map(r=>'<tr>'+r.map(c=>'<td>'+esc(c)+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>'}
function summary(s){const stats=[['Internos',s.ocupacao.reduce((n,x)=>n+x.internos,0)],['Admissões hospitalares',s.admissoes],['Altas hospitalares',s.altas],['Óbitos',s.obitos],['Transferências internas',s.internas],['Altas UTI',s.altasUti]];return '<div class="hsj-nums">'+stats.map(x=>'<div class="hsj-num">'+esc(x[0])+'<b>'+esc(x[1])+'</b></div>').join('')+'</div><h4 style="margin:14px 0 5px">Internos por setor</h4>'+table(['Setor','Internos'],s.ocupacao.map(x=>[x.nome,x.internos]))+'<h4 style="margin:14px 0 5px">Admissões por setor, inclusive transferências internas</h4>'+table(['Setor','Admissões'],s.admSetorial.map(x=>[x.nome,x.total]))}
function transfers(s){return '<h3>Transferências pendentes ('+s.pendentes.length+')</h3>'+(s.pendentes.length?table(['Paciente','Prontuário','Origem + leito','Destino','Situação','Pendências','DUSV','Data da solicitação'],s.pendentes.map(x=>[x.paciente,x.atendimento,x.origemSetor&&x.origemLeito?x.origemSetor+' · Leito '+x.origemLeito:'Não registrado',x.destino,x.status,x.pendencias||'Não informado',x.dusv||'—',x.data||'—'])):'<p>Nenhuma transferência pendente.</p>')}
function refresh(){if(!root.classList.contains('active'))return;showAccumulated();let s=calculate({setoresData:w.setoresData,movimentacoesHistorico:w.movimentacoesHistorico,transferenciasAtivas:w.transferenciasAtivas},Date.now()-12*3600000,Date.now());$('hsj-plantao-resumo').innerHTML='<h3>Resumo atual</h3><p class="hsj-help">Movimentações das últimas 12 horas (prévia). Ao liberar, o período parte do último fechamento registrado no mês.</p>'+summary(s);$('hsj-plantao-pendentes').innerHTML=transfers(s)}
let passagemHistoricoSelecionada=null;
const localDay=()=>{
 const parts=new Intl.DateTimeFormat('en-US',{timeZone:'America/Maceio',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
 const o={};parts.forEach(x=>o[x.type]=x.value);return o.year+'-'+o.month+'-'+o.day;
};
let ultimoAcumulado={dia:'',registro:null,consultado:false};
function showAccumulated(){
 const panel=$('hsj-plantao-acumulado-dia');
 if(!panel)return;
 const day=localDay(),record=ultimoAcumulado.dia===day?ultimoAcumulado.registro:null;
 const label=day.split('-').reverse().join('/');
 if(!record){
  panel.innerHTML='<h3>Admissões de '+esc(label)+' · 00h00–23h59</h3><div class="hsj-nums"><div class="hsj-num">Acumulado liberado<b>0</b></div></div><p class="hsj-help">Novo dia: nenhuma passagem liberada ainda. O acumulado permanece em zero até a primeira liberação, sem alterar o histórico de ontem.</p>';
  return;
 }
 const count=Number(record.resumo?.admissoesDia);
 const known=Number.isFinite(count)&&count>=0;
 const release=display(record.criadoEm);
 const from=record.resumo?.inicioDia?display(record.resumo.inicioDia):'00h00';
 panel.innerHTML='<h3>Admissões de '+esc(label)+' · 00h00–23h59</h3><div class="hsj-nums"><div class="hsj-num">Admissões acumuladas até a última liberação<b>'+(known?esc(count):'N/D')+'</b></div><div class="hsj-num">Admissões nesta passagem<b>'+esc(record.resumo?.admissoes??'N/D')+'</b></div></div><p class="hsj-help">Janela diária: '+esc(from)+' até '+esc(release)+'. Última liberação: '+esc(release)+'. A contagem só muda após outra liberação. A coluna da passagem utiliza a janela desde o fechamento anterior.</p>';
}
async function read(){
 const mes=$('hsj-plantao-mes').value,host=$('hsj-plantao-historico');
 if(!/^\d{4}-\d{2}$/.test(mes))return;
 const previous=passagemHistoricoSelecionada?.criadoEm||'';
 passagemHistoricoSelecionada=null;
 host.textContent='Consultando histórico...';
 try{
  const snap=await getDoc(refMonth(mes));
  if(snap.metadata?.fromCache)throw Error('Servidor não confirmou a consulta');
  const rows=Array.isArray(snap.data()?.registros)?snap.data().registros:[];
  const ordered=rows.slice().reverse();
  const today=localDay();
  // Apenas liberações do dia civil corrente contribuem para o acumulado.
  const todays=ordered.filter(x=>String(x.resumo?.dataDiaLocal||'')===today);
  ultimoAcumulado={dia:today,registro:todays[0]||null,consultado:true};
  showAccumulated();
  host.innerHTML=ordered.length?ordered.map((x,i)=>
   '<div style="display:flex;align-items:flex-start;gap:10px;border-top:1px solid #cbd5e1;padding:12px 0">' +
   '<input type="radio" name="hsj-selecionar-plantao" value="'+i+'" aria-label="Selecionar passagem de '+esc(display(x.criadoEm))+' para impressão" style="margin-top:3px;width:18px;height:18px;flex-shrink:0;cursor:pointer">' +
   '<details style="flex:1;min-width:0"><summary style="cursor:pointer"><strong>'+esc(display(x.criadoEm))+'</strong> · '+esc(x.responsavel)+'</summary>'+
   '<p class="hsj-help">Período: '+esc(display(x.inicio))+' a '+esc(display(x.criadoEm))+'</p>'+
   summary(x.resumo)+'<div style="margin-top:12px">'+transfers(x.resumo)+'</div><h4>Observações</h4>'+
   (x.pendenciasPlantao?.itens?.length?'<h4>Pendências e desfechos</h4>'+table(['Pendência','Desfecho','Orientação'],x.pendenciasPlantao.itens.map(y=>[y.texto,y.desfecho,y.notaDesfecho||'—'])):'<p class="hsj-help">Sem pendências registradas nesta passagem.</p>')+
   '<p style="white-space:pre-wrap;overflow-wrap:anywhere">'+esc(x.observacoes||'Sem observações')+'</p></details></div>'
  ).join(''):'Nenhuma passagem registrada neste mês.';
  host.querySelectorAll('input[name="hsj-selecionar-plantao"]').forEach(input=>{
   const clearSelection=()=>{
    input.checked=false;
    passagemHistoricoSelecionada=null;
    $('hsj-plantao-status').textContent='Nenhuma passagem selecionada para impressão.';
   };
   input.addEventListener('pointerdown',()=>{input.dataset.wasChecked=input.checked?'1':'0'});
   input.addEventListener('click',()=>{
    if(input.dataset.wasChecked==='1')clearSelection();
    delete input.dataset.wasChecked;
   });
   input.addEventListener('keydown',e=>{
    if(e.key===' '&&input.checked){e.preventDefault();clearSelection()}
   });
   input.addEventListener('change',()=>{
    passagemHistoricoSelecionada=ordered[Number(input.value)]||null;
    $('hsj-plantao-status').textContent=passagemHistoricoSelecionada?
      'Passagem selecionada para impressão: '+display(passagemHistoricoSelecionada.criadoEm)+' — '+passagemHistoricoSelecionada.responsavel:'';
   });
   if(previous&&ordered[Number(input.value)]?.criadoEm===previous){
    input.checked=true;passagemHistoricoSelecionada=ordered[Number(input.value)];
   }
  });
 }catch(e){host.textContent='Histórico indisponível: '+String(e.message||e);$('hsj-plantao-acumulado-dia').innerHTML='<h3>Admissões do dia</h3><p class="hsj-help">Não foi possível consultar a última liberação. O acumulado não está disponível até a conexão ser restabelecida.</p>'}
}

function printRecord(item){
  if(!item||!item.resumo)throw Error('Passagem arquivada inválida.');
  const data=display(item.criadoEm),inicio=display(item.inicio),responsavel=esc(item.responsavel||'');
  const resumo=item.resumo;
  const numPendentes=(resumo.pendentes||[]).length;
  // Somente em relatórios antigos sem localização gravada: complementar com a posição
  // atual, sinalizando claramente que ela NÃO é um dado histórico.
  const normPr=x=>String(x??'').replace(/[^0-9A-Za-z]/g,'').toUpperCase();
  const positions=new Map();
  for(const sector of (w.setoresData||[])){
   for(const bed of (sector.leitos||[])){
    if(!['ocupado','reservado'].includes(bed.status))continue;
    const key=normPr(bed.prontuario);
    if(!key)continue;
    const list=positions.get(key)||[];
    list.push({setor:sector.nome,leito:bed.n,status:bed.status});
    positions.set(key,list);
   }
  }
  const missingOriginal=(resumo.pendentes||[]).some(x=>!(x.origemSetor&&x.origemLeito));
  const lookupNow=x=>{
   if(x.origemSetor&&x.origemLeito)return x.origemSetor+' · Leito '+x.origemLeito;
   const list=positions.get(normPr(x.atendimento))||[];
   const occupied=list.filter(z=>z.status==='ocupado');
   const match=occupied.length===1?occupied[0]:(occupied.length===0&&list.length===1?list[0]:null);
   return match?match.setor+' · Leito '+match.leito+' (atual*)':'Não registrado';
  };
  // A página é compacta, mas não corta solicitações extensas quando o conteúdo não couber.
  const compacto=numPendentes>8?'compacto':'';
  const content='<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Passagem de plantão NIR - '+esc(data)+'</title><style>'+
  '@page{size:A4 portrait;margin:8mm}*{box-sizing:border-box}html,body{padding:0;margin:0;background:white;color:#182638;font-family:Arial,sans-serif;font-size:9pt;line-height:1.2}h1{font-size:15pt;margin:0;color:#123f69}h2{font-size:10pt;margin:8px 0 4px;color:#123f69}h3,h4{font-size:9pt;margin:6px 0 3px}header{border-bottom:2px solid #123f69;padding-bottom:5px;margin-bottom:6px}p{margin:4px 0}.dados{font-size:9pt}.grade{display:grid;grid-template-columns:repeat(4,1fr);gap:5px;margin:7px 0}.kpi{padding:5px;border:1px solid #ced8e3;border-radius:4px}.kpi b{display:block;font-size:12pt}table{width:100%;border-collapse:collapse;font-size:8pt}th,td{border:1px solid #dbe2eb;text-align:left;vertical-align:top;padding:3px 4px;overflow-wrap:anywhere}th{background:#f1f5f9}.resumo-setores{display:grid;grid-template-columns:1fr 1fr;gap:9px}.obs{white-space:pre-wrap;overflow-wrap:anywhere;border:1px solid #dbe2eb;padding:7px;min-height:22px}.rodape{border-top:1px solid #cbd5e1;margin-top:7px;padding-top:5px;color:#475569;font-size:7.5pt}tr{break-inside:avoid}.compacto table{font-size:7.2pt}.compacto td,.compacto th{padding:2px 3px}.compacto .grade{gap:3px}.compacto .kpi{padding:3px}.resumo-setores+h2+div{overflow:visible!important}.resumo-setores+h2+div table{table-layout:fixed;width:100%}.resumo-setores+h2+div th:nth-child(1),.resumo-setores+h2+div td:nth-child(1){width:21%}.resumo-setores+h2+div th:nth-child(2),.resumo-setores+h2+div td:nth-child(2){width:20%}.resumo-setores+h2+div th:nth-child(3),.resumo-setores+h2+div td:nth-child(3){width:16%}.resumo-setores+h2+div th:nth-child(4),.resumo-setores+h2+div td:nth-child(4){width:15%}.resumo-setores+h2+div th:nth-child(5),.resumo-setores+h2+div td:nth-child(5){width:20%}.resumo-setores+h2+div th:nth-child(6),.resumo-setores+h2+div td:nth-child(6){width:8%;white-space:nowrap!important;overflow-wrap:normal!important;word-break:keep-all!important;writing-mode:horizontal-tb!important;text-align:center!important;padding-left:1px!important;padding-right:1px!important}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}'+
  '</style></head><body class="'+compacto+'"><header><div style="display:flex;align-items:center;gap:8px"><img src="./sigma-mark.svg" alt="SIGMA" style="width:35px;height:35px;object-fit:contain"><div><h1>SIGMA · Hospital São José</h1><strong>NIR — PASSAGEM DE PLANTÃO</strong></div></div><div class="dados">Liberada por: <b>'+responsavel+'</b> · Data e hora: '+esc(data)+'</div><div>Período: '+esc(inicio)+' até '+esc(data)+'</div></header>'+
  '<div style="border:1px solid #bdcfe0;padding:6px;margin-bottom:6px"><strong>ADMISSÕES DO DIA (00h00 até esta liberação): '+esc(Number.isFinite(Number(resumo.admissoesDia))&&resumo.dataDiaLocal?resumo.admissoesDia:'N/D')+'</strong><br><small>Data: '+esc(resumo.dataDiaLocal||'Não registrada')+' · Liberação: '+esc(data)+' · Admissões apenas desta passagem: '+esc(resumo.admissoes)+'</small></div>'+
  '<div class="grade">'+[['Internos',resumo.ocupacao.reduce((n,x)=>n+x.internos,0)],['Admissões',resumo.admissoes],['Altas',resumo.altas],['Óbitos',resumo.obitos]].map(x=>'<div class="kpi">'+esc(x[0])+'<b>'+esc(x[1])+'</b></div>').join('')+'</div>'+
  '<div class="resumo-setores"><section><h2>Internos por setor</h2>'+table(['Setor','Total'],resumo.ocupacao.map(x=>[x.nome,x.internos]))+'</section><section><h2>Admissões por setor</h2>'+table(['Setor','Total'],resumo.admSetorial.map(x=>[x.nome,x.total]))+'</section></div>'+
  '<h2>Transferências pendentes ('+numPendentes+')</h2>'+(numPendentes?table(['Paciente / prontuário','Origem + leito','Destino','Situação','Pendências','DUSV'],resumo.pendentes.map(x=>[x.paciente+' / '+x.atendimento,lookupNow(x),x.destino,x.status,x.pendencias||'—',x.dusv||'—'])):'<p>Nenhuma transferência pendente.</p>')+
  (missingOriginal?'<p style="font-size:7pt;color:#475569">* Localização atual consultada na impressão. Não comprova o leito na data da passagem arquivada.</p>':'')+
  '<h2>Pendências do plantão ('+esc(item.pendenciasPlantao?.itens?.length||0)+')</h2>'+(item.pendenciasPlantao?.itens?.length?table(['Pendência / setor','Prioridade','Desfecho','Orientação'],item.pendenciasPlantao.itens.map(x=>[x.texto+(x.setor?' · '+x.setor:''),x.prioridade,x.desfecho,x.notaDesfecho||'—'])):'<p>Nenhuma pendência registrada nesta passagem.</p>')+
  '<h2>Observações do plantão</h2><div class="obs">'+esc(item.observacoes||'Sem observações registradas')+'</div><div class="rodape">Registro arquivado · Transferências internas: '+esc(resumo.internas)+' · Saídas da UTI: '+esc(resumo.altasUti)+'. Documento gerado a partir da passagem gravada.</div></body></html>';
  return content;
}
$('hsj-plantao-imprimir-historico').onclick=async()=>{
 const btn=$('hsj-plantao-imprimir-historico'),status=$('hsj-plantao-status');
 // Abrir diretamente no clique: abertura posterior a await costuma ser bloqueada pelo navegador.
 const popup=w.open('','_blank');
 if(!popup){
  status.textContent='O navegador bloqueou a janela de impressão. Permita pop-ups para este aplicativo e tente novamente.';
  return;
 }
 popup.document.open();
 popup.document.write('<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Preparando impressão</title></head><body><p>Preparando passagem de plantão para impressão...</p></body></html>');
 popup.document.close();
 btn.disabled=true;status.textContent='Preparando relatório A4...';
 try{
  if(!passagemHistoricoSelecionada)throw Error('Marque a bolinha ao lado da passagem no histórico antes de imprimir.');
  const html=printRecord(passagemHistoricoSelecionada).replace('src="./sigma-mark.svg"','src="'+new URL('sigma-mark.svg',d.baseURI).href+'"');
  if(popup.closed)throw Error('A janela de impressão foi fechada.');
  popup.document.open();popup.document.write(html);popup.document.close();
  popup.focus();
  // Evita imprimir a tela de carregamento antes que o navegador componha o documento.
  popup.setTimeout(()=>{if(!popup.closed)popup.print()},500);
  status.textContent='Relatório aberto para impressão. Se necessário, use Ctrl + P na nova janela.';
 }catch(e){
  const msg=String(e.message||e);
  status.textContent='Falha na impressão: '+msg;
  if(!popup.closed){popup.document.body.textContent='Não foi possível preparar o relatório: '+msg}
 }finally{btn.disabled=false}
};
$('hsj-plantao-consultar').onclick=read;

$('hsj-plantao-gravar').onclick=async()=>{
const autor=$('hsj-plantao-autor').value.trim().replace(/\s+/g,' '),observacoes=$('hsj-plantao-obs').value.trim(),status=$('hsj-plantao-status'),btn=$('hsj-plantao-gravar');
if(autor.length<3){status.textContent='Informe obrigatoriamente o nome completo de quem libera.';return}
if(w.usuarioAtual?.perfil==='Visitante'||!w.hsjAuthReady){status.textContent='Sem autorização ou sem autenticação válida.';return}
if(!w.confirm('Liberar passagem de plantão em nome de '+autor+'? O registro será arquivado.'))return;
btn.disabled=true;status.textContent='Salvando no servidor...';
try{
 const snap=await getDoc(doc(w.db,'hospital','dados'));if(!snap.exists()||snap.metadata?.fromCache)throw Error('Dados principais sem confirmação do servidor');
 const state=snap.data();if(!Array.isArray(state.setoresData))throw Error('Setores inválidos');
 const now=new Date(),iso=now.toISOString(),mes=localDay().slice(0,7),archive=refMonth(mes);
 if(typeof w.hsjGravarPassagemPlantaoV2!=='function')throw Error('Módulo de gravação indisponível; atualize a página.');
 const result=await w.hsjGravarPassagemPlantaoV2({
  mes, responsavel:autor, observacoes, pendenciasPlantao:pendPrepare(),
  setores:state.setoresData,
  movimentacoes:state.movimentacoesHistorico||[],
  transferencias:state.transferenciasAtivas||[],
  revisaoFonte:Number(state._meta?.revision||0)
 });
 if(!result?.ok)throw Error('Servidor não confirmou o arquivamento.');
await pendRead(true);status.textContent='Passagem arquivada com sucesso em '+display(iso);$('hsj-plantao-obs').value='';$('hsj-plantao-mes').value=mes;await read();refresh()
}catch(e){status.textContent='Falha ao salvar: '+String(e.message||e)}
finally{btn.disabled=false}
};
const oldSwitch=w.switchTab;w.switchTab=function(tab){const result=oldSwitch.apply(this,arguments);if(tab==='plantao'){refresh();read();if(!pendDirty)pendRead()}return result};
const oldUpdate=w.atualizarResumoPlantao;if(typeof oldUpdate==='function')w.atualizarResumoPlantao=function(){refresh()};
if(root.classList.contains('active')){refresh();read()}
const timer=setInterval(()=>{if(!d.isConnected||frame.contentDocument!==d){clearInterval(timer);return}refresh()},20000);
}
frame.addEventListener('load',()=>{mounted=false;setTimeout(start,300)});
let n=0;let timer=setInterval(()=>{start();if(mounted||++n>100)clearInterval(timer)},250);
})();
;
;/* FILE: patch-sigma-header-sidebar-20261103.js */
(()=>{const frame=document.getElementById('appFrame');if(!frame)return;function install(){let w,d;try{w=frame.contentWindow;d=frame.contentDocument}catch{return false}if(!w||!d||!d.querySelector('body>header .header-brand')||!d.querySelector('nav.subnav')||!d.querySelector('.main-container'))return false;if(w.__hsjSigmaShell20261103)return true;w.__hsjSigmaShell20261103=true;const header=d.querySelector('body>header'),brand=header.querySelector('.header-brand'),nav=d.querySelector('nav.subnav');header.classList.add('hsj-sigma-head');brand.innerHTML='<img class="hsj-sigma-icon" src="./sigma-mark.svg?v=1" alt="Símbolo SIGMA"><span class="hsj-sigma-titles"><strong>SIGMA</strong><small>Sistema Inteligente de Gestão e Monitoramento Assistencial</small><em>Hospital São José · NIR</em></span>';nav.classList.add('hsj-sigma-side');const icons={painel:'▤','pacientes-internos':'♙',movimentacao:'✚','historico-geral':'◷',transferencias:'⇄',plantao:'▣',indicadores:'▥',admin:'⚙'};nav.querySelectorAll('.nav-item').forEach(item=>{if(item.querySelector('.hsj-sigma-nav-icon'))return;const act=item.getAttribute('onclick')||'',match=act.match(/switchTab\('([^']+)'/);const icon=d.createElement('span');icon.className='hsj-sigma-nav-icon';icon.setAttribute('aria-hidden','true');icon.textContent=icons[match?.[1]]||'•';item.prepend(icon)});const style=d.createElement('style');style.id='hsj-sigma-shell-css';style.textContent="body>header.hsj-sigma-head{min-height:86px;padding:10px 24px;background:linear-gradient(105deg,#062d60 0%,#07518d 65%,#0cafa7 100%);border-bottom:3px solid #09bbb0;position:relative;z-index:20;gap:14px}body>header.hsj-sigma-head .header-brand{display:flex;align-items:center;gap:12px;min-width:0}body>header.hsj-sigma-head .hsj-sigma-icon{width:64px;height:64px;object-fit:contain}body>header.hsj-sigma-head .hsj-sigma-titles{display:flex;flex-direction:column;gap:2px}body>header.hsj-sigma-head .hsj-sigma-titles strong{font-size:29px;letter-spacing:1px;color:white;line-height:1}body>header.hsj-sigma-head .hsj-sigma-titles small{font-size:11px;font-weight:600;color:#e6faff}body>header.hsj-sigma-head .hsj-sigma-titles em{font-style:normal;font-size:11px;color:#8ff0e4}body>header.hsj-sigma-head .header-user{margin-left:auto}body>header.hsj-sigma-head .btn-profile{background:#f1fbff;color:#063d70;border-color:#b4ddeb}nav.subnav.hsj-sigma-side{position:fixed!important;top:86px;bottom:0;left:0;width:232px;z-index:15;display:flex!important;flex-direction:column!important;gap:5px!important;align-items:stretch;padding:16px 9px!important;overflow-x:hidden!important;overflow-y:auto!important;background:linear-gradient(180deg,#063c78,#062a56)!important;border:0!important;box-shadow:2px 0 12px #082e4d30}nav.subnav.hsj-sigma-side .nav-item{display:flex;align-items:center;gap:11px;flex:none;white-space:normal!important;padding:12px!important;font-size:13px;font-weight:650;border:0!important;border-radius:8px;color:#e7f4ff!important}nav.subnav.hsj-sigma-side .nav-item:hover{background:#ffffff22!important;color:white!important}nav.subnav.hsj-sigma-side .nav-item.active{background:linear-gradient(90deg,#0a8fc3,#0fb4a7)!important;color:white!important;box-shadow:0 3px 8px #0018}nav.subnav.hsj-sigma-side .hsj-sigma-nav-icon{display:inline-flex;width:23px;min-width:23px;justify-content:center;font-size:19px}body:has(nav.hsj-sigma-side)>.main-container{margin-left:232px!important;width:calc(100% - 232px)!important;max-width:none!important}@media(max-width:850px){body>header.hsj-sigma-head{min-height:76px;padding:8px}body>header.hsj-sigma-head .hsj-sigma-icon{width:48px;height:48px}body>header.hsj-sigma-head .hsj-sigma-titles strong{font-size:22px}body>header.hsj-sigma-head .hsj-sigma-titles small{font-size:9px}nav.subnav.hsj-sigma-side{top:76px;width:62px;padding:10px 5px!important}nav.subnav.hsj-sigma-side .nav-item{font-size:0!important;justify-content:center;padding:11px 4px!important}nav.subnav.hsj-sigma-side .hsj-sigma-nav-icon{font-size:21px}body:has(nav.hsj-sigma-side)>.main-container{margin-left:62px!important;width:calc(100% - 62px)!important;padding:1rem!important}}@media(max-width:540px){body>header.hsj-sigma-head .hsj-sigma-titles small,body>header.hsj-sigma-head .user-badge{display:none}body>header.hsj-sigma-head .btn-profile{font-size:10px;padding:6px}}@media print{nav.subnav.hsj-sigma-side{display:none!important}body:has(nav.hsj-sigma-side)>.main-container{margin:0!important;width:100%!important}}";d.head.appendChild(style);
const printBrand=d.createElement('div');printBrand.id='hsj-sigma-print-brand';
printBrand.innerHTML='<img src="./sigma-mark.svg?v=1" alt="SIGMA"><div><strong>SIGMA · Hospital São José</strong><small>Sistema Inteligente de Gestão e Monitoramento Assistencial · NIR</small></div>';
d.body.insertBefore(printBrand,d.querySelector('.main-container'));
const printStyle=d.createElement('style');
printStyle.textContent='#hsj-sigma-print-brand{display:none}@media print{@page{size:A4;margin:10mm}#hsj-sigma-print-brand{display:flex!important;gap:8px;align-items:center;border-bottom:2px solid #07518d;padding:0 0 7px;margin-bottom:9px;color:#083564}#hsj-sigma-print-brand img{height:38px;width:38px;object-fit:contain}#hsj-sigma-print-brand strong{display:block;font-size:15px}#hsj-sigma-print-brand small{display:block;font-size:9px}body:has(nav.hsj-sigma-side)>.main-container{margin:0!important;width:100%!important;max-width:none!important}nav.subnav.hsj-sigma-side{display:none!important}}';
d.head.appendChild(printStyle);return true}frame.addEventListener('load',()=>setTimeout(install,200));let n=0;const timer=setInterval(()=>{if(install()||++n>100)clearInterval(timer)},200)})();
;
;/* FILE: patch-historico-timeline-20261104.js */
(()=>{
'use strict';
const frame=document.getElementById('appFrame');if(!frame)return;
let initialized=false;
function setup(){
let w,d;try{w=frame.contentWindow;d=frame.contentDocument}catch{return false}
if(!w||!d||!d.getElementById('historico-geral')||!Array.isArray(w.movimentacoesHistorico)||typeof w.atualizarTabelaHistoricoGeral!=='function')return false;
if(w.__hsjTimelinePaciente20261104)return true;w.__hsjTimelinePaciente20261104=true;initialized=true;
const tab=d.getElementById('historico-geral'), table=tab.querySelector('.table-container');
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=x=>String(x??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
const toDate=x=>{if(x?.toDate) return x.toDate();const v=x instanceof Date?x:new Date(x);return Number.isFinite(v.getTime())?v:null};
const when=x=>toDate(x)?.getTime()||0;
const timestamp=e=>e?.dataIso||e?.dataDesfechoObj||e?.data||'';
const dateDisplay=v=>{const dt=toDate(v);return dt?dt.toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'medium'}):'Não registrado'};
const icon=e=>norm(e).includes('transfer')?'⇄':norm(e).includes('admiss')?'↳':norm(e).includes('alta')?'⇥':norm(e).includes('obito')?'✚':norm(e).includes('reserv')?'▣':'•';
const head=tab.querySelector('.page-header');
const title=head?.querySelector('h2');if(title)title.textContent='Histórico Geral · Linha do tempo dos pacientes';
const description=head?.querySelector('p');if(description)description.textContent='Eventos registrados com horários reais; sem horários presumidos para etapas antigas.';
const controls=d.createElement('section');controls.id='hsj-timeline-filtros';controls.innerHTML='<div class="hsj-timeline-controls"><label>Paciente ou prontuário<input type="search" id="hsj-timeline-busca" placeholder="Nome ou número de prontuário"></label><label>De<input type="date" id="hsj-timeline-inicio"></label><label>Até<input type="date" id="hsj-timeline-fim"></label><label>Movimentação<select id="hsj-timeline-tipo"><option value="">Todas</option><option value="admiss">Admissões</option><option value="reserv">Reservas</option><option value="alta">Altas</option><option value="obito">Óbitos</option><option value="transfer">Transferências</option><option value="leito">Leitos</option><option value="outro">Outras</option></select></label><button type="button" class="btn" id="hsj-timeline-filtrar">Pesquisar</button><button type="button" class="btn" id="hsj-timeline-limpar">Limpar</button></div><p id="hsj-timeline-count" class="hsj-timeline-note"></p>';
head?.after(controls);
if(table){
 table.innerHTML='<table><thead><tr><th>Data e hora do evento</th><th>Prontuário</th><th>Paciente</th><th>Movimentação</th><th>Setor / leito de origem</th><th>Destino</th><th>Detalhes e situação</th></tr></thead><tbody id="hsj-timeline-rows"></tbody></table><div class="hsj-timeline-pages"><button class="btn" type="button" id="hsj-timeline-prev">Anterior</button><span id="hsj-timeline-page"></span><button class="btn" type="button" id="hsj-timeline-next">Próxima</button></div><p class="hsj-timeline-note">Horários de recepção, acomodação, reservas e transferências aparecem como eventos separados somente quando o sistema realmente os registrou. Mudanças antigas sem histórico próprio não são reconstruídas.</p>';
}
const css=d.createElement('style');
css.textContent='#hsj-timeline-filtros{border:1px solid #dbe4ef;background:white;padding:14px;border-radius:10px;margin:0 0 14px}.hsj-timeline-controls{display:flex;gap:10px;align-items:end;flex-wrap:wrap}.hsj-timeline-controls label{display:flex;flex-direction:column;gap:5px;color:#193d65;font-size:12px;font-weight:700}.hsj-timeline-controls input,.hsj-timeline-controls select{border:1px solid #b9c7d7;border-radius:6px;padding:9px;background:white;color:#1b344b;font-size:13px;max-width:100%}#hsj-timeline-busca{width:min(290px,65vw)}#historico-geral .hsj-timeline-note{font-size:12px;color:#52677d;margin:8px 0}#historico-geral .hsj-timeline-pages{display:flex;gap:12px;justify-content:center;align-items:center;padding:12px}#hsj-timeline-rows td{font-size:12px;vertical-align:top;word-break:break-word}#hsj-timeline-rows .hsj-timeline-action{font-weight:700;color:#06658f}#historico-geral .table-container{overflow-x:auto}#historico-geral .table-container table{min-width:900px}@media print{#hsj-timeline-filtros,.hsj-timeline-pages{display:none!important}#historico-geral .table-container table{min-width:0!important}#historico-geral .table-container{overflow:visible!important}#hsj-timeline-rows td{font-size:8pt}}';
d.head.appendChild(css);
const get=id=>d.getElementById(id);
let filtered=[],page=0;
function makeEvents(){
 const list=[];
 const seen=new Set();
 const add=e=>{const key=[e.kind,e.pr,e.time,e.action,e.location,e.dest].join('|');if(seen.has(key))return;seen.add(key);list.push(e)};
 for(const m of (w.movimentacoesHistorico||[])){
  const action=String(m.acao||'Movimentação');
  const time=timestamp(m);
  const origem=String(m.origem||m.setor||'');
  const destino=String(m.destino||'');
  const detail=[m.tipoIndicador?'Indicador: '+m.tipoIndicador:'',m.contabilizarIndicadores===false?'Não computado nos indicadores':''].filter(Boolean).join(' · ');
  add({kind:'movement',time,pr:String(m.atendimento||''),name:String(m.paciente||''),action,location:origem,dest:destino,detail});
 }
 // Solicitação de transferência e mudanças efetivamente registradas.
 for(const t of [...(w.transferenciasAtivas||[]),...(w.transferenciasFinalizadas||[])]){
  const pr=String(t.atendimento||''),name=String(t.paciente||''),dest=String(t.destino||'');
  const time=t.dataIso||t.data;
  if(time)add({kind:'request',time,pr,name,action:'Solicitação de transferência',location:String(t.setorOrigem||''),dest,detail:'Status inicial: '+String(t.historicoStatus?.[0]?.status||'Não registrado')});
  for(const h of (t.historicoStatus||[])){
   if(!h.dataIso)continue;
   // Initial status is represented by the request row when timestamps match.
   if(time&&when(time)===when(h.dataIso))continue;
   add({kind:'status',time:h.dataIso,pr,name,action:'Atualização da transferência',location:String(t.setorOrigem||''),dest,detail:String(h.statusAnterior? h.statusAnterior+' → ':'')+String(h.status||'')});
  }
  // Finalized transfer is already in movimentacoesHistorico; avoid double counting this event.
 }
 return list.sort((a,b)=>when(b.time)-when(a.time));
}
function render(){
 const start=get('hsj-timeline-inicio').value,end=get('hsj-timeline-fim').value,
 q=norm(get('hsj-timeline-busca').value),type=get('hsj-timeline-tipo').value;
 const all=makeEvents();
 filtered=all.filter(e=>{
  if(q&&!norm(e.pr+' '+e.name).includes(q))return false;
  const stamp=toDate(e.time);
  if(start&&(!stamp||stamp<new Date(start+'T00:00:00')))return false;
  if(end&&(!stamp||stamp>new Date(end+'T23:59:59')))return false;
  const act=norm(e.action);
  if(type==='outro')return !/admiss|reserv|alta|obito|transfer|leito/.test(act);
  return !type||act.includes(type);
 });
 const limit=70,pages=Math.max(1,Math.ceil(filtered.length/limit));page=Math.min(page,pages-1);
 const chunk=filtered.slice(page*limit,(page+1)*limit);
 get('hsj-timeline-rows').innerHTML=chunk.length?chunk.map(e=>'<tr><td>'+esc(dateDisplay(e.time))+'</td><td>'+esc(e.pr||'—')+'</td><td>'+esc(e.name||'—')+'</td><td class="hsj-timeline-action">'+esc(icon(e.action))+' '+esc(e.action)+'</td><td>'+esc(e.location||'Não registrado')+'</td><td>'+esc(e.dest||'Não informado')+'</td><td>'+esc(e.detail||'—')+'</td></tr>').join(''):'<tr><td colspan="7" style="text-align:center">Nenhum evento encontrado para os filtros informados.</td></tr>';
 get('hsj-timeline-count').textContent=filtered.length+' evento(s) encontrados. Exibição limitada a '+limit+' registros por página para manter o aplicativo rápido.';
 get('hsj-timeline-page').textContent='Página '+(page+1)+' de '+pages;
 get('hsj-timeline-prev').disabled=page===0;get('hsj-timeline-next').disabled=page>=pages-1;
}
get('hsj-timeline-filtrar').onclick=()=>{page=0;render()};
get('hsj-timeline-limpar').onclick=()=>{get('hsj-timeline-busca').value='';get('hsj-timeline-inicio').value='';get('hsj-timeline-fim').value='';get('hsj-timeline-tipo').value='';page=0;render()};
get('hsj-timeline-prev').onclick=()=>{page=Math.max(0,page-1);render()};
get('hsj-timeline-next').onclick=()=>{page++;render()};
get('hsj-timeline-busca').onkeydown=e=>{if(e.key==='Enter'){page=0;render()}};
// Não reconstruir nem ordenar milhares de eventos quando o Histórico Geral está oculto.
// Também agrupa renderizações solicitadas diversas vezes no mesmo ciclo.
let renderQueued=false;
function renderWhenVisible(){
 if(!tab.classList.contains('active')||renderQueued)return;
 renderQueued=true;
 w.requestAnimationFrame(()=>{
  renderQueued=false;
  if(tab.classList.contains('active'))render();
 });
}
w.atualizarTabelaHistoricoGeral=renderWhenVisible;
const oldSwitch=w.switchTab;w.switchTab=function(tabName,el){
 const result=oldSwitch.apply(this,arguments);
 if(tabName==='historico-geral')renderWhenVisible();
 return result;
};
if(tab.classList.contains('active'))renderWhenVisible();
}
frame.addEventListener('load',()=>{initialized=false;setTimeout(setup,200)});
let n=0;const interval=setInterval(()=>{if(setup()||++n>90)clearInterval(interval)},200);
})();
;
;/* FILE: patch-painel-autorecuperacao-20261104.js */
(()=>{
 const frame=document.getElementById('appFrame');if(!frame)return;
 let bound=false;
 function start(){
  let w,d;try{w=frame.contentWindow;d=frame.contentDocument}catch{return false}
  if(!w||!d||!d.getElementById('painel-setores-detalhado')||typeof w.renderizarPainelLeitos!=='function')return false;
  if(w.__hsjPainelAutoRecuperacao20261104)return true;
  w.__hsjPainelAutoRecuperacao20261104=true;bound=true;
  const grid=d.getElementById('painel-setores-detalhado'),panel=d.getElementById('painel');
  const banner=d.createElement('div');banner.id='hsj-painel-status-reparo';banner.style.cssText='display:none;background:#eff6ff;border:1px solid #93c5fd;border-left:4px solid #2563eb;border-radius:8px;padding:9px 12px;font:600 12px Arial,sans-serif;color:#1e3a8a;margin:8px 0';
  banner.setAttribute('role','status');grid.before(banner);
  function notice(message){banner.textContent=message;banner.style.display='block'}
  function dismiss(){banner.style.display='none';banner.textContent=''}
  let emptyChecks=0,recovering=false,lastAttempt=0,failures=0;
  function verify(){
   if(!d.isConnected||frame.contentDocument!==d)return false;
   if(!panel.classList.contains('active'))return true;
   const sectors=Array.isArray(w.setoresData)?w.setoresData.filter(s=>Array.isArray(s.leitos)&&s.leitos.length):[];
   const confirmed=w.multiusuarioStatus!=='conflito'&&d.getElementById('hsj-bloqueio-conexao')?.style.display==='none';
   // Never render absent, cache-only or disconnected data.
   if(!sectors.length||!confirmed)return true;
   const cards=[...grid.querySelectorAll('.sector-box')];
   const beds=grid.querySelectorAll('.leito-pill').length;
   const expected=sectors.reduce((sum,s)=>sum+s.leitos.length,0);
   const allValid=sectors.every(s=>s.leitos.every(l=>l&&l.n!=null&&typeof l.status==='string'));
   if(!allValid)return true;
   if(cards.length===sectors.length&&beds===expected){
    emptyChecks=0;failures=0;
    const allHidden=cards.every(c=>d.defaultView.getComputedStyle(c).display==='none');
    if(allHidden){
     const filter=d.getElementById('hsj-leitos-pesquisa'),sector=d.getElementById('hsj-leitos-setor');
     if(filter?.value.trim()||sector?.value){
      notice('Nenhum setor corresponde aos filtros atuais. Utilize “Limpar” nos filtros do painel para visualizar todos os leitos.');
     }else{
      notice('Os leitos estão ocultos por um filtro de exibição. Tentando restaurar a visualização...');
      cards.forEach(c=>c.style.removeProperty('display'));
      const reset=d.getElementById('btn-todos-v2');if(reset)reset.click();
     }
    }else dismiss();
    return true;
   }
   if(++emptyChecks<2||recovering||Date.now()-lastAttempt<12000)return true;
   recovering=true;lastAttempt=Date.now();
   notice('Painel de leitos temporariamente indisponível. Recuperando a visualização automaticamente...');
   try{
    // Pure UI rerender, no Firebase write and no page refresh.
    w.renderizarPainelLeitos();
    const actual=grid.querySelectorAll('.leito-pill').length;
    if(actual===expected){emptyChecks=0;failures=0;dismiss()}
    else {
      // Fallback de apresentação: apenas estado já confirmado; não toca no banco.
      const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
      const allowed=['disponivel','ocupado','reservado','higienizacao','bloqueado'];
      const html=sectors.map(sector=>{
       const beds=sector.leitos;
       const occupied=beds.filter(l=>l.status==='ocupado').length;
       const free=beds.filter(l=>l.status==='disponivel').length;
       const reserved=beds.filter(l=>l.status==='reservado').length;
       const blocked=beds.filter(l=>l.status==='bloqueado').length;
       const percent=beds.length?Math.round(occupied*100/beds.length):0;
       return '<section class="sector-box"><div class="sector-title-row"><div><h3>'+esc(sector.nome)+'</h3><p>'+esc(sector.tipo||'')+' · Total: '+beds.length+'</p></div><span class="ocup-badge">'+percent+'% Ocup.</span></div><div class="leitos-grid">'+beds.map(l=>'<div role="button" tabindex="0" class="leito-pill leito-'+(allowed.includes(l.status)?l.status:'disponivel')+'" data-recover-sector="'+esc(sector.nome)+'" data-recover-bed="'+esc(l.n)+'" title="'+esc(l.paciente||'Leito '+l.n)+'">'+esc(l.n)+'</div>').join('')+'</div><div class="sector-summary">Total: <strong>'+beds.length+'</strong> · Livres: <strong>'+free+'</strong> · Ocupados: <strong>'+occupied+'</strong> · Reservados: <strong>'+reserved+'</strong> · Bloqueados: <strong>'+blocked+'</strong></div></section>';
      }).join('');
      if(html&&expected>0){
       grid.innerHTML=html;
       emptyChecks=0;failures=0;
       notice('Exibição dos leitos restaurada com os dados confirmados do servidor.');
      } else if(++failures>=3)notice('A exibição não pôde ser restaurada. As movimentações permanecem protegidas.');
    }
   }catch(e){failures++;notice('Erro ao reconstruir os cartões: '+String(e?.message||e).slice(0,140));w.console?.error?.('SIGMA recuperação do painel',e)}
   finally{recovering=false}
   return true;
  }
  grid.addEventListener('click',e=>{
   const bed=e.target.closest('[data-recover-bed]');if(!bed)return;
   if(typeof w.abrirHistoricoPacienteLeito==='function')w.abrirHistoricoPacienteLeito(bed.dataset.recoverSector,bed.dataset.recoverBed);
  });
  grid.addEventListener('keydown',e=>{
   const bed=e.target.closest('[data-recover-bed]');if(bed&&(e.key==='Enter'||e.key===' ')){e.preventDefault();bed.click()}
  });
  let stopped=false;
  const timer=w.setInterval(()=>{if(stopped)return;if(!verify()){stopped=true;w.clearInterval(timer)}},5000);
  // Check after a tab change without rewrapping shared save/sync functions.
  d.addEventListener('click',e=>{if(e.target.closest('nav.subnav .nav-item'))w.setTimeout(verify,1200)});
  w.setTimeout(verify,3500);
  return true;
 }
 frame.addEventListener('load',()=>{bound=false;setTimeout(start,400)});
 let tries=0;const timer=setInterval(()=>{if(start()||++tries>100)clearInterval(timer)},250);
})();
;
;/* FILE: patch-sigma-fixed-header-tv-brand-20261104.js */
(()=>{
'use strict';
const frame=document.getElementById('appFrame');if(!frame)return;
const outerStyle=document.createElement('style');
outerStyle.id='hsj-sigma-tv-brand-style-20261104';
outerStyle.textContent="#hsj-tv-screen .hsj-sigma-tv-brand{display:flex;gap:9px;align-items:center;min-width:0}#hsj-tv-screen .hsj-sigma-tv-mark{display:block;width:43px;height:43px;object-fit:contain;flex:0 0 43px}#hsj-tv-screen .hsj-sigma-tv-name{display:block;font-size:clamp(14px,1.4vw,23px);line-height:1;font-weight:900;letter-spacing:.9px}#hsj-tv-screen .hsj-sigma-tv-tagline{font-size:clamp(7px,.77vw,10px);color:#cfebff;line-height:1.15}#hsj-tv-screen .hsj-sigma-tv-hospital{font-size:clamp(7px,.7vw,10px);color:#7de5e0;font-weight:700}@media(max-width:700px){#hsj-tv-screen .hsj-sigma-tv-mark{width:32px;height:32px}#hsj-tv-screen .hsj-sigma-tv-tagline{max-width:160px}}";
document.head.appendChild(outerStyle);
const tvLogoUrl=new URL('./sigma-mark.svg?v=1',document.baseURI).href;
function addTvBrand(){
 const screen=document.getElementById('hsj-tv-screen');
 if(!screen)return false;
 const heading=screen.querySelector('.tv-header .tv-heading');
 if(!heading)return !!screen.querySelector('.hsj-sigma-tv-brand');
 const original=heading.parentElement;
 const brand=document.createElement('div');
 brand.className='hsj-sigma-tv-brand';
 const logo=document.createElement('img');
 logo.className='hsj-sigma-tv-mark';logo.alt='SIGMA';logo.src=tvLogoUrl;
 const texts=document.createElement('div');
 texts.innerHTML='<span class="hsj-sigma-tv-name">SIGMA</span><div class="hsj-sigma-tv-tagline">Sistema Inteligente de Gestão e Monitoramento Assistencial</div><div class="hsj-sigma-tv-hospital">Hospital São José · NIR · Painel de Leitos</div>';
 brand.append(logo,texts);original.replaceWith(brand);return true;
}
function installFrame(){
 let w,d;try{w=frame.contentWindow;d=frame.contentDocument}catch{return false}
 if(!w||!d||!d.body||!d.querySelector('body > header.hsj-sigma-head')||!d.querySelector('body > .main-container')||!d.querySelector('nav.subnav.hsj-sigma-side'))return false;
 if(d.getElementById('hsj-sigma-fixed-shell-style-20261104'))return true;
 const style=d.createElement('style');
 style.id='hsj-sigma-fixed-shell-style-20261104';
 style.textContent="\n:root{--hsj-fixed-header-height:86px}\nhtml,body{height:100%!important;max-height:100%!important;overflow:hidden!important;background:#f8fafc!important}\nbody{min-height:0!important;display:block!important}\nbody > header.hsj-sigma-head{\nposition:fixed!important;top:0!important;left:0!important;right:0!important;\nwidth:100%!important;height:var(--hsj-fixed-header-height)!important;min-height:var(--hsj-fixed-header-height)!important;\nz-index:1000!important;box-sizing:border-box!important}\nbody > nav.subnav.hsj-sigma-side{\nposition:fixed!important;top:var(--hsj-fixed-header-height)!important;bottom:0!important;\nheight:calc(100% - var(--hsj-fixed-header-height))!important;overflow-y:auto!important}\nbody:has(nav.hsj-sigma-side)>.main-container{\nmargin-top:var(--hsj-fixed-header-height)!important;\nheight:calc(100% - var(--hsj-fixed-header-height))!important;\nmax-height:calc(100% - var(--hsj-fixed-header-height))!important;\noverflow-y:auto!important;overflow-x:hidden!important;overscroll-behavior-y:contain;\nscrollbar-gutter:stable;box-sizing:border-box!important}\nbody > header.hsj-sigma-head .header-brand{padding-left:100px!important}\n@media(max-width:850px){:root{--hsj-fixed-header-height:76px}}\n@media(max-width:600px){body > header.hsj-sigma-head .header-brand{padding-left:86px!important}body > header.hsj-sigma-head .hsj-sigma-titles small{display:none!important}}\n@media print{\nhtml,body{height:auto!important;max-height:none!important;overflow:visible!important}\nbody > header.hsj-sigma-head,body > nav.subnav.hsj-sigma-side{display:none!important}\nbody:has(nav.hsj-sigma-side)>.main-container{margin:0!important;height:auto!important;max-height:none!important;overflow:visible!important;width:100%!important}}\n";
 d.head.appendChild(style);return true;
}
function retryFrame(){let n=0;const timer=setInterval(()=>{if(installFrame()||++n>=100)clearInterval(timer)},200)}
retryFrame();frame.addEventListener('load',retryFrame);
let n=0;const tvTimer=setInterval(()=>{if(addTvBrand()||++n>=100)clearInterval(tvTimer)},200);addTvBrand();
})();
;
;/* FILE: patch-central-transferencias-sigma-20261104.js */
(()=>{
const frame=document.getElementById('appFrame');if(!frame)return;
const states=['Solicitação Pendente','Vaga Solicitada','Vaga Liberada','Em Regulação','Finalizada'];
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=x=>String(x??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
const canon=x=>norm(x)==='aguardando liberacao'?'Em Regulação':states.find(t=>norm(t)===norm(x))||'Solicitação Pendente';
const time=x=>{const d=new Date(x||'');return Number.isFinite(d.getTime())?d:null};
const pretty=x=>time(x)?time(x).toLocaleString('pt-BR'):String(x||'Não informado');
const day=x=>{const d=time(x);if(!d)return'';const p=new Intl.DateTimeFormat('en-US',{timeZone:'America/Maceio',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(d);const g=k=>p.find(z=>z.type===k)?.value||'';return g('year')+'-'+g('month')+'-'+g('day')};
function init(){
let w,d;try{w=frame.contentWindow;d=frame.contentDocument}catch{return false}
if(!w||!d||!d.getElementById('transferencias')||!Array.isArray(w.transferenciasAtivas)||!w.hsjAtualizarStatusTransferenciaAtomico||typeof w.atualizarTabelasTransferencias!=='function')return false;
if(w.__sigmaTransferCentralV1)return true;
w.__sigmaTransferCentralV1=true;
const tab=d.getElementById('transferencias');
const root=d.createElement('div');root.id='hsj-central';tab.prepend(root);
const oldForm=tab.querySelector('#transf-atendimento')?.closest('.notes-box');
const details=d.createElement('details');details.className='ct-new';details.innerHTML='<summary>Nova solicitação de transferência</summary>';
if(oldForm){oldForm.style.display='block';details.appendChild(oldForm)}
const legacyCss=d.createElement('style');legacyCss.textContent='#transferencias:has(#hsj-central)>:not(#hsj-central):not(#hsj-indicadores-transferencias-externas){display:none!important}#transferencias #hsj-central .ct-new>.notes-box{display:block!important}';
d.head.appendChild(legacyCss);
const css=d.createElement('style');css.textContent="#hsj-central{color:#163459;font:13px Arial,sans-serif}#hsj-central *{box-sizing:border-box}#hsj-central h2{font-size:25px;margin:0}#hsj-central h3{font-size:17px}#hsj-central .ct-head{display:flex;gap:12px;align-items:center;margin:5px 0 15px}#hsj-central .ct-head>span{background:#e0f2fe;color:#087cb2;border-radius:12px;padding:12px;font-size:28px}#hsj-central .ct-kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:15px}#hsj-central .ct-kpi{background:#edf7ff;border:1px solid #cce3f4;border-radius:12px;padding:14px}#hsj-central .ct-kpi:nth-child(2){background:#fff7eb}#hsj-central .ct-kpi:nth-child(3){background:#e9f9f3}#hsj-central .ct-kpi b{display:block;font-size:27px;margin-top:6px}#hsj-central .ct-priority{background:#fff5f6;border:1px solid #ffd0d5;border-radius:10px;padding:11px;margin-bottom:14px}#hsj-central .ct-filters{border:1px solid #dbe5f0;background:#f8fbff;border-radius:12px;padding:13px;margin:10px 0 17px}#hsj-central .ct-fields{display:grid;grid-template-columns:2fr 1.2fr 1fr 1fr 1.4fr;gap:9px}#hsj-central label{display:flex;flex-direction:column;gap:5px;font-weight:bold;font-size:11px}#hsj-central input,#hsj-central select{padding:9px;border:1px solid #cedae6;border-radius:7px;min-width:0;width:100%;background:white;color:#17365b}#hsj-central button{cursor:pointer;border:1px solid #9cb9d1;border-radius:7px;background:white;color:#08639c;padding:8px 11px;font-weight:bold}#hsj-central .ct-btnblue{background:#0879b9;color:white;border-color:#0879b9}#hsj-central .ct-tabs{display:flex;border-bottom:2px solid #d8e6f4;margin-bottom:14px;gap:4px}#hsj-central .ct-tabs button{border:0;border-radius:10px 10px 0 0;background:#eaf0f7;padding:12px 24px}#hsj-central .ct-tabs button[aria-selected=true]{background:#07588f;color:white}#hsj-central .ct-sort{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}#hsj-central .ct-sort select{max-width:250px}#hsj-central .ct-request{display:grid;grid-template-columns:1.2fr 1fr 1.65fr .9fr .75fr;align-items:center;border:1px solid #d4e3ef;background:#fff;border-radius:11px;margin:8px 0;overflow:hidden;box-shadow:0 2px 8px #14365f10}#hsj-central .ct-pane{padding:14px 10px;min-width:0;overflow-wrap:anywhere}#hsj-central .ct-pane+.ct-pane{border-left:1px solid #e2eaf3}#hsj-central .ct-name{font-weight:800;color:#14294a;font-size:13px}#hsj-central .ct-bed{background:#e1f2ff;border-radius:20px;color:#07598c;display:inline-block;padding:4px 8px;margin:7px 0;font-weight:bold;font-size:11px}#hsj-central .ct-meta{font-size:11px;color:#465c75;margin:3px 0}#hsj-central .ct-status{font-weight:bold;background:#dff3ff;color:#075f95;border-radius:16px;padding:5px 9px;display:inline-block;font-size:11px}#hsj-central .ct-track{display:flex;margin-top:11px;gap:2px;justify-content:space-around}#hsj-central .ct-step{position:relative;flex:1;text-align:center;font-size:9px;line-height:1.15}#hsj-central .ct-step span{display:grid;place-items:center;border:2px solid #b2c3d3;background:#fff;border-radius:50%;width:21px;height:21px;margin:0 auto 5px;color:#789}#hsj-central .ct-step.done span{background:#07865e;border-color:#07865e;color:#fff}#hsj-central .ct-step.current span{border-color:#0297c1;box-shadow:0 0 0 3px #c9f1fd;color:#047da2}#hsj-central .ct-actions{display:grid;gap:5px}#hsj-central .ct-actions button{padding:6px 3px}#hsj-central .ct-status-quick{display:grid;grid-template-columns:minmax(0,1fr) 34px;gap:4px;align-items:stretch}#hsj-central .ct-status-quick select{min-width:0;width:34px;padding:4px 1px;border:1px solid #70a9d0;border-radius:6px;background:#eaf6ff;color:#075b91;font-size:12px;cursor:pointer}#hsj-central .ct-status-quick button{min-width:0;padding:5px 2px}#hsj-central .ct-green{color:#087b4c!important;background:#e8fff1!important;border-color:#32b976!important}#hsj-central .ct-red{color:#a8232b!important;background:#fff2f2!important;border-color:#f87171!important}#hsj-central .ct-footer{border:1px solid #dbe5f0;border-radius:10px;padding:13px;margin:17px 0;background:#fff}#hsj-central .ct-empty{padding:28px;text-align:center;border:1px solid #dbe5f0;background:#fff;border-radius:10px}#hsj-central .ct-new{border:1px solid #dbe5f0;border-radius:10px;padding:10px;background:#fff}#hsj-central .ct-new summary{font-weight:bold;cursor:pointer;color:#0870a6}@media(max-width:1300px){#hsj-central .ct-request{grid-template-columns:repeat(2,minmax(0,1fr))}#hsj-central .ct-pane+.ct-pane{border-top:1px solid #dce6ef}#hsj-central .ct-fields{grid-template-columns:repeat(3,minmax(0,1fr))}}@media(max-width:700px){#hsj-central .ct-request{grid-template-columns:1fr}#hsj-central .ct-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}#hsj-central .ct-fields{grid-template-columns:repeat(2,minmax(0,1fr))}}";d.head.appendChild(css);
root.innerHTML='<div class="ct-head"><span>⇄</span><div><h2>Central de Transferências</h2><div>Controle das solicitações de transferências internas e externas, com acompanhamento por status e indicadores.</div></div></div>'+
'<div id="ct-kpis" class="ct-kpis"></div><div id="ct-priority" class="ct-priority"></div>'+
'<div class="ct-filters"><h3>⚲ Filtros de busca</h3><div class="ct-fields">'+
'<label>Paciente / Prontuário<input type="search" id="ct-search" placeholder="Nome ou prontuário"></label>'+
'<label>Destino<select id="ct-dest"><option value="">Todos os destinos</option></select></label>'+
'<label>Data inicial<input type="date" id="ct-start"></label>'+
'<label>Data final<input type="date" id="ct-end"></label>'+
'<label>Status<select id="ct-status"><option value="">Todos os status</option></select></label>'+
'</div><div style="display:flex;justify-content:flex-end;gap:8px;margin-top:10px"><button id="ct-clear">Limpar</button><button id="ct-filter" class="ct-btnblue">Filtrar</button></div></div>'+
'<div class="ct-tabs"><button id="ct-tab-active" aria-selected="true">⇄ Ativas</button><button id="ct-tab-final" aria-selected="false">✓ Finalizadas</button></div>'+
'<div class="ct-sort"><h3 id="ct-title">Solicitações Ativas</h3><label>Ordenar por<select id="ct-sort"><option value="new">Mais recentes</option><option value="old">Mais antigas</option></select></label></div>'+
'<div id="ct-results"></div><div class="ct-footer" id="ct-footer"></div>';
root.appendChild(details);
const $=id=>d.getElementById(id);let current='active',sort='new';
const key=x=>String(x||'').toUpperCase().replace(/[^0-9A-Z]/g,'');
function loc(t){
 if(t.setorOrigem&&t.leitoOrigem)return String(t.setorOrigem)+' · Leito '+t.leitoOrigem;
 const pr=key(t.atendimento);if(!pr)return 'Local não registrado';
 const matches=(w.setoresData||[]).flatMap(s=>(s.leitos||[]).filter(l=>['ocupado','reservado'].includes(l.status)&&key(l.prontuario)===pr).map(l=>({setor:s.nome,leito:l.n,status:l.status})));
 const occ=matches.filter(m=>m.status==='ocupado'),v=occ.length===1?occ[0]:occ.length===0&&matches.length===1?matches[0]:null;
 return v?v.setor+' · Leito '+v.leito:'Local não registrado';
}
const getIndex=t=>(w.transferenciasAtivas||[]).findIndex(x=>String(x.atendimento)===String(t.atendimento)&&String(x.dataIso||x.data)===String(t.dataIso||t.data));
function choices(id,items,placeholder){const sel=$(id),value=sel.value;sel.replaceChildren(new Option(placeholder,''));[...new Set(items.filter(Boolean))].sort().forEach(x=>sel.add(new Option(x,x)));if([...sel.options].some(o=>o.value===value))sel.value=value}
function progress(status){
 const currentIndex=states.indexOf(canon(status));
 return '<span class="ct-status">'+esc(canon(status))+'</span><div class="ct-track">'+states.map((n,i)=>'<div class="ct-step '+(i<currentIndex?'done':i===currentIndex?'current':'')+'"><span>'+(i<currentIndex?'✓':i===currentIndex?'●':'')+'</span>'+esc(n)+'</div>').join('')+'</div>';
}
function filters(rows,done){
 const q=norm($('ct-search').value),dest=$('ct-dest').value,status=$('ct-status').value,start=$('ct-start').value,end=$('ct-end').value;
 return rows.filter(t=>{
  if(q&&!norm((t.paciente||'')+' '+(t.atendimento||'')).includes(q))return false;
  if(dest&&t.destino!==dest)return false;
  if(status&&(done?'Finalizada':canon(t.status))!==status)return false;
  const date=day(done?(t.dataFinalizacao||t.dataIso):t.dataIso||t.data);
  if(start&&(!date||date<start))return false;if(end&&(!date||date>end))return false;
  return true;
 }).sort((a,b)=>((time(b.dataFinalizacao||b.dataIso)?.getTime()||0)-(time(a.dataFinalizacao||a.dataIso)?.getTime()||0))*(sort==='old'?-1:1));
}
function card(t,done){
 const idx=done?-1:getIndex(t);
 const person='<section class="ct-pane"><div class="ct-name">'+esc(t.paciente||'Paciente')+'</div><div class="ct-bed">▣ '+esc(loc(t))+'</div><div class="ct-meta">Prontuário: '+esc(t.atendimento||'-')+'</div><div class="ct-meta">Nascimento: '+esc(t.nascimento||'Consultar cadastro')+'</div></section>';
 const info='<section class="ct-pane"><div class="ct-meta"><b>Solicitação:</b> '+esc(pretty(t.dataIso||t.data))+'</div><div class="ct-meta"><b>Destino:</b> '+esc(t.destino||'-')+'</div><div class="ct-meta"><b>Perfil:</b> '+esc(t.perfil||'-')+'</div><div class="ct-meta"><b>DUSV:</b> '+esc(t.dusv||'-')+'</div></section>';
 const stage='<section class="ct-pane">'+(done?'<span class="ct-status">✓ Finalizada</span><div class="ct-meta">Conclusão: '+esc(pretty(t.dataFinalizacao))+'</div><div class="ct-meta">'+esc(t.statusFinal||'')+'</div>':progress(t.status))+'</section>';
 const notes='<section class="ct-pane"><div class="ct-meta"><b>Observações</b></div><div class="ct-meta">'+esc(t.pendencias||'Nenhuma')+'</div><div class="ct-meta">Atualizado: '+esc(pretty(t.atualizadoEm||t.dataIso||t.data))+'</div></section>';
 const act=done?'<section class="ct-pane ct-meta">Registro arquivado</section>':'<section class="ct-pane ct-actions"><button data-act="obs" data-id="'+idx+'">✎ Editar observações</button><div class="ct-status-quick"><button type="button" data-act="status" data-id="'+idx+'">☷ Registrar andamento</button><select data-status-select="'+idx+'" aria-label="Selecionar andamento de '+esc(t.paciente||'paciente')+'">'+states.slice(0,4).map(status=>'<option value="'+esc(status)+'" '+(canon(t.status)===status?'selected':'')+'>'+esc(status)+'</option>').join('')+'</select></div><button class="ct-green" data-act="baixa" data-id="'+idx+'">✓ Dar baixa</button><button class="ct-red" data-act="cancel" data-id="'+idx+'">✕ Cancelar</button></section>';
 return '<article class="ct-request">'+person+info+stage+notes+act+'</article>';
}
function render(){
 if(!tab.classList.contains('active'))return; // Evitar montagem de cartões fora da central.
 const active=w.transferenciasAtivas||[],done=w.transferenciasFinalizadas||[];
 const items=[['Ativas',active.length],['Aguardando resposta',active.filter(t=>['Solicitação Pendente','Vaga Solicitada'].includes(canon(t.status))).length],['Vaga confirmada',active.filter(t=>canon(t.status)==='Vaga Liberada').length],['Finalizadas (histórico)',done.length]];
 $('ct-kpis').innerHTML=items.map(x=>'<div class="ct-kpi">'+esc(x[0])+'<b>'+x[1]+'</b></div>').join('');
 const old=active.filter(t=>{const tm=time(t.dataIso);return tm&&Date.now()-tm.getTime()>86400000}).length;
 $('ct-priority').textContent=old?'⚠ '+old+' solicitação(ões) ativa(s) há mais de 24 horas.':'Nenhuma solicitação com mais de 24 horas identificada.';
 choices('ct-dest',[...active,...done].map(t=>t.destino),'Todos os destinos');
 choices('ct-status',current==='active'?states.slice(0,4):['Finalizada'],'Todos os status');
 $('ct-tab-active').textContent='⇄ Ativas ('+active.length+')';$('ct-tab-final').textContent='✓ Finalizadas ('+done.length+')';
 $('ct-tab-active').setAttribute('aria-selected',String(current==='active'));$('ct-tab-final').setAttribute('aria-selected',String(current==='done'));
 $('ct-title').textContent=current==='active'?'Solicitações Ativas':'Transferências Finalizadas';
 const records=filters(current==='active'?active:done,current==='done');
 $('ct-results').innerHTML=records.length?records.slice(0,150).map(t=>card(t,current==='done')).join(''):'<div class="ct-empty">Nenhum registro encontrado.</div>';
 $('ct-footer').innerHTML='<b>Indicadores de Transferências</b><p class="ct-meta">Este resumo acompanha situações operacionais. Os indicadores oficiais por perfil, origem, destino, período e duração continuam no painel de indicadores abaixo. Cancelamentos não são contabilizados como transferência realizada.</p>';
}
async function statusUpdate(t,status){
 if(w.usuarioAtual?.perfil==='Visitante')return w.alert('Sem permissão para alterar status.');
 const before=t.status;
 try{
  const a=await w.hsjAtualizarStatusTransferenciaAtomico({atendimento:t.atendimento,dataIso:t.dataIso||t.data,status,statusAnterior:before,usuario:w.usuarioAtual?.nome||'usuario'});
  if(!a?.ok)throw Error('Gravação não confirmada.');
  const snap=await w.firebaseModules.getDoc(w.firebaseModules.doc(w.db,'hospital','dados'));
  if(!snap.exists()||snap.metadata?.fromCache)throw Error('Sem confirmação de leitura do servidor.');
  w.transferenciasAtivas=snap.data().transferenciasAtivas||[];
  w.atualizarTabelasTransferencias();render();
 }catch(e){w.alert('Falha ao registrar andamento: '+(e.message||e))}
}
$('ct-results').addEventListener('click',e=>{
 const button=e.target.closest('button[data-act]');if(!button)return;
 const idx=Number(button.dataset.id),t=w.transferenciasAtivas?.[idx];if(!t)return;
 if(button.dataset.act==='baixa'){return w.baixarTransferencia(idx)}
 const tr=$('tabela-transf-ativas')?.rows[idx];
 if(button.dataset.act==='obs'){const b=tr?.querySelector('.hsj-edit-observacoes');return b?b.click():w.alert('Editor indisponível. Atualize o aplicativo.')}
 if(button.dataset.act==='cancel'){const b=tr?.querySelector('.hsj-cancelar-solicitacao');return b?b.click():w.alert('Cancelamento indisponível. Atualize o aplicativo.')}
 if(button.dataset.act==='status'){
  const sel=$('ct-results').querySelector('select[data-status-select="'+idx+'"]');
  if(sel){sel.focus();if(typeof sel.showPicker==='function'){try{sel.showPicker()}catch(_){}}}
 }
});
$('ct-results').addEventListener('change',async e=>{
 const sel=e.target.closest('select[data-status-select]');if(!sel)return;
 const idx=Number(sel.dataset.statusSelect),t=w.transferenciasAtivas?.[idx];
 if(!t||!states.slice(0,4).includes(sel.value)){render();return}
 const chosen=sel.value,previous=canon(t.status);
 if(chosen===previous)return;
 if(!w.confirm('Registrar o andamento de '+t.paciente+' como "'+chosen+'"?\n\nEsta atualização não finaliza a transferência nem gera indicador de alta.')){sel.value=previous;return}
 sel.disabled=true;
 await statusUpdate(t,chosen);
 sel.disabled=false;
 if(w.transferenciasAtivas?.[idx]?.status!==chosen)render();
});
$('ct-tab-active').onclick=()=>{current='active';$('ct-status').value='';render()};
$('ct-tab-final').onclick=()=>{current='done';$('ct-status').value='';render()};
$('ct-filter').onclick=render;$('ct-sort').onchange=()=>{sort=$('ct-sort').value;render()};
$('ct-clear').onclick=()=>{['ct-search','ct-dest','ct-start','ct-end','ct-status'].forEach(id=>$(id).value='');render()};
$('ct-search').onkeydown=e=>{if(e.key==='Enter')render()};
const oldUpdate=w.atualizarTabelasTransferencias;
w.atualizarTabelasTransferencias=function(){const v=oldUpdate.apply(this,arguments);if(tab.classList.contains('active'))render();return v};
const oldSwitch=w.switchTab;w.switchTab=function(name){const v=oldSwitch.apply(this,arguments);if(name==='transferencias')render();return v};
// Firestore e ações do usuário já atualizam as solicitações: sem redesenho periódico.
render();return true;
}
frame.addEventListener('load',()=>{let n=0;const t=setInterval(()=>{if(init()||++n>120)clearInterval(t)},250)});
let n=0;const t=setInterval(()=>{if(init()||++n>120)clearInterval(t)},250);
})();
;
;/* FILE: patch-drawer-stable-sigma-20261104.js */
(()=>{
 'use strict';
 const frame=document.getElementById('appFrame');if(!frame)return;
 const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function init(){
  let w,d;try{w=frame.contentWindow;d=frame.contentDocument}catch{return false}
  const wrap=d?.getElementById('hsj-drawer-wrap'),body=d?.getElementById('hsj-drawer-body'),panel=d?.getElementById('hsj-drawer'),grid=d?.getElementById('painel-setores-detalhado');
  if(!w||!wrap||!body||!panel||!grid||typeof w.abrirHistoricoPacienteLeito!=='function')return false;
  if(w.__sigmaDrawerStable20261104)return true;
  w.__sigmaDrawerStable20261104=true;
  const style=d.createElement('style');style.id='sigma-drawer-stable-css';style.textContent="\n#hsj-drawer-wrap.sigma-drawer-fixed{z-index:100010!important}\n#hsj-drawer-wrap.sigma-drawer-fixed{align-items:stretch!important;padding:0!important}\n#hsj-drawer-wrap.sigma-drawer-fixed #hsj-drawer{width:min(860px,96vw)!important;max-width:96vw!important;min-width:0!important;height:100dvh!important;max-height:100dvh!important;display:flex!important;flex-direction:column!important;overflow:hidden!important;box-shadow:-12px 0 40px #0f172a35!important}\n#hsj-drawer-wrap.sigma-drawer-fixed #hsj-drawer-head{position:sticky!important;top:0!important;flex:0 0 auto!important;padding:15px 22px!important;min-height:60px!important;border-bottom:1px solid #dbe6f0!important;z-index:12!important}\n#hsj-drawer-wrap.sigma-drawer-fixed #hsj-drawer-body{flex:1 1 auto!important;min-height:0!important;overflow-x:hidden!important;overflow-y:auto!important;padding:18px 22px 28px!important;scrollbar-gutter:stable!important;overscroll-behavior:contain!important}\n#hsj-drawer-wrap.sigma-drawer-fixed #box-form-mov{width:100%!important;box-sizing:border-box!important;margin:0!important}\n#hsj-drawer-wrap.sigma-drawer-fixed #box-form-mov .form-grid{gap:12px 16px!important}\n#hsj-drawer-wrap.sigma-drawer-fixed #box-form-mov .form-group input,#hsj-drawer-wrap.sigma-drawer-fixed #box-form-mov .form-group select,#hsj-drawer-wrap.sigma-drawer-fixed #box-form-mov .form-group textarea{width:100%!important;min-width:0!important;box-sizing:border-box!important}\n@media(max-width:750px){#hsj-drawer-wrap.sigma-drawer-fixed #hsj-drawer{width:100vw!important;max-width:100vw!important}#hsj-drawer-wrap.sigma-drawer-fixed #hsj-drawer-body{padding:14px!important}#hsj-drawer-wrap.sigma-drawer-fixed #box-form-mov .form-grid{grid-template-columns:1fr!important}}\n#hsj-drawer-wrap.sigma-drawer-fixed #hsj-drawer{display:block!important;width:min(700px,100vw)!important;min-width:min(360px,100vw)!important;height:100%!important;overflow-y:auto!important;background:#fff!important}\n#hsj-drawer-wrap.sigma-drawer-fixed #hsj-drawer-body{display:block!important;visibility:visible!important;opacity:1!important;min-height:180px!important;height:auto!important;overflow:visible!important;padding:18px!important;background:white!important}\n#hsj-drawer-wrap.sigma-drawer-fixed #box-form-mov{display:block!important;visibility:visible!important;opacity:1!important;position:relative!important;left:auto!important;top:auto!important;transform:none!important;clip:auto!important;clip-path:none!important;height:auto!important;max-height:none!important;overflow:visible!important;content-visibility:visible!important}\n#hsj-drawer-wrap.sigma-drawer-fixed #box-form-mov .form-grid{display:grid!important;visibility:visible!important;opacity:1!important;grid-template-columns:repeat(2,minmax(0,1fr))!important}\n#hsj-drawer-wrap.sigma-drawer-fixed #box-form-mov .form-group{display:block!important;visibility:visible!important;opacity:1!important}\n#hsj-drawer-wrap.sigma-drawer-fixed #box-form-mov input,#hsj-drawer-wrap.sigma-drawer-fixed #box-form-mov select,#hsj-drawer-wrap.sigma-drawer-fixed #box-form-mov textarea{visibility:visible!important;opacity:1!important;max-width:100%!important}\n#hsj-drawer-wrap.sigma-drawer-fixed #hsj-bed-title{font-size:17px!important}\n#hsj-drawer-wrap.sigma-drawer-fixed #sigma-drawer-context{background:#eff6ff;color:#0f4677;border:1px solid #bfd9f0;padding:12px;margin-bottom:12px;border-radius:9px;font-size:13px;line-height:1.5}\n#hsj-drawer-wrap.sigma-drawer-fixed #sigma-drawer-fail{display:none;background:#fff7ed;color:#92400e;border:1px solid #f59e0b;padding:12px;border-radius:9px;margin-bottom:12px;font-weight:600}\n@media(max-width:650px){#hsj-drawer-wrap.sigma-drawer-fixed #box-form-mov .form-grid{grid-template-columns:1fr!important}}\n";d.head.appendChild(style);
  wrap.classList.add('sigma-drawer-fixed');
  const msg=d.createElement('div');msg.id='sigma-drawer-context';body.prepend(msg);
  const error=d.createElement('div');error.id='sigma-drawer-fail';body.prepend(error);
  let selection=null,lastOpen=0;
  function findBed(setor,leito){
   const s=(w.setoresData||[]).find(s=>s.nome===setor);
   if(!s)return null;
   const l=(s.leitos||[]).find(l=>String(l.n)===String(leito));
   return l?{sector:s,bed:l}:null;
  }
  function verified(){return w.multiusuarioStatus!=='conflito'&&d.getElementById('hsj-bloqueio-conexao')?.style.display==='none'}
  function set(id,value){const el=d.getElementById(id);if(el)el.value=value??''}
  function renderContext(found){
   const title=d.getElementById('hsj-bed-title'),desc=d.getElementById('hsj-bed-desc');
   const {sector,bed}=found;
   if(title)title.textContent='Gerenciar leito '+bed.n;
   if(desc)desc.textContent=sector.nome+' · '+bed.status;
   msg.replaceChildren();
   const heading=d.createElement('strong');heading.textContent=sector.nome+' · Leito '+bed.n;
   const details=d.createElement('div');
   details.textContent='Situação: '+bed.status+(bed.paciente?' | Paciente: '+bed.paciente:'')+(bed.prontuario?' | Prontuário: '+bed.prontuario:'');
   msg.append(heading,details);
  }
  function repair(){
   if(wrap.style.display!=='flex')return;
   const form=d.getElementById('box-form-mov');
   if(!form||!form.querySelector('#mov-setor')||!form.querySelector('#mov-acao')){
    error.style.display='block';error.textContent='Não foi possível localizar o formulário de movimentação. Nenhum dado foi alterado. Feche e atualize o SIGMA.';return;
   }
   if(form.parentElement!==body)body.appendChild(form);
   for(const e of [wrap,panel,body,form]){
    e.hidden=false;e.removeAttribute('inert');
    e.style.setProperty('visibility','visible','important');
    e.style.setProperty('opacity','1','important');
   }
   body.style.setProperty('display','block','important');
   form.style.setProperty('display','block','important');
   form.style.setProperty('content-visibility','visible','important');
   const inner=form.querySelector('.form-grid');
   if(inner){inner.hidden=false;inner.style.setProperty('display','grid','important')}
   const fields=['mov-setor','mov-leito','mov-acao'].map(id=>d.getElementById(id));
   const ok=fields.every(x=>x&&x.getClientRects().length&&x.getBoundingClientRect().height>8);
   error.style.display=ok?'none':'block';
   if(!ok)error.textContent='Os campos de movimentação não ficaram visíveis. Nenhum registro foi alterado. Feche o painel e atualize a página.';
  }
  function open(setor,leito){
   const found=findBed(setor,leito);
   if(!found)return;
   // Visualizar cadastro atual e preservar handlers originais de admissão, reserva e alta.
   if(w.usuarioAtual?.perfil==='Visitante'){w.abrirHistoricoPacienteLeito(setor,leito);return}
   selection={setor,leito};lastOpen=Date.now();
   try{w.abrirHistoricoPacienteLeito(setor,leito)}
   catch(e){w.console?.error?.('Falha na abertura do leito',e)}
   const {bed}=found;
   wrap.style.display='flex';
   renderContext(found);
   const base=w.basePacientesCadastrados?.[bed.prontuario]||{};
   const val=(id,v)=>set(id,v);
   val('mov-setor',setor);
   if(typeof w.atualizarSelectLeitosMov==='function')try{w.atualizarSelectLeitosMov()}catch(e){w.console?.warn?.(e)}
   val('mov-leito',leito);
   // Somente leitura de dados já presentes; estes campos não são gravados aqui.
   val('mov-atendimento',bed.prontuario||'');
   val('mov-paciente',bed.paciente||base.nome||'');
   for(const [id,key] of [['mov-nascimento','nascimento'],['mov-sexo','sexo'],['mov-perfil-vaga','perfil'],['mov-convenio','convenio'],['mov-origem','origem'],['mov-precaucao','precaucao'],['mov-previsao-alta-paciente','previsaoAlta']]){
    if(base[key]!=null)val(id,base[key]);
   }
   repair();
   w.setTimeout(repair,80);w.setTimeout(repair,350);
  }
  // Intercepta somente o clique em um leito do painel central.
  // Não interfere em histórico, botões de salvar nem em transações de indicadores.
  grid.addEventListener('click',e=>{
   const pill=e.target.closest('.leito-pill');if(!pill||!grid.contains(pill))return;
   const sector=pill.closest('.sector-box');
   const sectorName=pill.dataset.recoverSector||sector?.querySelector('.sector-title-row h3')?.textContent?.trim();
   const bedNumber=pill.dataset.recoverBed||[...sector?.querySelectorAll('.leito-pill')||[]].indexOf(pill);
   const s=(w.setoresData||[]).find(x=>x.nome===sectorName);
   const n=pill.dataset.recoverBed||s?.leitos?.[[...sector?.querySelectorAll('.leito-pill')||[]].indexOf(pill)]?.n;
   if(!sectorName||n==null)return;
   // Evento da abertura nativa é substituído por uma única chamada consistente.
   e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
   open(sectorName,String(n));
  },true);
  const observer=new MutationObserver(()=>{if(wrap.style.display==='flex')repair()});
  observer.observe(wrap,{attributes:true,attributeFilter:['style']});
  const timer=w.setInterval(()=>{if(!d.isConnected||frame.contentDocument!==d){w.clearInterval(timer);return}if(wrap.style.display==='flex'&&Date.now()-lastOpen<120000)repair()},1200);
  return true;
 }
 function start(){let tries=0;const t=setInterval(()=>{if(init()||++tries>120)clearInterval(t)},200)}
 frame.addEventListener('load',start);start();
})();
;
;/* FILE: patch-ocupacao-censo-automatico-20261104.js */
(()=>{
'use strict';
const frame=document.getElementById('appFrame');if(!frame)return;
const TZ='America/Maceio';
const excluded=/ESPERA VIRTUAL|SALAS OPERAT[OÓ]RIAS|^SRPA$|^URG[EÊ]NCIA PARTICULAR$/i;
let wired=false,writing=false,lastAttempt='',daily={},loadedDays=new Set(),loadingKey='',loadVersion=0;
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
  const ds=item.setores.filter(x=>eligible(x,s)&&!excluded.test(String(x.setor||'')));
  for(const x of ds){
   occ+=x.ocupados;capacity+=x.operacionais;
   const state=bySector.get(x.setor)||{occupied:0,operational:0,days:0};
   state.occupied+=x.ocupados;state.operational+=x.operacionais;state.days++;
   bySector.set(x.setor,state);
  }
 }
 const external=Array.isArray(win.__hsjHistoricOccupancyVerified)?win.__hsjHistoricOccupancyVerified:[];
 let historicalDays=0;
 const claimed=new Set();
 if(s.all){
  for(const x of external){
   // Agregados antigos sem comprovação de exclusão das áreas transitórias não são comparáveis.
   if(x.leitosTransitoriosExcluidos!==true)continue;
   const ds=periodDays(x.inicio,x.fim);
   if(!ds.length||!ds.every(day=>days.includes(day)))continue;
   if(ds.some(day=>claimed.has(day)||daily[day]?.setores))continue;
   if(!Number.isSafeInteger(x.pacientesDia)||!Number.isSafeInteger(x.leitosDia)||x.pacientesDia<0||x.leitosDia<1||x.pacientesDia>x.leitosDia)continue;
   ds.forEach(day=>claimed.add(day));historicalDays+=ds.length;occ+=x.pacientesDia;capacity+=x.leitosDia;
  }
 }
 const totalCovered=covered+historicalDays;
 const fullyCovered=totalCovered===days.length;
 const certified=fullyCovered&&complete===days.length;
 const shown=capacity?pct(occ,capacity):'N/D';
 const label=certified?'Taxa mensal validada':fullyCovered?'Taxa mensal completa (provisória)':'Taxa parcial por dados registrados';
 main.innerHTML='<div style="display:flex;gap:10px;flex-wrap:wrap;margin:6px 0">'+
  '<div style="border:1px solid #cad9e9;background:#f1f7ff;border-radius:8px;padding:9px 13px;min-width:175px"><small>'+label+'</small><div style="font-size:24px;font-weight:700">'+esc(shown)+'</div></div>'+
  '<div style="border:1px solid #cad9e9;border-radius:8px;padding:9px 13px"><small>Pacientes-dia registrados</small><div style="font-size:20px;font-weight:700">'+occ+'</div></div>'+
  '<div style="border:1px solid #cad9e9;border-radius:8px;padding:9px 13px"><small>Leitos operacionais-dia registrados</small><div style="font-size:20px;font-weight:700">'+capacity+'</div></div>'+
  '<div style="border:1px solid #cad9e9;border-radius:8px;padding:9px 13px"><small>Dias com censo</small><div style="font-size:20px;font-weight:700">'+totalCovered+' / '+days.length+'</div></div></div>'+
  '<details style="font-size:12px"><summary style="cursor:pointer;font-weight:600">Ver ocupação por setor</summary><div style="overflow-x:auto;margin-top:6px"><table style="border-collapse:collapse;width:100%;font-size:12px"><thead><tr><th style="text-align:left">Setor</th><th>Pacientes-dia</th><th>Leitos-dia</th><th>Taxa</th><th>Dias</th></tr></thead><tbody>'+
   [...bySector].sort((a,b)=>a[0].localeCompare(b[0],'pt-BR')).map(([name,v])=>'<tr><td style="padding:5px;border-bottom:1px solid #eee">'+esc(name)+'</td><td style="text-align:center">'+v.occupied+'</td><td style="text-align:center">'+v.operational+'</td><td style="text-align:center">'+pct(v.occupied,v.operational)+'</td><td style="text-align:center">'+v.days+'</td></tr>').join('')+'</tbody></table></div></details>';
 footer.textContent=(certified?'Todos os censos do período foram fechados.':fullyCovered?'Todos os dias têm registro, mas há censos ainda não fechados; resultado provisório.':'Faltam '+(days.length-totalCovered)+' dia(s) de censo no período; resultado parcial, não utilizar como taxa mensal oficial.')+
  ' · Excluídos: espera virtual, salas operatórias, SRPA e 6 leitos da Urgência Particular. Leitos bloqueados não entram no denominador.'+
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
async function loadRange(win,doc,refreshRecent=false){
  if(!activeSource(win))return;
  const s=selector(win,doc);if(!s||!s.section.classList.contains('active'))return;
  const key=s.from+'|'+s.to;
  if(!s.days.length){render(win,doc);return}
  if(key===loadingKey&&!refreshRecent)return;
  loadingKey=key;const version=++loadVersion;
  const {doc:ref,getDoc}=win.firebaseModules;
  // Cache dos censos consultados, inclusive dias sem registro.
  // Na atualização periódica, reler apenas dias recentes.
  const recentCutoff=dateKey(new Date(Date.now()-2*864e5));
  const pending=s.days.filter(day=>!loadedDays.has(day)||(refreshRecent&&day>=recentCutoff));
  for(let i=0;i<pending.length;i+=12){
   const batch=pending.slice(i,i+12);
   await Promise.all(batch.map(async day=>{
    try{
     const snap=await getDoc(ref(win.db,'hospital','censo_'+day.replace(/-/g,'_')));
     if(version!==loadVersion)return;
     if(snap.exists())daily[day]=snap.data();else delete daily[day];
     loadedDays.add(day);
    }catch(err){if(version===loadVersion)saveError='Leitura dos censos: '+String(err.code||err.message||err)}
   }));
   if(version!==loadVersion)return;
   if(i===0||i+12>=pending.length)render(win,doc);
  }
  if(!pending.length)render(win,doc);
}
async function capture(win,doc,snapshot){
 if(writing||!activeSource(win)||!snapshot||snapshot.metadata?.fromCache||snapshot.metadata?.hasPendingWrites||!snapshot.exists())return;
 const source=snapshot.data();
 if(!Array.isArray(source.setoresData))return;
 const revision=Number(source._meta?.revision||0),day=dateKey(new Date());
 const snapshotCounts=counts(source.setoresData);
 const signature=day+'|'+JSON.stringify(snapshotCounts); // Ignorar edições sem mudança no censo.
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
  daily[day]=record;loadedDays.add(day);lastAttempt=signature;saveError='';
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
   if(!frame.isConnected||doc.hidden||!doc.getElementById('indicadores')?.classList.contains('active'))return;
   loadingKey='';
   loadRange(win,doc,true).catch(()=>{});
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
let bootstrapTimer=null;
function bootstrap(){
 if(bootstrapTimer){clearInterval(bootstrapTimer);bootstrapTimer=null}
 let attempts=0;
 bootstrapTimer=setInterval(()=>{
  init();
  if(wired||++attempts>100){clearInterval(bootstrapTimer);bootstrapTimer=null}
 },250);
 init();
 if(wired&&bootstrapTimer){clearInterval(bootstrapTimer);bootstrapTimer=null}
}
frame.addEventListener('load',()=>{wired=false;daily={};loadedDays=new Set();loadingKey='';loadVersion++;bootstrap()});
bootstrap();
})();
;