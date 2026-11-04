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
w.atualizarTabelaHistoricoGeral=render;
const oldSwitch=w.switchTab;w.switchTab=function(tab,el){const result=oldSwitch.apply(this,arguments);if(tab==='historico-geral')render();return result};
if(tab.classList.contains('active'))render();
}
frame.addEventListener('load',()=>{initialized=false;setTimeout(setup,200)});
let n=0;const interval=setInterval(()=>{if(setup()||++n>90)clearInterval(interval)},200);
})();