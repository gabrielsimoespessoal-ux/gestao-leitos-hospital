(()=>{
 const frame=document.getElementById('appFrame');if(!frame)return;
 function install(){
  let w,d;try{w=frame.contentWindow;d=frame.contentDocument}catch{return}
  if(!w||!d||typeof w.renderizarIndicadores!=='function'||w.__hsjSeparacaoTransferencia20261028)return;
  w.__hsjSeparacaoTransferencia20261028=true;
  const normalize=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  function clean(){
   const host=d.getElementById('indicadores');if(!host)return;
   for(const card of host.querySelectorAll('#kpi-container .kpi-card,#hsj-indicadores-auditaveis .hsj-evento')){
    const label=normalize(card.querySelector('h4,small')?.textContent);
    if(label.includes('transferencia'))card.remove();
   }
   for(const table of host.querySelectorAll('table')){
    const row=table.querySelector('thead tr');if(!row)continue;
    const indexes=[...row.children].map((cell,i)=>normalize(cell.textContent).includes('transferencia')?i:-1).filter(i=>i>=0);
    if(!indexes.length)continue;
    for(const tr of table.querySelectorAll('tr')){
     const cells=[...tr.children];
     for(const i of indexes.sort((a,b)=>b-a))cells[i]?.remove();
    }
   }
  }
  const prior=w.renderizarIndicadores;
  w.renderizarIndicadores=function(...args){const result=prior.apply(this,args);clean();return result};
  clean();
 }
 frame.addEventListener('load',()=>setTimeout(install,450));let n=0;const timer=setInterval(()=>{install();if(frame.contentWindow?.__hsjSeparacaoTransferencia20261028||++n>100)clearInterval(timer)},250);
})();