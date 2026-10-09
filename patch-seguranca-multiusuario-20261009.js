(()=>{
const frame=document.getElementById('appFrame');if(!frame)return;
frame.addEventListener('load',()=>{
const w=frame.contentWindow,d=frame.contentDocument;if(!w||!d)return;
const promptIndicador=(acao,setor)=>{
 const relevante=/admiss|alta|óbito|obito|transfer|evas|reserv/i.test(acao||'');
 if(!relevante)return false;
 const uti=String(setor||'').toUpperCase().includes('UTI');
 return w.confirm('INDICADORES HOSPITALARES\\n\\nDeseja COMPUTAR esta movimentação nos indicadores?\\n\\nAção: '+acao+(uti?'\\nOrigem UTI: se computada, qualquer transferência também será alta da UTI.':'')+'\\n\\nOK = SIM, COMPUTAR\\nCancelar = NÃO COMPUTAR\\n\\nA movimentação será executada normalmente em ambas as opções.');
};
const core=['executarEntradaLeitoAtomica','executarAdmissaoReservaAtomica','executarSaidaLeitoAtomica'];
core.forEach(nome=>{
 const original=w[nome];if(typeof original!=='function')return;
 w[nome]=function(args){const a={...(args||{})};if(typeof a.contabilizarIndicadores!=='boolean')a.contabilizarIndicadores=promptIndicador(a.acao||(/Admissao/.test(nome)?'Admissão':'Saída'),a.setor);return original.call(w,a);};
});
const original=w.executarMovimentacaoLeito;
if(typeof original==='function')w.executarMovimentacaoLeito=async function(){
 const ac=d.getElementById('mov-acao')?.value||'';
 if(ac==='Reserva Cirúrgica Eletiva'){
  const get=id=>d.getElementById(id)?.value?.trim()||'';
  const setor=get('mov-setor'),leito=get('mov-leito'),nome=get('mov-paciente'),nasc=get('mov-nascimento'),sexo=get('mov-sexo'),perfil=get('mov-perfil-vaga'),origem=get('mov-origem');
  const medico=get('mov-medico'),dataHora=get('mov-data-cirurgia'),procedimento=get('mov-procedimento');
  if(!setor||!leito||!nome||!nasc||!sexo||!perfil||!origem||!medico||!dataHora||!procedimento){w.alert('Preencha os campos obrigatórios e os dados específicos da cirurgia.');return;}
  const pr=get('mov-atendimento')||('RES-'+Date.now()+'-'+Math.random().toString(36).slice(2,6));
  const contabilizar=promptIndicador(ac,setor);
  try{
   const r=await w.executarEntradaLeitoAtomica({acao:ac,setor,leito,pr,nome,nasc,sexo,perfil,origem,convenio:get('mov-convenio'),precaucao:get('mov-precaucao'),previsaoAlta:get('mov-previsao-alta-paciente'),medicoCirurgiao:medico,dataHoraCirurgia:dataHora,procedimentoProposto:procedimento,contabilizarIndicadores:contabilizar,usuario:w.usuarioAtual?.nome||'usuario'});
   if(r?.status!=='reservado')throw Error('Banco não confirmou status reservado.');
   ['mov-atendimento','mov-paciente','mov-nascimento'].forEach(id=>{const el=d.getElementById(id);if(el)el.value='';});
   w.alert('Reserva cirúrgica '+(r.jaExistia?'já existente e confirmada':'GRAVADA NO BANCO')+' para '+setor+' / leito '+leito+'. Aguarde a atualização do painel.');
  }catch(e){w.alert('RESERVA NÃO CONFIRMADA: '+(e?.message||e)+'\\nConfira o status do leito antes de repetir.');}
  return;
 }
 if(ac==='Transferência Interna'){
  if(w.usuarioAtual?.perfil==='Visitante'){w.alert('Acesso negado.');return;}
  const get=id=>d.getElementById(id)?.value?.trim()||'';
  const pr=get('mov-atendimento'),dest=get('mov-setor'),leito=get('mov-leito');
  if(!pr||!dest||!leito){w.alert('Informe prontuário, setor e leito de destino.');return;}
  const contabilizar=promptIndicador(ac, w.setoresData?.find(s=>s.leitos?.some(l=>l.prontuario===pr&&l.status==='ocupado'))?.nome);
  try{
   if(typeof w.executarTransferenciaSeguraV20261009!=='function')throw Error('Transação segura indisponível.');
   await w.executarTransferenciaSeguraV20261009({pr,setorDestino:dest,leitoDestino:leito,contabilizarIndicadores:contabilizar,usuario:w.usuarioAtual?.nome});
   if(typeof w.carregarDadosDoFirebase==='function')w.carregarDadosDoFirebase();
   w.alert('Transferência CONFIRMADA no banco. Acomodação de origem liberada e destino ocupado.');
   if(typeof w.renderizarPainelLeitos==='function')w.renderizarPainelLeitos();
  }catch(e){w.alert('Transferência NÃO realizada: '+(e?.message||e));}
  return;
 }
 return original.apply(w,arguments);
};
const aviso=d.createElement('div');aviso.id='regra-indicadores-multiusuario';aviso.style.cssText='position:fixed;bottom:12px;right:12px;z-index:9999;background:#e0f2fe;color:#075985;padding:7px 12px;border:1px solid #38bdf8;border-radius:8px;font:600 12px sans-serif;max-width:270px';aviso.textContent='Banco central: confirme a gravação antes de considerar uma movimentação concluída.';d.body.appendChild(aviso);
});
})();