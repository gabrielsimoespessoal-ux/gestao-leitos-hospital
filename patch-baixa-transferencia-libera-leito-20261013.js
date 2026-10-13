(()=>{
const frame=document.getElementById('appFrame');if(!frame)return;
let t;
function init(){
 let w,d;try{w=frame.contentWindow;d=frame.contentDocument}catch(_){return false}
 if(!w||!d||typeof w.hsjBaixarTransferenciaLiberandoLeito!=='function')return false;
 if(w.__hsjBaixaSeguraV2)return true;
 w.__hsjBaixaSeguraV2=true;
 let busy=false;
 w.baixarTransferencia=async function(index){
  if(busy)return;
  if(w.usuarioAtual?.perfil==='Visitante'){w.alert('Sem permissão.');return}
  const row=w.transferenciasAtivas?.[index];if(!row){w.alert('Transferência não encontrada. Atualize o painel.');return}
  const pr=String(row.atendimento||''),id=String(row.dataIso||row.data||'');
  const ocupados=[];
  (w.setoresData||[]).forEach(s=>(s.leitos||[]).forEach(l=>{if(l.status==='ocupado'&&String(l.prontuario||'')===pr)ocupados.push({setor:s.nome,leito:String(l.n)})}));
  if(ocupados.length!==1){w.alert('Não foi identificado um único leito ocupado para este prontuário. A baixa foi bloqueada por segurança.');return}
  const loc=ocupados[0];
  if(!w.confirm('Confirmar BAIXA da transferência de '+row.paciente+'?\n\nO leito '+loc.leito+' de '+loc.setor+' será liberado automaticamente e ficará DISPONÍVEL no painel.'))return;
  const contabilizarIndicadores=w.confirm('Computar a transferência concluída nos indicadores?\nOK = Sim | Cancelar = Não (a baixa prossegue).');
  busy=true;
  try{
    const result=await w.hsjBaixarTransferenciaLiberandoLeito({atendimento:pr,dataIso:id,setor:loc.setor,leito:loc.leito,contabilizarIndicadores,usuario:w.usuarioAtual?.nome||'usuario'});
    if(!result?.ok)throw Error('Gravação não confirmada.');
    const {doc,getDoc}=w.firebaseModules;
    const snap=await getDoc(doc(w.db,'hospital','dados'));
    if(!snap.exists()||snap.metadata?.fromCache)throw Error('Transação concluída, mas validação do servidor indisponível. Confira o estado antes de repetir.');
    const data=snap.data();
    const bed=data.setoresData?.find(x=>x.nome===loc.setor)?.leitos?.find(x=>String(x.n)===loc.leito);
    if(bed?.status!=='disponivel')throw Error('Estado do leito não confirmado na releitura; atualize a tela.');
    w.setoresData=data.setoresData;w.transferenciasAtivas=data.transferenciasAtivas||[];w.transferenciasFinalizadas=data.transferenciasFinalizadas||[];
    if(typeof w.renderizarPainelLeitos==='function')w.renderizarPainelLeitos();
    if(typeof w.atualizarTabelasTransferencias==='function')w.atualizarTabelasTransferencias();
    if(typeof w.atualizarTabelaPacientesInternos==='function')w.atualizarTabelaPacientesInternos();
    if(typeof w.atualizarResumoPlantao==='function')w.atualizarResumoPlantao();
    w.alert('Transferência baixada e leito '+loc.leito+' de '+loc.setor+' DISPONÍVEL no Firebase.');
  }catch(e){w.alert('Baixa não confirmada: '+(e?.message||e)+'\nConfira o Painel de Leitos antes de repetir.')}
  finally{busy=false}
 };
 return true;
}
function start(){if(t)clearInterval(t);let n=0;t=setInterval(()=>{if(init()||++n>120)clearInterval(t)},250);init()}
frame.addEventListener('load',start);start();
})();