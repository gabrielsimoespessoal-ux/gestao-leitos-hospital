(()=>{
const frame=document.getElementById('appFrame');if(!frame)return;
let timer;
function init(){
 let w,d;try{w=frame.contentWindow;d=frame.contentDocument}catch(_){return false}
 if(!w||!d||typeof w.atualizarTabelasTransferencias!=='function'||typeof w.hsjAtualizarStatusTransferenciaAtomico!=='function')return false;
 if(w.__hsjStatusTransferenciasV1)return true;
 w.__hsjStatusTransferenciasV1=true;
 const estados=['Solicitação Pendente','Vaga Solicitada','Aguardando liberação','Autorizada','Vaga Liberada'];
 const refresh=()=>{
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