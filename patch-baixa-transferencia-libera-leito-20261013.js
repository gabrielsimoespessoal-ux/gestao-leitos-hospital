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
  if(ocupados.length>1){w.alert('Foram identificados vários leitos ocupados. Baixa bloqueada por segurança.');return}
  const loc=ocupados[0]||null;
  if(!w.confirm(loc?'Confirmar BAIXA da transferência de '+row.paciente+'?\n\nO leito '+loc.leito+' de '+loc.setor+' será liberado automaticamente.':'Paciente sem leito ocupado. Confirmar BAIXA ADMINISTRATIVA da solicitação de '+row.paciente+'?\n\nNenhum leito ou cadastro de internação será alterado.'))return;
  const contabilizarIndicadores=loc?w.confirm('Computar a transferência concluída nos indicadores?\nOK = Sim | Cancelar = Não (a baixa prossegue).'):false;
  busy=true;
  try{
    const result=await w.hsjBaixarTransferenciaLiberandoLeito({atendimento:pr,dataIso:id,setor:loc?.setor||'',leito:loc?.leito||'',semLeito:!loc,contabilizarIndicadores,usuario:w.usuarioAtual?.nome||'usuario'});
    if(!result?.ok)throw Error('Gravação não confirmada.');
    const {doc,getDoc}=w.firebaseModules;
    const snap=await getDoc(doc(w.db,'hospital','dados'));
    if(!snap.exists()||snap.metadata?.fromCache)throw Error('Transação concluída, mas validação do servidor indisponível. Confira o estado antes de repetir.');
    const data=snap.data();
    const bed=loc?data.setoresData?.find(x=>x.nome===loc.setor)?.leitos?.find(x=>String(x.n)===loc.leito):null;
    if(!Array.isArray(data.transferenciasFinalizadas)||!data.transferenciasFinalizadas.some(t=>String(t.atendimento)===pr&&String(t.dataIso||t.data)===id))throw Error('Transferência não encontrada no histórico de finalizadas após a transação.');
    // O leito pode ter sido novamente ocupado por outra operação simultânea. A baixa é validada pelo histórico, sem sobrescrever o estado atual do leito.
    if(data.transferenciasAtivas?.some(t=>String(t.atendimento)===pr&&String(t.dataIso||t.data)===id))throw Error('Baixa ainda não confirmada na releitura.');
    w.setoresData=data.setoresData;w.transferenciasAtivas=data.transferenciasAtivas||[];w.transferenciasFinalizadas=data.transferenciasFinalizadas||[];w.movimentacoesHistorico=data.movimentacoesHistorico||[];
    if(typeof w.renderizarPainelLeitos==='function')w.renderizarPainelLeitos();
    if(typeof w.atualizarTabelasTransferencias==='function')w.atualizarTabelasTransferencias();
    if(typeof w.atualizarTabelaPacientesInternos==='function')w.atualizarTabelaPacientesInternos();
    if(typeof w.atualizarResumoPlantao==='function')w.atualizarResumoPlantao();
    if(typeof w.renderizarIndicadores==='function'&&d.getElementById('indicadores')?.classList.contains('active'))w.renderizarIndicadores();
    w.alert(loc?'Transferência baixada e registrada em Finalizadas. Confira o estado atual do leito '+loc.leito+' no painel.':'Solicitação baixada administrativamente e registrada em Finalizadas. Nenhum leito foi alterado.');
  }catch(e){w.alert('Baixa não confirmada: '+(e?.message||e)+'\nConfira o Painel de Leitos antes de repetir.')}
  finally{busy=false}
 };
 return true;
}
function start(){if(t)clearInterval(t);let n=0;t=setInterval(()=>{if(init()||++n>120)clearInterval(t)},250);init()}
frame.addEventListener('load',start);start();
})();