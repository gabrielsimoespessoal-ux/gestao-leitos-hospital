(()=>{
 const frame=document.getElementById('appFrame');if(!frame)return;
 let timer;
 function setup(){
  let w,d;try{w=frame.contentWindow;d=frame.contentDocument}catch(_){return false}
  if(!w||!d||!d.getElementById('transf-destino'))return false;
  if(d.getElementById('hsj-outra-unidade-destino'))return true;
  const select=d.getElementById('transf-destino');
  const field=d.createElement('div');field.className='form-group';field.id='hsj-outro-destino-wrap';field.style.display='none';
  field.innerHTML='<label for="hsj-outra-unidade-destino">Nome da unidade de destino *</label><input type="text" id="hsj-outra-unidade-destino" maxlength="160" placeholder="Digite o nome completo da unidade" autocomplete="off">';
  select.closest('.form-group')?.after(field);
  const base=w.alternarTipoDestinoTransferencia;
  const customize=()=>{
   const tipo=d.getElementById('transf-tipo-destino')?.value;
   if(tipo==='externa'){
    if(![...select.options].some(o=>o.value==='HOSPITAL DO CORAÇÃO'))select.add(new Option('HOSPITAL DO CORAÇÃO','HOSPITAL DO CORAÇÃO'));
    if(![...select.options].some(o=>o.value==='__OUTRA_UNIDADE__'))select.add(new Option('Outra unidade (digitar nome)','__OUTRA_UNIDADE__'));
   }
   field.style.display=tipo==='externa'&&select.value==='__OUTRA_UNIDADE__'?'block':'none';
  };
  if(typeof base==='function')w.alternarTipoDestinoTransferencia=function(){const result=base.apply(this,arguments);customize();return result};
  select.addEventListener('change',customize);
  d.getElementById('transf-tipo-destino')?.addEventListener('change',()=>setTimeout(customize,0));
  customize();return true;
 }
 function start(){if(timer)clearInterval(timer);let i=0;timer=setInterval(()=>{if(setup()||++i>100)clearInterval(timer)},250);setup()}
 frame.addEventListener('load',start);start();
})();