(()=>{
 const frame=document.getElementById('appFrame');if(!frame)return;
 function install(){
  let w,d;try{w=frame.contentWindow;d=frame.contentDocument}catch{return}
  if(!w||!d||!w.setoresData)return;
  const form=d.getElementById('box-form-mov');if(!form||d.getElementById('hsj-confirmar-reserva-admissao'))return;
  const btn=d.createElement('button');btn.id='hsj-confirmar-reserva-admissao';btn.type='button';btn.className='btn btn-success';btn.textContent='Confirmar admissão da reserva';
  btn.style.cssText='padding:11px 14px;margin:9px;background:#1565a8;color:white;border-radius:8px;font-weight:bold';
  const info=d.createElement('p');info.style.cssText='font-size:12px;color:#334155;margin:6px 0';info.textContent='Para reservas criadas sem número de atendimento: informe o número definitivo para efetivar a admissão.';
  const actions=form.querySelector('.btn-success')?.parentElement||form;actions.append(btn,info);
  btn.onclick=async()=>{
   const get=id=>String(d.getElementById(id)?.value||'').trim();
   const setor=get('mov-setor'),leito=get('mov-leito'),id=get('mov-atendimento'),nome=get('mov-paciente');
   if(get('mov-acao')!=='Admissão'){w.alert('Selecione Admissão (Ocupa o Leito) antes de confirmar.');return}
   if(!setor||!leito||!nome||!id){w.alert('Selecione uma reserva com paciente, setor, leito e identificador.');return}
   const leitoAtual=w.setoresData.find(s=>s.nome===setor)?.leitos?.find(l=>String(l.n)===leito);
   if(!leitoAtual||leitoAtual.status!=='reservado'||String(leitoAtual.prontuario||'')!==id){w.alert('A reserva exibida não corresponde aos dados do leito. Atualize antes de continuar.');return}
   if(w.usuarioAtual?.perfil==='Visitante'){w.alert('Usuário não autorizado.');return}
   if(typeof w.hsjConfirmarReservaComoAdmissao!=='function'){w.alert('O módulo seguro de admissão não está carregado. Atualize a página.');return}
   if(!/^RESERVA-SEM-PR-/i.test(id)){w.alert('Esta reserva já possui número real de atendimento. Utilize Executar Movimentação Inteligente para admissão.');return}
   const real=w.prompt('Informe o NÚMERO DEFINITIVO DO ATENDIMENTO deste paciente. Não utilize o código RESERVA-SEM-PR.','');
   if(real===null)return;
   const definitivo=String(real).trim();
   if(!definitivo||/^RESERVA-SEM-PR-/i.test(definitivo)){w.alert('Informe um número definitivo válido.');return}
   if(!w.confirm('CONFIRMAR ADMISSÃO NO BANCO?\\nPaciente: '+nome+'\\nSetor/leito: '+setor+' / '+leito+'\\nAtendimento definitivo: '+definitivo+'\\n\\nA reserva será convertida em ocupação.'))return;
   let indicador=false;
   if(typeof w.hsjConfirmarIndicadorSimNao==='function')indicador=await w.hsjConfirmarIndicadorSimNao('Deseja contabilizar esta admissão nos indicadores hospitalares?');
   else indicador=w.confirm('Deseja contabilizar esta admissão nos indicadores hospitalares?\\nOK = Sim; Cancelar = Não. A admissão acontece em ambas as opções.');
   btn.disabled=true;btn.textContent='Confirmando no banco...';
   try{
    const resp=await w.hsjConfirmarReservaComoAdmissao({prontuarioProvisorio:id,prontuarioDefinitivo:definitivo,setor,leito,nome,nascimento:get('mov-nascimento'),sexo:get('mov-sexo'),perfil:get('mov-perfil-vaga'),convenio:get('mov-convenio'),origem:get('mov-origem'),precaucao:get('mov-precaucao'),usuario:w.usuarioAtual?.nome||'usuario',contabilizarIndicadores:indicador});
    if(!resp?.ok)throw Error('Banco não confirmou a admissão.');
    w.alert('ADMISSÃO CONFIRMADA NO BANCO. Leito '+leito+' agora está ocupado. Atualize o painel para conferir.');
    if(typeof w.carregarDadosDoFirebase==='function')await w.carregarDadosDoFirebase();
   }catch(e){w.alert('ADMISSÃO NÃO CONFIRMADA: '+(e?.message||e)+'\\nNão efetue nova reserva nem libere o leito manualmente.');}
   finally{btn.disabled=false;btn.textContent='Confirmar admissão da reserva'}
  };
 }
 frame.addEventListener('load',()=>setTimeout(install,350));
 const timer=setInterval(install,800);setTimeout(()=>clearInterval(timer),45000);install();
})();