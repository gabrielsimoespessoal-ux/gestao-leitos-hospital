(()=>{
const frame=document.getElementById('appFrame');if(!frame)return;
let interval;
function init(){
 let w,d;try{w=frame.contentWindow;d=frame.contentDocument}catch(_){return false}
 if(!w||!d||typeof w.hsjSalvarSolicitacaoTransferenciaAtomica!=='function'||!d.getElementById('transf-atendimento'))return false;
 if(w.__hsjTransferSaveFixed)return true;
 w.__hsjTransferSaveFixed=true;
 let saving=false;
 w.salvarNovaTransferencia=async function(){
  if(saving)return;
  const val=id=>String(d.getElementById(id)?.value||'').trim();
  const data={
   atendimento:val('transf-atendimento'),paciente:val('transf-paciente'),nascimento:val('transf-nascimento'),
   perfil:val('transf-perfil'),sexo:val('transf-sexo'),destino:val('transf-destino')==='__OUTRA_UNIDADE__'?val('hsj-outra-unidade-destino'):val('transf-destino'),
   status:val('transf-status'),dusv:val('transf-dusv'),plataforma:val('transf-plataforma'),
   pendencias:val('transf-pendencias'),judicial:val('transf-judicial'),compulsoria:val('transf-compulsoria'),
   usuario:w.usuarioAtual?.nome||'usuario'
  };
  if(val('transf-destino')==='__OUTRA_UNIDADE__'&&!data.destino){w.alert('Digite o nome da unidade de destino.');return}
  if(!data.atendimento||!data.paciente||!data.destino){w.alert('Informe o prontuário, nome e destino antes de salvar.');return}
  if(w.usuarioAtual?.perfil==='Visitante'){w.alert('Perfil sem permissão de alteração.');return}
  saving=true;
  const btn=[...d.querySelectorAll('#transferencias button')].find(b=>(b.getAttribute('onclick')||'').includes('salvarNovaTransferencia'));
  if(btn){btn.disabled=true;btn.textContent='Salvando no banco...'}
  try{
   const response=await w.hsjSalvarSolicitacaoTransferenciaAtomica(data);
   if(!response?.ok)throw Error('Banco não confirmou a solicitação.');
   const {doc,getDoc}=w.firebaseModules;
   const snap=await getDoc(doc(w.db,'hospital','dados'));
   if(!snap.exists()||snap.metadata?.fromCache)throw Error('Gravação executada, mas não foi possível validar leitura atualizada. Verifique antes de repetir.');
   const records=snap.data().transferenciasAtivas||[];
   if(!records.some(t=>String(t.atendimento)===data.atendimento&&String(t.destino)===data.destino))
    throw Error('Registro ainda não confirmado na leitura. Confira a lista antes de repetir.');
   w.transferenciasAtivas=records;
   if(typeof w.atualizarTabelasTransferencias==='function')w.atualizarTabelasTransferencias();
   if(typeof w.atualizarResumoPlantao==='function')w.atualizarResumoPlantao();
   w.alert('Transferência '+(response.atualizada?'atualizada':'registrada')+' e confirmada no banco central. Os dados permanecerão após F5.');
  }catch(e){w.alert('Não foi possível confirmar a transferência: '+(e?.message||e)+'\nNão considere a solicitação salva antes da confirmação.')}
  finally{saving=false;if(btn){btn.disabled=false;btn.textContent='Salvar e Registrar Solicitação'}}
 };
 return true;
}
function start(){if(interval)clearInterval(interval);let n=0;interval=setInterval(()=>{if(init()||++n>120)clearInterval(interval)},250);init()}
frame.addEventListener('load',start);start();
})();