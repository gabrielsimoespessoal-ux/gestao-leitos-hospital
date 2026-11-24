/* SIGMA · Cardiologia. Módulo independente, sem acesso à base de internos/leitos. */
(()=>{
'use strict';
const frame=document.getElementById('appFrame');if(!frame)return;
let ready=false;
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const STATUS=['Enviada','Em avaliação','Finalizada','Cancelada'];
const allowed=(from,to)=>from==='Enviada'&&['Em avaliação','Finalizada','Cancelada'].includes(to)||from==='Em avaliação'&&['Finalizada','Cancelada'].includes(to);
const fdate=x=>{if(!x)return'—';if(x.toDate)x=x.toDate();else x=new Date(x);return Number.isFinite(x.getTime())?x.toLocaleString('pt-BR'):'—'};
const short=x=>String(x||'').length>110?String(x).slice(0,107)+'…':String(x||'');
const clean=x=>String(x||'').trim().replace(/\s+/g,' ');
function setup(){
let w,d;try{w=frame.contentWindow;d=frame.contentDocument}catch{return false}
if(!d||!w||!d.querySelector('nav.subnav')||!d.querySelector('.main-container')||!w.firebaseModules?.getDocs||!w.firebaseModules?.runTransaction||!w.hsjAuthReady)return false;
if(w.__hsjCardiologia20261124)return true;
w.__hsjCardiologia20261124=true;ready=true;
const {collection,doc,query,orderBy,limit,startAfter,getDocs,addDoc,runTransaction,serverTimestamp}=w.firebaseModules;
const nav=d.querySelector('nav.subnav'),tab=d.createElement('div');
tab.id='cardiologia';tab.className='tab-content';
tab.innerHTML='<div class="page-header"><div><h2>Solicitações de Cardiologia</h2><p>Formalização e acompanhamento independente. Nenhum vínculo com a lista de pacientes internos.</p></div><button type="button" class="btn" id="hc-print">Imprimir relatório A4</button></div>'+
'<section class="hc-panel"><div class="hc-flex"><div><div class="hc-eyebrow">FORMALIZAÇÃO DE PEDIDOS</div><h3>Nova solicitação</h3><p>Preenchimento manual, sem consulta automática ao painel de leitos ou aos cadastros de pacientes.</p></div><a class="hc-public" href="https://gabrielsimoespessoal-ux.github.io/gestao-leitos-hospital/solicitar-especialidade.html" target="_blank" rel="noopener noreferrer">Abrir formulário público ↗</a></div>'+
'<form id="hc-form" autocomplete="off"><div class="hc-grid">'+
'<label>Nome do paciente *<input id="hc-paciente" minlength="3" maxlength="140" required placeholder="Nome completo" autocomplete="off"></label>'+
'<label>Leito / referência *<input id="hc-leito" maxlength="60" required placeholder="Ex.: Ala A · 103" autocomplete="off"></label>'+
'<label>Setor <input id="hc-setor" maxlength="80" placeholder="Opcional" autocomplete="off"></label>'+
'<label>Data da solicitação *<input id="hc-data" type="date" required></label>'+
'<label>Quem está solicitando *<input id="hc-solicitante" minlength="3" maxlength="120" required placeholder="Nome completo do solicitante" autocomplete="off"></label>'+
'<label>Função do solicitante <input id="hc-funcao" maxlength="80" placeholder="Opcional" autocomplete="off"></label>'+
'</div><label>Motivo da avaliação cardiológica *<textarea id="hc-motivo" minlength="8" maxlength="3000" rows="3" required placeholder="Descreva objetivamente o motivo da solicitação"></textarea></label>'+
'<div class="hc-toolbar"><span class="hc-note">Especialidade: <strong>Cardiologia</strong> · Campos obrigatórios (*)</span><button type="submit" class="btn btn-success" id="hc-submit">Registrar solicitação</button></div><div class="hc-feedback" id="hc-feedback" role="status"></div></form></section>'+
'<section class="hc-panel"><div class="hc-flex"><div><div class="hc-eyebrow">ACOMPANHAMENTO</div><h3>Solicitações registradas</h3><p id="hc-hint">Consulta restrita ao usuário autenticado.</p></div><div class="hc-buttons"><button class="btn" id="hc-refresh">↻ Atualizar</button><button class="btn" id="hc-csv">Exportar CSV</button></div></div>'+
'<div id="hc-stats" class="hc-stats"></div>'+
'<div class="hc-filters"><label>Pesquisar <input id="hc-search" type="search" placeholder="Paciente, leito ou solicitante"></label><label>Status <select id="hc-filter-status"><option value="">Todos</option><option>Enviada</option><option>Em avaliação</option><option>Finalizada</option><option>Cancelada</option></select></label><label>De <input id="hc-from" type="date"></label><label>Até <input id="hc-to" type="date"></label></div>'+
'<div class="hc-scroll"><table><thead><tr><th>Solicitação</th><th>Paciente / Leito</th><th>Solicitante</th><th>Motivo</th><th>Situação</th><th>Ação</th></tr></thead><tbody id="hc-rows"><tr><td colspan="6">Carregando...</td></tr></tbody></table></div>'+
'<div class="hc-bottom"><span id="hc-count">—</span><button type="button" class="btn" id="hc-more">Carregar mais solicitações</button></div></section>'+
'<div class="hc-modal" id="hc-modal" hidden><section class="hc-dialog" role="dialog" aria-modal="true" aria-label="Detalhes da solicitação"><div class="hc-flex"><h3>Detalhes e histórico</h3><button type="button" id="hc-close" class="btn">Fechar</button></div><div id="hc-details"></div><form id="hc-change"><div class="hc-grid"><label>Novo status <select id="hc-newstatus"><option value="">Selecione o desfecho</option><option>Em avaliação</option><option>Finalizada</option><option>Cancelada</option></select></label><label>Responsável pelo registro *<input id="hc-actor" maxlength="120" placeholder="Nome completo" required></label></div><label>Observações do desfecho <textarea id="hc-note" maxlength="1000" rows="3" placeholder="Justificativa / resposta do cardiologista"></textarea></label><button type="submit" class="btn btn-success" id="hc-save">Gravar atualização</button><p class="hc-feedback" id="hc-changefeedback"></p></form></section></div>';
d.querySelector('.main-container').appendChild(tab);
const navItem=d.createElement('div');navItem.className='nav-item';navItem.innerHTML='<span class="hsj-sigma-nav-icon" aria-hidden="true">♡</span> Cardiologia';navItem.setAttribute('role','button');navItem.tabIndex=0;navItem.setAttribute('aria-label','Solicitações de Cardiologia');
const insertBefore=[...nav.querySelectorAll('.nav-item')].find(e=>(e.getAttribute('onclick')||'').includes("'plantao'"));
if(insertBefore)nav.insertBefore(navItem,insertBefore);else nav.appendChild(navItem);
navItem.addEventListener('click',()=>{w.switchTab('cardiologia',navItem);refresh(true)});
navItem.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();navItem.click()}});
const style=d.createElement('style');style.textContent=
'#cardiologia .hc-panel{background:white;border:1px solid #d6e5ee;border-radius:13px;padding:18px;margin:14px 0;box-shadow:0 4px 18px #133d600a}#cardiologia .hc-flex{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px}#cardiologia .hc-eyebrow{font-size:10px;font-weight:800;letter-spacing:.11em;color:#087f8c}#cardiologia h3{font-size:19px;margin:5px 0 3px;color:#133f68}#cardiologia .hc-panel p{font-size:12px;color:#667d91;margin:3px 0 12px}#cardiologia label{font-size:12px;font-weight:700;color:#264b6a}#cardiologia input,#cardiologia select,#cardiologia textarea{display:block;width:100%;margin:5px 0 0;padding:10px;border:1px solid #b9cede;border-radius:7px;background:#fff;color:#1a344d;box-sizing:border-box;font:13px Arial;max-width:100%}#cardiologia textarea{resize:vertical}#cardiologia .hc-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin:12px 0}#cardiologia .hc-grid label{display:block}#cardiologia form>label{display:block}#cardiologia .hc-toolbar{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:9px;margin:12px 0}#cardiologia .hc-public{display:inline-block;padding:10px 13px;text-decoration:none;background:#e7f3fc;color:#075c8c;border:1px solid #bad9ec;border-radius:8px;font-weight:800;font-size:12px}#cardiologia .hc-note,#cardiologia .hc-feedback{font-size:12px;color:#527084}#cardiologia .hc-feedback{font-weight:700;margin-top:8px;white-space:pre-wrap}#cardiologia .hc-buttons{display:flex;gap:8px;flex-wrap:wrap}#cardiologia .hc-stats{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:9px;margin:15px 0}#cardiologia .hc-stat{background:#edf6fc;padding:11px;border-radius:9px;border:1px solid #d5e8f5;font-size:11px;color:#547084}#cardiologia .hc-stat strong{display:block;font-size:22px;color:#115f9a}#cardiologia .hc-filters{display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:8px;margin-bottom:12px}#cardiologia .hc-scroll{overflow:auto}#cardiologia table{width:100%;min-width:780px;border-collapse:collapse;font-size:12px}#cardiologia th{background:#eff5fa;text-align:left;color:#34536c;font-size:11px}#cardiologia th,#cardiologia td{padding:10px 8px;border-bottom:1px solid #e2ebf2;vertical-align:top}#cardiologia td{overflow-wrap:anywhere}#cardiologia .hc-chip{border-radius:6px;padding:5px 7px;background:#fff1d9;color:#87540a;display:inline-block;font-weight:800;white-space:nowrap}#cardiologia .hc-chip.finalizada{background:#e2f6e9;color:#166b40}#cardiologia .hc-chip.cancelada{background:#ffe6e6;color:#96363c}#cardiologia .hc-chip.avaliacao{background:#e4f0ff;color:#1e6195}#cardiologia .hc-bottom{display:flex;justify-content:space-between;align-items:center;gap:10px;padding-top:13px;font-size:12px;color:#58758a}#cardiologia .hc-modal{position:fixed;inset:0;z-index:999999;display:flex;align-items:center;justify-content:center;background:#10283fac;padding:12px}#cardiologia .hc-modal[hidden]{display:none!important}#cardiologia .hc-dialog{width:min(760px,100%);max-height:92vh;overflow:auto;padding:20px;background:#fff;border-radius:13px;box-shadow:0 15px 50px #0005}#cardiologia .hc-detailgrid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:12px 0}#cardiologia .hc-detailgrid div{border:1px solid #e3ebf1;padding:10px;border-radius:7px;font-size:12px}#cardiologia .hc-history{padding-left:18px;font-size:12px;line-height:1.6;color:#385873}#cardiologia .hc-history li{padding:5px}#cardiologia .hc-hidden{display:none}@media(max-width:780px){#cardiologia .hc-grid,#cardiologia .hc-detailgrid{grid-template-columns:1fr}#cardiologia .hc-filters{grid-template-columns:1fr 1fr}#cardiologia .hc-stats{grid-template-columns:repeat(2,minmax(0,1fr))}}@media print{#cardiologia .hc-modal,#cardiologia form,#cardiologia .hc-filters,#cardiologia button{display:none!important}}';
d.head.appendChild(style);
const $=id=>d.getElementById(id);
const coll=collection(w.db,'solicitacoes_especialidades');
const PAGE=120;
let rows=[],cursor=null,more=true,loading=false,selected=null,lastUpdated=0;
const today=()=>{const z=new Date();return new Date(z.getTime()-z.getTimezoneOffset()*60000).toISOString().slice(0,10)};
$('hc-data').value=today();
const message=(t,target='hc-feedback')=>{$(target).textContent=t};
const isReadOnly=()=>!w.hsjAuthReady||w.usuarioAtual?.perfil==='Visitante';
const hasDate=v=>/^\d{4}-\d{2}-\d{2}$/.test(v);
function shown(){
const q=clean($('hc-search').value).toLowerCase(),status=$('hc-filter-status').value,from=$('hc-from').value,to=$('hc-to').value;
return rows.filter(x=>x.especialidade==='Cardiologia').filter(x=>{
 if(status&&x.status!==status)return false;
 if(from&&String(x.dataSolicitacao||'')<from)return false;
 if(to&&String(x.dataSolicitacao||'')>to)return false;
 return !q||[x.paciente,x.leito,x.setor,x.solicitante,x.motivo].some(v=>String(v||'').toLowerCase().includes(q));
});}
function render(){
const visible=shown(),card=rows.filter(x=>x.especialidade==='Cardiologia');
const stats=[['Carregadas',card.length],['Enviadas',card.filter(x=>x.status==='Enviada').length],['Em avaliação',card.filter(x=>x.status==='Em avaliação').length],['Finalizadas',card.filter(x=>x.status==='Finalizada').length],['Canceladas',card.filter(x=>x.status==='Cancelada').length]];
$('hc-stats').innerHTML=stats.map(([title,num])=>'<div class="hc-stat">'+esc(title)+'<strong>'+esc(num)+'</strong></div>').join('');
$('hc-rows').innerHTML=visible.length?visible.map(x=>'<tr><td><strong>'+esc(x.dataSolicitacao||'—')+'</strong><div style="color:#688095">'+esc(fdate(x.criadoEm))+'</div></td><td><strong>'+esc(x.paciente)+'</strong><div>'+esc(x.leito)+' · '+esc(x.setor||'—')+'</div></td><td>'+esc(x.solicitante)+'<div>'+esc(x.funcao||'')+'</div></td><td>'+esc(short(x.motivo))+'</td><td><span class="hc-chip '+(x.status==='Finalizada'?'finalizada':x.status==='Cancelada'?'cancelada':x.status==='Em avaliação'?'avaliacao':'')+'">'+esc(x.status)+'</span></td><td><button type="button" class="btn hc-detail" data-id="'+esc(x.id)+'">Ver / tratar</button></td></tr>').join(''):'<tr><td colspan="6">Nenhuma solicitação encontrada nos filtros atuais.</td></tr>';
$('hc-count').textContent='Exibindo '+visible.length+' de '+card.length+' solicitações carregadas'+(more?' (há páginas adicionais)':'')+'.';
$('hc-more').disabled=loading||!more;
$('hc-more').style.display=more?'':'none';
$('hc-hint').textContent='Origem exclusiva: formulários de Cardiologia. Sem importação ou ligação com pacientes internos. Atualize para consultar novas solicitações.';
}
async function refresh(reset=false){
 if(loading)return;
 if(isReadOnly()){message('Acesso restrito aos usuários autorizados.');return}
 if(reset){rows=[];cursor=null;more=true;render()}
 if(!more)return;
 loading=true;$('hc-refresh').disabled=true;$('hc-more').disabled=true;$('hc-hint').textContent='Consultando registros do servidor...';
 try{
  const constraints=[orderBy('criadoEm','desc'),limit(PAGE)];
  if(cursor)constraints.push(startAfter(cursor));
  const snap=await getDocs(query(coll,...constraints));
  if(snap.metadata?.fromCache)throw Error('Consulta sem confirmação do servidor. Confira a conexão.');
  const received=snap.docs.map(x=>({id:x.id,...x.data()}));
  const prev=new Map(rows.map(x=>[x.id,x]));received.forEach(x=>prev.set(x.id,x));
  rows=[...prev.values()].sort((a,b)=>{
    const time=x=>x.criadoEm?.toMillis?.()||new Date(x.criadoEm||0).getTime()||0;
    return time(b)-time(a);
  });
  cursor=snap.docs[snap.docs.length-1]||cursor;
  more=snap.docs.length===PAGE;
  lastUpdated=Date.now();
 }catch(err){message('Não foi possível carregar solicitações: '+String(err.message||err))}
 finally{loading=false;$('hc-refresh').disabled=false;render()}
}
$('hc-refresh').onclick=()=>refresh(true);
$('hc-more').onclick=()=>refresh(false);
['hc-search','hc-filter-status','hc-from','hc-to'].forEach(id=>$(id).addEventListener(id==='hc-search'?'input':'change',render));
$('hc-form').onsubmit=async e=>{
e.preventDefault();if(isReadOnly()){message('Não autorizado.');return}
const v=id=>clean($(id).value);
if(!$('hc-form').reportValidity())return;
if(v('hc-motivo').length<8){message('Descreva o motivo com pelo menos oito caracteres.');return}
const payload={especialidade:'Cardiologia',dataSolicitacao:v('hc-data'),paciente:v('hc-paciente'),leito:v('hc-leito'),setor:v('hc-setor'),solicitante:v('hc-solicitante'),funcao:v('hc-funcao'),motivo:v('hc-motivo'),status:'Enviada',origem:'Formulário interno SIGMA',criadoEm:serverTimestamp()};
const btn=$('hc-submit');btn.disabled=true;message('Gravando solicitação no servidor...');
try{
 const entry=await addDoc(coll,payload);
 $('hc-form').reset();$('hc-data').value=today();
 message('✓ Solicitação registrada! Protocolo: '+entry.id.slice(0,12).toUpperCase());
 await refresh(true);
}catch(err){message('Erro ao salvar: '+String(err.message||err)+'. Nenhuma confirmação de registro.')}
finally{btn.disabled=false}
};
function detail(item){
 selected=item;
 $('hc-details').innerHTML='<div class="hc-detailgrid">'+[
 ['Protocolo',item.id],['Paciente',item.paciente],['Leito / referência',item.leito],['Setor',item.setor||'—'],['Solicitante',item.solicitante],['Função',item.funcao||'—'],
 ['Solicitado em',item.dataSolicitacao],['Situação',item.status],['Criado em',fdate(item.criadoEm)],['Origem',item.origem||'—']
 ].map(([a,b])=>'<div><strong>'+esc(a)+'</strong><p style="margin:5px 0 0;white-space:pre-wrap">'+esc(b)+'</p></div>').join('')+
 '</div><h4>Motivo registrado</h4><p style="white-space:pre-wrap;overflow-wrap:anywhere">'+esc(item.motivo)+'</p><h4>Histórico auditável</h4><ol class="hc-history">'+
 (Array.isArray(item.historico)&&item.historico.length?item.historico.map(h=>'<li><strong>'+esc(h.de||'')+' → '+esc(h.para||'')+'</strong> · '+esc(fdate(h.em))+' · '+esc(h.por||'')+(h.nota?'<div>'+esc(h.nota)+'</div>':'')+'</li>').join(''):'<li>Registro original: solicitação enviada em '+esc(fdate(item.criadoEm))+'</li>')+'</ol>';
 const closed=['Finalizada','Cancelada'].includes(item.status);
 $('hc-change').classList.toggle('hc-hidden',closed||isReadOnly());
 $('hc-newstatus').value='';$('hc-actor').value='';$('hc-note').value='';message('', 'hc-changefeedback');
 [...$('hc-newstatus').options].forEach(option=>{if(option.value)option.disabled=!allowed(item.status,option.value)});
 $('hc-modal').hidden=false;
}
$('hc-rows').addEventListener('click',e=>{const id=e.target.closest('button[data-id]')?.dataset.id;if(id){const item=rows.find(x=>x.id===id);if(item)detail(item)}});
$('hc-close').onclick=()=>{$('hc-modal').hidden=true;selected=null};
$('hc-modal').addEventListener('click',e=>{if(e.target===$('hc-modal'))$('hc-close').click()});
$('hc-change').onsubmit=async e=>{
e.preventDefault();if(isReadOnly()||!selected)return;
const id=selected.id,to=$('hc-newstatus').value,actor=clean($('hc-actor').value),note=clean($('hc-note').value);
if(!allowed(selected.status,to)){message('Selecione uma transição válida.','hc-changefeedback');return}
if(actor.length<3){message('Informe o nome completo do responsável.','hc-changefeedback');return}
if(['Finalizada','Cancelada'].includes(to)&&note.length<8){message('Registre uma justificativa de pelo menos 8 caracteres para o desfecho.','hc-changefeedback');return}
const button=$('hc-save');button.disabled=true;
try{
 const ref=doc(w.db,'solicitacoes_especialidades',id);
 await runTransaction(w.db,async tx=>{
  const snap=await tx.get(ref);if(!snap.exists())throw Error('Solicitação não encontrada no servidor.');
  const cur=snap.data();
  if(cur.especialidade!=='Cardiologia'||!allowed(cur.status,to))throw Error('O status foi alterado por outro usuário. Atualize e confira.');
  const history=Array.isArray(cur.historico)?cur.historico.slice():[];
  if(history.length>=200)throw Error('Limite de histórico atingido. Solicite revisão administrativa.');
  history.push({de:cur.status,para:to,por:actor,nota:note,em:new Date().toISOString()});
  tx.update(ref,{status:to,historico:history,atualizadoEm:serverTimestamp(),ultimoResponsavel:actor,ultimaObservacao:note});
 });
 $('hc-modal').hidden=true;selected=null;message('✓ Atualização confirmada no servidor.');await refresh(true);
}catch(err){message('Falha no registro do desfecho: '+String(err.message||err),'hc-changefeedback')}
finally{button.disabled=false}
};
const csvCell=value=>{let str=String(value??'');if(/^[=+\-@\t\r]/.test(str))str="'"+str;return '"'+str.replace(/"/g,'""')+'"';};
function exportRows(){return shown().map(x=>[x.id,x.dataSolicitacao,fdate(x.criadoEm),x.paciente,x.leito,x.setor,x.solicitante,x.funcao,x.motivo,x.status,x.ultimoResponsavel||'',x.ultimaObservacao||'',fdate(x.atualizadoEm),JSON.stringify(x.historico||[])]);}
$('hc-csv').onclick=()=>{
 if(!rows.length)return message('Não há registros carregados para exportar.');
 const head=['Protocolo','Data','Registro','Paciente','Leito','Setor','Solicitante','Função','Motivo','Status','Último responsável','Última observação','Atualizado em','Histórico'];
 const csv='\uFEFF'+[head,...exportRows()].map(line=>line.map(csvCell).join(';')).join('\r\n');
 const a=d.createElement('a'),url=w.URL.createObjectURL(new w.Blob([csv],{type:'text/csv;charset=utf-8;'}));
 a.href=url;a.download='SIGMA_Cardiologia_'+today()+'.csv';d.body.appendChild(a);a.click();a.remove();w.setTimeout(()=>w.URL.revokeObjectURL(url),1000);
};
$('hc-print').onclick=()=>{
 const popup=w.open('','_blank');if(!popup){message('O navegador bloqueou a janela de impressão.');return}
 const data=shown();const tr=data.map(x=>'<tr><td>'+esc(x.dataSolicitacao||'')+'</td><td>'+esc(x.paciente)+'</td><td>'+esc(x.leito)+'</td><td>'+esc(x.solicitante)+'</td><td>'+esc(x.status)+'</td><td>'+esc(x.motivo)+'</td><td>'+esc(x.ultimaObservacao||'—')+'</td></tr>').join('');
 const html='<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>SIGMA - Relatório Cardiologia</title><style>@page{size:A4 landscape;margin:9mm}body{font:10px Arial;color:#20374a}h1{color:#0b5789;font-size:20px;margin-bottom:3px}p{color:#536679;font-size:11px}table{width:100%;border-collapse:collapse;table-layout:fixed}td,th{border:1px solid #cddce6;padding:5px;text-align:left;vertical-align:top;overflow-wrap:anywhere}th{background:#eaf3fb}thead{display:table-header-group}tr{break-inside:avoid}.meta{border-bottom:2px solid #0c6796;margin-bottom:12px;padding-bottom:8px}</style></head><body><div class="meta"><h1>SIGMA · Hospital São José</h1><strong>NIR — Relatório de Solicitações de Cardiologia</strong><p>Emitido em '+esc(new Date().toLocaleString('pt-BR'))+' · '+data.length+' registros filtrados dentre '+rows.length+' carregados. '+(more?'Existem registros adicionais não carregados.':'')+'</p></div><table><thead><tr><th>Data</th><th>Paciente</th><th>Leito</th><th>Solicitante</th><th>Status</th><th>Motivo</th><th>Desfecho</th></tr></thead><tbody>'+tr+'</tbody></table><p>Documento gerado para acompanhamento de solicitações formalizadas. Não substitui registro no prontuário.</p></body></html>';
 popup.document.open();popup.document.write(html);popup.document.close();popup.focus();popup.setTimeout(()=>{if(!popup.closed)popup.print()},400);
};
render();
const previous=w.switchTab;
w.switchTab=function(tabId){const result=previous.apply(this,arguments);if(tabId==='cardiologia'&&Date.now()-lastUpdated>20000)refresh(true);return result};
return true;
}
frame.addEventListener('load',()=>{ready=false;setTimeout(setup,400)});
let attempts=0;const timer=setInterval(()=>{if(setup()||++attempts>130)clearInterval(timer)},250);
})();