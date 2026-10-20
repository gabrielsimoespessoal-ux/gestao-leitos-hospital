(()=>{
'use strict';
// Painel somente leitura. Nao altera Firebase, pacientes, reservas ou historicos.
const frame=document.getElementById('appFrame');if(!frame)return;
let lastDoc=null,clock=null;
function start(){
 let d,w;try{d=frame.contentDocument;w=frame.contentWindow}catch(e){return}
 if(!d||!w||!d.getElementById('tabela-pacientes-internos')||!Array.isArray(w.setoresData))return;
 if(lastDoc===d&&d.getElementById('hsj-tempo-internacao'))return;
 lastDoc=d;if(clock)clearInterval(clock);
 const tbody=d.getElementById('tabela-pacientes-internos');
 const table=tbody.closest('table'),container=table?.closest('.table-container')||table?.parentElement;
 if(!container)return;
 const css=d.createElement('style');css.textContent=`
 #hsj-tempo-internacao{margin:22px 0 28px;background:#fff;border:1px solid #dbe5ee;border-radius:14px;padding:20px;box-shadow:0 4px 20px #163a5e0b;color:#17324b}
 #hsj-tempo-internacao .hsj-ti-head{display:flex;justify-content:space-between;gap:18px;align-items:center;flex-wrap:wrap;margin-bottom:16px}
 #hsj-tempo-internacao h3{font-size:21px;margin:0;color:#103c65}
 #hsj-tempo-internacao .hsj-ti-muted{color:#64748b;font-size:12px;margin:5px 0 0}
 #hsj-tempo-internacao .hsj-ti-legend{display:flex;gap:15px;flex-wrap:wrap;font-size:12px;color:#475569}
 #hsj-tempo-internacao .hsj-ti-legend span{display:inline-flex;gap:6px;align-items:center}
 #hsj-tempo-internacao .hsj-ti-dot{width:10px;height:10px;border-radius:50%;display:inline-block}
 #hsj-tempo-internacao .hsj-ti-kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;margin:0 0 16px}
 #hsj-tempo-internacao .hsj-ti-kpi{background:#f5f9fd;border:1px solid #e0eaf3;border-radius:10px;padding:10px 13px}
 #hsj-tempo-internacao .hsj-ti-kpi b{display:block;font-size:22px;color:#07598c}
 #hsj-tempo-internacao .hsj-ti-kpi small{font-size:11px;color:#56697e}
 #hsj-tempo-internacao .hsj-ti-chart{max-height:510px;overflow:auto;border:1px solid #e2e8f0;border-radius:11px}
 #hsj-tempo-internacao .hsj-ti-row{display:grid;grid-template-columns:minmax(175px,30%) minmax(110px,1fr) 88px;align-items:center;gap:14px;padding:10px 13px;border-bottom:1px solid #edf1f6;font-size:12px}
 #hsj-tempo-internacao .hsj-ti-row:last-child{border-bottom:0}
 #hsj-tempo-internacao .hsj-ti-row:nth-child(even){background:#f8fbfe}
 #hsj-tempo-internacao .hsj-ti-name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:650;color:#07598c}
 #hsj-tempo-internacao .hsj-ti-name small{display:block;color:#64748b;font-weight:400;margin-top:3px}
 #hsj-tempo-internacao .hsj-ti-track{height:13px;border-radius:20px;background:#e9eff5;overflow:hidden}
 #hsj-tempo-internacao .hsj-ti-bar{height:100%;border-radius:20px;min-width:0;transition:width .2s}
 #hsj-tempo-internacao .hsj-ti-days{text-align:right;font-weight:750;white-space:nowrap}
 @media(max-width:650px){#hsj-tempo-internacao{padding:12px}#hsj-tempo-internacao .hsj-ti-row{grid-template-columns:minmax(100px,38%) minmax(55px,1fr) 66px;gap:7px;padding:9px 7px;font-size:10px}}
 `;d.head.appendChild(css);
 const panel=d.createElement('section');panel.id='hsj-tempo-internacao';
 panel.innerHTML='<div class="hsj-ti-head"><div><h3>📊 Tempo de Internação dos Pacientes</h3><p class="hsj-ti-muted">Permanência desde a admissão registrada · atualizado automaticamente · reservas não contabilizadas</p></div><div class="hsj-ti-legend"><span><i class="hsj-ti-dot" style="background:#18a66b"></i>0–5 dias</span><span><i class="hsj-ti-dot" style="background:#f5af13"></i>6–14 dias</span><span><i class="hsj-ti-dot" style="background:#ef4557"></i>15+ dias</span></div></div><div class="hsj-ti-kpis"></div><div class="hsj-ti-chart" role="list"></div><p class="hsj-ti-muted">Faixas de cores ilustrativas, não representam classificação clínica de risco. Datas ausentes não são presumidas.</p>';
 container.after(panel);
 const kpis=panel.querySelector('.hsj-ti-kpis'),chart=panel.querySelector('.hsj-ti-chart');
 function parseDate(value){
  if(!value)return null;
  if(typeof value.toDate==='function')value=value.toDate();
  else if(typeof value.seconds==='number')value=new Date(value.seconds*1000);
  else if(typeof value==='string'&&/^\\d{2}\\/\\d{2}\\/\\d{4}/.test(value)){const m=value.match(/^(\\d{2})\\/(\\d{2})\\/(\\d{4})/);value=new Date(+m[3],+m[2]-1,+m[1]);}
  const dt=value instanceof Date?value:new Date(value);
  return Number.isFinite(dt.getTime())&&dt.getTime()<=Date.now()?dt:null;
 }
 function el(tag,cls,txt){const e=d.createElement(tag);if(cls)e.className=cls;if(txt!==undefined)e.textContent=String(txt);return e}
 function render(){
  if(!panel.isConnected)return;
  const lookup=w.basePacientesCadastrados||{},entries=[];
  const q=(d.getElementById('hsj-i-search')?.value||'').toLocaleLowerCase('pt-BR').trim();
  const chosen=d.getElementById('hsj-i-setor')?.value||'';
  for(const sector of w.setoresData||[])for(const bed of sector.leitos||[]){
   if(bed.status!=='ocupado')continue;
   const id=String(bed.prontuario||''),name=String(bed.paciente||lookup[id]?.nome||'Paciente sem nome');
   if(chosen&&sector.nome!==chosen)continue;
   if(q&&!(id+' '+name).toLocaleLowerCase('pt-BR').includes(q))continue;
   const date=parseDate(lookup[id]?.dataAdmissao);
   const days=date?Math.max(0,Math.floor((Date.now()-date.getTime())/86400000)):null;
   entries.push({id,name,sector:sector.nome,bed:bed.n,days});
  }
  entries.sort((a,b)=>(b.days??-1)-(a.days??-1)||a.name.localeCompare(b.name,'pt-BR'));
  const measured=entries.filter(x=>x.days!==null),missing=entries.length-measured.length;
  const mean=measured.length?(measured.reduce((s,x)=>s+x.days,0)/measured.length).toLocaleString('pt-BR',{maximumFractionDigits:1}):'—';
  const blocks=[['Internados',entries.length],['Permanência média',mean==='—'?'—':mean+' dias'],['15 dias ou mais',measured.filter(x=>x.days>=15).length],['Sem data registrada',missing]];
  kpis.replaceChildren();blocks.forEach(([label,value])=>{const cell=el('div','hsj-ti-kpi'),num=el('b','',value),small=el('small','',label);cell.append(num,small);kpis.appendChild(cell)});
  chart.replaceChildren();
  if(!entries.length){chart.appendChild(el('p','hsj-ti-muted','Nenhum paciente ocupado corresponde aos filtros atuais.'));return}
  const max=Math.max(21,...measured.map(x=>x.days));
  for(const e of entries){
   const color=e.days===null?'#94a3b8':e.days<=5?'#18a66b':e.days<=14?'#f5af13':'#ef4557';
   const row=el('div','hsj-ti-row');row.setAttribute('role','listitem');
   const name=el('div','hsj-ti-name','👤 '+e.name),details=el('small','',e.sector+' · Leito '+e.bed);name.title=e.name;name.appendChild(details);
   const track=el('div','hsj-ti-track'),bar=el('div','hsj-ti-bar');bar.style.background=color;bar.style.width=e.days===null?'0%':Math.max(2,100*e.days/max)+'%';track.appendChild(bar);
   const days=el('div','hsj-ti-days',e.days===null?'Sem data':e.days+' '+(e.days===1?'dia':'dias'));days.style.color=color;
   row.append(name,track,days);chart.appendChild(row);
  }
 }
 const observer=new MutationObserver(()=>setTimeout(render,100));observer.observe(tbody,{childList:true});
 ['hsj-i-search','hsj-i-setor','hsj-i-reset'].forEach(id=>d.getElementById(id)?.addEventListener(id==='hsj-i-search'?'input':'change',()=>setTimeout(render,100)));
 d.getElementById('hsj-i-reset')?.addEventListener('click',()=>setTimeout(render,100));
 clock=setInterval(render,5000);render();
}
frame.addEventListener('load',()=>{lastDoc=null;setTimeout(start,700)});
let tries=0;const boot=setInterval(()=>{start();if(++tries>50||lastDoc)clearInterval(boot)},300);
})();