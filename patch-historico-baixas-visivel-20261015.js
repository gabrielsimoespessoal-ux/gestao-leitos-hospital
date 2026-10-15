(()=>{
const frame=document.getElementById('appFrame');if(!frame)return;
let boot=null;
function attach(){
 let w,d;try{w=frame.contentWindow;d=frame.contentDocument}catch(_){return false}
 if(!w||!d||!d.getElementById('tabela-transf-finalizadas')||typeof w.atualizarTabelasTransferencias!=='function')return false;
 if(w.__hsjHistoricoBaixasVisivel20261015)return true;
 w.__hsjHistoricoBaixasVisivel20261015=true;
 const esc=x=>String(x??'');
 function render(){
  const tb=d.getElementById('tabela-transf-finalizadas');if(!tb)return;
  const list=Array.isArray(w.transferenciasFinalizadas)?w.transferenciasFinalizadas:[];
  const tabela=tb.closest('table'),container=tabela?.parentElement;
  if(container){container.style.display='block';container.hidden=false;}
  if(tabela){tabela.style.display='table';tabela.hidden=false;}
  const header=[...d.querySelectorAll('#transferencias h3')].find(e=>e.textContent.includes('Transferências Finalizadas'));
  if(header){
   header.textContent='Transferências Finalizadas (Baixadas) — '+list.length+' registro(s)';
   const group=header.parentElement?.parentElement;
   if(group){
    const btns=[...group.querySelectorAll('button')].filter(b=>/ver\s*\/\s*ocultar transferências finalizadas/i.test(b.textContent));
    btns.forEach(b=>{b.style.display='none';b.disabled=true;});
   }
  }
  // Corrige eventuais botões duplicados e não permite que escondam o histórico.
  [...d.querySelectorAll('#transferencias button')].filter(b=>/ver\s*\/\s*ocultar transferências finalizadas/i.test(b.textContent)).forEach(b=>{b.style.display='none';b.disabled=true;});
  tb.replaceChildren();
  if(!list.length){
   const tr=tb.insertRow(),td=tr.insertCell();td.colSpan=8;td.textContent='Nenhuma baixa confirmada no histórico compartilhado.';td.style.cssText='text-align:center;color:#64748b;padding:12px';return;
  }
  list.forEach(t=>{
   const tr=tb.insertRow();
   const dt=t.dataFinalizacao?new Date(t.dataFinalizacao):null;
   const date=dt&&!isNaN(dt.getTime())?dt.toLocaleString('pt-BR'):t.data||'—';
   const values=[date,t.atendimentoNasc||('Pront: '+esc(t.atendimento||'—')),t.paciente||'—',t.destino||'—',t.perfil||'—',t.statusFinal||'Finalizada / Baixada','DUSV: '+(t.dusv||'—'),'—'];
   values.forEach((value,i)=>{const cell=tr.insertCell();cell.textContent=esc(value);if(i===5)cell.style.cssText='font-weight:600;color:#059669';});
  });
 }
 const original=w.atualizarTabelasTransferencias;
 w.atualizarTabelasTransferencias=function(){const result=original.apply(this,arguments);render();return result};
 render();
 // A sincronização original do Firebase não repinta a tabela de baixadas.
 // Atualizar apenas a interface, sem escrever nem regravar dados de pacientes.
 w.__hsjHistoricoVisualTimer=setInterval(render,1500);
 return true;
}
function start(){if(boot)clearInterval(boot);let n=0;boot=setInterval(()=>{if(attach()||++n>120)clearInterval(boot)},250);attach()}
frame.addEventListener('load',start);start();
})();