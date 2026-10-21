(()=>{
'use strict';
const frame=document.getElementById('appFrame');if(!frame)return;
const style=document.createElement('style');
style.textContent=`
#hsj-tv-toggle{position:fixed;right:14px;top:12px;z-index:2147483000;background:#172b4a;color:white;border:2px solid #93c5fd;border-radius:10px;padding:10px 16px;font:700 14px system-ui;box-shadow:0 4px 18px #0005;cursor:pointer}
#hsj-tv-screen{display:none;position:fixed;inset:0;z-index:2147483001;background:#090f19;color:#edf4ff;font:500 15px/1.25 system-ui,sans-serif;box-sizing:border-box;padding:clamp(8px,1vh,16px);overflow:hidden}
#hsj-tv-screen.active{display:flex;flex-direction:column;gap:6px}
#hsj-tv-screen *{box-sizing:border-box}
#hsj-tv-screen .tv-header{display:flex;justify-content:space-between;align-items:center;gap:16px;flex:0 0 auto;border:2px solid #34455c;border-radius:13px;background:#152237;padding:6px 12px}
#hsj-tv-screen .tv-heading{font-weight:800;font-size:clamp(16px,1.55vw,24px);letter-spacing:.2px}
#hsj-tv-screen .tv-subtitle{color:#b1c4da;font-size:10px}
#hsj-tv-screen .tv-controls{display:flex;align-items:center;gap:10px}
#hsj-tv-screen button{border:1px solid #8094b2;background:#233957;color:#fff;border-radius:8px;padding:6px 10px;font-weight:700;cursor:pointer}
#hsj-tv-screen .tv-clock{font-weight:800;font-size:15px;font-variant-numeric:tabular-nums}
#hsj-tv-screen .tv-sectors{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));grid-auto-rows:minmax(0,auto);align-content:space-evenly;gap:8px;flex:1 1 auto;min-height:0}
#hsj-tv-screen .tv-sector{border:2px solid #536880;border-radius:8px;background:#17263a;padding:5px 7px;min-height:0;display:flex;flex-direction:column;gap:5px}
#hsj-tv-screen .tv-sector-header{display:flex;align-items:center;justify-content:space-between;gap:8px}
#hsj-tv-screen .tv-sector-name{font-weight:800;font-size:clamp(15px,1.55vw,24px)}
#hsj-tv-screen .tv-sector-count{font-size:12px;color:#bfd0e7;white-space:nowrap}
#hsj-tv-screen .tv-beds{display:grid;grid-template-columns:repeat(auto-fill,58px);gap:3px;align-content:start;justify-content:start}
#hsj-tv-screen .tv-bed{aspect-ratio:1/1;min-width:0;border:2px solid #ffffff3d;border-radius:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;padding:2px;font-size:clamp(14px,1.15vw,19px);font-weight:850;letter-spacing:.2px;text-align:center}
#hsj-tv-screen .tv-bed small{font-size:9px;letter-spacing:0;font-weight:750}
#hsj-tv-screen .tv-markers{position:absolute;top:0;left:0;right:0;display:flex;align-items:center;justify-content:center;gap:1px;line-height:1;white-space:nowrap;pointer-events:none}
#hsj-tv-screen .tv-sex{font-size:clamp(8px,1.15vw,15px);color:white;text-shadow:0 1px 2px #000;font-weight:900}
#hsj-tv-screen .tv-iso{font-size:clamp(6px,.65vw,9px);color:#fff;background:#b91c1c;padding:1px;font-weight:900}
#hsj-tv-screen .tv-bed-id{display:block;white-space:nowrap;line-height:1;font-weight:900}
#hsj-tv-screen .tv-bed[data-status=ocupado]{background:#822b39;color:#fff}
#hsj-tv-screen .tv-bed[data-status=disponivel]{background:#145f42;color:#fff}
#hsj-tv-screen .tv-bed[data-status=reservado]{background:#1a5288;color:#fff}
#hsj-tv-screen .tv-bed[data-status=higienizacao]{background:#886117;color:#fff}
#hsj-tv-screen .tv-bed[data-status=bloqueado]{background:#4c3a70;color:#fff}
#hsj-tv-screen .tv-bed[data-status=outro]{background:#475569;color:#fff}
#hsj-tv-screen .tv-footer{flex:0 0 auto;border:2px solid #4e6684;background:#142238;border-radius:9px;padding:4px 7px}
#hsj-tv-screen .tv-footer-title{font-weight:800;margin-bottom:3px;font-size:12px}
#hsj-tv-screen .tv-kpis{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:4px}
#hsj-tv-screen .tv-kpi{border:1px solid #5b7190;border-radius:5px;padding:2px 2px;background:#20324a;text-align:center;min-width:0}
#hsj-tv-screen .tv-kpi span{display:block;color:#cbd8e7;font-size:clamp(9px,.8vw,11px);margin-bottom:0}
#hsj-tv-screen .tv-kpi strong{display:block;font-size:clamp(14px,1.25vw,20px);font-variant-numeric:tabular-nums}
#hsj-tv-screen .tv-legend{display:flex;flex-wrap:wrap;justify-content:center;gap:3px 12px;color:#d3e0f2;font-size:9px}
#hsj-tv-screen .tv-dot{display:inline-block;width:11px;height:11px;border-radius:3px;margin-right:5px}
@media(max-width:650px){#hsj-tv-screen .tv-sectors{grid-template-columns:1fr}#hsj-tv-screen .tv-kpis{grid-template-columns:repeat(4,minmax(0,1fr))}}
`;
document.head.appendChild(style);
const toggle=document.createElement('button');toggle.id='hsj-tv-toggle';toggle.type='button';toggle.textContent='▣ Modo TV';toggle.title='Exibir painel de leitos e indicadores em tela cheia';document.body.appendChild(toggle);
const screen=document.createElement('section');screen.id='hsj-tv-screen';screen.setAttribute('aria-label','Modo TV do painel de leitos');
screen.innerHTML='<header class="tv-header"><div><div class="tv-heading">HOSPITAL SÃO JOSÉ · PAINEL DE LEITOS</div><div class="tv-subtitle">Visualização em tempo real · Somente leitura</div></div><div class="tv-controls"><time class="tv-clock" id="hsj-tv-clock"></time><button type="button" id="hsj-tv-fullscreen">⛶ Tela cheia</button><button type="button" id="hsj-tv-exit">✕ Sair</button></div></header><div class="tv-sectors" id="hsj-tv-sectors"></div><footer class="tv-footer"><div class="tv-footer-title">Indicadores de ocupação</div><div class="tv-kpis" id="hsj-tv-kpis"></div><div class="tv-legend" style="margin-top:3px"><span><i class="tv-dot" style="background:#145f42"></i>Disponível</span><span><i class="tv-dot" style="background:#822b39"></i>Ocupado</span><span><i class="tv-dot" style="background:#1a5288"></i>Reservado</span><span><i class="tv-dot" style="background:#886117"></i>Higienização</span><span><i class="tv-dot" style="background:#4c3a70"></i>Bloqueado</span></div></footer>';
document.body.appendChild(screen);
const sectorsNode=screen.querySelector('#hsj-tv-sectors'),kpiNode=screen.querySelector('#hsj-tv-kpis');
const statuses={disponivel:'Livre',ocupado:'Ocupado',reservado:'Reserva',higienizacao:'Higien.',bloqueado:'Bloqueio'};
let timer=null,last='';
function escapeHtml(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function showClock(){screen.querySelector('#hsj-tv-clock').textContent=new Date().toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'});}
function fit(){
 const cards=[...sectorsNode.querySelectorAll('.tv-sector')];
 if(!cards.length)return;
 const width=sectorsNode.clientWidth,height=sectorsNode.clientHeight;
 const cols=width>=650?2:1;
 const rows=Math.ceil(cards.length/cols);
 const gap=6, available=Math.max(80,height-gap*(rows-1));
 sectorsNode.style.gridTemplateColumns='repeat('+cols+',minmax(0,1fr))';
 sectorsNode.style.gap=gap+'px';
 // Distribuição proporcional: setores com mais leitos recebem mais altura.
 const groups=Array.from({length:rows},(_,i)=>cards.slice(i*cols,(i+1)*cols));
 const weights=groups.map(group=>{
   const maxBeds=Math.max(1,...group.map(card=>card.querySelectorAll('.tv-bed').length));
   return Math.max(1,Math.sqrt(maxBeds));
 });
 const minRow=Math.min(35,available/rows);
 const remainder=Math.max(0,available-minRow*rows);
 const totalWeight=weights.reduce((a,b)=>a+b,0);
 const rowHeights=weights.map(w=>minRow+remainder*w/totalWeight);
 sectorsNode.style.gridTemplateRows=rowHeights.map(v=>v+'px').join(' ');
 sectorsNode.style.alignContent='start';
 cards.forEach((card,i)=>{
  card.style.cssText+=';height:100%;min-height:0;padding:5px 7px;gap:3px;overflow:hidden;box-sizing:border-box';
  const title=card.querySelector('.tv-sector-name');
  if(title)title.style.fontSize=/INTERNO\s*\/\s*FILANTR[OÔ]PICO/i.test(title.textContent)?'clamp(9px,.9vw,13px)':'clamp(11px,1.15vw,17px)';
  const beds=card.querySelector('.tv-beds'),items=[...beds.children];
  if(!items.length)return;
  const rowHeight=rowHeights[Math.floor(i/cols)];
  const sectorWidth=(width-gap*(cols-1))/cols;
  const usableWidth=Math.max(25,sectorWidth-20);
  const usableHeight=Math.max(15,rowHeight-30);
  // Quadrados de uma mesma dimensão, encostados, sem espaçamento entre si.
  let best={size:0,columns:1};
  for(let columns=1;columns<=items.length;columns++){
   const lines=Math.ceil(items.length/columns);
   const side=Math.floor(Math.min(usableWidth/columns,usableHeight/lines));
   if(side>best.size)best={size:side,columns};
  }
  const side=Math.max(7,Math.min(76,best.size));
  beds.style.display='grid';
  beds.style.gridTemplateColumns='repeat('+best.columns+','+side+'px)';
  beds.style.gridAutoRows=side+'px';
  beds.style.gap='0';
  beds.style.justifyContent='start';
  beds.style.alignContent='start';
  beds.style.minHeight='0';
  items.forEach(el=>{
   el.style.width=side+'px';
   el.style.height=side+'px';
   el.style.minWidth='0';
   el.style.minHeight='0';
   el.style.aspectRatio='1/1';
   el.style.padding='0';
   el.style.borderRadius='0';
   el.style.borderWidth='1px';
   el.style.letterSpacing='0';
   el.style.fontSize=Math.max(7,Math.min(22,side*.35))+'px';
   el.style.lineHeight='1';
   el.style.gap='0';el.style.position='relative';el.style.justifyContent='flex-end';el.style.paddingBottom='1px';
  });
  card.querySelectorAll('.tv-bed small').forEach(el=>{
   el.style.fontSize=Math.max(6,Math.min(12,side*.20))+'px';
   el.style.lineHeight='1';
  });
 });
}
function bedDetail(bed,sector,base){
 const data=(base&&bed.prontuario!=null&&base[bed.prontuario])||{};
 const norm=x=>String(x||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
 const precaution=norm(data.precaucao||bed.precaucao);
 const isolated=!!precaution&&!['nenhuma','nenhuma (padrao)','padrao','nao','sem','sem precaucao'].includes(precaution)&&/isolamento|precaucao|contato|goticulas|aeross/.test(precaution);
 const gender=norm(data.sexo||bed.sexo);
 const sex=(gender.startsWith('mascul')||gender==='m')?'♂':(gender.startsWith('feminin')||gender==='f')?'♀':'';
 return {sex,isolated};
}
function render(){
 if(!screen.classList.contains('active'))return;
 showClock();let sectors,base={};
 try{
  const w=frame.contentWindow,d=frame.contentDocument;
  sectors=w?.setoresData;base=w?.basePacientesCadastrados||{};
  if(d){
   let bridge=d.getElementById('hsj-tv-bridge');
   if(!bridge){
    bridge=d.createElement('script');bridge.id='hsj-tv-bridge';
    bridge.textContent="try { window.__hsjTvBridge = function(){ return {setores: (typeof setoresData !== 'undefined' ? setoresData : window.setoresData), base: (typeof basePacientesCadastrados !== 'undefined' ? basePacientesCadastrados : window.basePacientesCadastrados)||{}}; }; } catch(e) { window.__hsjTvBridgeError=String(e); }";
    (d.head||d.documentElement).appendChild(bridge);
   }
   const state=w.__hsjTvBridge?.();
   if(state){if(Array.isArray(state.setores))sectors=state.setores;base=state.base||base;}
  }
 }catch(e){console.warn('Modo TV - leitura:',e);sectors=null;base={}}
 if(!Array.isArray(sectors)){sectorsNode.innerHTML='<div style="padding:20px;color:#fff">Aguardando conexão com o painel de leitos… Verifique se o painel principal já carregou.</div>';return}
 try{const snapshot=JSON.stringify(sectors.map(s=>[s.nome,(s.leitos||[]).map(l=>[l.n,l.status,bedDetail(l,s,base)])]));if(snapshot===last)return;last=snapshot;
 const counts={total:0,ocupado:0,disponivel:0,reservado:0,higienizacao:0,bloqueado:0};
 sectorsNode.innerHTML=sectors.map(s=>{
 const beds=Array.isArray(s.leitos)?s.leitos:[];beds.forEach(l=>{counts.total++;if(Object.hasOwn(counts,l.status))counts[l.status]++});
 return '<article class="tv-sector"><div class="tv-sector-header"><div class="tv-sector-name">'+escapeHtml(s.nome)+'</div><div class="tv-sector-count">'+beds.length+' leitos</div></div><div class="tv-beds">'+beds.map(l=>{const status=Object.hasOwn(statuses,l.status)?l.status:'outro';const detail=bedDetail(l,s,base);const markers=(detail.sex?'<b class="tv-sex">'+detail.sex+'</b>':'')+(detail.isolated?'<b class="tv-iso">ISO</b>':'');return '<div class="tv-bed" data-status="'+status+'" title="'+escapeHtml(statuses[status]||l.status)+'"><span class="tv-markers">'+markers+'</span><span class="tv-bed-id">'+escapeHtml(l.n)+'</span></div>'}).join('')+'</div></article>';
 }).join('');
 const capacity=counts.total-counts.bloqueado;const rate=capacity?(counts.ocupado/capacity*100).toLocaleString('pt-BR',{maximumFractionDigits:1})+'%':'—';
 const vals=[['Total',counts.total],['Ocupados',counts.ocupado],['Disponíveis',counts.disponivel],['Reservados',counts.reservado],['Higienização',counts.higienizacao],['Bloqueados',counts.bloqueado],['Ocupação',rate]];
 kpiNode.innerHTML=vals.map(([k,v])=>'<div class="tv-kpi"><span>'+k+'</span><strong>'+v+'</strong></div>').join('');
 requestAnimationFrame(fit);
 }catch(e){console.error('Erro ao renderizar Modo TV:',e);sectorsNode.innerHTML='<div style="color:#fff;padding:20px">Falha na exibição dos leitos: '+escapeHtml(e.message||e)+'</div>';last='';}
}
async function exit(){screen.classList.remove('active');toggle.style.display='';clearInterval(timer);timer=null;last='';if(document.fullscreenElement===screen){try{await document.exitFullscreen()}catch(_){}}}
toggle.addEventListener('click',()=>{toggle.style.display='none';screen.classList.add('active');render();timer=setInterval(render,3000)});
screen.querySelector('#hsj-tv-exit').addEventListener('click',exit);
screen.querySelector('#hsj-tv-fullscreen').addEventListener('click',async()=>{try{if(document.fullscreenElement===screen)await document.exitFullscreen();else await screen.requestFullscreen()}catch(e){console.warn('Tela cheia não disponível:',e)}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&screen.classList.contains('active')&&!document.fullscreenElement)exit()});
document.addEventListener('fullscreenchange',()=>{if(screen.classList.contains('active'))requestAnimationFrame(fit)});
window.addEventListener('resize',()=>{if(screen.classList.contains('active'))requestAnimationFrame(fit)});
})();
