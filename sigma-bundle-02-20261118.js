/* SIGMA: bundle 2/5; ordem original preservada, fontes individuais intactas */
;/* FILE: patch-medicos-digitacao-catalogo-20261013.js */
(()=>{
 const frame=document.getElementById('appFrame');if(!frame)return;
 let timer;
 function init(){
  let w,d;try{w=frame.contentWindow;d=frame.contentDocument}catch(_){return false}
  if(!w||!d||typeof w.hsjAdicionarMedicoCatalogo!=='function'||!d.getElementById('mov-medico'))return false;
  if(d.getElementById('hsj-medico-digitacao'))return true;
  const original=d.getElementById('mov-medico');
  const parent=original.closest('.form-group');if(!parent)return false;
  original.style.display='none';
  const wrap=d.createElement('div');wrap.style.cssText='display:flex;flex-wrap:wrap;gap:8px';
  wrap.innerHTML='<input type="text" id="hsj-medico-digitacao" list="hsj-medicos-sugestoes" placeholder="Digite ou selecione o médico" autocomplete="off" maxlength="120" style="flex:1;min-width:180px;padding:10px;border:1px solid #cbd5e1;border-radius:7px"><datalist id="hsj-medicos-sugestoes"></datalist><button type="button" id="hsj-salvar-medico" class="btn" style="background:#0e7490;color:white;padding:8px 12px">Adicionar médico</button>';
  parent.appendChild(wrap);
  const info=d.createElement('small');info.id='hsj-medicos-msg';info.style.cssText='display:block;margin-top:5px;color:#64748b';
  info.textContent='Digite um nome novo e clique em Adicionar médico. Os nomes salvos ficam disponíveis nas próximas reservas.';parent.appendChild(info);
  const input=d.getElementById('hsj-medico-digitacao'),datalist=d.getElementById('hsj-medicos-sugestoes'),button=d.getElementById('hsj-salvar-medico');
  let remote=[],unsub=null;
  const norm=x=>String(x||'').trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR');
  function fill(){
   const previous=original.value;
   const list=[...new Set([...Array.from(original.options).map(x=>x.value).filter(Boolean),...remote])];
   list.sort((a,b)=>a.localeCompare(b,'pt-BR'));
   datalist.replaceChildren();list.forEach(n=>{const op=d.createElement('option');op.value=n;datalist.appendChild(op)});
   remote.forEach(n=>{if(![...original.options].some(x=>norm(x.value)===norm(n)))original.add(new Option(n,n))});
   if(previous)original.value=previous;
  }
  // Mantém o campo original utilizado pelos fluxos seguros de reserva.
  function sync(){
   const name=input.value.trim().replace(/\s+/g,' ');
   if(!name){original.value='';return}
   let opt=[...original.options].find(x=>norm(x.value)===norm(name));
   if(!opt){opt=new Option(name,name);original.add(opt)}
   original.value=opt.value;
  }
  input.addEventListener('input',sync);
  input.addEventListener('change',sync);
  button.onclick=async()=>{
   const name=input.value.trim().replace(/\s+/g,' ');
   if(name.length<3){w.alert('Informe o nome completo do médico.');return}
   if(w.usuarioAtual?.perfil==='Visitante'){w.alert('Perfil sem permissão para cadastro.');return}
   button.disabled=true;info.textContent='Salvando médico na lista compartilhada...';
   try{
    const result=await w.hsjAdicionarMedicoCatalogo(name);
    if(!result?.ok)throw Error('Cadastro não confirmado.');
    remote=[...remote,name];fill();sync();
    info.textContent='Médico salvo no catálogo compartilhado. Você já pode executar a reserva.';
   }catch(err){info.textContent='Nome não confirmado no banco. Verifique a conexão.';w.alert('Não foi possível salvar o médico: '+(err?.message||err))}
   finally{button.disabled=false}
  };
  // Mantém sugestões atualizadas entre computadores sem tocar nos dados dos pacientes.
  unsub=w.hsjObservarCatalogoMedicos((names,error)=>{
   if(error){info.textContent='Catálogo remoto indisponível: novos nomes não serão compartilhados até corrigir a conexão.';return}
   remote=names||[];fill();
  });
  // Inclui os nomes estáticos anteriores; valida valor digitado também ao abrir uma reserva.
  fill();
  return true;
 }
 function start(){if(timer)clearInterval(timer);let i=0;timer=setInterval(()=>{if(init()||++i>120)clearInterval(timer)},250);init()}
 frame.addEventListener('load',start);start();
})();
;
;/* FILE: patch-efetivar-reserva-internado-20261014.js */
(()=>{
const frame=document.getElementById('appFrame');if(!frame)return;
let timer;
function init(){
 let w,d;try{w=frame.contentWindow;d=frame.contentDocument}catch(_){return false}
 if(!w||!d||!Array.isArray(w.setoresData)||typeof w.executarTransferenciaSeguraV20261009!=='function')return false;
 if(d.__hsjCaptureEfetivarReservaV3)return true;
 d.__hsjCaptureEfetivarReservaV3=true;
 let busy=false;
 d.addEventListener('click',async event=>{
   const button=event.target?.closest?.('button');
   if(!button||!d.getElementById('box-form-mov')?.contains(button))return;
   if(!button.matches('.btn-success')||!String(button.getAttribute('onclick')||'').includes('executarMovimentacaoLeito')&&!button.dataset.hsjMoveAction)return;
   const val=id=>String(d.getElementById(id)?.value||'').trim();
   const action=val('mov-acao'),pr=val('mov-atendimento'),setor=val('mov-setor'),leito=val('mov-leito');
   if(action!=='Admissão'||!pr||!setor||!leito)return;
   const destino=w.setoresData.find(s=>s.nome===setor)?.leitos?.find(l=>String(l.n)===leito);
   const origens=[];w.setoresData.forEach(s=>(s.leitos||[]).forEach(l=>{if(l.status==='ocupado'&&String(l.prontuario||'')===pr)origens.push({s,l})}));
   if(!origens.length)return;
   event.preventDefault();event.stopImmediatePropagation();
   if(busy)return;
   if(!destino||destino.status!=='reservado'||String(destino.prontuario||'')!==pr){
     w.alert('Este paciente ja ocupa outro leito. Selecione Transferencia Interna para outro destino. Nenhuma admissao foi realizada.');return;
   }
   if(origens.length!==1){w.alert('Ha mais de uma ocupacao para este prontuario. Regularize antes de transferir.');return}
   if(w.usuarioAtual?.perfil==='Visitante'){w.alert('Acesso negado.');return}
   const origem=origens[0],nome=origem.l.paciente||val('mov-paciente');
   const msg='EFETIVAR RESERVA COMO TRANSFERENCIA INTERNA?\\n\\nPaciente: '+nome+'\\nOrigem: '+origem.s.nome+' / '+origem.l.n+'\\nDestino: '+setor+' / '+leito+'\\n\\nAo confirmar no banco, o destino ficara ocupado e a origem sera liberada.';
   if(!w.confirm(msg))return;
   busy=true;button.disabled=true;
   try{
     const r=await w.executarTransferenciaSeguraV20261009({pr,setorDestino:setor,leitoDestino:leito,nome,usuario:w.usuarioAtual?.nome||'usuario'});
     if(!r?.ok)throw Error('Banco nao confirmou transferencia.');
     w.alert('TRANSFERENCIA CONFIRMADA NO BANCO. Atualize o painel e confira os dois leitos.');
     if(typeof w.carregarDadosDoFirebase==='function')await w.carregarDadosDoFirebase();
   }catch(e){w.alert('TRANSFERENCIA NAO REALIZADA: '+(e?.message||e)+'\\nNao libere manualmente nenhum leito.');}
   finally{busy=false;button.disabled=false}
 },true);
 // Mantem a chamada inline existente, interceptando apenas a admissao incorreta.
 return true;
}
function start(){if(timer)clearInterval(timer);let attempts=0;timer=setInterval(()=>{if(init()||++attempts>160)clearInterval(timer)},250);init()}
frame.addEventListener('load',start);start();
})();
;
;/* FILE: patch-status-transferencia-20261014.js */
(()=>{
const frame=document.getElementById('appFrame');if(!frame)return;
let timer;
function init(){
 let w,d;try{w=frame.contentWindow;d=frame.contentDocument}catch(_){return false}
 if(!w||!d||typeof w.atualizarTabelasTransferencias!=='function'||typeof w.hsjAtualizarStatusTransferenciaAtomico!=='function')return false;
 if(w.__hsjStatusTransferenciasV1)return true;
 w.__hsjStatusTransferenciasV1=true;
 const estados=['Solicitação Pendente','Vaga Solicitada','Aguardando liberação','Vaga Liberada'];
 const esc=x=>String(x??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
 const renderFinalizadas=()=>{
  const tb=d.getElementById('tabela-transf-finalizadas');if(!tb)return;
  const arr=Array.isArray(w.transferenciasFinalizadas)?w.transferenciasFinalizadas:[];
  tb.innerHTML='';
  if(!arr.length){tb.innerHTML='<tr><td colspan="8" style="text-align:center;color:#64748b">Nenhuma transferência finalizada.</td></tr>';return}
  arr.forEach(t=>{
   const tr=d.createElement('tr');
   const cells=[t.dataFinalizacao?new Date(t.dataFinalizacao).toLocaleString('pt-BR'):t.data||'-',
    t.atendimentoNasc||('Pront: '+(t.atendimento||'-')),t.paciente||'-',t.destino||'-',
    t.perfil||'-',t.statusFinal||'Finalizada / Baixada','DUSV: '+(t.dusv||'-'),'-'];
   cells.forEach((v,i)=>{const td=d.createElement('td');td.textContent=String(v);if(i===5)td.style.cssText='font-weight:600;color:#059669';tr.appendChild(td)});
   tb.appendChild(tr);
  });
 };
 const refresh=()=>{
  renderFinalizadas();
  const tb=d.getElementById('tabela-transf-ativas');if(!tb)return;
  [...tb.rows].forEach((tr,index)=>{
   const item=w.transferenciasAtivas?.[index];if(!item||tr.cells.length<9)return;
   const cell=tr.cells[5];cell.textContent='';
   const sel=d.createElement('select');sel.setAttribute('aria-label','Status da solicitação de vaga');sel.style.cssText='max-width:180px;width:100%;padding:6px;border:1px solid #cbd5e1;border-radius:6px';
   [...new Set([...estados,String(item.status||'')])].filter(Boolean).forEach(s=>{const o=d.createElement('option');o.value=s;o.textContent=s;sel.appendChild(o)});
   sel.value=item.status||'';
   sel.onchange=async()=>{
    if(w.usuarioAtual?.perfil==='Visitante'){w.alert('Sem permissão.');sel.value=item.status;return}
    const novo=sel.value,antigo=item.status;sel.disabled=true;
    try{
     const r=await w.hsjAtualizarStatusTransferenciaAtomico({atendimento:item.atendimento,dataIso:item.dataIso||item.data,status:novo,statusAnterior:antigo,usuario:w.usuarioAtual?.nome||'usuario'});
     if(!r?.ok)throw Error('Alteração não confirmada.');
     const {doc,getDoc}=w.firebaseModules;
     const snap=await getDoc(doc(w.db,'hospital','dados'));
     if(!snap.exists()||snap.metadata?.fromCache)throw Error('Verificação do banco indisponível. Atualize a página.');
     w.transferenciasAtivas=snap.data().transferenciasAtivas||[];
     if(!w.transferenciasAtivas.some(t=>String(t.atendimento)===String(item.atendimento)&&String(t.dataIso||t.data)===String(item.dataIso||item.data)&&t.status===novo))throw Error('Não confirmado no banco. Atualize.');
     w.atualizarTabelasTransferencias();w.alert('Status da vaga atualizado no banco compartilhado.');
    }catch(e){sel.value=antigo;w.alert('Status não atualizado: '+(e?.message||e))}finally{sel.disabled=false}
   };
   cell.appendChild(sel);
  });
 };
 const original=w.atualizarTabelasTransferencias;
 w.atualizarTabelasTransferencias=function(){const result=original.apply(this,arguments);refresh();return result};
 refresh();return true;
}
function start(){if(timer)clearInterval(timer);let count=0;timer=setInterval(()=>{if(init()||++count>120)clearInterval(timer)},250);init()}
frame.addEventListener('load',start);start();
})();
;
;/* FILE: patch-historico-baixas-visivel-20261015.js */
(()=>{
const frame=document.getElementById('appFrame');if(!frame)return;
let boot=null;
function attach(){
 let w,d;try{w=frame.contentWindow;d=frame.contentDocument}catch(_){return false}
 if(!w||!d||!d.getElementById('tabela-transf-finalizadas')||typeof w.atualizarTabelasTransferencias!=='function')return false;
 if(w.__hsjHistoricoBaixasVisivel20261015)return true;
 w.__hsjHistoricoBaixasVisivel20261015=true;
 const esc=x=>String(x??'');
 function render(){
  const tb=d.getElementById('tabela-transf-finalizadas');if(!tb)return;
  const list=Array.isArray(w.transferenciasFinalizadas)?w.transferenciasFinalizadas:[];
  const tabela=tb.closest('table'),container=tabela?.parentElement;
  if(container){container.style.display='block';container.hidden=false;}
  if(tabela){tabela.style.display='table';tabela.hidden=false;}
  const header=[...d.querySelectorAll('#transferencias h3')].find(e=>e.textContent.includes('Transferências Finalizadas'));
  if(header){
   header.textContent='Transferências Finalizadas (Baixadas) — '+list.length+' registro(s)';
   const group=header.parentElement?.parentElement;
   if(group){
    const btns=[...group.querySelectorAll('button')].filter(b=>/ver\s*\/\s*ocultar transferências finalizadas/i.test(b.textContent));
    btns.forEach(b=>{b.style.display='none';b.disabled=true;});
   }
  }
  // Corrige eventuais botões duplicados e não permite que escondam o histórico.
  [...d.querySelectorAll('#transferencias button')].filter(b=>/ver\s*\/\s*ocultar transferências finalizadas/i.test(b.textContent)).forEach(b=>{b.style.display='none';b.disabled=true;});
  tb.replaceChildren();
  if(!list.length){
   const tr=tb.insertRow(),td=tr.insertCell();td.colSpan=8;td.textContent='Nenhuma baixa confirmada no histórico compartilhado.';td.style.cssText='text-align:center;color:#64748b;padding:12px';return;
  }
  list.forEach(t=>{
   const tr=tb.insertRow();
   const dt=t.dataFinalizacao?new Date(t.dataFinalizacao):null;
   const date=dt&&!isNaN(dt.getTime())?dt.toLocaleString('pt-BR'):t.data||'—';
   const values=[date,t.atendimentoNasc||('Pront: '+esc(t.atendimento||'—')),t.paciente||'—',t.destino||'—',t.perfil||'—',t.statusFinal||'Finalizada / Baixada','DUSV: '+(t.dusv||'—'),'—'];
   values.forEach((value,i)=>{const cell=tr.insertCell();cell.textContent=esc(value);if(i===5)cell.style.cssText='font-weight:600;color:#059669';});
  });
 }
 const original=w.atualizarTabelasTransferencias;
 w.atualizarTabelasTransferencias=function(){const result=original.apply(this,arguments);render();return result};
 render();
 // A sincronização original do Firebase não repinta a tabela de baixadas.
 // Atualizar apenas a interface, sem escrever nem regravar dados de pacientes.
 w.__hsjHistoricoVisualTimer=setInterval(render,1500);
 return true;
}
function start(){if(boot)clearInterval(boot);let n=0;boot=setInterval(()=>{if(attach()||++n>120)clearInterval(boot)},250);attach()}
frame.addEventListener('load',start);start();
})();
;
;/* FILE: patch-bloqueio-resumo-20261015.js */
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
 const painel=d.getElementById('painel');
 // Remove painéis-resumo duplicados criados por inicializações concorrentes da interface.
 painel.querySelectorAll('#hsj-overview-20261015').forEach(existing=>existing.remove());
 painel.appendChild(overview);
 const fmt=n=>Number(n||0).toLocaleString('pt-BR');
 function counts(list){
  const c={total:0,ocupado:0,disponivel:0,reservado:0,bloqueado:0,higienizacao:0};
  (list||[]).forEach(l=>{c.total++;if(Object.prototype.hasOwnProperty.call(c,l.status))c[l.status]++});
  return c;
 }
 function renderOverview(){
  if(!overview.isConnected)return;
  const sectors=Array.isArray(w.setoresData)?w.setoresData:[];
  const isTransitory=sector=>{
   const name=String(sector.nome||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().trim();
   return sector.virtual===true||name.includes('ESPERA VIRTUAL')||name.includes('SALAS OPERATORIAS')||name==='SRPA'||name==='URGENCIA PARTICULAR';
  };
  const effective=sectors.filter(s=>!isTransitory(s));
  const transitory=sectors.filter(isTransitory);
  const all=counts(effective.flatMap(s=>s.leitos||[]));
  const transient=counts(transitory.flatMap(s=>s.leitos||[]));
  const capacity=all.total-all.bloqueado;
  const pct=capacity?100*all.ocupado/capacity:0;
  const cards=[['Total',all.total],['Ocupados',all.ocupado],['Disponíveis',all.disponivel],['Reservados',all.reservado],['Higienização',all.higienizacao],['Bloqueados',all.bloqueado],['Ocupação',pct.toLocaleString('pt-BR',{maximumFractionDigits:1})+'%']];
  overview.replaceChildren();
  const title=d.createElement('div');title.innerHTML='<strong style="font-size:19px;color:#0f2747">Resumo geral da ocupação hospitalar — leitos efetivos</strong><div style="font-size:12px;color:#64748b;margin-top:4px">Somente leitos efetivos de internação. Ocupação = ocupados ÷ (total efetivo − bloqueados efetivos). Excluídos do cálculo: SRPA, salas operatórias, espera virtual e os 6 leitos da Urgência Particular.</div>';overview.appendChild(title);
  const grid=d.createElement('div');grid.className='kpis';
  cards.forEach(([label,value])=>{const cell=d.createElement('div');cell.className='kpi';const small=d.createElement('small');small.textContent=label;const num=d.createElement('b');num.textContent=typeof value==='number'?fmt(value):value;cell.append(small,num);grid.appendChild(cell)});overview.appendChild(grid);
  const wrap=d.createElement('div');wrap.className='scroll';const table=d.createElement('table');
  const header=d.createElement('tr');['Setor','Total','Ocupados','Livres','Reservados','Higienização','Bloqueados','Ocupação'].forEach(s=>{const th=d.createElement('th');th.textContent=s;header.appendChild(th)});
  const thead=d.createElement('thead');thead.appendChild(header);table.appendChild(thead);
  const tbody=d.createElement('tbody');
  effective.forEach(s=>{const c=counts(s.leitos),cap=c.total-c.bloqueado,row=d.createElement('tr');[s.nome,c.total,c.ocupado,c.disponivel,c.reservado,c.higienizacao,c.bloqueado,cap?(100*c.ocupado/cap).toLocaleString('pt-BR',{maximumFractionDigits:1})+'%':'—'].forEach(v=>{const td=d.createElement('td');td.textContent=v;row.appendChild(td)});tbody.appendChild(row)});
  table.appendChild(tbody);wrap.appendChild(table);overview.appendChild(wrap);
  if(transitory.length){
   const note=d.createElement('details');note.style.cssText='margin-top:10px;padding:9px 12px;background:#f8fafc;border:1px solid #dbe5ef;border-radius:8px;font-size:12px;color:#475569';
   const label=d.createElement('summary');label.style.cursor='pointer';label.textContent='Áreas transitórias (fora da ocupação): '+transient.total+' posições · '+transient.ocupado+' em uso';note.appendChild(label);
   const area=d.createElement('div');area.style.marginTop='7px';
   area.textContent=transitory.map(s=>s.nome+': '+(s.leitos||[]).length+' posições').join(' · ');
   note.appendChild(area);overview.appendChild(note);
  }
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
;
;/* FILE: patch-editar-observacoes-transferencias-20261015.js */
(()=>{
 const frame=document.getElementById('appFrame');if(!frame)return;
 let activated=false;
 function init(){
  if(activated)return;
  let w,d;try{w=frame.contentWindow;d=frame.contentDocument}catch(e){return}
  if(!w||!d||!d.getElementById('tabela-transf-ativas')||typeof w.atualizarTabelasTransferencias!=='function'||typeof w.hsjSalvarObservacoesTransferenciaAtomico!=='function')return;
  activated=true;
  const body=d.getElementById('tabela-transf-ativas');
  function decorate(){
   const list=Array.isArray(w.transferenciasAtivas)?w.transferenciasAtivas:[];
   [...body.querySelectorAll('tr')].forEach((tr,i)=>{
    const t=list[i],cell=tr.cells?.[7];if(!t||!cell||cell.querySelector('.hsj-edit-observacoes'))return;
    const btn=d.createElement('button');btn.type='button';btn.className='hsj-edit-observacoes';
    btn.textContent='✎ Editar observações';btn.style.cssText='display:block;margin-top:7px;padding:5px 9px;border:1px solid #0e7490;background:#ecfeff;color:#155e75;border-radius:6px;cursor:pointer;font-weight:700;font-size:12px';
    btn.onclick=()=>openEditor(t);cell.appendChild(btn);
   });
  }
  function openEditor(item){
   if(w.usuarioAtual?.perfil==='Visitante'){w.alert('Sem permissão para editar observações.');return}
   const old=d.getElementById('hsj-obs-editor-overlay');if(old)old.remove();
   const overlay=d.createElement('div');overlay.id='hsj-obs-editor-overlay';overlay.style.cssText='position:fixed;inset:0;background:#0f172a99;z-index:999999;display:flex;align-items:center;justify-content:center;padding:16px';
   const box=d.createElement('section');box.style.cssText='width:min(640px,100%);max-height:90vh;overflow:auto;background:white;padding:22px;border-radius:12px;box-shadow:0 15px 35px #0003';
   const h=d.createElement('h3');h.textContent='Editar observações da transferência';h.style.margin='0 0 10px';
   const info=d.createElement('p');info.textContent=(item.paciente||'Paciente')+' — Prontuário '+item.atendimento;info.style.cssText='font-size:14px;color:#475569';
   const help=d.createElement('p');help.textContent='Acrescente ou corrija informações. As observações anteriores permanecerão no campo até você alterá-las. Salvar não altera o status nem a localização do paciente.';help.style.cssText='font-size:13px;color:#475569';
   const area=d.createElement('textarea');area.value=String(item.pendencias||'');area.rows=9;area.maxLength=12000;area.style.cssText='width:100%;box-sizing:border-box;padding:12px;border:1px solid #94a3b8;border-radius:8px;font:14px Arial;resize:vertical';area.setAttribute('aria-label','Observações da transferência');
   const footer=d.createElement('div');footer.style.cssText='display:flex;justify-content:flex-end;gap:10px;margin-top:14px;flex-wrap:wrap';
   const cancel=d.createElement('button');cancel.type='button';cancel.textContent='Cancelar';cancel.style.cssText='padding:10px 16px;border:1px solid #cbd5e1;border-radius:7px;background:#fff;cursor:pointer';
   const save=d.createElement('button');save.type='button';save.textContent='Salvar observações';save.style.cssText='padding:10px 16px;border:0;border-radius:7px;background:#047857;color:white;font-weight:700;cursor:pointer';
   cancel.onclick=()=>overlay.remove();overlay.onclick=e=>{if(e.target===overlay)overlay.remove()};
   save.onclick=async()=>{
    save.disabled=true;save.textContent='Salvando...';
    try{
     await w.hsjSalvarObservacoesTransferenciaAtomico({atendimento:item.atendimento,dataIso:item.dataIso||item.data,anterior:item.pendencias||'',observacoes:area.value,usuario:w.usuarioAtual?.nome||'Usuário'});
     overlay.remove();w.alert('Observações salvas no banco compartilhado.');
    }catch(e){w.alert('Não foi possível salvar as observações: '+(e?.message||e))}
    finally{save.disabled=false;save.textContent='Salvar observações'}
   };
   footer.append(cancel,save);box.append(h,info,help,area,footer);overlay.appendChild(box);d.body.appendChild(overlay);area.focus();
  }
  const previous=w.atualizarTabelasTransferencias;
  w.atualizarTabelasTransferencias=function(){const result=previous.apply(this,arguments);decorate();return result};
  decorate();
  // Restaura o botão após atualizações e sincronização com outros computadores.
  let last='';
  setInterval(()=>{if(!d.getElementById('tabela-transf-ativas'))return;const count=body.querySelectorAll('tr').length;const buttons=body.querySelectorAll('.hsj-edit-observacoes').length;if(count!==buttons)decorate()},1300);
 }
 frame.addEventListener('load',()=>{activated=false;let n=0;const t=setInterval(()=>{init();if(activated||++n>120)clearInterval(t)},250)});
 init();
})();
;
;/* FILE: patch-repaginacao-pacientes-internos-20261016.js */
(()=>{
const frame=document.getElementById('appFrame');if(!frame)return;
let started=false;
function init(){
 if(started)return;
 let w,d;try{w=frame.contentWindow;d=frame.contentDocument}catch(_){return}
 if(!w||!d||!d.getElementById('tabela-pacientes-internos')||typeof w.atualizarTabelaPacientesInternos!=='function')return;
 started=true;
 const table=d.getElementById('tabela-pacientes-internos').closest('table'),tbody=d.getElementById('tabela-pacientes-internos');
 if(!table)return;
 const section=tbody.closest('.tab-content')||table.parentElement;
 const header=section.querySelector('.page-header');
 const css=d.createElement('style');css.textContent=`
 #hsj-internos-toolbar{margin:14px 0 18px;background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:17px 18px;box-shadow:0 4px 15px #1a35550a}
 #hsj-internos-summary{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:14px}
 .hsj-interno-counter{background:#f1f6fb;padding:8px 13px;border-radius:9px;font-size:12px;color:#52657b}
 .hsj-interno-counter b{font-size:19px;color:#124d79;margin-right:5px}
 #hsj-internos-controls{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
 #hsj-internos-controls input,#hsj-internos-controls select{font:inherit;border:1px solid #d4deea;border-radius:9px;padding:11px 12px;background:#fff;min-height:43px;box-sizing:border-box}
 #hsj-internos-controls input{flex:2;min-width:210px}
 #hsj-internos-controls select{flex:1;min-width:160px}
 #hsj-internos-controls button{border:1px solid #d3dfea;background:#f8fafc;padding:10px 14px;border-radius:9px;cursor:pointer;font-weight:600;color:#245176}
 #hsj-internos-controls button:hover{background:#edf4fa}
 #internos .table-container, #pacientes-internos .table-container{border:1px solid #e2e8f0;border-radius:13px;overflow:auto;background:white}
 #tabela-pacientes-internos{font-size:13px}
 #tabela-pacientes-internos tr{background:white!important;transition:background .15s}
 #tabela-pacientes-internos tr:nth-child(even){background:#fafcfe!important}
 #tabela-pacientes-internos tr:hover{background:#f1f7fc!important}
 #tabela-pacientes-internos td{padding:15px 13px!important;border-bottom:1px solid #e6edf4!important;vertical-align:middle;line-height:1.45}
 #tabela-pacientes-internos td:nth-child(2) a{font-size:14px;font-weight:700!important;text-decoration:none!important;color:#075a92!important}
 #tabela-pacientes-internos td:nth-child(2) a:hover{text-decoration:underline!important}
 #tabela-pacientes-internos td:nth-child(1){color:#55687c;font-variant-numeric:tabular-nums}
 #tabela-pacientes-internos td:nth-child(4) span{display:inline-block;padding:5px 9px;border-radius:15px;background:#e4f5ee;color:#176044!important;font-size:11px;text-transform:capitalize}
 #tabela-pacientes-internos td:nth-child(5){color:#50657b;font-size:12px}
 #tabela-pacientes-internos .hsj-bed-action{border:0!important;border-radius:8px!important;padding:8px 11px!important;white-space:nowrap}
 #hsj-interno-empty{padding:18px;text-align:center;color:#63748b;display:none}
 @media(max-width:750px){#hsj-internos-toolbar{padding:12px}#hsj-internos-controls input,#hsj-internos-controls select{flex:1 1 100%;min-width:0}#tabela-pacientes-internos td{padding:11px 8px!important}}
 `;d.head.appendChild(css);
 const toolbar=d.createElement('div');toolbar.id='hsj-internos-toolbar';
 toolbar.innerHTML='<div id="hsj-internos-summary"><span class="hsj-interno-counter"><b id="hsj-i-total">—</b> Pacientes listados</span><span class="hsj-interno-counter"><b id="hsj-i-ocupados">—</b> Ocupados</span><span class="hsj-interno-counter"><b id="hsj-i-reservados">—</b> Reservados</span></div><div id="hsj-internos-controls"><input type="search" id="hsj-i-search" placeholder="🔎 Buscar paciente ou prontuário" aria-label="Buscar paciente ou prontuário"><select id="hsj-i-setor" aria-label="Filtrar setor"><option value="">Todos os setores</option></select><button type="button" id="hsj-i-reset">Limpar filtros</button></div>';
 const container=table.closest('.table-container')||table.parentElement;
 container.before(toolbar);
 const empty=d.createElement('div');empty.id='hsj-interno-empty';empty.textContent='Nenhum paciente corresponde aos filtros selecionados.';container.after(empty);
 const search=d.getElementById('hsj-i-search'),sector=d.getElementById('hsj-i-setor');
 const norm=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
 let pending=false;
 function refresh(){
  pending=false;
  const rows=[...tbody.querySelectorAll('tr')].filter(tr=>tr.cells.length>=5);
  const sectors=[...new Set(rows.map(tr=>tr.cells[2]?.textContent?.replace(/\s*\(Leito.*$/i,'').trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'pt-BR'));
  const selected=sector.value;
  sector.innerHTML='<option value="">Todos os setores</option>';
  sectors.forEach(s=>{const opt=d.createElement('option');opt.value=s;opt.textContent=s;sector.appendChild(opt)});
  if(sectors.includes(selected))sector.value=selected;
  const q=norm(search.value),s=sector.value;let visible=0,occupied=0,reserved=0;
  rows.forEach(tr=>{
   const cells=tr.cells;
   const sectorText=(cells[2]?.textContent||'').replace(/\s*\(Leito.*$/i,'').trim();
   const match=(!q||norm((cells[0]?.textContent||'')+' '+(cells[1]?.textContent||'')).includes(q))&&(!s||s===sectorText);
   tr.style.display=match?'':'none';
   if(match){visible++;const status=norm(cells[3]?.textContent);if(status.includes('ocupado'))occupied++;if(status.includes('reservado'))reserved++}
  });
  d.getElementById('hsj-i-total').textContent=visible;
  d.getElementById('hsj-i-ocupados').textContent=occupied;
  d.getElementById('hsj-i-reservados').textContent=reserved;
  empty.style.display=rows.length&&!visible?'block':'none';
 }
 const later=()=>{if(pending)return;pending=true;setTimeout(refresh,80)};
 new MutationObserver(later).observe(tbody,{childList:true,subtree:false});
 search.addEventListener('input',refresh);sector.addEventListener('change',refresh);
 d.getElementById('hsj-i-reset').addEventListener('click',()=>{search.value='';sector.value='';refresh()});
 refresh();
}
frame.addEventListener('load',()=>{started=false;setTimeout(init,150)});
if(frame.contentDocument?.readyState==='complete')init();
else setTimeout(init,600);
})();
;
;/* FILE: patch-painel-leitos-compacto-mobile-20261016.js */
(()=>{
const frame=document.getElementById('appFrame');if(!frame)return;
let active=false;
function boot(){
 if(active)return;
 let d,w;try{d=frame.contentDocument;w=frame.contentWindow}catch(e){return}
 if(!d||!w||!d.getElementById('painel-setores-detalhado'))return;
 active=true;
 const meta=d.querySelector('meta[name="viewport"]');if(meta)meta.content='width=device-width, initial-scale=1, viewport-fit=cover';
 const style=d.createElement('style');style.id='hsj-mobile-compact-panel-css';
 style.textContent=`
 #painel .page-header{margin-bottom:12px!important;gap:8px;align-items:center}
 #painel .page-header h2{font-size:clamp(18px,2.2vw,23px)!important;margin:0 0 3px!important}
 #painel .page-header p{font-size:12px!important}
 #hsj-leitos-filtros-compactos{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:0 0 12px;padding:10px;background:#fff;border:1px solid #dce6ef;border-radius:11px}
 #hsj-leitos-filtros-compactos input,#hsj-leitos-filtros-compactos select{border:1px solid #cfdae5;background:white;border-radius:9px;padding:10px 12px;min-height:42px;font:inherit;font-size:13px;max-width:100%}
 #hsj-leitos-filtros-compactos input{flex:2;min-width:150px}
 #hsj-leitos-filtros-compactos select{flex:1;min-width:180px}
 #hsj-leitos-filtros-compactos button{border:1px solid #d3deea;border-radius:8px;background:#f4f8fc;min-height:42px;padding:9px 14px;font-weight:600;color:#19446d;cursor:pointer}
 #painel-setores-detalhado{display:grid!important;grid-template-columns:repeat(auto-fit,minmax(min(100%,340px),1fr));gap:12px!important;align-items:start}
 #painel-setores-detalhado .sector-box{width:auto!important;min-width:0!important;margin:0!important;padding:13px!important;background:#fff;border:1px solid #dbe5ef;border-radius:12px;box-shadow:0 3px 12px #17324a0a}
 #painel-setores-detalhado .sector-title-row{gap:8px;margin-bottom:10px!important;align-items:start}
 #painel-setores-detalhado .sector-title-row h3{font-size:15px!important;margin:0 0 3px!important;line-height:1.25}
 #painel-setores-detalhado .sector-title-row p{font-size:11px!important;margin:0!important}
 #painel-setores-detalhado .ocup-badge{font-size:11px!important;padding:5px 8px!important;white-space:nowrap}
 #painel-setores-detalhado .leitos-grid{display:grid!important;grid-template-columns:repeat(auto-fill,minmax(50px,1fr))!important;gap:7px!important;margin:10px 0!important}
 #painel-setores-detalhado .leito-pill{box-sizing:border-box!important;min-width:0!important;width:100%!important;height:45px!important;min-height:45px!important;padding:0 4px!important;margin:0!important;border-radius:9px!important;font-size:13px!important;display:flex!important;align-items:center!important;justify-content:center!important;cursor:pointer;touch-action:manipulation}
 #painel-setores-detalhado .leito-pill:focus-visible{outline:3px solid #2563eb;outline-offset:2px}
 #painel-setores-detalhado .sector-summary{display:flex!important;flex-wrap:wrap!important;gap:6px 12px!important;margin-top:10px!important;padding-top:8px!important;border-top:1px solid #e7edf5!important;font-size:10px!important;line-height:1.3}
 #controles-bloqueio-painel-v1{padding:10px 12px!important;border-radius:10px!important;margin-bottom:12px!important;gap:8px!important}
 #controles-bloqueio-painel-v1 span,#controles-bloqueio-painel-v1 strong{font-size:12px!important}
 #hsj-overview-20261015{margin-top:18px!important}
 @media(max-width:720px){
 html,body{max-width:100%;overflow-x:hidden!important}
 .container,.main-content,.content-wrapper{max-width:100%!important;min-width:0!important}
 .subnav{display:flex!important;flex-wrap:nowrap!important;overflow-x:auto!important;overscroll-behavior-x:contain;gap:5px!important;-webkit-overflow-scrolling:touch;scrollbar-width:thin}
 .subnav .nav-item{white-space:nowrap!important;flex:none!important;padding:11px 13px!important}
 #painel{padding-left:8px!important;padding-right:8px!important;max-width:100%!important}
 #painel .page-header{flex-wrap:wrap!important}
 #painel .page-header .btn{font-size:12px!important;padding:9px 11px!important}
 #hsj-leitos-filtros-compactos{padding:9px!important}
 #hsj-leitos-filtros-compactos input,#hsj-leitos-filtros-compactos select{flex:1 1 100%;min-width:0;width:100%}
 #painel-setores-detalhado{grid-template-columns:repeat(auto-fit,minmax(min(100%,280px),1fr))!important;gap:10px!important}
 #painel-setores-detalhado .sector-box{padding:12px!important}
 #painel-setores-detalhado .leitos-grid{grid-template-columns:repeat(auto-fill,minmax(48px,1fr))!important;gap:7px!important}
 #painel-setores-detalhado .leito-pill{min-height:46px!important;height:46px!important}
 #hsj-overview-20261015{padding:12px!important}
 #hsj-overview-20261015 .kpis{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:7px!important}
 #hsj-overview-20261015 .kpi{padding:9px!important;min-width:0!important}
 #hsj-overview-20261015 .kpi b{font-size:21px!important}
 #hsj-drawer,#hsj-internal-move>section{max-width:100vw!important}
 }
 @media(max-width:390px){#painel-setores-detalhado{grid-template-columns:minmax(0,1fr)!important}}
 `;
 d.head.appendChild(style);
 const painel=d.getElementById('painel'),grid=d.getElementById('painel-setores-detalhado');
 const controls=d.createElement('div');controls.id='hsj-leitos-filtros-compactos';
 controls.innerHTML='<input id="hsj-leitos-pesquisa" type="search" name="sigma_consulta_setor_leito" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Buscar setor ou leito" aria-label="Buscar setor ou leito"><select id="hsj-leitos-setor" aria-label="Selecionar setor"><option value="">Todos os setores</option></select><button type="button" id="hsj-leitos-limpar">Limpar</button>';
 grid.before(controls);
 const input=d.getElementById('hsj-leitos-pesquisa'),select=d.getElementById('hsj-leitos-setor');
 // Impede preenchimento indevido por gerenciadores de senhas ou pelo login.
 input.value='';input.defaultValue='';
 input.setAttribute('autocomplete','off');
 const clearUnexpected=()=>{
   if(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim())){
     input.value='';select.value='';refresh();
   }
 };
 d.addEventListener('focusin',event=>{if(event.target===input)clearUnexpected()});
 let scheduled=false;
 const norm=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
 function refresh(){
  scheduled=false;
  const cards=[...grid.querySelectorAll('.sector-box')];
  const options=cards.map(c=>c.querySelector('.sector-title-row h3')?.textContent?.trim()).filter(Boolean);
  const selected=select.value;select.innerHTML='<option value="">Todos os setores</option>';
  [...new Set(options)].sort((a,b)=>a.localeCompare(b,'pt-BR')).forEach(x=>{const opt=d.createElement('option');opt.value=x;opt.textContent=x;select.appendChild(opt)});
  if(options.includes(selected))select.value=selected;
  if(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim())) input.value='';
  const query=norm(input.value),sector=select.value;
  cards.forEach(c=>{
   const name=c.querySelector('.sector-title-row h3')?.textContent?.trim()||'';
   const beds=[...c.querySelectorAll('.leito-pill')];
   const byName=norm(name).includes(query);
   let visible=0;
   beds.forEach(b=>{
    const match=!query||byName||norm(b.textContent).includes(query);
    if(match)b.style.removeProperty('display');else b.style.setProperty('display','none','important');
    if(match)visible++;
   });
   c.style.display=(!sector||sector===name)&&(!query||byName||visible>0)?'':'none';
  });
 }
 const queue=()=>{if(scheduled)return;scheduled=true;setTimeout(refresh,80)};
 new MutationObserver(queue).observe(grid,{childList:true});
 input.addEventListener('input',refresh);select.addEventListener('change',refresh);
 // Quando o painel for reaberto, a pesquisa transitória não deve ocultar os leitos.
 d.querySelectorAll('nav.subnav .nav-item').forEach(item=>item.addEventListener('click',()=>{
   w.setTimeout(()=>{
     if(!d.getElementById('painel')?.classList.contains('active'))return;
     input.value='';select.value='';refresh();
   },50);
 }));
 w.setTimeout(()=>{clearUnexpected();refresh()},700);
 d.getElementById('hsj-leitos-limpar').onclick=()=>{input.value='';select.value='';refresh()};
 refresh();
}
frame.addEventListener('load',()=>{active=false;setTimeout(boot,220)});
if(frame.contentDocument?.readyState==='complete')boot();else setTimeout(boot,700);
})();
;
;/* FILE: patch-reservas-pediatria-isolamento-20261016.js */
(()=>{
const frame=document.getElementById('appFrame');if(!frame)return;
let ready=false;
function init(){
 if(ready)return;let d,w;
 try{d=frame.contentDocument;w=frame.contentWindow}catch(e){return}
 if(!d||!w||!Array.isArray(w.setoresData)||!d.getElementById('painel-setores-detalhado'))return;
 ready=true;
 const css=d.createElement('style');
 css.textContent=`
 #painel-setores-detalhado .leito-pill.hsj-reserva-masculina{background:#dbeafe!important;border:2px solid #2563eb!important;color:#153e86!important}
 #painel-setores-detalhado .leito-pill.hsj-reserva-feminina{background:#fce7f3!important;border:2px solid #db2777!important;color:#831843!important}
 #painel-setores-detalhado .leito-pill.hsj-pediatria{box-shadow:inset 0 0 0 2px #b45309!important}
 #painel-setores-detalhado .leito-pill.hsj-isolamento{outline:3px solid #dc2626!important;outline-offset:1px!important}
 #painel-setores-detalhado .leito-pill.hsj-isolamento.hsj-pediatria{outline:3px solid #dc2626!important}
 #painel-setores-detalhado .leito-pill .hsj-leito-mini{position:absolute;inset:0;display:block;transform:none;pointer-events:none} #painel-setores-detalhado .leito-pill .hsj-leito-mini .hsj-tag{position:absolute;top:-6px;right:-3px} #painel-setores-detalhado .leito-pill .hsj-leito-mini .hsj-tag.iso{right:auto;left:-5px}
 #painel-setores-detalhado .leito-pill{position:relative!important;overflow:visible!important}
 #painel-setores-detalhado .leito-pill .hsj-tag{font-size:9px;line-height:1;border-radius:4px;padding:3px 3px;font-weight:800;background:#f59e0b;color:#3f2205;box-shadow:0 1px 3px #0002}
 #painel-setores-detalhado .leito-pill .hsj-tag.iso{background:#b91c1c;color:white}
 #hsj-legenda-identificacao{background:#fff;border:1px solid #dbe5ef;border-radius:10px;padding:10px 12px;display:flex;gap:8px 14px;align-items:center;flex-wrap:wrap;margin-bottom:12px;font-size:12px;color:#31465b}
 #hsj-legenda-identificacao span{display:inline-flex;gap:6px;align-items:center}
 #hsj-legenda-identificacao i{width:13px;height:13px;display:inline-block;border-radius:3px;border:1px solid #94a3b8}
 #hsj-legenda-identificacao .male{background:#dbeafe;border-color:#2563eb}
 #hsj-legenda-identificacao .female{background:#fce7f3;border-color:#db2777}
 #hsj-legenda-identificacao .ped{background:#fef3c7;border:2px solid #b45309}
 #hsj-legenda-identificacao .iso{background:#fee2e2;border:2px solid #dc2626}
 @media(max-width:720px){#hsj-legenda-identificacao{font-size:11px;gap:8px}#painel-setores-detalhado .leito-pill .hsj-tag{font-size:8px}}
 `;d.head.appendChild(css);
 const grid=d.getElementById('painel-setores-detalhado');
 const legend=d.createElement('div');legend.id='hsj-legenda-identificacao';
 legend.innerHTML='<strong>Identificação rápida:</strong><span><i class="male"></i> Reserva masculina</span><span><i class="female"></i> Reserva feminina</span><span><i class="ped"></i> P = Pediatria</span><span><i class="iso"></i> ISO = Isolamento</span>';
 grid.before(legend);
 const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
 let queued=false;
 function annotate(){
  queued=false;
  const sectors=Array.isArray(w.setoresData)?w.setoresData:[];
  const base=w.basePacientesCadastrados||{};
  const cards=[...grid.querySelectorAll('.sector-box')];
  sectors.forEach(sector=>{
   const card=cards.find(c=>norm(c.querySelector('.sector-title-row h3')?.textContent)===norm(sector.nome));
   if(!card)return;
   const pills=[...card.querySelectorAll('.leito-pill')];
   (sector.leitos||[]).forEach(bed=>{
    const pill=pills.find(p=>String(p.firstChild?.textContent||'').trim()===String(bed.n));
    if(!pill)return;
    pill.classList.remove('hsj-reserva-masculina','hsj-reserva-feminina','hsj-pediatria','hsj-isolamento');
    pill.querySelector('.hsj-leito-mini')?.remove();
    const data=base[bed.prontuario]||{};
    const sexo=norm(data.sexo||bed.sexo);
    if(bed.status==='reservado'){
     if(sexo.startsWith('mascul'))pill.classList.add('hsj-reserva-masculina');
     if(sexo.startsWith('feminin'))pill.classList.add('hsj-reserva-feminina');
    }
    const pediatric=/pediatr|infantil/.test(norm(sector.nome)+' '+norm(sector.tipo)+' '+norm(data.perfil));
    const precaucao=norm(data.precaucao||bed.precaucao);
    const isolated=!!precaucao&&!['nenhuma','nenhuma (padrao)','padrao','não','nao'].includes(precaucao)&&/isolamento|precaucao|contato|goticulas|aeross/.test(precaucao);
    if(pediatric)pill.classList.add('hsj-pediatria');
    if(isolated)pill.classList.add('hsj-isolamento');
    if(pediatric||isolated){
     const badges=d.createElement('span');badges.className='hsj-leito-mini';badges.setAttribute('aria-hidden','true');
     if(pediatric){const a=d.createElement('span');a.className='hsj-tag';a.textContent='P';badges.appendChild(a)}
     if(isolated){const a=d.createElement('span');a.className='hsj-tag iso';a.textContent='ISO';badges.appendChild(a)}
     pill.appendChild(badges);
    }
    const summary=[bed.status==='reservado'&&sexo.startsWith('mascul')?'Reserva masculina':null,bed.status==='reservado'&&sexo.startsWith('feminin')?'Reserva feminina':null,pediatric?'Pediatria':null,isolated?'Isolamento: '+String(data.precaucao||bed.precaucao):null].filter(Boolean).join(' • ');
    if(summary)pill.title=(pill.title||'')+' | '+summary;
   });
  });
 }
 const schedule=()=>{if(queued)return;queued=true;setTimeout(annotate,100)};
 new MutationObserver(schedule).observe(grid,{childList:true,subtree:false});
 annotate();
}
frame.addEventListener('load',()=>{ready=false;setTimeout(init,180)});
if(frame.contentDocument?.readyState==='complete')init();else setTimeout(init,650);
})();
;