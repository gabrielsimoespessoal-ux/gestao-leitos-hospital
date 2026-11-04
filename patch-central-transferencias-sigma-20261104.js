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
const css=d.createElement('style');css.textContent="#hsj-central{color:#163459;font:13px Arial,sans-serif}#hsj-central *{box-sizing:border-box}#hsj-central h2{font-size:25px;margin:0}#hsj-central h3{font-size:17px}#hsj-central .ct-head{display:flex;gap:12px;align-items:center;margin:5px 0 15px}#hsj-central .ct-head>span{background:#e0f2fe;color:#087cb2;border-radius:12px;padding:12px;font-size:28px}#hsj-central .ct-kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:15px}#hsj-central .ct-kpi{background:#edf7ff;border:1px solid #cce3f4;border-radius:12px;padding:14px}#hsj-central .ct-kpi:nth-child(2){background:#fff7eb}#hsj-central .ct-kpi:nth-child(3){background:#e9f9f3}#hsj-central .ct-kpi b{display:block;font-size:27px;margin-top:6px}#hsj-central .ct-priority{background:#fff5f6;border:1px solid #ffd0d5;border-radius:10px;padding:11px;margin-bottom:14px}#hsj-central .ct-filters{border:1px solid #dbe5f0;background:#f8fbff;border-radius:12px;padding:13px;margin:10px 0 17px}#hsj-central .ct-fields{display:grid;grid-template-columns:2fr 1.2fr 1fr 1fr 1.4fr;gap:9px}#hsj-central label{display:flex;flex-direction:column;gap:5px;font-weight:bold;font-size:11px}#hsj-central input,#hsj-central select{padding:9px;border:1px solid #cedae6;border-radius:7px;min-width:0;width:100%;background:white;color:#17365b}#hsj-central button{cursor:pointer;border:1px solid #9cb9d1;border-radius:7px;background:white;color:#08639c;padding:8px 11px;font-weight:bold}#hsj-central .ct-btnblue{background:#0879b9;color:white;border-color:#0879b9}#hsj-central .ct-tabs{display:flex;border-bottom:2px solid #d8e6f4;margin-bottom:14px;gap:4px}#hsj-central .ct-tabs button{border:0;border-radius:10px 10px 0 0;background:#eaf0f7;padding:12px 24px}#hsj-central .ct-tabs button[aria-selected=true]{background:#07588f;color:white}#hsj-central .ct-sort{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}#hsj-central .ct-sort select{max-width:250px}#hsj-central .ct-request{display:grid;grid-template-columns:1.2fr 1fr 1.65fr .9fr .75fr;align-items:center;border:1px solid #d4e3ef;background:#fff;border-radius:11px;margin:8px 0;overflow:hidden;box-shadow:0 2px 8px #14365f10}#hsj-central .ct-pane{padding:14px 10px;min-width:0;overflow-wrap:anywhere}#hsj-central .ct-pane+.ct-pane{border-left:1px solid #e2eaf3}#hsj-central .ct-name{font-weight:800;color:#14294a;font-size:13px}#hsj-central .ct-bed{background:#e1f2ff;border-radius:20px;color:#07598c;display:inline-block;padding:4px 8px;margin:7px 0;font-weight:bold;font-size:11px}#hsj-central .ct-meta{font-size:11px;color:#465c75;margin:3px 0}#hsj-central .ct-status{font-weight:bold;background:#dff3ff;color:#075f95;border-radius:16px;padding:5px 9px;display:inline-block;font-size:11px}#hsj-central .ct-track{display:flex;margin-top:11px;gap:2px;justify-content:space-around}#hsj-central .ct-step{position:relative;flex:1;text-align:center;font-size:9px;line-height:1.15}#hsj-central .ct-step span{display:grid;place-items:center;border:2px solid #b2c3d3;background:#fff;border-radius:50%;width:21px;height:21px;margin:0 auto 5px;color:#789}#hsj-central .ct-step.done span{background:#07865e;border-color:#07865e;color:#fff}#hsj-central .ct-step.current span{border-color:#0297c1;box-shadow:0 0 0 3px #c9f1fd;color:#047da2}#hsj-central .ct-actions{display:grid;gap:5px}#hsj-central .ct-actions button{padding:6px 3px}#hsj-central .ct-green{color:#087b4c!important;background:#e8fff1!important;border-color:#32b976!important}#hsj-central .ct-red{color:#a8232b!important;background:#fff2f2!important;border-color:#f87171!important}#hsj-central .ct-footer{border:1px solid #dbe5f0;border-radius:10px;padding:13px;margin:17px 0;background:#fff}#hsj-central .ct-empty{padding:28px;text-align:center;border:1px solid #dbe5f0;background:#fff;border-radius:10px}#hsj-central .ct-new{border:1px solid #dbe5f0;border-radius:10px;padding:10px;background:#fff}#hsj-central .ct-new summary{font-weight:bold;cursor:pointer;color:#0870a6}@media(max-width:1300px){#hsj-central .ct-request{grid-template-columns:repeat(2,minmax(0,1fr))}#hsj-central .ct-pane+.ct-pane{border-top:1px solid #dce6ef}#hsj-central .ct-fields{grid-template-columns:repeat(3,minmax(0,1fr))}}@media(max-width:700px){#hsj-central .ct-request{grid-template-columns:1fr}#hsj-central .ct-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}#hsj-central .ct-fields{grid-template-columns:repeat(2,minmax(0,1fr))}}";d.head.appendChild(css);
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
 const act=done?'<section class="ct-pane ct-meta">Registro arquivado</section>':'<section class="ct-pane ct-actions"><button data-act="obs" data-id="'+idx+'">✎ Editar observações</button><button data-act="status" data-id="'+idx+'">☷ Registrar andamento</button><button class="ct-green" data-act="baixa" data-id="'+idx+'">✓ Dar baixa</button><button class="ct-red" data-act="cancel" data-id="'+idx+'">✕ Cancelar</button></section>';
 return '<article class="ct-request">'+person+info+stage+notes+act+'</article>';
}
function render(){
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
  const raw=w.prompt('Selecione a nova etapa:\\n1. Solicitação Pendente\\n2. Vaga Solicitada\\n3. Vaga Liberada\\n4. Em Regulação',String(Math.max(1,states.indexOf(canon(t.status))+1)));
  if(raw===null)return;const x=Number(raw);if(!Number.isInteger(x)||x<1||x>4)return w.alert('Informe um número de 1 a 4. Finalização deve usar Dar baixa.');
  statusUpdate(t,states[x-1]);
 }
});
$('ct-tab-active').onclick=()=>{current='active';$('ct-status').value='';render()};
$('ct-tab-final').onclick=()=>{current='done';$('ct-status').value='';render()};
$('ct-filter').onclick=render;$('ct-sort').onchange=()=>{sort=$('ct-sort').value;render()};
$('ct-clear').onclick=()=>{['ct-search','ct-dest','ct-start','ct-end','ct-status'].forEach(id=>$(id).value='');render()};
$('ct-search').onkeydown=e=>{if(e.key==='Enter')render()};
const oldUpdate=w.atualizarTabelasTransferencias;
w.atualizarTabelasTransferencias=function(){const v=oldUpdate.apply(this,arguments);if(tab.classList.contains('active'))render();return v};
const oldSwitch=w.switchTab;w.switchTab=function(name){const v=oldSwitch.apply(this,arguments);if(name==='transferencias')render();return v};
const tick=w.setInterval(()=>{if(!d.isConnected||frame.contentDocument!==d){w.clearInterval(tick);return}if(tab.classList.contains('active'))render()},15000);
render();return true;
}
frame.addEventListener('load',()=>{let n=0;const t=setInterval(()=>{if(init()||++n>120)clearInterval(t)},250)});
let n=0;const t=setInterval(()=>{if(init()||++n>120)clearInterval(t)},250);
})();