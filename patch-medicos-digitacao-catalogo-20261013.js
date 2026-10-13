(()=>{
 const frame=document.getElementById('appFrame');if(!frame)return;
 let timer;
 function init(){
  let w,d;try{w=frame.contentWindow;d=frame.contentDocument}catch(_){return false}
  if(!w||!d||typeof w.hsjAdicionarMedicoCatalogo!=='function'||!d.getElementById('mov-medico'))return false;
  if(d.getElementById('hsj-medico-digitacao'))return true;
  const original=d.getElementById('mov-medico');
  const parent=original.closest('.form-group');if(!parent)return false;
  original.style.display='none';
  const wrap=d.createElement('div');wrap.style.cssText='display:flex;flex-wrap:wrap;gap:8px';
  wrap.innerHTML='<input type="text" id="hsj-medico-digitacao" list="hsj-medicos-sugestoes" placeholder="Digite ou selecione o médico" autocomplete="off" maxlength="120" style="flex:1;min-width:180px;padding:10px;border:1px solid #cbd5e1;border-radius:7px"><datalist id="hsj-medicos-sugestoes"></datalist><button type="button" id="hsj-salvar-medico" class="btn" style="background:#0e7490;color:white;padding:8px 12px">Adicionar médico</button>';
  parent.appendChild(wrap);
  const info=d.createElement('small');info.id='hsj-medicos-msg';info.style.cssText='display:block;margin-top:5px;color:#64748b';
  info.textContent='Digite um nome novo e clique em Adicionar médico. Os nomes salvos ficam disponíveis nas próximas reservas.';parent.appendChild(info);
  const input=d.getElementById('hsj-medico-digitacao'),datalist=d.getElementById('hsj-medicos-sugestoes'),button=d.getElementById('hsj-salvar-medico');
  let remote=[],unsub=null;
  const norm=x=>String(x||'').trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR');
  function fill(){
   const previous=original.value;
   const list=[...new Set([...Array.from(original.options).map(x=>x.value).filter(Boolean),...remote])];
   list.sort((a,b)=>a.localeCompare(b,'pt-BR'));
   datalist.replaceChildren();list.forEach(n=>{const op=d.createElement('option');op.value=n;datalist.appendChild(op)});
   remote.forEach(n=>{if(![...original.options].some(x=>norm(x.value)===norm(n)))original.add(new Option(n,n))});
   if(previous)original.value=previous;
  }
  // Mantém o campo original utilizado pelos fluxos seguros de reserva.
  function sync(){
   const name=input.value.trim().replace(/\s+/g,' ');
   if(!name){original.value='';return}
   let opt=[...original.options].find(x=>norm(x.value)===norm(name));
   if(!opt){opt=new Option(name,name);original.add(opt)}
   original.value=opt.value;
  }
  input.addEventListener('input',sync);
  input.addEventListener('change',sync);
  button.onclick=async()=>{
   const name=input.value.trim().replace(/\s+/g,' ');
   if(name.length<3){w.alert('Informe o nome completo do médico.');return}
   if(w.usuarioAtual?.perfil==='Visitante'){w.alert('Perfil sem permissão para cadastro.');return}
   button.disabled=true;info.textContent='Salvando médico na lista compartilhada...';
   try{
    const result=await w.hsjAdicionarMedicoCatalogo(name);
    if(!result?.ok)throw Error('Cadastro não confirmado.');
    remote=[...remote,name];fill();sync();
    info.textContent='Médico salvo no catálogo compartilhado. Você já pode executar a reserva.';
   }catch(err){info.textContent='Nome não confirmado no banco. Verifique a conexão.';w.alert('Não foi possível salvar o médico: '+(err?.message||err))}
   finally{button.disabled=false}
  };
  // Mantém sugestões atualizadas entre computadores sem tocar nos dados dos pacientes.
  unsub=w.hsjObservarCatalogoMedicos((names,error)=>{
   if(error){info.textContent='Catálogo remoto indisponível: novos nomes não serão compartilhados até corrigir a conexão.';return}
   remote=names||[];fill();
  });
  // Inclui os nomes estáticos anteriores; valida valor digitado também ao abrir uma reserva.
  fill();
  return true;
 }
 function start(){if(timer)clearInterval(timer);let i=0;timer=setInterval(()=>{if(init()||++i>120)clearInterval(timer)},250);init()}
 frame.addEventListener('load',start);start();
})();