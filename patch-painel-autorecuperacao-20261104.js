(()=>{
 const frame=document.getElementById('appFrame');if(!frame)return;
 let bound=false;
 function start(){
  let w,d;try{w=frame.contentWindow;d=frame.contentDocument}catch{return false}
  if(!w||!d||!d.getElementById('painel-setores-detalhado')||typeof w.renderizarPainelLeitos!=='function')return false;
  if(w.__hsjPainelAutoRecuperacao20261104)return true;
  w.__hsjPainelAutoRecuperacao20261104=true;bound=true;
  const grid=d.getElementById('painel-setores-detalhado'),panel=d.getElementById('painel');
  const banner=d.createElement('div');banner.id='hsj-painel-status-reparo';banner.style.cssText='display:none;background:#eff6ff;border:1px solid #93c5fd;border-left:4px solid #2563eb;border-radius:8px;padding:9px 12px;font:600 12px Arial,sans-serif;color:#1e3a8a;margin:8px 0';
  banner.setAttribute('role','status');grid.before(banner);
  function notice(message){banner.textContent=message;banner.style.display='block'}
  function dismiss(){banner.style.display='none';banner.textContent=''}
  let emptyChecks=0,recovering=false,lastAttempt=0,failures=0;
  function verify(){
   if(!d.isConnected||frame.contentDocument!==d)return false;
   if(!panel.classList.contains('active'))return true;
   const sectors=Array.isArray(w.setoresData)?w.setoresData.filter(s=>Array.isArray(s.leitos)&&s.leitos.length):[];
   // Never render absent, cache-only or disconnected data.
   if(!sectors.length||w.multiusuarioStatus==='conflito')return true;
   const cards=[...grid.querySelectorAll('.sector-box')];
   const beds=grid.querySelectorAll('.leito-pill').length;
   if(cards.length&&beds){
    emptyChecks=0;failures=0;
    const allHidden=cards.every(c=>d.defaultView.getComputedStyle(c).display==='none');
    if(allHidden){
     const filter=d.getElementById('hsj-leitos-pesquisa'),sector=d.getElementById('hsj-leitos-setor');
     if(filter?.value.trim()||sector?.value){
      notice('Nenhum setor corresponde aos filtros atuais. Utilize “Limpar” nos filtros do painel para visualizar todos os leitos.');
     }else{
      notice('Os leitos estão ocultos por um filtro de exibição. Tentando restaurar a visualização...');
      cards.forEach(c=>c.style.removeProperty('display'));
      const reset=d.getElementById('btn-todos-v2');if(reset)reset.click();
     }
    }else dismiss();
    return true;
   }
   if(++emptyChecks<2||recovering||Date.now()-lastAttempt<12000)return true;
   recovering=true;lastAttempt=Date.now();
   notice('Painel de leitos temporariamente indisponível. Recuperando a visualização automaticamente...');
   try{
    // Pure UI rerender, no Firebase write and no page refresh.
    w.renderizarPainelLeitos();
    if(grid.querySelectorAll('.leito-pill').length){emptyChecks=0;failures=0;dismiss()}
    else if(++failures>=3)notice('Não foi possível reconstruir o painel. Confira a conexão e tente atualizar apenas a página; nenhum registro foi alterado.');
   }catch(e){failures++;notice('Erro ao reconstruir os cartões: '+String(e?.message||e).slice(0,140));w.console?.error?.('SIGMA recuperação do painel',e)}
   finally{recovering=false}
   return true;
  }
  let stopped=false;
  const timer=w.setInterval(()=>{if(stopped)return;if(!verify()){stopped=true;w.clearInterval(timer)}},5000);
  // Check after a tab change without rewrapping shared save/sync functions.
  d.addEventListener('click',e=>{if(e.target.closest('nav.subnav .nav-item'))w.setTimeout(verify,1200)});
  w.setTimeout(verify,3500);
  return true;
 }
 frame.addEventListener('load',()=>{bound=false;setTimeout(start,400)});
 let tries=0;const timer=setInterval(()=>{if(start()||++tries>100)clearInterval(timer)},250);
})();