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