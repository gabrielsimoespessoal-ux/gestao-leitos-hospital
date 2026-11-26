/* SIGMA: bundle 3/5; ordem original preservada, fontes individuais intactas */
;/* FILE: patch-indicadores-eventos-confirmados-20261016.js */
(()=>{
const frame=document.getElementById('appFrame');if(!frame)return;
let done=false;
function init(){
 if(done)return;let w,d;try{w=frame.contentWindow;d=frame.contentDocument}catch(e){return}
 if(!w||!d||typeof w.executarEntradaLeitoAtomica!=='function'||typeof w.executarTransferenciaSeguraV20261009!=='function'||!d.getElementById('indicadores'))return;
 done=true;
 const style=d.createElement('style');style.textContent='#hsj-indicadores-auditaveis{border:1px solid #cbd5e1;background:#fff;border-radius:12px;padding:16px;margin:14px 0}#hsj-indicadores-auditaveis .hsj-kpis-eventos{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:10px;margin:12px 0}#hsj-indicadores-auditaveis .hsj-evento{background:#f7fafc;border:1px solid #dfe7f0;border-radius:9px;padding:12px}#hsj-indicadores-auditaveis .hsj-evento strong{font-size:25px;display:block;color:#0f456f}#hsj-indicadores-auditaveis .hsj-evento small{display:block;color:#475569}';d.head.appendChild(style);
 const fmt=v=>Number(v||0).toLocaleString('pt-BR');
 const norm=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 function draw(){
  const root=d.getElementById('indicadores');if(!root)return;
  let section=d.getElementById('hsj-indicadores-auditaveis');
  if(!section){section=d.createElement('section');section.id='hsj-indicadores-auditaveis';const heading=root.querySelector('.page-header');heading?.after(section);if(!section.isConnected)root.prepend(section)}
  const from=d.getElementById('filtro-data-inicio')?.value||'',to=d.getElementById('filtro-data-fim')?.value||'';
  const selected=[...d.querySelectorAll('#checkboxes-setores-container input:checked')].map(e=>e.value);
  const allSectors=selected.includes('GERAL')||selected.length===0;
  const rows=(w.movimentacoesHistorico||[]).filter(m=>{
   if(m.contabilizarIndicadores===false)return false;
   const dt=String(m.dataIso||m.dataDesfechoObj||'').slice(0,10);
   if(!/^\d{4}-\d{2}-\d{2}$/.test(dt)||from&&dt<from||to&&dt>to)return false;
   return allSectors||selected.some(s=>[m.setor,m.origem,m.destino].some(k=>norm(k).includes(norm(s))));
  });
  let adm=0,admSetorial=0,alta=0,uti=0,ext=0,death=0,int=0,excluded=(w.movimentacoesHistorico||[]).filter(m=>m.contabilizarIndicadores===false).length;
  for(const m of rows){
   const action=norm(m.acao),source=norm(m.origem||m.setor),destination=norm(m.destino);
   if(action==='admissao'){adm++;if(!allSectors)admSetorial++;}
   if(action.includes('transferencia interna') && !allSectors && destination!==source && selected.some(s=>norm(s)===destination))admSetorial++;
   if(/alta hospitalar|alta a pedido/.test(action))alta++;
   if(action.includes('obito'))death++;
   if(action.includes('transferencia externa'))ext++;
   if(action.includes('transferencia interna')){
     int++;
     if((m.altaUTI===true||source.includes('uti'))&&!destination.includes('uti') && (allSectors || selected.some(s=>norm(s)===source)))uti++;
   }
  }
  const card=(label,value)=>'<div class="hsj-evento"><small>'+label+'</small><strong>'+fmt(value)+'</strong></div>';
  section.innerHTML='<h3 style="margin:0;color:#123f69">Indicadores por eventos confirmados</h3><p style="font-size:12px;color:#52657b;margin:5px 0">Apuração baseada no histórico de movimentações e na opção de contabilização. Alta da UTI não equivale a alta hospitalar. Admissões setoriais incluem transferências internas de entrada, sem criar novas admissões hospitalares. Óbitos são apresentados separadamente.</p><div class="hsj-kpis-eventos">'+card('Admissões hospitalares',adm)+(!allSectors?card('Admissões nos setores selecionados',admSetorial):'')+card('Altas hospitalares',alta)+card('Altas da UTI para enfermaria',uti)+card('Transferências externas',ext)+card('Óbitos',death)+card('Transferências internas',int)+'</div><p style="font-size:11px;color:#64748b;margin:0">Eventos não contabilizados no histórico total: '+fmt(excluded)+'. Os indicadores históricos anteriores podem não ter confirmação explícita registrada. Os demais cálculos legados da aba não foram recalculados por esta atualização.</p>';
 }
 const prior=w.renderizarIndicadores;
 w.renderizarIndicadores=function(){const r=prior.apply(this,arguments);draw();return r};
 draw();
}
frame.addEventListener('load',()=>{done=false;setTimeout(init,450)});
if(frame.contentDocument?.readyState==='complete')init();else setTimeout(init,850);
})();
;
;/* FILE: patch-auditoria-indicadores-20261016.js */
(()=>{
const frame=document.getElementById('appFrame');if(!frame)return;let started=false;
function init(){
 if(started)return;let w,d;try{w=frame.contentWindow;d=frame.contentDocument}catch(e){return}
 if(!w||!d||typeof w.renderizarIndicadores!=='function'||!d.getElementById('tabela-indicadores-detalhada'))return;started=true;
 const norm=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
 const isUti=v=>/\buti\b/.test(norm(v));
 const isVirtual=s=>s.virtual||norm(s.nome).includes('espera virtual')||norm(s.tipo).includes('centro cirurgico');
 const dateOf=m=>{const t=m.dataIso||m.dataDesfechoObj;const d=new Date(t);return isFinite(d.getTime())?d:null};
 const dateRange=()=>{const a=d.getElementById('filtro-data-inicio')?.value||'',b=d.getElementById('filtro-data-fim')?.value||'';return [a?new Date(a+'T00:00:00'):new Date('2026-01-01T00:00:00'),b?new Date(b+'T23:59:59.999'):new Date('2026-12-31T23:59:59.999')]};
 const has= (s,t)=>norm(s).includes(t);
 function compute(movements,sector){
  const counts={adm:0,alta:0,uti:0,ob:0,ext:0,int:0,resI:0,resE:0,ev:0,legacy:0,missing:0};
  const [from,to]=dateRange();
  for(const m of movements){
   if(m.contabilizarIndicadores===false)continue;
   const dt=dateOf(m);if(!dt){counts.missing++;continue}if(dt<from||dt>to)continue;
   const a=norm(m.acao),src=m.origem||m.setor||'',dest=m.destino||'';
   const tipo=norm(m.tipoIndicador||'');
   const srcMatch=!sector||norm(m.setor).startsWith(norm(sector.nome))||norm(src)===norm(sector.nome);
   const destMatch=!sector||norm(dest)===norm(sector.nome);
   if(!srcMatch&&!destMatch)continue;
   if(m.contabilizarIndicadores!==true)counts.legacy++;
   if((tipo==='admissao'||(!tipo&&a==='admissao'))&&destMatch)counts.adm++;
   else if((tipo&&['alta para casa (melhorada)','alta a pedido','alta com assistencia domiciliar'].includes(tipo))||(!tipo&&(a==='alta hospitalar'||a==='alta a pedido'))){if(srcMatch)counts.alta++}
   else if(tipo==='obito'||(!tipo&&a.includes('obito'))){if(srcMatch)counts.ob++}
   else if(tipo==='evasao'||(!tipo&&a.includes('evasao'))){if(srcMatch)counts.ev++}
   else if(a.includes('transferencia externa')){if(srcMatch)counts.ext++}
   else if(a.includes('transferencia interna')){
    if(srcMatch)counts.int++;
    if(srcMatch&&isUti(src)&&!isUti(dest))counts.uti++;
   }else if(a.includes('reserva')&&!a.includes('cancelamento')&&destMatch){
    const all=(w.setoresData||[]).some(s=>norm(s.nome)===norm(src));
    if(all)counts.resI++;else counts.resE++;
   }
  }return counts;
 }
 function format(v){return Number(v||0).toLocaleString('pt-BR')}
 function render(){
  const tbody=d.getElementById('tabela-indicadores-detalhada');const kpi=d.getElementById('kpi-container');if(!tbody||!kpi)return;
  const all=w.movimentacoesHistorico||[];
  const sectors=w.setoresData||[];
  const selected=[...d.querySelectorAll('#checkboxes-setores-container input:checked')].map(x=>x.value);
  const filtered=selected.includes('GERAL')||!selected.length?sectors:sectors.filter(s=>selected.includes(s.nome));
  const total=compute(all,null);
  let warning=d.getElementById('hsj-auditoria-indicadores');if(!warning){warning=d.createElement('div');warning.id='hsj-auditoria-indicadores';kpi.before(warning)}
  warning.style.cssText='padding:12px 14px;margin:12px 0;background:#fff7ed;border:1px solid #fdba74;border-radius:10px;color:#803d08;font-size:13px';
  warning.innerHTML='<b>Indicadores auditados — não usar estimativas como resultados reais.</b> Taxas acumuladas, pacientes-dia acumulados, permanência média e intervalo de substituição dependem de censo diário e histórico completo de permanências; aparecem como “N/D” até existirem dados suficientes. Eventos legados sem confirmação explícita no histórico: <b>'+format(total.legacy)+'</b>. Eventos sem data confiável: <b>'+format(total.missing)+'</b>. Contagens de eventos exigem validação operacional.';
  const current=filtered.filter(s=>!isVirtual(s)).flatMap(s=>s.leitos||[]);
  const occupied=current.filter(l=>l.status==='ocupado').length,capacity=current.filter(l=>l.status!=='bloqueado').length;
  const cells=[['Ocupação atual',capacity?(100*occupied/capacity).toFixed(1)+'%':'N/D'],['Admissões',total.adm],['Altas hospitalares',total.alta],['Altas UTI → outro setor',total.uti],['Transferências externas',total.ext],['Óbitos',total.ob],['Transferências internas',total.int],['Reservas internas',total.resI],['Reservas externas',total.resE],['Média permanência','N/D'],['Ocupação acumulada','N/D'],['Pacientes-dia acumulados','N/D'],['Intervalo de substituição','N/D'],['Índice de rotatividade','N/D']];
  kpi.innerHTML=cells.map(([label,value])=>'<div class="kpi-card"><h4>'+label+'</h4><div class="kpi-value">'+value+'</div></div>').join('');
  const table=tbody.closest('table');if(!table)return;
  const columns=['Setor','Média permanência','Ocupação atual','Ocupação acumulada','Desocupação atual','Desocupação acumulada','Pacientes-dia atual','Pacientes-dia acumulados','Intervalo substituição','Índice rotatividade','Admissões','Reservas internas','Reservas externas','Altas (incl. UTI)','Óbitos','Transferências externas'];
  table.querySelector('thead').innerHTML='<tr>'+columns.map(x=>'<th>'+x+'</th>').join('')+'</tr>';
  tbody.innerHTML='';
  const make=(s)=>{
   const c=compute(all,s),beds=(s.leitos||[]),usable=beds.filter(l=>l.status!=='bloqueado').length,occ=beds.filter(l=>l.status==='ocupado').length;
   const pc=usable?(100*occ/usable).toFixed(1)+'%':'N/D';
   const values=[s.nome,'N/D',pc,'N/D',usable?(100*(usable-occ)/usable).toFixed(1)+'%':'N/D','N/D',occ,'N/D','N/D','N/D',c.adm,c.resI,c.resE,c.alta+c.uti,c.ob,c.ext];
   const tr=d.createElement('tr');values.forEach(v=>{const td=d.createElement('td');td.textContent=v;tr.appendChild(td)});return tr;
  };
  filtered.forEach(s=>tbody.appendChild(make(s)));
  const note=d.createElement('caption');note.textContent='N/D = não determinado com segurança a partir dos registros disponíveis. As altas da UTI e hospitalares são contadas separadamente na síntese superior.';note.style.cssText='caption-side:bottom;text-align:left;padding:9px;font-size:12px';
  table.querySelector('caption')?.remove();table.appendChild(note);
 }
 const original=w.renderizarIndicadores;
 w.renderizarIndicadores=function(){const result=original.apply(this,arguments);render();return result};
 if(d.getElementById('indicadores')?.classList.contains('active'))render();
}
frame.addEventListener('load',()=>{started=false;setTimeout(init,400)});
if(frame.contentDocument?.readyState==='complete')init();else setTimeout(init,750);
})();
;
;/* FILE: patch-reconciliar-indicadores-transferencias-20261016.js */
(()=>{
const frame=document.getElementById('appFrame');if(!frame)return;
let initialized=false;
function init(){
 if(initialized)return;
 let w,d;try{w=frame.contentWindow;d=frame.contentDocument}catch(e){return}
 if(!w||!d||!d.getElementById('tabela-transf-finalizadas')||!w.firebaseModules?.runTransaction)return;
 initialized=true;
 const {doc,runTransaction}=w.firebaseModules;
 const findEvents=(t,moves)=>{
  const stamp=new Date(t.dataFinalizacao||'').getTime();
  if(!Number.isFinite(stamp)||!t.atendimento||!t.leitoOrigem||!t.setorOrigem||t.setorOrigem==='Sem leito ocupado')return [];
  return moves.filter(m=>{
   if(String(m.atendimento)!==String(t.atendimento)||!String(m.acao||'').toLowerCase().includes('transferência externa'))return false;
   if(!String(m.setor||'').startsWith(t.setorOrigem+' (Leito '+t.leitoOrigem+')'))return false;
   const when=new Date(m.dataIso||m.dataDesfechoObj||'').getTime();
   return Number.isFinite(when)&&Math.abs(when-stamp)<120000;
  });
 };
 w.hsjRevisarIndicadorBaixa20261016=async function(index){
  const item=w.transferenciasFinalizadas?.[index];if(!item)return w.alert('Registro não localizado. Atualize o sistema.');
  if(w.usuarioAtual?.perfil==='Visitante')return w.alert('Sem permissão para validar indicadores.');
  const events=findEvents(item,w.movimentacoesHistorico||[]);
  if(events.length!==1||events[0].contabilizarIndicadores===true)return w.alert('Esta baixa já está contabilizada ou precisa de conferência manual.');
  if(!w.confirm('CONFIRMAR CONTABILIZAÇÃO RETROATIVA\n\nPaciente: '+item.paciente+'\nProntuário: '+item.atendimento+'\nData da baixa: '+new Date(item.dataFinalizacao).toLocaleString('pt-BR')+'\n\nA transferência será computada uma única vez. Não serão alterados leitos nem dados do paciente. Continuar?'))return;
  try{
   const result=await runTransaction(w.db,async tx=>{
    const ref=doc(w.db,'hospital','dados'),snap=await tx.get(ref);
    if(!snap.exists())throw Error('Base compartilhada indisponível.');
    const state=JSON.parse(JSON.stringify(snap.data()));
    const existing=(state.transferenciasFinalizadas||[]).filter(t=>t.atendimento===item.atendimento&&t.dataFinalizacao===item.dataFinalizacao);
    if(existing.length!==1)throw Error('Baixa ausente ou ambígua na base. Atualize.');
    const matching=findEvents(existing[0],state.movimentacoesHistorico||[]);
    if(matching.length!==1)throw Error('Não foi possível vincular exatamente um evento à baixa.');
    if(matching[0].contabilizarIndicadores===true)return {already:true};
    matching[0].contabilizarIndicadores=true;
    matching[0].indicadorValidadoEm=new Date().toISOString();
    matching[0].indicadorValidadoPor=w.usuarioAtual?.nome||'usuario';
    const rev=Number(state._meta?.revision||0);
    state._meta={...(state._meta||{}),revision:rev+1,previousRevision:rev,updatedAt:new Date().toISOString(),editor:w.usuarioAtual?.nome||'usuario',safeguards:'validacao-indicador-transferencia'};
    tx.set(ref,state);return {ok:true};
   });
   if(result.already)return w.alert('Este evento já foi contabilizado em outro computador.');
   const snap=await w.firebaseModules.getDoc(doc(w.db,'hospital','dados'));
   if(snap.exists()&&!snap.metadata?.fromCache){const state=snap.data();w.movimentacoesHistorico=state.movimentacoesHistorico||[];w.transferenciasFinalizadas=state.transferenciasFinalizadas||[]}
   decorate();if(typeof w.renderizarIndicadores==='function')w.renderizarIndicadores();
   w.alert('Contabilização confirmada no histórico compartilhado. Nenhuma nova transferência foi criada.');
  }catch(e){w.alert('Não foi possível validar o indicador: '+(e.message||e))}
 };
 function decorate(){
  const table=d.getElementById('tabela-transf-finalizadas')?.closest('table'),tbody=d.getElementById('tabela-transf-finalizadas');
  if(!table||!tbody)return;
  const th=table.querySelector('thead tr');if(th&&!th.querySelector('[data-indicador-baixa]')){const cell=d.createElement('th');cell.dataset.indicadorBaixa='1';cell.textContent='Indicador';th.appendChild(cell)}
  const list=w.transferenciasFinalizadas||[];
  [...tbody.rows].forEach((row,i)=>{
   if(i>=list.length)return;
   const t=list[i],events=findEvents(t,w.movimentacoesHistorico||[]);
   let td=row.querySelector('[data-indicador-baixa]');
   if(!td){td=row.insertCell();td.dataset.indicadorBaixa='1'}
   td.textContent='';
   if(t.setorOrigem==='Sem leito ocupado'||!t.leitoOrigem){td.textContent='Baixa administrativa · não é saída hospitalar';return}
   if(events.length!==1){td.textContent='⚠ Conferência necessária';return}
   if(events[0].contabilizarIndicadores===true){td.textContent='✓ Computada';return}
   const btn=d.createElement('button');btn.className='btn';btn.type='button';btn.textContent='Computar indicador';btn.style.cssText='padding:7px 9px;font-size:11px;white-space:nowrap';
   btn.onclick=()=>w.hsjRevisarIndicadorBaixa20261016(i);td.appendChild(btn);
  });
 }
 setInterval(decorate,2000);decorate();
}
frame.addEventListener('load',()=>{initialized=false;setTimeout(init,450)});
if(frame.contentDocument?.readyState==='complete')init();else setTimeout(init,800);
})();
;
;/* FILE: patch-confirmacao-indicadores-sim-nao-20261016.js */
(()=>{const frame=document.getElementById('appFrame');if(!frame)return;function start(){let w,d;try{w=frame.contentWindow;d=frame.contentDocument}catch(e){return}if(!w||!d||w.hsjConfirmarIndicadorSimNao)return;w.hsjConfirmarIndicadorSimNao=function(message){return new Promise(resolve=>{const overlay=d.createElement('div');overlay.style.cssText='position:fixed;inset:0;z-index:2147483646;background:#0f172a80;display:flex;align-items:center;justify-content:center;padding:16px';const modal=d.createElement('section');modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');modal.style.cssText='background:#fff;border-radius:14px;padding:23px;max-width:440px;width:100%;box-shadow:0 20px 70px #0004;font-family:Arial,sans-serif;color:#1e293b';const h=d.createElement('h3');h.textContent='Indicadores hospitalares';h.style.cssText='font-size:19px;margin:0 0 12px';const p=d.createElement('p');p.textContent=message;p.style.cssText='font-size:15px;line-height:1.5;margin:0 0 8px';const note=d.createElement('p');note.textContent='A movimentação será realizada com qualquer uma das opções.';note.style.cssText='font-size:12px;color:#64748b;margin:0 0 20px';const row=d.createElement('div');row.style.cssText='display:flex;justify-content:flex-end;gap:10px';const no=d.createElement('button');no.type='button';no.textContent='Não';no.style.cssText='padding:11px 22px;border:1px solid #cbd5e1;background:#f8fafc;border-radius:8px;font-weight:bold;font-size:15px;cursor:pointer';const yes=d.createElement('button');yes.type='button';yes.textContent='Sim';yes.style.cssText='padding:11px 22px;border:0;background:#1458a3;color:white;border-radius:8px;font-weight:bold;font-size:15px;cursor:pointer';let selected=false;function close(value){if(selected)return;selected=true;overlay.remove();resolve(value)}no.onclick=()=>close(false);yes.onclick=()=>close(true);row.append(no,yes);modal.append(h,p,note,row);overlay.appendChild(modal);d.body.appendChild(overlay);yes.focus();});};}frame.addEventListener('load',()=>setTimeout(start,120));if(frame.contentDocument?.readyState==='complete')start();else setTimeout(start,400);})();
;
;/* FILE: patch-tempo-internacao-20261020.js */
(()=>{
'use strict';
// Indicador visual somente leitura: nunca altera cadastros ou dados compartilhados.
const frame=document.getElementById('appFrame');if(!frame)return;
let activeDoc=null,refreshTimer=null,observer=null;
function boot(){
 let w,d;try{w=frame.contentWindow;d=frame.contentDocument}catch(_){return}
 if(!w||!d||!Array.isArray(w.setoresData))return;
 const body=d.getElementById('tabela-pacientes-internos');if(!body)return;
 if(activeDoc===d)return;
 activeDoc=d;
 if(refreshTimer)clearInterval(refreshTimer);
 if(observer)observer.disconnect();
 d.getElementById('hsj-tempo-internacao')?.remove();
 const css=d.createElement('style');
 css.textContent=`
 .hsj-ti-inline{margin-top:6px;max-width:275px;font-size:11px;color:#475569;font-weight:500;line-height:1.5}
 .hsj-ti-label{display:flex;align-items:center;gap:6px;flex-wrap:wrap}
 .hsj-ti-inline strong{font-weight:750}
 .hsj-ti-mini-track{height:6px;border-radius:10px;background:#e6edf4;overflow:hidden;margin-top:5px;max-width:230px}
 .hsj-ti-mini-fill{height:100%;border-radius:10px}
 .hsj-ti-reserved{display:inline-flex;align-items:center;background:#e9f1fc;color:#1c5b8b;border-radius:6px;padding:3px 7px;font-size:11px;font-weight:700}
 `;
 d.head.appendChild(css);
 function dateFrom(value){
  if(!value)return null;
  if(typeof value.toDate==='function')value=value.toDate();
  else if(typeof value.seconds==='number')value=new Date(value.seconds*1000);
  else if(typeof value==='string'&&/^\d{2}\/\d{2}\/\d{4}/.test(value)){
   const parts=value.slice(0,10).split('/').map(Number);
   value=new Date(parts[2],parts[1]-1,parts[0]);
  }
  const dt=value instanceof Date?value:new Date(value);
  return Number.isFinite(dt.getTime())&&dt.getTime()<=Date.now()?dt:null;
 }
 function update(){
  if(!body.isConnected)return;
  const records=w.basePacientesCadastrados||{};
  const occupants=new Map();
  for(const sector of w.setoresData||[])for(const bed of sector.leitos||[]){
   if(!['ocupado','reservado'].includes(bed.status))continue;
   const id=String(bed.prontuario||'').trim();
   // Status por prontuario e leito, sem alterar as estruturas existentes.
   const key=id+'|'+String(sector.nome)+'|'+String(bed.n);
   occupants.set(key,bed.status);
  }
  for(const tr of body.querySelectorAll('tr')){
   if(tr.cells.length<5)continue;
   const cell=tr.cells[1],pr=tr.cells[0].textContent.trim();
   const location=tr.cells[2].textContent||'';
   const status=(tr.cells[3].textContent||'').toLowerCase();
   let label=cell.querySelector('.hsj-ti-inline');
   if(!label){label=d.createElement('div');label.className='hsj-ti-inline';cell.appendChild(label)}
   const isReserved=status.includes('reservado')&&!status.includes('ocupado');
   if(isReserved){
    if(label.dataset.state!=='reserved'){label.replaceChildren();const x=d.createElement('span');x.className='hsj-ti-reserved';x.textContent='◷ Reservado';label.appendChild(x);label.dataset.state='reserved'}
    continue;
   }
   if(!status.includes('ocupado')){label.replaceChildren();label.dataset.state='';continue}
   const admission=dateFrom(records[pr]?.dataAdmissao);
   const days=admission?Math.max(0,Math.floor((Date.now()-admission.getTime())/86400000)):null;
   const state=days===null?'unknown':String(days);
   if(label.dataset.state===state)continue;
   label.dataset.state=state;label.replaceChildren();
   const line=d.createElement('div');line.className='hsj-ti-label';
   if(days===null){line.textContent='Tempo de internação: data não registrada';label.appendChild(line);continue}
   const color=days<=5?'#18a66b':days<=14?'#f5af13':'#ef4557';
   line.append('Tempo de internação: ');
   const count=d.createElement('strong');count.textContent=days+' '+(days===1?'dia':'dias');count.style.color=color;
   line.appendChild(count);
   const track=d.createElement('div');track.className='hsj-ti-mini-track';
   const fill=d.createElement('div');fill.className='hsj-ti-mini-fill';fill.style.background=color;fill.style.width=Math.min(100,Math.max(4,days/30*100))+'%';track.appendChild(fill);
   label.append(line,track);
  }
 }
 let queued=false;
 function schedule(){if(queued)return;queued=true;setTimeout(()=>{queued=false;update()},110)}
 observer=new MutationObserver(schedule);observer.observe(body,{childList:true});
 refreshTimer=setInterval(update,5000);
 update();
}
frame.addEventListener('load',()=>{activeDoc=null;setTimeout(boot,250)});
const retry=setInterval(()=>{boot();if(activeDoc)clearInterval(retry)},350);
})();
;
;/* FILE: patch-modo-tv-vertical-20261021.js */
(()=>{
'use strict';
const frame=document.getElementById('appFrame');if(!frame)return;
const style=document.createElement('style');
style.textContent=`
#hsj-tv-toggle{position:fixed;left:14px;right:auto;top:12px;z-index:2147483000;background:#172b4a;color:white;border:2px solid #93c5fd;border-radius:10px;padding:10px 16px;font:700 14px system-ui;box-shadow:0 4px 18px #0005;cursor:pointer}
#hsj-tv-screen{display:none;position:fixed;inset:0;z-index:2147483001;background:#090f19;color:#edf4ff;font:500 15px/1.25 system-ui,sans-serif;box-sizing:border-box;padding:clamp(8px,1vh,16px);overflow:hidden}
#hsj-tv-screen.active{display:flex;flex-direction:column;gap:6px}
#hsj-tv-screen *{box-sizing:border-box}
#hsj-tv-screen .tv-header{display:flex;justify-content:space-between;align-items:center;gap:16px;flex:0 0 auto;border:2px solid #34455c;border-radius:13px;background:#152237;padding:6px 12px}
#hsj-tv-screen .tv-heading{font-weight:800;font-size:clamp(16px,1.55vw,24px);letter-spacing:.2px}
#hsj-tv-screen .tv-subtitle{color:#b1c4da;font-size:10px}
#hsj-tv-screen .tv-controls{display:flex;align-items:center;gap:10px}
#hsj-tv-screen button{border:1px solid #8094b2;background:#233957;color:#fff;border-radius:8px;padding:6px 10px;font-weight:700;cursor:pointer}
#hsj-tv-screen .tv-clock{font-weight:800;font-size:15px;font-variant-numeric:tabular-nums}
#hsj-tv-screen .tv-sectors{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));grid-auto-rows:minmax(0,auto);align-content:space-evenly;gap:8px;flex:1 1 auto;min-height:0}
#hsj-tv-screen .tv-sector{border:2px solid #536880;border-radius:8px;background:#17263a;padding:5px 7px;min-height:0;display:flex;flex-direction:column;gap:5px}
#hsj-tv-screen .tv-sector-header{display:flex;align-items:center;justify-content:space-between;gap:8px}
#hsj-tv-screen .tv-sector-name{font-weight:800;font-size:clamp(15px,1.55vw,24px)}
#hsj-tv-screen .tv-sector-count{font-size:12px;color:#bfd0e7;white-space:nowrap}
#hsj-tv-screen .tv-beds{display:grid;grid-template-columns:repeat(auto-fill,58px);gap:3px;align-content:start;justify-content:start}
#hsj-tv-screen .tv-bed{aspect-ratio:1/1;min-width:0;border:2px solid #ffffff3d;border-radius:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;padding:2px;font-size:clamp(14px,1.15vw,19px);font-weight:850;letter-spacing:.2px;text-align:center}
#hsj-tv-screen .tv-bed small{font-size:9px;letter-spacing:0;font-weight:750}
#hsj-tv-screen .tv-markers{position:absolute;top:0;left:0;right:0;display:flex;align-items:center;justify-content:center;gap:1px;line-height:1;white-space:nowrap;pointer-events:none}
#hsj-tv-screen .tv-sex{font-size:clamp(8px,1.15vw,15px);color:white;text-shadow:0 1px 2px #000;font-weight:900}
#hsj-tv-screen .tv-cm{font-size:clamp(6px,.65vw,9px);color:#fff;background:#7c3aed;padding:1px;font-weight:900}
#hsj-tv-screen .tv-ped{font-size:clamp(6px,.65vw,9px);color:#422006;background:#fbbf24;padding:1px;font-weight:900;border-radius:2px}\n#hsj-tv-screen .tv-iso{font-size:clamp(6px,.65vw,9px);color:#fff;background:#b91c1c;padding:1px;font-weight:900}
#hsj-tv-screen .tv-bed-id{display:block;white-space:nowrap;line-height:1;font-weight:900}
#hsj-tv-screen .tv-bed[data-status=ocupado]{background:#822b39;color:#fff}
#hsj-tv-screen .tv-bed[data-status=disponivel]{background:#145f42;color:#fff}
#hsj-tv-screen .tv-bed[data-status=reservado]{background:#475569;color:#fff}
#hsj-tv-screen .tv-bed[data-status=reservado][data-sex=masculino]{background:#1a5288;color:#fff}
#hsj-tv-screen .tv-bed[data-status=reservado][data-sex=feminino]{background:#b83280;color:#fff}
#hsj-tv-screen .tv-bed[data-status=higienizacao]{background:#886117;color:#fff}
#hsj-tv-screen .tv-bed[data-status=bloqueado]{background:#4c3a70;color:#fff}
#hsj-tv-screen .tv-bed[data-status=outro]{background:#475569;color:#fff}
#hsj-tv-screen .tv-footer{flex:0 0 auto;border:2px solid #4e6684;background:#142238;border-radius:9px;padding:4px 7px}
#hsj-tv-screen .tv-footer-title{font-weight:800;margin-bottom:3px;font-size:12px}
#hsj-tv-screen .tv-kpis{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:4px}
#hsj-tv-screen .tv-kpi{border:1px solid #5b7190;border-radius:5px;padding:2px 2px;background:#20324a;text-align:center;min-width:0}
#hsj-tv-screen .tv-kpi span{display:block;color:#cbd8e7;font-size:clamp(9px,.8vw,11px);margin-bottom:0}
#hsj-tv-screen .tv-kpi strong{display:block;font-size:clamp(14px,1.25vw,20px);font-variant-numeric:tabular-nums}
#hsj-tv-screen .tv-legend{display:flex;flex-wrap:wrap;justify-content:center;gap:3px 12px;color:#d3e0f2;font-size:9px}
#hsj-tv-screen .tv-dot{display:inline-block;width:11px;height:11px;border-radius:3px;margin-right:5px}
@media(max-width:650px){#hsj-tv-screen .tv-sectors{grid-template-columns:1fr}#hsj-tv-screen .tv-kpis{grid-template-columns:repeat(4,minmax(0,1fr))}}
`;
document.head.appendChild(style);
const toggle=document.createElement('button');toggle.id='hsj-tv-toggle';toggle.type='button';toggle.textContent='▣ Modo TV';toggle.title='Exibir painel de leitos e indicadores em tela cheia';document.body.appendChild(toggle);
const screen=document.createElement('section');screen.id='hsj-tv-screen';screen.setAttribute('aria-label','Modo TV do painel de leitos');
screen.innerHTML='<header class="tv-header"><div><div class="tv-heading">HOSPITAL SÃO JOSÉ · PAINEL DE LEITOS</div><div class="tv-subtitle">Visualização em tempo real · Somente leitura</div></div><div class="tv-controls"><time class="tv-clock" id="hsj-tv-clock"></time><button type="button" id="hsj-tv-fullscreen">⛶ Tela cheia</button><button type="button" id="hsj-tv-exit">✕ Sair</button></div></header><div class="tv-sectors" id="hsj-tv-sectors"></div><footer class="tv-footer"><div class="tv-footer-title">Indicadores de ocupação</div><div class="tv-kpis" id="hsj-tv-kpis"></div><div class="tv-legend" style="margin-top:3px"><span><i class="tv-dot" style="background:#145f42"></i>Disponível</span><span><i class="tv-dot" style="background:#822b39"></i>Ocupado</span><span><i class="tv-dot" style="background:#1a5288"></i>Reserva masc.</span><span><i class="tv-dot" style="background:#b83280"></i>Reserva fem.</span><span><i class="tv-dot" style="background:#475569"></i>Reserva sem sexo</span><span><i class="tv-dot" style="background:#886117"></i>Higienização</span><span><i class="tv-dot" style="background:#4c3a70"></i>Bloqueado</span></div></footer>';
document.body.appendChild(screen);
const sectorsNode=screen.querySelector('#hsj-tv-sectors'),kpiNode=screen.querySelector('#hsj-tv-kpis');
const statuses={disponivel:'Livre',ocupado:'Ocupado',reservado:'Reserva',higienizacao:'Higien.',bloqueado:'Bloqueio'};
let timer=null,last='';
function escapeHtml(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function showClock(){screen.querySelector('#hsj-tv-clock').textContent=new Date().toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'});}
function fit(){
 const cards=[...sectorsNode.querySelectorAll('.tv-sector')];
 if(!cards.length)return;
 const width=sectorsNode.clientWidth,height=sectorsNode.clientHeight;
 const cols=width>=650?2:1;
 const rows=Math.ceil(cards.length/cols);
 const gap=6, available=Math.max(80,height-gap*(rows-1));
 sectorsNode.style.gridTemplateColumns='repeat('+cols+',minmax(0,1fr))';
 sectorsNode.style.gap=gap+'px';
 // Distribuição proporcional: setores com mais leitos recebem mais altura.
 const groups=Array.from({length:rows},(_,i)=>cards.slice(i*cols,(i+1)*cols));
 const weights=groups.map(group=>{
   const maxBeds=Math.max(1,...group.map(card=>card.querySelectorAll('.tv-bed').length));
   const special=group.some(card=>/SALAS OPERAT|SALAS OPERATÓRIAS|SRPA|ESPERA VIRTUAL INTERNA/i.test(card.querySelector('.tv-sector-name')?.textContent||''));
   const largeWard=group.some(card=>/IRMÃ LIBÂNIA|IRMA LIBANIA|ALA A/i.test(card.querySelector('.tv-sector-name')?.textContent||''));
   return Math.max(1,Math.sqrt(maxBeds))*(special?1.48:largeWard?1.27:1);
 });
 const minRow=Math.min(35,available/rows);
 const remainder=Math.max(0,available-minRow*rows);
 const totalWeight=weights.reduce((a,b)=>a+b,0);
 const rowHeights=weights.map(w=>minRow+remainder*w/totalWeight);
 sectorsNode.style.gridTemplateRows=rowHeights.map(v=>v+'px').join(' ');
 sectorsNode.style.alignContent='start';
 cards.forEach((card,i)=>{
  card.style.cssText+=';height:100%;min-height:0;padding:5px 7px;gap:3px;overflow:hidden;box-sizing:border-box';
  const title=card.querySelector('.tv-sector-name');
  if(title)title.style.fontSize=/INTERNO\s*\/\s*FILANTR[OÔ]PICO/i.test(title.textContent)?'clamp(9px,.9vw,13px)':'clamp(11px,1.15vw,17px)';
  const beds=card.querySelector('.tv-beds'),items=[...beds.children];
  if(!items.length)return;
  const rowHeight=rowHeights[Math.floor(i/cols)];
  const sectorWidth=(width-gap*(cols-1))/cols;
  const usableWidth=Math.max(25,sectorWidth-20);
  const sectorName=title?.textContent||'';
  const special=/SALAS OPERAT|SRPA|ESPERA VIRTUAL INTERNA/i.test(sectorName);
  const largeWard=/IRMÃ LIBÂNIA|IRMA LIBANIA|^ALA A$/i.test(sectorName.trim());
  const headerHeight=card.querySelector('.tv-sector-header')?.getBoundingClientRect().height||17;
  const usableHeight=Math.max(15,rowHeight-headerHeight-12);
  // Usar a largura do setor e a altura de 1-3 linhas, com quadrados unidos.
  let best={size:0,columns:1};
  for(let columns=1;columns<=items.length;columns++){
   const lines=Math.ceil(items.length/columns);
   const side=Math.floor(Math.min(usableWidth/columns,usableHeight/lines));
   if(side>best.size)best={size:side,columns};
  }
  // Os dois setores maiores ganham uma grade retangular equilibrada com mais altura.
  if(largeWard){
   let bestWard={score:-Infinity,size:0,columns:1};
   for(let columns=1;columns<=items.length;columns++){
    const lines=Math.ceil(items.length/columns);
    const sideCandidate=Math.floor(Math.min(usableWidth/columns,usableHeight/lines));
    const coverage=Math.min(1,(columns*sideCandidate)/usableWidth);
    const score=sideCandidate+coverage*2-(lines===1?2:0);
    if(score>bestWard.score)bestWard={score,size:sideCandidate,columns};
   }
   best=bestWard;
  }
  const side=Math.max(7,Math.min(special?94:76,best.size));
  if(special){
   card.style.gap='2px';
   card.style.padding='4px 6px';
   beds.style.overflow='hidden';
  }
  beds.style.display='grid';
  beds.style.gridTemplateColumns='repeat('+best.columns+','+side+'px)';
  beds.style.gridAutoRows=side+'px';
  beds.style.gap='0';
  beds.style.justifyContent='start';
  beds.style.alignContent='start';
  beds.style.minHeight='0';
  items.forEach(el=>{
   el.style.width=side+'px';
   el.style.height=side+'px';
   el.style.minWidth='0';
   el.style.minHeight='0';
   el.style.aspectRatio='1/1';
   el.style.padding='0';
   el.style.borderRadius='0';
   el.style.borderWidth='1px';
   el.style.letterSpacing='0';
   el.style.fontSize=Math.max(7,Math.min(22,side*(special?.30:.35)))+'px';
   el.style.lineHeight='1';
   el.style.gap='0';el.style.position='relative';el.style.justifyContent='flex-end';el.style.paddingBottom='1px';if(special){el.style.overflow='hidden';const name=el.querySelector('.tv-bed-id');if(name){name.style.fontSize=Math.max(6,Math.min(15,side/(name.textContent.length>7?5.3:name.textContent.length>4?4:2.8)))+'px';name.style.maxWidth='100%';name.style.overflow='hidden';name.style.textOverflow='clip';}}
  });
  card.querySelectorAll('.tv-bed small').forEach(el=>{
   el.style.fontSize=Math.max(6,Math.min(12,side*.20))+'px';
   el.style.lineHeight='1';
  });
 });
}
function bedDetail(bed,sector,base){
 const data=(base&&bed.prontuario!=null&&base[bed.prontuario])||{};
 const norm=x=>String(x||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
 const precaution=norm(data.precaucao||bed.precaucao);
 const isolated=!!precaution&&!['nenhuma','nenhuma (padrao)','padrao','nao','sem','sem precaucao'].includes(precaution)&&/isolamento|precaucao|contato|goticulas|aeross/.test(precaution);
 const gender=norm(data.sexo||bed.sexo);
 const sex=(gender.startsWith('mascul')||gender==='m')?'♂':(gender.startsWith('feminin')||gender==='f')?'♀':'';
 const profile=norm(data.perfil||data.perfilVaga||bed.perfil||bed.perfilVaga);
 const context=[profile,norm(sector.nome),norm(sector.tipo)].join(' ');
 const pediatric=['ocupado','reservado'].includes(bed.status)&&/pediatr|infantil/.test(context);
 const dc=bed.dadosCirurgicos;
 const reservaCirurgica=bed.status==='reservado'&&!!dc&&typeof dc==='object';
 const cc=['ocupado','reservado'].includes(bed.status)&&(/cirurg/.test(profile)||reservaCirurgica);
 return {sex,isolated,cc,pediatric};
}
function tooltipForBed(bed,base){
 const status=Object.hasOwn(statuses,bed.status)?bed.status:'outro';
 if(status==='ocupado'||status==='reservado'){
  const patient=bed.prontuario!=null?base?.[bed.prontuario]:null;
  const name=String(bed.paciente||patient?.nome||patient?.nomePaciente||'').trim();
  return name||'Paciente não identificado';
 }
 return status==='disponivel'?'Leito disponível':(statuses[status]||String(bed.status||''));
}
function render(){
 if(!screen.classList.contains('active'))return;
 showClock();let sectors,base={};
 try{
  const w=frame.contentWindow,d=frame.contentDocument;
  sectors=w?.setoresData;base=w?.basePacientesCadastrados||{};
  if(d){
   let bridge=d.getElementById('hsj-tv-bridge');
   if(!bridge){
    bridge=d.createElement('script');bridge.id='hsj-tv-bridge';
    bridge.textContent="try { window.__hsjTvBridge = function(){ return {setores: (typeof setoresData !== 'undefined' ? setoresData : window.setoresData), base: (typeof basePacientesCadastrados !== 'undefined' ? basePacientesCadastrados : window.basePacientesCadastrados)||{}}; }; } catch(e) { window.__hsjTvBridgeError=String(e); }";
    (d.head||d.documentElement).appendChild(bridge);
   }
   const state=w.__hsjTvBridge?.();
   if(state){if(Array.isArray(state.setores))sectors=state.setores;base=state.base||base;}
  }
 }catch(e){console.warn('Modo TV - leitura:',e);sectors=null;base={}}
 if(!Array.isArray(sectors)){sectorsNode.innerHTML='<div style="padding:20px;color:#fff">Aguardando conexão com o painel de leitos… Verifique se o painel principal já carregou.</div>';return}
 try{const snapshot=JSON.stringify(sectors.map(s=>[s.nome,(s.leitos||[]).map(l=>[l.n,l.status,bedDetail(l,s,base),tooltipForBed(l,base)])]));if(snapshot===last)return;last=snapshot;
 const counts={total:0,ocupado:0,disponivel:0,reservado:0,higienizacao:0,bloqueado:0};
 let transitoryTotal=0;
 const operationalSector=s=>{
  const name=String(s.nome||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().trim();
  return !s.virtual&&!name.includes('ESPERA VIRTUAL')&&!name.includes('SALAS OPERATORIAS')&&name!=='SRPA'&&name!=='URGENCIA PARTICULAR';
 };
 sectorsNode.innerHTML=sectors.map(s=>{
 const beds=Array.isArray(s.leitos)?s.leitos:[];
 if(operationalSector(s))beds.forEach(l=>{counts.total++;if(Object.hasOwn(counts,l.status))counts[l.status]++});
 else transitoryTotal+=beds.length;
 return '<article class="tv-sector"><div class="tv-sector-header"><div class="tv-sector-name">'+escapeHtml(s.nome)+'</div><div class="tv-sector-count">'+beds.length+' leitos</div></div><div class="tv-beds">'+beds.map(l=>{const status=Object.hasOwn(statuses,l.status)?l.status:'outro';const detail=bedDetail(l,s,base);const markers=(detail.sex?'<b class="tv-sex">'+detail.sex+'</b>':'')+(detail.isolated?'<b class="tv-iso">ISO</b>':'')+(detail.cc?'<b class="tv-cm">C.C</b>':'')+(detail.pediatric?'<b class="tv-ped">PED</b>':'');const sexColor=detail.sex==='♂'?'masculino':detail.sex==='♀'?'feminino':'nao-informado';return '<div class="tv-bed" data-status="'+status+'" data-sex="'+sexColor+'" title="'+escapeHtml(tooltipForBed(l,base))+'"><span class="tv-markers">'+markers+'</span><span class="tv-bed-id">'+escapeHtml(l.n)+'</span></div>'}).join('')+'</div></article>';
 }).join('');
 const capacity=counts.total-counts.bloqueado;const rate=capacity?(counts.ocupado/capacity*100).toLocaleString('pt-BR',{maximumFractionDigits:1})+'%':'—';
 const vals=[['Leitos efetivos',counts.total],['Ocupados',counts.ocupado],['Disponíveis',counts.disponivel],['Reservados',counts.reservado],['Higienização',counts.higienizacao],['Bloqueados',counts.bloqueado],['Ocupação',rate],['Transitórios (não computados)',transitoryTotal]];
 kpiNode.innerHTML=vals.map(([k,v])=>'<div class="tv-kpi"><span>'+k+'</span><strong>'+v+'</strong></div>').join('');
 requestAnimationFrame(fit);
 }catch(e){console.error('Erro ao renderizar Modo TV:',e);sectorsNode.innerHTML='<div style="color:#fff;padding:20px">Falha na exibição dos leitos: '+escapeHtml(e.message||e)+'</div>';last='';}
}
async function exit(){screen.classList.remove('active');toggle.style.display='';clearInterval(timer);timer=null;last='';if(document.fullscreenElement===screen){try{await document.exitFullscreen()}catch(_){}}}
toggle.addEventListener('click',()=>{toggle.style.display='none';screen.classList.add('active');render();timer=setInterval(render,3000)});
screen.querySelector('#hsj-tv-exit').addEventListener('click',exit);
screen.querySelector('#hsj-tv-fullscreen').addEventListener('click',async()=>{try{if(document.fullscreenElement===screen)await document.exitFullscreen();else await screen.requestFullscreen()}catch(e){console.warn('Tela cheia não disponível:',e)}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&screen.classList.contains('active')&&!document.fullscreenElement)exit()});
document.addEventListener('fullscreenchange',()=>{if(screen.classList.contains('active'))requestAnimationFrame(fit)});
window.addEventListener('resize',()=>{if(screen.classList.contains('active'))requestAnimationFrame(fit)});
})();

;
;/* FILE: patch-observacoes-tv-20261026.js */
(()=>{
'use strict';
const frame=document.getElementById('appFrame');
const screen=document.getElementById('hsj-tv-screen');
if(!frame||!screen)return;
const style=document.createElement('style');
style.textContent=`
#hsj-tv-screen .tv-observacoes{grid-column:2;min-width:0;min-height:0;display:flex;flex-direction:column;border:2px solid #536880;border-radius:8px;background:#17263a;padding:9px 12px;gap:6px;overflow:hidden}
#hsj-tv-screen .tv-observacoes-header{display:flex;justify-content:space-between;align-items:center;gap:8px;font-size:clamp(13px,1.15vw,18px);font-weight:800}
#hsj-tv-screen .tv-observacoes textarea{width:100%;flex:1;min-height:38px;resize:none;border:1px solid #526a88;border-radius:6px;background:#0e1b2b;color:#fff;padding:9px 10px;font:500 clamp(12px,1vw,17px)/1.35 system-ui;outline-offset:1px}
#hsj-tv-screen .tv-observacoes-bar{display:flex;justify-content:space-between;align-items:center;gap:8px}
#hsj-tv-screen .tv-observacoes-status{font-size:11px;color:#d0deee;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
#hsj-tv-screen .tv-observacoes button{background:#0f766e;padding:5px 14px}
@media(max-width:650px){#hsj-tv-screen .tv-observacoes{grid-column:1}}
`;
document.head.appendChild(style);
const card=document.createElement('section');
card.className='tv-observacoes';
card.id='hsj-tv-observacoes';
card.innerHTML='<div class="tv-observacoes-header"><span>Observações do Plantão</span><small style="font-size:11px;font-weight:500;color:#cbd5e1">Compartilhadas</small></div><textarea id="hsj-tv-observacoes-texto" maxlength="12000" placeholder="Registre avisos e pendências gerais do NIR. Evite dados sensíveis de pacientes."></textarea><div class="tv-observacoes-bar"><span class="tv-observacoes-status" id="hsj-tv-observacoes-status">Conectando…</span><button type="button" id="hsj-tv-observacoes-salvar">Salvar observações</button></div>';
const input=card.querySelector('textarea'),status=card.querySelector('#hsj-tv-observacoes-status'),button=card.querySelector('button');
let unsubscribe=null,connection=null,remoteText='',changed=false,busy=false,remoteVersion=null;
function setStatus(t){status.textContent=t}
function connect(){
  const w=frame.contentWindow;
  const fm=w?.firebaseModules;
  if(!w?.db||!fm?.doc||!fm?.onSnapshot||!fm?.setDoc)return false;
  if(connection===w)return true;
  if(unsubscribe){unsubscribe();unsubscribe=null}
  connection=w;
  const ref=fm.doc(w.db,'hospital','observacoes_plantao_tv');
  unsubscribe=fm.onSnapshot(ref,snap=>{
    const val=snap.data()||{};
    const texto=String(val.texto||'');
    remoteVersion=val.atualizadoEm||null;
    if(!changed&&!busy){remoteText=texto;input.value=texto;setStatus(val.atualizadoEm?'Atualizado: '+new Date(val.atualizadoEm).toLocaleString('pt-BR'):'Pronto para editar');}
    else if(texto!==remoteText){setStatus('Há uma atualização de outro computador. Revise antes de salvar.');}
  },err=>setStatus('Erro de sincronização: '+(err?.message||'verifique a conexão')));
  return true;
}
input.addEventListener('input',()=>{changed=input.value!==remoteText;setStatus(changed?'Alterações não salvas':'Sem alterações pendentes')});
button.addEventListener('click',async()=>{
 if(busy||!connect())return;
 const w=frame.contentWindow, fm=w.firebaseModules;
 if(!changed){setStatus('Nenhuma alteração pendente');return}
 busy=true;button.disabled=true;setStatus('Salvando…');
 try{
  const ref=fm.doc(w.db,'hospital','observacoes_plantao_tv');
  const texto=input.value;
  // Compare o texto recebido antes de sobrescrever mudanças de outro computador.
  const snap=await fm.getDoc(ref);
  if(snap.metadata?.fromCache)throw Error('Sem confirmação do servidor. Nenhuma gravação efetuada.');
  const atual=String(snap.data()?.texto||'');
  if(atual!==remoteText){setStatus('Conflito: outro computador alterou as observações. Copie seu texto antes de atualizar.');return}
  if(typeof w.hsjSalvarObservacoesTv!=='function')throw Error('Módulo de gravação não carregado. Atualize a página.');
  const resposta=await w.hsjSalvarObservacoesTv(texto,remoteText,w.usuarioAtual?.nome||'Equipe NIR');
  if(!resposta?.ok)throw Error('Banco não confirmou o salvamento.');
  remoteText=texto;remoteVersion=resposta.atualizadoEm;changed=input.value!==texto;
  setStatus('Salvo e sincronizado às '+new Date(resposta.atualizadoEm).toLocaleTimeString('pt-BR'));
 }catch(e){setStatus('Não foi possível salvar: '+(e?.message||e))}
 finally{busy=false;button.disabled=false}
});
function mount(){
 const grid=screen.querySelector('#hsj-tv-sectors');
 if(!grid)return;
 // O modo TV reconstrói os cards dos leitos periodicamente.
 if(card.parentElement!==grid)grid.appendChild(card);
 // 11 setores: a última célula é a área vazia inferior direita.
 // Ajustar a geometria do grid mantendo os leitos intactos.
 const cards=[...grid.querySelectorAll('.tv-sector')];
 if(cards.length===11){
   card.style.gridRow='6';
   grid.style.gridTemplateRows=grid.style.gridTemplateRows;
 }
 connect();
}
const observer=new MutationObserver(()=>{if(screen.classList.contains('active')&&card.parentElement!==screen.querySelector('#hsj-tv-sectors'))mount()});
observer.observe(screen,{childList:true,subtree:true});
frame.addEventListener('load',()=>{if(unsubscribe)unsubscribe();unsubscribe=null;connection=null;setStatus('Reconectando…');});
setInterval(()=>{if(screen.classList.contains('active'))mount()},1300);
mount();
})();
;
;/* FILE: patch-admissao-reserva-provisoria-20261022.js */
(()=>{
 const frame=document.getElementById('appFrame');if(!frame)return;
 function install(){
  let w,d;try{w=frame.contentWindow;d=frame.contentDocument}catch{return}
  if(!w||!d||!w.setoresData)return;
  const form=d.getElementById('box-form-mov');if(!form||d.getElementById('hsj-confirmar-reserva-admissao'))return;
  const btn=d.createElement('button');btn.id='hsj-confirmar-reserva-admissao';btn.type='button';btn.className='btn btn-success';btn.textContent='Confirmar admissão da reserva';
  btn.style.cssText='padding:11px 14px;margin:9px;background:#1565a8;color:white;border-radius:8px;font-weight:bold';
  const info=d.createElement('p');info.style.cssText='font-size:12px;color:#334155;margin:6px 0';info.textContent='Para reservas criadas sem número de atendimento: informe o número definitivo para efetivar a admissão.';
  const actions=form.querySelector('.btn-success')?.parentElement||form;actions.append(btn,info);
  btn.onclick=async()=>{
   const get=id=>String(d.getElementById(id)?.value||'').trim();
   const setor=get('mov-setor'),leito=get('mov-leito'),id=get('mov-atendimento'),nome=get('mov-paciente');
   if(get('mov-acao')!=='Admissão'){w.alert('Selecione Admissão (Ocupa o Leito) antes de confirmar.');return}
   if(!setor||!leito||!nome||!id){w.alert('Selecione uma reserva com paciente, setor, leito e identificador.');return}
   const leitoAtual=w.setoresData.find(s=>s.nome===setor)?.leitos?.find(l=>String(l.n)===leito);
   if(!leitoAtual||leitoAtual.status!=='reservado'||String(leitoAtual.prontuario||'')!==id){w.alert('A reserva exibida não corresponde aos dados do leito. Atualize antes de continuar.');return}
   if(w.usuarioAtual?.perfil==='Visitante'){w.alert('Usuário não autorizado.');return}
   if(typeof w.hsjConfirmarReservaComoAdmissao!=='function'){w.alert('O módulo seguro de admissão não está carregado. Atualize a página.');return}
   if(!/^RESERVA-SEM-PR-/i.test(id)){w.alert('Esta reserva já possui número real de atendimento. Utilize Executar Movimentação Inteligente para admissão.');return}
   const real=w.prompt('Informe o NÚMERO DEFINITIVO DO ATENDIMENTO deste paciente. Não utilize o código RESERVA-SEM-PR.','');
   if(real===null)return;
   const definitivo=String(real).trim();
   if(!definitivo||/^RESERVA-SEM-PR-/i.test(definitivo)){w.alert('Informe um número definitivo válido.');return}
   if(!w.confirm('CONFIRMAR ADMISSÃO NO BANCO?\\nPaciente: '+nome+'\\nSetor/leito: '+setor+' / '+leito+'\\nAtendimento definitivo: '+definitivo+'\\n\\nA reserva será convertida em ocupação.'))return;
   btn.disabled=true;btn.textContent='Confirmando no banco...';
   try{
    const resp=await w.hsjConfirmarReservaComoAdmissao({prontuarioProvisorio:id,prontuarioDefinitivo:definitivo,setor,leito,nome,nascimento:get('mov-nascimento'),sexo:get('mov-sexo'),perfil:get('mov-perfil-vaga'),convenio:get('mov-convenio'),origem:get('mov-origem'),precaucao:get('mov-precaucao'),usuario:w.usuarioAtual?.nome||'usuario'});
    if(!resp?.ok)throw Error('Banco não confirmou a admissão.');
    w.alert('ADMISSÃO CONFIRMADA NO BANCO. Leito '+leito+' agora está ocupado. Atualize o painel para conferir.');
    if(typeof w.carregarDadosDoFirebase==='function')await w.carregarDadosDoFirebase();
   }catch(e){w.alert('ADMISSÃO NÃO CONFIRMADA: '+(e?.message||e)+'\\nNão efetue nova reserva nem libere o leito manualmente.');}
   finally{btn.disabled=false;btn.textContent='Confirmar admissão da reserva'}
  };
 }
 frame.addEventListener('load',()=>setTimeout(install,350));
 const timer=setInterval(install,800);setTimeout(()=>clearInterval(timer),45000);install();
})();
;
;/* FILE: patch-indicadores-obrigatorios-20261027.js */
(()=>{const frame=document.getElementById('appFrame');if(!frame)return;
const TYPES=['Admissão','Alta para casa (melhorada)','Óbito','Alta para o internamento','Alta a pedido','Alta por transferência','Alta com assistência domiciliar','Evasão','Cirurgias suspensas','Alta administrativa por cirurgia suspensa'];
function install(){let w,d;try{w=frame.contentWindow;d=frame.contentDocument}catch{return}if(!w||!d||!w.executarEntradaLeitoAtomica||!w.hsjConfirmarReservaComoAdmissao||!w.executarTransferenciaSeguraV20261009||!w.executarSaidaLeitoAtomica)return;if(w.__hsjIndicadoresObrigatorios20261027)return;w.__hsjIndicadoresObrigatorios20261027=true;
w.hsjEscolherIndicadorMovimentacao=function(contexto){
 return new Promise(resolve=>{
  const overlay=d.createElement('div');overlay.style.cssText='position:fixed;inset:0;z-index:2147483647;background:#0f172ab3;display:flex;align-items:center;justify-content:center;padding:16px';
  const card=d.createElement('section');card.setAttribute('role','dialog');card.setAttribute('aria-modal','true');card.style.cssText='width:min(510px,100%);max-height:90vh;overflow:auto;background:white;color:#182638;border-radius:14px;padding:22px;box-shadow:0 20px 50px #0005;font:15px Arial,sans-serif';
  const h=d.createElement('h2');h.style.cssText='margin:0 0 12px;font-size:20px';h.textContent='Indicadores hospitalares';
  const p=d.createElement('p');p.textContent='Deseja computar esta movimentação nos indicadores?';p.style.margin='8px 0';
  const detail=d.createElement('p');detail.style.cssText='color:#64748b;font-size:12px';detail.textContent=contexto||'Movimentação hospitalar';
  const controls=d.createElement('div');controls.style.cssText='display:flex;gap:12px;margin-top:16px;flex-wrap:wrap';
  const field=d.createElement('div');field.style.cssText='display:none;margin-top:18px;padding:12px;background:#f1f5f9;border-radius:8px';
  const label=d.createElement('label');label.textContent='Selecione o indicador obrigatório';label.style.cssText='display:block;font-weight:700;margin-bottom:8px';
  const select=d.createElement('select');select.style.cssText='width:100%;padding:11px;border:1px solid #94a3b8;border-radius:6px;background:white';select.appendChild(new Option('Selecione uma opção',''));
  TYPES.forEach(t=>select.appendChild(new Option(t,t)));
  const recommended=/admiss|reserva/i.test(contexto||'')?'Admissão':/transfer/i.test(contexto||'')?'Alta por transferência':/óbito|obito/i.test(contexto||'')?'Óbito':/evasão|evasao/i.test(contexto||'')?'Evasão':/pedido/i.test(contexto||'')?'Alta a pedido':/uti.*intern|internamento/i.test(contexto||'')?'Alta para o internamento':'';
  if(recommended)select.value=recommended;
  const confirm=d.createElement('button');confirm.textContent='Confirmar indicador';confirm.style.cssText='background:#1458a3;color:#fff;border:0;padding:11px 15px;border-radius:7px;margin-top:12px;font-weight:700';confirm.onclick=()=>{if(!select.value){select.focus();return}end({contabilizarIndicadores:true,tipoIndicador:select.value})};
  field.append(label,select,confirm);
  function btn(label,color,fn){const b=d.createElement('button');b.textContent=label;b.style.cssText='padding:11px 20px;border-radius:8px;font-weight:700;border:1px solid #cbd5e1;cursor:pointer;background:'+color;b.onclick=fn;controls.appendChild(b)}
  let finished=false;function end(value){if(finished)return;finished=true;overlay.remove();resolve(value)}
  btn('NÃO','#f8fafc',()=>end({contabilizarIndicadores:false,tipoIndicador:null}));
  btn('SIM','#dbeafe',()=>{controls.style.display='none';field.style.display='block';select.focus()});
  btn('Cancelar movimentação','#fff',()=>end(null));
  card.append(h,p,detail,controls,field);overlay.appendChild(card);d.body.appendChild(overlay);
  controls.querySelector('button')?.focus();
 });
};
function wrap(name,condition,context){
 const prior=w[name];if(typeof prior!=='function')return;
 w[name]=async function(args){const a={...(args||{})};if(condition(a)&&!(typeof a.contabilizarIndicadores==='boolean'&&(a.contabilizarIndicadores===false||a.tipoIndicador))){const selection=await w.hsjEscolherIndicadorMovimentacao(context(a));if(!selection)throw new Error('Movimentação cancelada na confirmação de indicadores. Nenhum registro foi solicitado.');Object.assign(a,selection)}return prior.call(this,a)};
}
wrap('executarEntradaLeitoAtomica',a=>a.acao==='Admissão',()=> 'Admissão no setor');
wrap('executarAdmissaoReservaAtomica',()=>true,()=> 'Admissão de reserva');
wrap('hsjConfirmarReservaComoAdmissao',()=>true,()=> 'Conversão de reserva para admissão');
wrap('executarTransferenciaSeguraV20261009',()=>true,()=> 'Transferência interna entre setores');
}
frame.addEventListener('load',()=>setTimeout(install,200));let n=0;const t=setInterval(()=>{install();if(frame.contentWindow?.__hsjIndicadoresObrigatorios20261027||++n>100)clearInterval(t)},250);
})();
;
;/* FILE: patch-resumo-categorias-indicadores-20261027.js */
(()=>{const frame=document.getElementById('appFrame');if(!frame)return;
const types=['Admissão','Alta para casa (melhorada)','Óbito','Alta para o internamento','Alta a pedido','Alta por transferência','Alta com assistência domiciliar','Evasão','Cirurgias suspensas','Alta administrativa por cirurgia suspensa'];
const norm=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
function install(){let w,d;try{w=frame.contentWindow;d=frame.contentDocument}catch{return}if(!w||!d||typeof w.renderizarIndicadores!=='function'||!d.getElementById('indicadores'))return;if(w.__hsjCategoriasIndicadores20261027)return;w.__hsjCategoriasIndicadores20261027=true;
function draw(){
const host=d.getElementById('indicadores');if(!host)return;
let root=d.getElementById('hsj-categorias-confirmadas');
if(!root){root=d.createElement('section');root.id='hsj-categorias-confirmadas';root.style.cssText='margin:16px 0;background:#fff;border:1px solid #cbd5e1;border-radius:12px;padding:15px';const t=d.getElementById('hsj-indicadores-auditaveis');if(t)t.after(root);else host.prepend(root)}
const from=d.getElementById('filtro-data-inicio')?.value||'',to=d.getElementById('filtro-data-fim')?.value||'';
const selected=[...d.querySelectorAll('#checkboxes-setores-container input:checked')].map(x=>x.value);
const general=!selected.length||selected.includes('GERAL');
const counts=new Map(types.map(t=>[t,0]));let no=0,old=0;
for(const m of w.movimentacoesHistorico||[]){
const when=String(m.dataIso||m.dataDesfechoObj||'').slice(0,10);
if(!/^\d{4}-\d{2}-\d{2}$/.test(when)||from&&when<from||to&&when>to)continue;
if(!general&&!selected.some(s=>[m.origem,m.destino,m.setor].some(v=>norm(v).includes(norm(s)))))continue;
if(m.contabilizarIndicadores===false){no++;continue}
if(m.contabilizarIndicadores!==true){old++;continue}
const t=types.find(x=>norm(x)===norm(m.tipoIndicador));
if(t)counts.set(t,counts.get(t)+1);else old++;
}
const heading=d.createElement('h3');heading.textContent='Indicadores por classificação confirmada';heading.style.cssText='font-size:17px;margin:0 0 9px;color:#123f69';
const note=d.createElement('p');note.textContent='Contagem por eventos confirmados, sem estimar categorias em registros antigos. Transferência interna não equivale automaticamente a alta hospitalar.';note.style.cssText='font-size:12px;color:#475569;margin:0 0 12px';
const grid=d.createElement('div');grid.style.cssText='display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:9px';
for(const [name,count] of counts){const cell=d.createElement('div');cell.style.cssText='padding:12px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px';const label=d.createElement('div');label.textContent=name;label.style.cssText='font-size:12px;color:#475569';const val=d.createElement('b');val.textContent=String(count);val.style.cssText='display:block;font-size:23px;color:#16446e;margin-top:4px';cell.append(label,val);grid.appendChild(cell)}
const foot=d.createElement('p');foot.style.cssText='font-size:11px;color:#64748b;margin:12px 0 0';foot.textContent='Movimentações marcadas NÃO: '+no+'. Eventos sem categoria confirmada (histórico legado ou incompleto): '+old+'. Não redistribuídos automaticamente.';
root.replaceChildren(heading,note,grid,foot);
}
const prior=w.renderizarIndicadores;w.renderizarIndicadores=function(){const res=prior.apply(this,arguments);draw();return res};draw();
}
frame.addEventListener('load',()=>setTimeout(install,500));let count=0;const t=setInterval(()=>{install();if(frame.contentWindow?.__hsjCategoriasIndicadores20261027||++count>100)clearInterval(t)},250);
})();
;
;/* FILE: patch-cancelar-solicitacao-transferencia-20261027.js */
// Cancelamento administrativo da SOLICITACAO, sem movimentacao do paciente/leito ou indicador.
(()=>{
 const frame=document.getElementById('appFrame');if(!frame)return;
 let installed=false,timer;
 function init(){
  if(installed)return true;
  let w,d;try{w=frame.contentWindow;d=frame.contentDocument}catch(_){return false}
  const body=d?.getElementById('tabela-transf-ativas');
  if(!w||!body||typeof w.atualizarTabelasTransferencias!=='function'||!w.firebaseModules?.runTransaction||!w.db)return false;
  installed=true;
  let busy=false;
  async function cancelar(t){
   if(busy)return;
   if(w.usuarioAtual?.perfil==='Visitante'){w.alert('Sem permissão para cancelar solicitações.');return}
   const nome=String(t.paciente||'Paciente');
   if(!w.confirm('Cancelar a solicitação de transferência de '+nome+'?\n\nApenas esta solicitação sairá da lista de transferências ativas. O paciente continuará no mesmo leito, sem alta, sem transferência realizada e sem indicador.'))return;
   busy=true;
   try{
    const {doc,runTransaction,getDoc}=w.firebaseModules;
    const ref=doc(w.db,'hospital','dados');
    const id=String(t.dataIso||t.data||''),pr=String(t.atendimento||'');
    await runTransaction(w.db,async tx=>{
     const snap=await tx.get(ref);
     if(!snap.exists())throw Error('Banco central não encontrado.');
     const state=snap.data(),ativas=Array.isArray(state.transferenciasAtivas)?state.transferenciasAtivas:[];
     const ix=ativas.findIndex(item=>String(item.atendimento||'')===pr&&String(item.dataIso||item.data||'')===id&&String(item.paciente||'')===nome);
     if(ix<0)throw Error('Solicitação não está mais ativa ou foi modificada em outro computador. Atualize a lista.');
     // Modifica SOMENTE transferenciasAtivas e metadados de versão. Não altera setoresData,
     // transferenciasFinalizadas, indicadores, movimentacoesHistorico nem cadastro do paciente.
     const novas=ativas.filter((_,i)=>i!==ix);
     // Firestore transactions reject custom-prototype nested objects in update().
     // Submit only a JSON-safe array of active requests. Leave all other fields untouched.
     const payload=w.JSON.parse(JSON.stringify({transferenciasAtivas:novas}));
     tx.update(ref,payload);
    });
    const snap=await getDoc(ref);
    if(!snap.exists()||snap.metadata?.fromCache)throw Error('Cancelamento gravado, mas conferência com o servidor indisponível. Atualize antes de tentar novamente.');
    const remains=(snap.data().transferenciasAtivas||[]).some(item=>String(item.atendimento||'')===pr&&String(item.dataIso||item.data||'')===id&&String(item.paciente||'')===nome);
    if(remains)throw Error('A solicitação ainda consta no banco. Atualize e confira antes de repetir.');
    w.transferenciasAtivas=snap.data().transferenciasAtivas||[];
    w.atualizarTabelasTransferencias();
    w.alert('Solicitação cancelada. Nenhum leito, indicador ou transferência realizada foi alterado.');
   }catch(e){w.alert('Cancelamento não confirmado: '+(e?.message||e))}
   finally{busy=false}
  }
  function decorate(){
   const rows=[...body.querySelectorAll('tr')];
   const list=Array.isArray(w.transferenciasAtivas)?w.transferenciasAtivas:[];
   rows.forEach((tr,i)=>{
    const t=list[i],cell=tr.cells?.[8];
    if(!t||!cell||cell.querySelector('.hsj-cancelar-solicitacao'))return;
    const btn=d.createElement('button');
    btn.type='button';btn.className='hsj-cancelar-solicitacao';
    btn.textContent='Cancelar Solicitação';
    btn.style.cssText='padding:5px 7px;font-size:11px;font-weight:700;border:1px solid #b91c1c;color:#991b1b;background:#fff1f2;border-radius:6px;cursor:pointer;margin-left:5px;vertical-align:middle';
    btn.addEventListener('click',()=>cancelar(t));
    cell.appendChild(btn);
   });
  }
  const original=w.atualizarTabelasTransferencias;
  w.atualizarTabelasTransferencias=function(){const res=original.apply(this,arguments);decorate();return res};
  decorate();
  const observer=new MutationObserver(()=>{const rows=body.querySelectorAll('tr').length,buttons=body.querySelectorAll('.hsj-cancelar-solicitacao').length;if(rows!==buttons)decorate()});
  observer.observe(body,{childList:true,subtree:true});
  return true;
 }
 function begin(){installed=false;if(timer)clearInterval(timer);let count=0;timer=setInterval(()=>{if(init()||++count>120)clearInterval(timer)},250);init()}
 frame.addEventListener('load',begin);begin();
})();
;
;/* FILE: patch-auditoria-integridade-indicadores-20261028.js */
(()=>{
const frame=document.getElementById('appFrame');if(!frame)return;
function install(){
 let w,d;try{w=frame.contentWindow;d=frame.contentDocument}catch{return}
 if(!w||!d||typeof w.renderizarIndicadores!=='function'||!d.getElementById('indicadores')||w.__hsjAuditSafeguards20261028)return;
 w.__hsjAuditSafeguards20261028=true;
 const norm=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase();
 const iso=m=>{const s=m?.dataIso||m?.dataDesfechoObj;if(!s)return '';const dt=new Date(s);return Number.isFinite(dt.getTime())?new Intl.DateTimeFormat('en-CA',{year:'numeric',month:'2-digit',day:'2-digit',timeZone:'America/Araguaina'}).format(dt):''};
 const types=new Set(['admissao','alta para casa (melhorada)','obito','alta para o internamento','alta a pedido','alta por transferencia','alta com assistencia domiciliar','evasao','cirurgias suspensas','alta administrativa por cirurgia suspensa']);
 const start=d.getElementById('filtro-data-inicio'),end=d.getElementById('filtro-data-fim');
 // Replace stale September defaults only when still exactly at the original hard-coded defaults.
 const now=new Date(),currentMonth=new Intl.DateTimeFormat('en-CA',{year:'numeric',month:'2-digit',timeZone:'America/Araguaina'}).format(now).slice(0,7);
 const today=new Intl.DateTimeFormat('en-CA',{year:'numeric',month:'2-digit',day:'2-digit',timeZone:'America/Araguaina'}).format(now);
 if(start?.value==='2026-09-01'&&end?.value==='2026-09-30'){start.value=currentMonth+'-01';end.value=today;}
 function audit(){
  const all=Array.isArray(w.movimentacoesHistorico)?w.movimentacoesHistorico:[];
  const a=start?.value||'',b=end?.value||'';
  const relevant=all.filter(m=>{let t=iso(m);return t&&(!a||t>=a)&&(!b||t<=b)});
  const missingDate=all.filter(m=>!iso(m));
  const excluded=relevant.filter(m=>m.contabilizarIndicadores===false);
  const undecided=relevant.filter(m=>m.contabilizarIndicadores!==true&&m.contabilizarIndicadores!==false);
  const unclassified=relevant.filter(m=>m.contabilizarIndicadores===true&&!types.has(norm(m.tipoIndicador)));
  const counts=new Map();
  relevant.filter(m=>m.contabilizarIndicadores===true&&types.has(norm(m.tipoIndicador))).forEach(m=>{
   const t=norm(m.tipoIndicador);counts.set(t,(counts.get(t)||0)+1);
  });
  let area=d.getElementById('hsj-auditoria-integridade-20261028');
  if(!area){area=d.createElement('section');area.id='hsj-auditoria-integridade-20261028';area.style.cssText='margin:12px 0;padding:15px;background:#fff;border:2px solid #cbd5e1;border-radius:10px;color:#1e293b';const host=d.getElementById('indicadores');const pos=host.querySelector('#kpi-container');if(pos)pos.before(area);else host.prepend(area);}
  const invalid=a&&b&&a>b;
  const bad=invalid||missingDate.length||undecided.length||unclassified.length;
  area.style.borderColor=bad?'#e6a23c':'#22a06b';
  const heading=d.createElement('h3');heading.style.margin='0 0 8px';heading.textContent='Conferência da integridade dos indicadores';
  const status=d.createElement('p');status.style.margin='0 0 10px';status.textContent=invalid?'ERRO: data inicial posterior à final. Corrija o período.':bad?'ATENÇÃO: existem registros que exigem conferência; não considerar os totais legados como indicadores validados.':'Sem inconsistências de classificação identificadas nos eventos consultados. Indicadores de permanência e ocupação histórica ainda exigem censo diário.';
  const info=d.createElement('div');info.style.cssText='display:flex;gap:14px;flex-wrap:wrap;font-size:13px';
  const metrics=[['Eventos com data no período',relevant.length],['Confirmados e classificados',[...counts.values()].reduce((x,y)=>x+y,0)],['Marcados NÃO',excluded.length],['Sem decisão SIM/NÃO',undecided.length],['SIM sem classificação válida',unclassified.length],['Sem data válida no histórico',missingDate.length]];
  for(const [label,value] of metrics){const el=d.createElement('span');el.textContent=label+': '+value;info.appendChild(el)}
  const note=d.createElement('p');note.style.cssText='font-size:12px;margin:10px 0 0;color:#475569';note.textContent='Esta conferência é somente leitura: não altera pacientes, leitos ou histórico. Não transforma ausência de dados em zero. Uma contagem de eventos confirmados não comprova que o histórico esteja completo.';
  area.replaceChildren(heading,status,info,note);
 }
 const before=w.renderizarIndicadores;
 w.renderizarIndicadores=function(...args){try{return before.apply(this,args)}finally{audit()}};
 const selected=d.getElementById('indicadores');if(selected?.classList.contains('active')){try{w.renderizarIndicadores()}catch(e){console.warn('Falha no cálculo legado; conferência disponível',e);audit()}}
}
frame.addEventListener('load',()=>setTimeout(install,600));
let tries=0;const timer=setInterval(()=>{install();if(frame.contentWindow?.__hsjAuditSafeguards20261028||++tries>100)clearInterval(timer)},250);
})();
;