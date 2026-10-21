(()=>{
'use strict';
const frame=document.getElementById('appFrame');if(!frame)return;
const style=document.createElement('style');
style.textContent=`
#hsj-tv-toggle{position:fixed;right:14px;top:12px;z-index:2147483000;background:#172b4a;color:white;border:2px solid #93c5fd;border-radius:10px;padding:10px 16px;font:700 14px system-ui;box-shadow:0 4px 18px #0005;cursor:pointer}
#hsj-tv-screen{display:none;position:fixed;inset:0;z-index:2147483001;background:#090f19;color:#edf4ff;font:500 15px/1.25 system-ui,sans-serif;box-sizing:border-box;padding:clamp(12px,1.5vh,26px);overflow:hidden}
#hsj-tv-screen.active{display:flex;flex-direction:column;gap:12px}
#hsj-tv-screen *{box-sizing:border-box}
#hsj-tv-screen .tv-header{display:flex;justify-content:space-between;align-items:center;gap:16px;flex:0 0 auto;border:2px solid #34455c;border-radius:13px;background:#152237;padding:12px 18px}
#hsj-tv-screen .tv-heading{font-weight:800;font-size:clamp(21px,2.2vw,34px);letter-spacing:.2px}
#hsj-tv-screen .tv-subtitle{color:#b1c4da;font-size:13px}
#hsj-tv-screen .tv-controls{display:flex;align-items:center;gap:10px}
#hsj-tv-screen button{border:1px solid #8094b2;background:#233957;color:#fff;border-radius:8px;padding:9px 13px;font-weight:700;cursor:pointer}
#hsj-tv-screen .tv-clock{font-weight:800;font-size:19px;font-variant-numeric:tabular-nums}
#hsj-tv-screen .tv-sectors{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));grid-auto-rows:minmax(0,auto);align-content:space-evenly;gap:12px;flex:1 1 auto;min-height:0}
#hsj-tv-screen .tv-sector{border:2px solid #536880;border-radius:12px;background:#17263a;padding:12px 14px;min-height:0;display:flex;flex-direction:column;gap:8px}
#hsj-tv-screen .tv-sector-header{display:flex;align-items:center;justify-content:space-between;gap:8px}
#hsj-tv-screen .tv-sector-name{font-weight:800;font-size:clamp(15px,1.55vw,24px)}
#hsj-tv-screen .tv-sector-count{font-size:12px;color:#bfd0e7;white-space:nowrap}
#hsj-tv-screen .tv-beds{display:grid;grid-template-columns:repeat(auto-fit,minmax(68px,1fr));gap:7px;align-content:start}
#hsj-tv-screen .tv-bed{min-height:43px;border:2px solid #ffffff3d;border-radius:9px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;padding:4px 2px;font-size:clamp(14px,1.15vw,19px);font-weight:850;letter-spacing:.2px;text-align:center}
#hsj-tv-screen .tv-bed small{font-size:9px;letter-spacing:0;font-weight:750}
#hsj-tv-screen .tv-bed[data-status=ocupado]{background:#822b39;color:#fff}
#hsj-tv-screen .tv-bed[data-status=disponivel]{background:#145f42;color:#fff}
#hsj-tv-screen .tv-bed[data-status=reservado]{background:#1a5288;color:#fff}
#hsj-tv-screen .tv-bed[data-status=higienizacao]{background:#886117;color:#fff}
#hsj-tv-screen .tv-bed[data-status=bloqueado]{background:#4c3a70;color:#fff}
#hsj-tv-screen .tv-bed[data-status=outro]{background:#475569;color:#fff}
#hsj-tv-screen .tv-footer{flex:0 0 auto;border:2px solid #4e6684;background:#142238;border-radius:13px;padding:12px}
#hsj-tv-screen .tv-footer-title{font-weight:800;margin-bottom:10px;font-size:19px}
#hsj-tv-screen .tv-kpis{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:8px}
#hsj-tv-screen .tv-kpi{border:1px solid #5b7190;border-radius:9px;padding:8px 4px;background:#20324a;text-align:center;min-width:0}
#hsj-tv-screen .tv-kpi span{display:block;color:#cbd8e7;font-size:clamp(10px,1vw,14px);margin-bottom:3px}
#hsj-tv-screen .tv-kpi strong{display:block;font-size:clamp(20px,2vw,33px);font-variant-numeric:tabular-nums}
#hsj-tv-screen .tv-legend{display:flex;flex-wrap:wrap;justify-content:center;gap:8px 16px;color:#d3e0f2;font-size:11px}
#hsj-tv-screen .tv-dot{display:inline-block;width:11px;height:11px;border-radius:3px;margin-right:5px}
@media(max-width:650px){#hsj-tv-screen .tv-sectors{grid-template-columns:1fr}#hsj-tv-screen .tv-kpis{grid-template-columns:repeat(4,minmax(0,1fr))}}
`;
document.head.appendChild(style);
const toggle=document.createElement('button');toggle.id='hsj-tv-toggle';toggle.type='button';toggle.textContent='▣ Modo TV';toggle.title='Exibir painel de leitos e indicadores em tela cheia';document.body.appendChild(toggle);
const screen=document.createElement('section');screen.id='hsj-tv-screen';screen.setAttribute('aria-label','Modo TV do painel de leitos');
screen.innerHTML='<header class="tv-header"><div><div class="tv-heading">HOSPITAL SÃO JOSÉ · PAINEL DE LEITOS</div><div class="tv-subtitle">Visualização em tempo real · Somente leitura</div></div><div class="tv-controls"><time class="tv-clock" id="hsj-tv-clock"></time><button type="button" id="hsj-tv-fullscreen">⛶ Tela cheia</button><button type="button" id="hsj-tv-exit">✕ Sair</button></div></header><div class="tv-sectors" id="hsj-tv-sectors"></div><footer class="tv-footer"><div class="tv-footer-title">Indicadores de ocupação</div><div class="tv-kpis" id="hsj-tv-kpis"></div><div class="tv-legend" style="margin-top:9px"><span><i class="tv-dot" style="background:#145f42"></i>Disponível</span><span><i class="tv-dot" style="background:#822b39"></i>Ocupado</span><span><i class="tv-dot" style="background:#1a5288"></i>Reservado</span><span><i class="tv-dot" style="background:#886117"></i>Higienização</span><span><i class="tv-dot" style="background:#4c3a70"></i>Bloqueado</span></div></footer>';
document.body.appendChild(screen);
const sectorsNode=screen.querySelector('#hsj-tv-sectors'),kpiNode=screen.querySelector('#hsj-tv-kpis');
const statuses={disponivel:'Livre',ocupado:'Ocupado',reservado:'Reserva',higienizacao:'Higien.',bloqueado:'Bloqueio'};
let timer=null,last='';
function escapeHtml(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function showClock(){screen.querySelector('#hsj-tv-clock').textContent=new Date().toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'});}
function fit(){
 const cards=Array.from(sectorsNode.children);if(!cards.length)return;
 sectorsNode.style.gridTemplateColumns=window.innerWidth>1500?'repeat(3,minmax(0,1fr))':window.innerWidth<650?'1fr':'repeat(2,minmax(0,1fr))';
 const available=sectorsNode.clientHeight;const rows=Math.ceil(cards.length/(window.innerWidth>1500?3:window.innerWidth<650?1:2));const gap=Number.parseFloat(getComputedStyle(sectorsNode).rowGap)||12;
 const maxCard=Math.max(85,(available-gap*(rows-1))/rows);
 let ratio=1;for(const c of cards){const beds=c.querySelectorAll('.tv-bed').length;const width=c.clientWidth-28;const cols=Math.max(1,Math.floor((width+7)/75));const bedRows=Math.ceil(beds/cols);const required=60+bedRows*50+(bedRows-1)*7;ratio=Math.min(ratio,(maxCard-14)/Math.max(required,1));}
 const density=Math.max(.48,Math.min(1,ratio));screen.style.setProperty('--tv-density',density);
 screen.querySelectorAll('.tv-sector').forEach(c=>{c.style.padding=(12*density)+'px '+(14*density)+'px';c.style.gap=(8*density)+'px'});
 screen.querySelectorAll('.tv-beds').forEach(c=>{c.style.gridTemplateColumns='repeat(auto-fit,minmax('+Math.max(34,68*density)+'px,1fr))';c.style.gap=Math.max(2,7*density)+'px'});
 screen.querySelectorAll('.tv-bed').forEach(c=>{c.style.minHeight=Math.max(22,43*density)+'px';c.style.fontSize=Math.max(10,17*density)+'px';c.style.padding='2px'});
 screen.querySelectorAll('.tv-bed small').forEach(c=>c.style.fontSize=Math.max(7,9*density)+'px');
 screen.querySelectorAll('.tv-sector-name').forEach(c=>c.style.fontSize=Math.max(12,21*density)+'px');
}
function render(){
 if(!screen.classList.contains('active'))return;
 showClock();let sectors;
 try{sectors=frame.contentWindow?.setoresData}catch(_){sectors=null}
 if(!Array.isArray(sectors)){sectorsNode.innerHTML='<div style="padding:20px">Carregando dados do painel de leitos…</div>';return}
 const snapshot=JSON.stringify(sectors.map(s=>[s.nome,(s.leitos||[]).map(l=>[l.n,l.status])]));if(snapshot===last)return;last=snapshot;
 const counts={total:0,ocupado:0,disponivel:0,reservado:0,higienizacao:0,bloqueado:0};
 sectorsNode.innerHTML=sectors.map(s=>{
 const beds=Array.isArray(s.leitos)?s.leitos:[];beds.forEach(l=>{counts.total++;if(Object.hasOwn(counts,l.status))counts[l.status]++});
 return '<article class="tv-sector"><div class="tv-sector-header"><div class="tv-sector-name">'+escapeHtml(s.nome)+'</div><div class="tv-sector-count">'+beds.length+' leitos</div></div><div class="tv-beds">'+beds.map(l=>{const status=Object.hasOwn(statuses,l.status)?l.status:'outro';return '<div class="tv-bed" data-status="'+status+'" title="'+escapeHtml(statuses[status]||l.status)+'"><span>'+escapeHtml(l.n)+'</span><small>'+escapeHtml(statuses[status]||'Outro')+'</small></div>'}).join('')+'</div></article>';
 }).join('');
 const capacity=counts.total-counts.bloqueado;const rate=capacity?(counts.ocupado/capacity*100).toLocaleString('pt-BR',{maximumFractionDigits:1})+'%':'—';
 const vals=[['Total',counts.total],['Ocupados',counts.ocupado],['Disponíveis',counts.disponivel],['Reservados',counts.reservado],['Higienização',counts.higienizacao],['Bloqueados',counts.bloqueado],['Ocupação',rate]];
 kpiNode.innerHTML=vals.map(([k,v])=>'<div class="tv-kpi"><span>'+k+'</span><strong>'+v+'</strong></div>').join('');
 requestAnimationFrame(fit);
}
async function exit(){screen.classList.remove('active');toggle.style.display='';clearInterval(timer);timer=null;last='';if(document.fullscreenElement===screen){try{await document.exitFullscreen()}catch(_){}}}
toggle.addEventListener('click',()=>{toggle.style.display='none';screen.classList.add('active');render();timer=setInterval(render,3000)});
screen.querySelector('#hsj-tv-exit').addEventListener('click',exit);
screen.querySelector('#hsj-tv-fullscreen').addEventListener('click',async()=>{try{if(document.fullscreenElement===screen)await document.exitFullscreen();else await screen.requestFullscreen()}catch(e){console.warn('Tela cheia não disponível:',e)}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&screen.classList.contains('active')&&!document.fullscreenElement)exit()});
document.addEventListener('fullscreenchange',()=>{if(screen.classList.contains('active'))requestAnimationFrame(fit)});
window.addEventListener('resize',()=>{if(screen.classList.contains('active'))requestAnimationFrame(fit)});
})();
