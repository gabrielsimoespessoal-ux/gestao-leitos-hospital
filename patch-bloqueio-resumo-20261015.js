(()=>{
'use strict';
const frame=document.getElementById('appFrame');if(!frame)return;
let initialized=false;
function boot(){
 if(initialized)return;
 let w,d;try{w=frame.contentWindow;d=frame.contentDocument}catch(_){return}
 if(!w||!d||!Array.isArray(w.setoresData)||!d.getElementById('mov-acao')||!d.getElementById('painel'))return;
 initialized=true;
 const form=d.getElementById('box-form-mov'),action=d.getElementById('mov-acao');
 const css=d.createElement('style');css.textContent=`
 #hsj-overview-20261015{margin:12px 0 18px;background:#fff;border:1px solid #cbd5e1;border-radius:12px;padding:16px}
 #hsj-overview-20261015 .kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(125px,1fr));gap:10px;margin:12px 0}
 #hsj-overview-20261015 .kpi{background:#f8fafc;border:1px solid #e2e8f0;border-radius:9px;padding:11px}
 #hsj-overview-20261015 .kpi b{display:block;font-size:24px;color:#0f2747}
 #hsj-overview-20261015 .kpi small{color:#475569;font-weight:600}
 #hsj-overview-20261015 table{width:100%;border-collapse:collapse;font-size:13px}
 #hsj-overview-20261015 th,#hsj-overview-20261015 td{padding:8px;text-align:left;border-bottom:1px solid #e2e8f0}
 #hsj-overview-20261015 .scroll{overflow-x:auto}
 #hsj-fast-block{border:1px solid #ddd6fe;background:#faf5ff;border-radius:9px;padding:14px;margin:12px 0}
 #hsj-fast-block button{background:#7c3aed;color:#fff;border:0;border-radius:8px;padding:11px 16px;cursor:pointer;font-weight:700}
 `;d.head.appendChild(css);
 const overview=d.createElement('section');overview.id='hsj-overview-20261015';overview.setAttribute('aria-label','Resumo geral de ocupação');
 const painel=d.getElementById('painel');painel.appendChild(overview);
 const fmt=n=>Number(n||0).toLocaleString('pt-BR');
 function counts(list){
  const c={total:0,ocupado:0,disponivel:0,reservado:0,bloqueado:0,higienizacao:0};
  (list||[]).forEach(l=>{c.total++;if(Object.prototype.hasOwnProperty.call(c,l.status))c[l.status]++});
  return c;
 }
 function renderOverview(){
  if(!overview.isConnected)return;
  const sectors=Array.isArray(w.setoresData)?w.setoresData:[],all=counts(sectors.flatMap(s=>s.leitos||[]));
  const capacity=all.total-all.bloqueado;
  const pct=capacity?100*all.ocupado/capacity:0;
  const cards=[['Total',all.total],['Ocupados',all.ocupado],['Disponíveis',all.disponivel],['Reservados',all.reservado],['Higienização',all.higienizacao],['Bloqueados',all.bloqueado],['Ocupação',pct.toLocaleString('pt-BR',{maximumFractionDigits:1})+'%']];
  overview.replaceChildren();
  const title=d.createElement('div');title.innerHTML='<strong style="font-size:19px;color:#0f2747">Resumo geral da ocupação hospitalar</strong><div style="font-size:12px;color:#64748b;margin-top:4px">Indicadores calculados a partir do estado compartilhado mais recente recebido neste computador. Ocupação = ocupados ÷ (total − bloqueados).</div>';overview.appendChild(title);
  const grid=d.createElement('div');grid.className='kpis';
  cards.forEach(([label,value])=>{const cell=d.createElement('div');cell.className='kpi';const small=d.createElement('small');small.textContent=label;const num=d.createElement('b');num.textContent=typeof value==='number'?fmt(value):value;cell.append(small,num);grid.appendChild(cell)});overview.appendChild(grid);
  const wrap=d.createElement('div');wrap.className='scroll';const table=d.createElement('table');
  const header=d.createElement('tr');['Setor','Total','Ocupados','Livres','Reservados','Higienização','Bloqueados','Ocupação'].forEach(s=>{const th=d.createElement('th');th.textContent=s;header.appendChild(th)});
  const thead=d.createElement('thead');thead.appendChild(header);table.appendChild(thead);
  const tbody=d.createElement('tbody');
  sectors.forEach(s=>{const c=counts(s.leitos),cap=c.total-c.bloqueado,row=d.createElement('tr');[s.nome,c.total,c.ocupado,c.disponivel,c.reservado,c.higienizacao,c.bloqueado,cap?(100*c.ocupado/cap).toLocaleString('pt-BR',{maximumFractionDigits:1})+'%':'—'].forEach(v=>{const td=d.createElement('td');td.textContent=v;row.appendChild(td)});tbody.appendChild(row)});
  table.appendChild(tbody);wrap.appendChild(table);overview.appendChild(wrap);
 }
 const block=d.createElement('div');block.id='hsj-fast-block';block.style.display='none';
 const message=d.createElement('p');message.textContent='Bloqueio administrativo: não exige prontuário nem informações de paciente. Só é permitido bloquear um leito sem ocupação ou reserva.';message.style.cssText='margin:0 0 10px;color:#5b21b6';
 const button=d.createElement('button');button.type='button';button.textContent='🔒 Confirmar bloqueio do leito';
 block.append(message,button);action.closest('.form-group')?.after(block);
 const nativeButton=[...form.querySelectorAll('button')].find(b=>(b.getAttribute('onclick')||'').includes('executarMovimentacao'));
 const patientInputs=['mov-convenio','mov-atendimento','mov-paciente','mov-nascimento','mov-sexo','mov-precaucao','mov-perfil-vaga','mov-origem','mov-previsao-alta-paciente'];
 const saved=new Map();
 function toggle(){
  const isBlock=action.value==='Bloqueio';block.style.display=isBlock?'block':'none';
  patientInputs.forEach(id=>{const el=d.getElementById(id),group=el?.closest('.form-group');if(!el||!group)return;
   if(isBlock){if(!saved.has(id))saved.set(id,{display:group.style.display,required:el.required});group.style.display='none';el.required=false}
   else if(saved.has(id)){const s=saved.get(id);group.style.display=s.display;el.required=s.required;saved.delete(id)}
  });
  if(nativeButton)nativeButton.style.display=isBlock?'none':'';
 }
 action.addEventListener('change',toggle);
 button.addEventListener('click',async()=>{
  const setor=d.getElementById('mov-setor')?.value,leito=d.getElementById('mov-leito')?.value;
  if(!setor||!leito){w.alert('Escolha o setor e o leito.');return}
  const s=w.setoresData.find(x=>x.nome===setor),l=s?.leitos.find(x=>String(x.n)===String(leito));
  if(!l){w.alert('Leito não encontrado. Atualize o painel.');return}
  if(['ocupado','reservado'].includes(l.status)){w.alert('O leito está ocupado ou reservado. Regularize primeiro a situação do paciente.');return}
  if(l.status==='bloqueado'){w.alert('Este leito já está bloqueado.');return}
  if(w.usuarioAtual?.perfil==='Visitante'){w.alert('Acesso negado.');return}
  if(typeof w.executarStatusLeitoAtomico!=='function'){w.alert('Serviço de bloqueio seguro indisponível. Atualize a página.');return}
  if(!w.confirm('Confirmar bloqueio de '+setor+' — leito '+leito+'?'))return;
  button.disabled=true;button.textContent='Salvando no banco compartilhado...';
  try{
   await w.executarStatusLeitoAtomico({setor,leito,statusDestino:'bloqueado',usuario:w.usuarioAtual?.nome||'Usuário'});
   w.alert('Leito '+leito+' bloqueado e registrado na base compartilhada.');
   const drawer=d.getElementById('hsj-drawer-wrap');if(drawer)drawer.style.display='none';
   renderOverview();
  }catch(e){w.alert('Bloqueio não confirmado: '+(e?.message||e))}
  finally{button.disabled=false;button.textContent='🔒 Confirmar bloqueio do leito'}
 });
 if(typeof w.renderizarPainelLeitos==='function'){
  const previous=w.renderizarPainelLeitos;
  w.renderizarPainelLeitos=function(){const res=previous.apply(this,arguments);setTimeout(renderOverview,0);return res};
 }
 toggle();renderOverview();setInterval(renderOverview,5000);
}
frame.addEventListener('load',()=>{initialized=false;let n=0;const t=setInterval(()=>{boot();if(initialized||++n>80)clearInterval(t)},250)});
boot();
})();