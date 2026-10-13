(()=>{
 const frame=document.getElementById('appFrame');if(!frame)return;
 let timer;
 function init(){
  let w,d;try{w=frame.contentWindow;d=frame.contentDocument}catch(_){return false}
  if(!w||!d||typeof w.hsjMudarReservaLeitoAtomica!=='function')return false;
  const modal=d.getElementById('modal-editar-paciente');
  if(!modal||!d.getElementById('edit-prontuario'))return false;
  if(d.getElementById('hsj-change-reservation'))return true;
  const button=d.createElement('button');button.id='hsj-change-reservation';button.type='button';button.className='btn';button.textContent='↗ Mudar leito reservado';button.style.cssText='display:none;width:100%;margin:12px 0;padding:12px;background:#0e7490;color:white;border-radius:8px;font-weight:700';
  const action=d.getElementById('atalho-acao-operacional-v4');(action||modal.firstElementChild).appendChild(button);
  const box=d.createElement('div');box.id='hsj-reservation-dialog';box.style.cssText='display:none;position:fixed;inset:0;z-index:100030;background:#0f172a99;align-items:center;justify-content:center;padding:12px';
  box.innerHTML='<section style="background:white;border-radius:12px;width:min(530px,100%);padding:22px;max-height:90vh;overflow:auto"><h3 style="margin-top:0">Mudar leito reservado</h3><p id="hsj-res-origin"></p><label for="hsj-res-sector">Setor de destino</label><select id="hsj-res-sector" style="width:100%;padding:10px;margin:6px 0 12px"></select><label for="hsj-res-bed">Leito disponível</label><select id="hsj-res-bed" style="width:100%;padding:10px;margin:6px 0 18px"></select><div style="display:flex;gap:10px;flex-wrap:wrap"><button id="hsj-res-confirm" class="btn btn-success" type="button">Confirmar mudança</button><button id="hsj-res-cancel" class="btn" type="button">Cancelar</button></div><small>O leito anterior só será liberado quando a nova reserva for confirmada no banco.</small></section>';d.body.appendChild(box);
  const sector=d.getElementById('hsj-res-sector'),bed=d.getElementById('hsj-res-bed');let origin=null;
  const cancel=()=>box.style.display='none';d.getElementById('hsj-res-cancel').onclick=cancel;
  box.addEventListener('click',e=>{if(e.target===box)cancel()});
  function findReservation(){
    const pr=d.getElementById('edit-prontuario')?.value||'';
    for(const s of w.setoresData||[])for(const l of s.leitos||[])if(l.status==='reservado'&&String(l.prontuario||'')===pr)return {s,l};
    return null;
  }
  function updateButton(){button.style.display=findReservation()&&w.usuarioAtual?.perfil!=='Visitante'?'block':'none'}
  const oldOpen=w.abrirEdicaoPaciente;
  if(typeof oldOpen==='function')w.abrirEdicaoPaciente=function(){const res=oldOpen.apply(this,arguments);setTimeout(updateButton,0);return res};
  button.onclick=()=>{
    origin=findReservation();
    if(!origin){w.alert('A reserva não foi localizada. Atualize o painel.');return}
    d.getElementById('hsj-res-origin').textContent='Paciente: '+(origin.l.paciente||'Não informado')+' | Atual: '+origin.s.nome+' / Leito '+origin.l.n;
    sector.innerHTML='';
    (w.setoresData||[]).filter(s=>s.leitos.some(l=>l.status==='disponivel')).forEach(s=>sector.add(new Option(s.nome,s.nome)));
    const updateBeds=()=>{
      bed.innerHTML='';
      const s=w.setoresData.find(x=>x.nome===sector.value);
      (s?.leitos||[]).filter(l=>l.status==='disponivel').forEach(l=>bed.add(new Option('Leito '+l.n,l.n)));
    };
    sector.onchange=updateBeds;updateBeds();
    box.style.display='flex';
  };
  d.getElementById('hsj-res-confirm').onclick=async()=>{
    if(!origin||!sector.value||!bed.value){w.alert('Escolha um leito disponível.');return}
    if(!w.confirm('Confirmar mudança da reserva de '+origin.s.nome+' / '+origin.l.n+' para '+sector.value+' / '+bed.value+'?'))return;
    const confirm=d.getElementById('hsj-res-confirm');confirm.disabled=true;
    try{
      const result=await w.hsjMudarReservaLeitoAtomica({setorOrigem:origin.s.nome,leitoOrigem:origin.l.n,setorDestino:sector.value,leitoDestino:bed.value,prontuario:origin.l.prontuario||'',paciente:origin.l.paciente||'',usuario:w.usuarioAtual?.nome||'usuario'});
      if(!result?.ok)throw Error('O banco não confirmou a alteração.');
      cancel();modal.style.display='none';w.alert('Reserva alterada e confirmada no banco central.');
    }catch(e){w.alert('Mudança NÃO realizada: '+(e?.message||e)+'\nConfira o painel antes de tentar novamente.')}
    finally{confirm.disabled=false}
  };
  return true;
 }
 function start(){if(timer)clearInterval(timer);let attempts=0;timer=setInterval(()=>{if(init()||++attempts>120)clearInterval(timer)},250);init()}
 frame.addEventListener('load',start);start();
})();