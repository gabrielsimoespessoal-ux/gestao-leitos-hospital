(()=>{
const frame=document.getElementById('appFrame');if(!frame)return;
let interval;
function init(){
let w,d;try{w=frame.contentWindow;d=frame.contentDocument}catch(_){return false}
if(!w||!d||typeof w.hsjRegularizarReservaDuplicada!=='function'||!Array.isArray(w.setoresData))return false;
if(d.getElementById('hsj-duplicate-reservation-tool'))return true;
const box=d.createElement('section');box.id='hsj-duplicate-reservation-tool';box.style.cssText='border:1px solid #f59e0b;padding:12px;margin:12px 0;border-radius:9px;background:#fffbeb;display:none';
box.innerHTML='<strong>Reservas duplicadas detectadas</strong><p style="font-size:12px">Confira os dois leitos e libere SOMENTE a reserva antiga, mantendo a reserva correta.</p><div id="hsj-duplicates-list"></div>';
d.getElementById('hsj-drawer-body')?.prepend(box);
let selected=null;
function refresh(){
const pr=d.getElementById('mov-atendimento')?.value||'';
const same=[];
if(pr)w.setoresData.forEach(s=>s.leitos.forEach(l=>{if(l.status==='reservado'&&String(l.prontuario||'')===String(pr))same.push({s,l})}));
box.style.display=same.length>1?'block':'none';box.querySelector('#hsj-duplicates-list').replaceChildren();
if(same.length!==2)return;
const area=box.querySelector('#hsj-duplicates-list');
const summary=d.createElement('p');summary.textContent=same.map(x=>x.s.nome+' / '+x.l.n).join(' E ');area.appendChild(summary);
const select=d.createElement('select');select.style.cssText='width:100%;padding:8px;margin:8px 0';
same.forEach((x,i)=>select.add(new Option('MANTER '+x.s.nome+' / '+x.l.n,i)));
area.appendChild(select);
const button=d.createElement('button');button.className='btn';button.textContent='Regularizar: liberar somente a reserva antiga';button.style.cssText='background:#b45309;color:white;padding:10px';
area.appendChild(button);
button.onclick=async()=>{
 const keep=same[Number(select.value)],old=same[1-Number(select.value)];
 if(!w.confirm('CONFIRMAR:\nMANTER RESERVADO: '+keep.s.nome+' / '+keep.l.n+'\nLIBERAR: '+old.s.nome+' / '+old.l.n+'\nPaciente: '+keep.l.paciente+'\n\nConfira se esta é a situação REAL do paciente antes de confirmar.'))return;
 button.disabled=true;
 try{
 const resp=await w.hsjRegularizarReservaDuplicada({pr,setorManter:keep.s.nome,leitoManter:keep.l.n,setorLiberar:old.s.nome,leitoLiberar:old.l.n,usuario:w.usuarioAtual?.nome||'usuario'});
 if(!resp?.ok)throw Error('Operação não confirmada.');
 w.alert('Regularização confirmada no banco. Atualize o painel para conferir o status dos dois leitos.');
 box.style.display='none';
 }catch(e){w.alert('Regularização bloqueada: '+(e?.message||e))}
 finally{button.disabled=false}
};
}
const opener=w.abrirHistoricoPacienteLeito;
if(typeof opener==='function')w.abrirHistoricoPacienteLeito=function(){const r=opener.apply(this,arguments);setTimeout(refresh,70);return r};
return true;
}
function start(){if(interval)clearInterval(interval);let i=0;interval=setInterval(()=>{if(init()||++i>120)clearInterval(interval)},250);init()}
frame.addEventListener('load',start);start();
})();