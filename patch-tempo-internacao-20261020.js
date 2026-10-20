(()=>{
'use strict';
// Indicador visual somente leitura: nunca altera cadastros ou dados compartilhados.
const frame=document.getElementById('appFrame');if(!frame)return;
let activeDoc=null,refreshTimer=null,observer=null;
function boot(){
 let w,d;try{w=frame.contentWindow;d=frame.contentDocument}catch(_){return}
 if(!w||!d||!Array.isArray(w.setoresData))return;
 const body=d.getElementById('tabela-pacientes-internos');if(!body)return;
 if(activeDoc===d)return;
 activeDoc=d;
 if(refreshTimer)clearInterval(refreshTimer);
 if(observer)observer.disconnect();
 d.getElementById('hsj-tempo-internacao')?.remove();
 const css=d.createElement('style');
 css.textContent=`
 .hsj-ti-inline{margin-top:6px;max-width:275px;font-size:11px;color:#475569;font-weight:500;line-height:1.5}
 .hsj-ti-label{display:flex;align-items:center;gap:6px;flex-wrap:wrap}
 .hsj-ti-inline strong{font-weight:750}
 .hsj-ti-mini-track{height:6px;border-radius:10px;background:#e6edf4;overflow:hidden;margin-top:5px;max-width:230px}
 .hsj-ti-mini-fill{height:100%;border-radius:10px}
 .hsj-ti-reserved{display:inline-flex;align-items:center;background:#e9f1fc;color:#1c5b8b;border-radius:6px;padding:3px 7px;font-size:11px;font-weight:700}
 `;
 d.head.appendChild(css);
 function dateFrom(value){
  if(!value)return null;
  if(typeof value.toDate==='function')value=value.toDate();
  else if(typeof value.seconds==='number')value=new Date(value.seconds*1000);
  else if(typeof value==='string'&&/^\d{2}\/\d{2}\/\d{4}/.test(value)){
   const parts=value.slice(0,10).split('/').map(Number);
   value=new Date(parts[2],parts[1]-1,parts[0]);
  }
  const dt=value instanceof Date?value:new Date(value);
  return Number.isFinite(dt.getTime())&&dt.getTime()<=Date.now()?dt:null;
 }
 function update(){
  if(!body.isConnected)return;
  const records=w.basePacientesCadastrados||{};
  const occupants=new Map();
  for(const sector of w.setoresData||[])for(const bed of sector.leitos||[]){
   if(!['ocupado','reservado'].includes(bed.status))continue;
   const id=String(bed.prontuario||'').trim();
   // Status por prontuario e leito, sem alterar as estruturas existentes.
   const key=id+'|'+String(sector.nome)+'|'+String(bed.n);
   occupants.set(key,bed.status);
  }
  for(const tr of body.querySelectorAll('tr')){
   if(tr.cells.length<5)continue;
   const cell=tr.cells[1],pr=tr.cells[0].textContent.trim();
   const location=tr.cells[2].textContent||'';
   const status=(tr.cells[3].textContent||'').toLowerCase();
   let label=cell.querySelector('.hsj-ti-inline');
   if(!label){label=d.createElement('div');label.className='hsj-ti-inline';cell.appendChild(label)}
   const isReserved=status.includes('reservado')&&!status.includes('ocupado');
   if(isReserved){
    if(label.dataset.state!=='reserved'){label.replaceChildren();const x=d.createElement('span');x.className='hsj-ti-reserved';x.textContent='◷ Reservado';label.appendChild(x);label.dataset.state='reserved'}
    continue;
   }
   if(!status.includes('ocupado')){label.replaceChildren();label.dataset.state='';continue}
   const admission=dateFrom(records[pr]?.dataAdmissao);
   const days=admission?Math.max(0,Math.floor((Date.now()-admission.getTime())/86400000)):null;
   const state=days===null?'unknown':String(days);
   if(label.dataset.state===state)continue;
   label.dataset.state=state;label.replaceChildren();
   const line=d.createElement('div');line.className='hsj-ti-label';
   if(days===null){line.textContent='Tempo de internação: data não registrada';label.appendChild(line);continue}
   const color=days<=5?'#18a66b':days<=14?'#f5af13':'#ef4557';
   line.append('Tempo de internação: ');
   const count=d.createElement('strong');count.textContent=days+' '+(days===1?'dia':'dias');count.style.color=color;
   line.appendChild(count);
   const track=d.createElement('div');track.className='hsj-ti-mini-track';
   const fill=d.createElement('div');fill.className='hsj-ti-mini-fill';fill.style.background=color;fill.style.width=Math.min(100,Math.max(4,days/30*100))+'%';track.appendChild(fill);
   label.append(line,track);
  }
 }
 let queued=false;
 function schedule(){if(queued)return;queued=true;setTimeout(()=>{queued=false;update()},110)}
 observer=new MutationObserver(schedule);observer.observe(body,{childList:true});
 refreshTimer=setInterval(update,5000);
 update();
}
frame.addEventListener('load',()=>{activeDoc=null;setTimeout(boot,250)});
const retry=setInterval(()=>{boot();if(activeDoc)clearInterval(retry)},350);
})();