(()=>{
const frame=document.getElementById('appFrame');if(!frame)return;
let timer;
function init(){
 let w,d;try{w=frame.contentWindow;d=frame.contentDocument}catch(_){return false}
 if(!w||!d||typeof w.hsjSalvarEdicaoPacienteSegura!=='function'||typeof w.hsjCriarTransferenciaPendenteSegura!=='function')return false;
 const btn=d.getElementById('hsj-encaminhamento-real-v6'),edit=d.getElementById('edit-sexo-v3');
 if(!btn||!edit)return false;
 if(btn.dataset.hsjPersistence==='on')return true;btn.dataset.hsjPersistence='on';
 const val=id=>String(d.getElementById(id)?.value||'').trim();
 const locate=pr=>{for(const s of w.setoresData||[])for(const l of s.leitos||[])if(String(l.prontuario||'')===pr)return {s,l};return null};
 let saving=false;
 w.salvarEdicaoPaciente=async function(){
  if(saving)return;saving=true;
  try{
   const oldPr=val('edit-prontuario'),pr=val('edit-prontuario-vis-v3')||oldPr;
   if(pr!==oldPr)throw Error('Alteração do número de prontuário exige rotina específica. Nenhuma mudança foi realizada.');
   const loc=locate(pr);if(!loc)throw Error('Paciente não localizado em um único leito ativo.');
   const nome=val('edit-nome');if(!nome)throw Error('Informe o nome do paciente.');
   const result=await w.hsjSalvarEdicaoPacienteSegura({
    pr,nome,nascimento:val('edit-nasc'),sexo:val('edit-sexo-v3'),perfil:val('edit-perfil'),
    convenio:val('edit-convenio-v3'),precaucao:val('edit-precaucao-v3'),origem:val('edit-origem-v3'),
    previsaoAlta:val('edit-previsao-alta-v14'),expectedSetor:loc.s.nome,expectedLeito:loc.l.n,
    expectedNome:loc.l.paciente,usuario:w.usuarioAtual?.nome||'usuario'
   });
   if(!result?.ok)throw Error('O banco não confirmou a alteração.');
   d.getElementById('modal-editar-paciente').style.display='none';
   w.alert('Alteração gravada no banco central. Ela permanecerá após atualizar a página.');
  }catch(e){w.alert('Alteração NÃO confirmada: '+(e?.message||e)+'\nConfira a conexão e atualize o painel antes de tentar novamente.')}
  finally{saving=false}
 };
 btn.onclick=async()=>{
  if(w.usuarioAtual?.perfil==='Visitante'){w.alert('Perfil sem permissão.');return}
  const pr=val('edit-prontuario-vis-v3')||val('edit-prontuario'),nome=val('edit-nome');
  if(!pr||!nome){w.alert('Informe prontuário e nome do paciente.');return}
  if(!w.confirm('Criar solicitação PENDENTE para '+nome+' e encaminhar à aba Transferências?\nO destino ficará A definir até ser preenchido.'))return;
  btn.disabled=true;
  try{
   const result=await w.hsjCriarTransferenciaPendenteSegura({pr,nome,usuario:w.usuarioAtual?.nome||'usuario'});
   if(!result?.ok)throw Error('Banco não confirmou a solicitação.');
   // Somente navegar depois que a transação do servidor confirmar.
   d.getElementById('modal-editar-paciente').style.display='none';
   const tab=[...d.querySelectorAll('.subnav .nav-item')].find(e=>(e.getAttribute('onclick')||'').includes("'transferencias'"));
   if(typeof w.switchTab==='function')w.switchTab('transferencias',tab);
   w.alert(result.jaExistia?'Solicitação já existente no banco central.':'Solicitação pendente gravada no banco central. Ela permanecerá após F5. Complete o destino e as pendências na aba Transferências.');
  }catch(e){w.alert('Encaminhamento NÃO gravado: '+(e?.message||e))}
  finally{btn.disabled=false}
 };
 return true;
}
function schedule(){if(timer)clearInterval(timer);let n=0;timer=setInterval(()=>{if(init()||++n>120)clearInterval(timer)},250);init()}
frame.addEventListener('load',schedule);schedule();
})();