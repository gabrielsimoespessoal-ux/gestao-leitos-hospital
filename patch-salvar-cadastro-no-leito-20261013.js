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
 // Se a acao selecionada for Admissao, Salvar deve efetivamente movimentar o leito.
 // Mantem a rotina atomica nativa e todas as suas validacoes de conflito.
 if(val('mov-acao')==='Admissão'){
   if(w.usuarioAtual?.perfil==='Visitante'){w.alert('Sem permissão para realizar admissão.');return;}
   if(!l){w.alert('Leito não localizado. Atualize o painel antes de tentar novamente.');return;}
   if(l.status==='ocupado'&&String(l.prontuario||'')===pr){w.alert('Este paciente já está admitido neste leito. Nenhuma nova admissão foi criada.');return;}
   if(l.status!=='reservado'||String(l.prontuario||'')!==pr){
     w.alert('Admissão não executada: a reserva não corresponde exatamente ao prontuário informado, ou o leito mudou de situação. Confira o atendimento e o leito antes de prosseguir. Nenhum registro foi alterado.');
     return;
   }
   if(typeof w.executarMovimentacaoLeito!=='function'){w.alert('Módulo de admissão indisponível. Atualize a página.');return;}
   if(!w.confirm('CONFIRMAR ADMISSÃO?\\n\\nPaciente: '+name+'\\nLeito: '+number+' ('+sector+')\\n\\nA reserva será convertida em ocupação no banco compartilhado.'))return;
   btn.disabled=true;btn.textContent='Confirmando admissão...';
   try{await w.executarMovimentacaoLeito();}
   catch(e){w.alert('Erro durante a admissão: '+(e?.message||e));}
   finally{btn.disabled=false;btn.textContent='Salvar alterações do paciente';}
   return;
 }
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