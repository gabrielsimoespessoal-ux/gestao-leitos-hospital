(()=>{
const frame=document.getElementById('appFrame');if(!frame)return;
let timer;
function init(){
let w,d;try{w=frame.contentWindow;d=frame.contentDocument}catch(_){return false}
if(!w||!d||typeof w.hsjSalvarEdicaoPacienteSegura!=='function')return false;
const drawer=d.getElementById('hsj-drawer-body'),form=d.getElementById('box-form-mov');
if(!drawer||!form)return false;
if(d.getElementById('hsj-save-patient-drawer'))return true;
const btn=d.createElement('button');btn.type='button';btn.id='hsj-save-patient-drawer';btn.className='btn btn-success';btn.textContent='Salvar alterações do paciente';btn.style.cssText='background:#0f766e;color:#fff;padding:11px 17px;margin:12px 9px 12px 0;font-weight:700';
const notice=d.createElement('p');notice.style.cssText='font-size:12px;color:#64748b;margin:0 0 10px';notice.textContent='Salva apenas os dados cadastrais no banco central. Não movimenta nem libera o leito.';
const actions=form.querySelector('.btn-success')?.parentElement||form;
actions.appendChild(btn);actions.after(notice);
btn.onclick=async()=>{
 const val=id=>String(d.getElementById(id)?.value||'').trim();
 const sector=val('mov-setor'),number=val('mov-leito'),pr=val('mov-atendimento'),name=val('mov-paciente');
 if(!sector||!number||!pr||!name){w.alert('Para salvar, informe setor, leito, prontuário e nome.');return}
 const s=w.setoresData.find(x=>x.nome===sector),l=s?.leitos.find(x=>String(x.n)===String(number));
 if(!l||!['ocupado','reservado'].includes(l.status)||String(l.prontuario||'')!==pr){
 w.alert('Cadastro não corresponde ao paciente atual desse leito. Não é possível salvar. Atualize o painel.');return}
 if(w.usuarioAtual?.perfil==='Visitante'){w.alert('Sem permissão para editar pacientes.');return}
 btn.disabled=true;btn.textContent='Salvando no banco...';
 try{
  const response=await w.hsjSalvarEdicaoPacienteSegura({pr,nome:name,nascimento:val('mov-nascimento'),
    sexo:val('mov-sexo'),perfil:val('mov-perfil-vaga'),convenio:val('mov-convenio'),
    precaucao:val('mov-precaucao'),origem:val('mov-origem'),
    previsaoAlta:val('mov-previsao-alta-paciente-v14')||val('mov-previsao-alta-paciente'),
    expectedSetor:sector,expectedLeito:number,expectedNome:l.paciente,
    usuario:w.usuarioAtual?.nome||'usuario'});
  if(!response?.ok)throw Error('Gravação não confirmada.');
  w.alert('Dados cadastrais salvos no banco central. Nenhuma movimentação de leito foi executada.');
 }catch(e){w.alert('Não foi possível salvar: '+(e?.message||e)+'\nNenhuma alteração foi confirmada. Confira os dados antes de tentar novamente.')}
 finally{btn.disabled=false;btn.textContent='Salvar alterações do paciente'}
};
return true;
}
function start(){if(timer)clearInterval(timer);let tries=0;timer=setInterval(()=>{if(init()||++tries>=120)clearInterval(timer)},250);init()}
frame.addEventListener('load',start);start();
})();