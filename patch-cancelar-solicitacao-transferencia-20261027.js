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
     const seguras=JSON.parse(JSON.stringify(novas));
     tx.update(ref,{transferenciasAtivas:seguras});
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