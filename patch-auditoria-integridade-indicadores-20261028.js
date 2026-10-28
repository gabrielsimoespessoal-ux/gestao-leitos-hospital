(()=>{
const frame=document.getElementById('appFrame');if(!frame)return;
function install(){
 let w,d;try{w=frame.contentWindow;d=frame.contentDocument}catch{return}
 if(!w||!d||typeof w.renderizarIndicadores!=='function'||!d.getElementById('indicadores')||w.__hsjAuditSafeguards20261028)return;
 w.__hsjAuditSafeguards20261028=true;
 const norm=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase();
 const iso=m=>{const s=m?.dataIso||m?.dataDesfechoObj;if(!s)return '';const dt=new Date(s);return Number.isFinite(dt.getTime())?new Intl.DateTimeFormat('en-CA',{year:'numeric',month:'2-digit',day:'2-digit',timeZone:'America/Araguaina'}).format(dt):''};
 const types=new Set(['admissao','alta para casa (melhorada)','obito','alta para o internamento','alta a pedido','alta por transferencia','alta com assistencia domiciliar','evasao','cirurgias suspensas','alta administrativa por cirurgia suspensa']);
 const start=d.getElementById('filtro-data-inicio'),end=d.getElementById('filtro-data-fim');
 // Replace stale September defaults only when still exactly at the original hard-coded defaults.
 const now=new Date(),currentMonth=new Intl.DateTimeFormat('en-CA',{year:'numeric',month:'2-digit',timeZone:'America/Araguaina'}).format(now).slice(0,7);
 const today=new Intl.DateTimeFormat('en-CA',{year:'numeric',month:'2-digit',day:'2-digit',timeZone:'America/Araguaina'}).format(now);
 if(start?.value==='2026-09-01'&&end?.value==='2026-09-30'){start.value=currentMonth+'-01';end.value=today;}
 function audit(){
  const all=Array.isArray(w.movimentacoesHistorico)?w.movimentacoesHistorico:[];
  const a=start?.value||'',b=end?.value||'';
  const relevant=all.filter(m=>{let t=iso(m);return t&&(!a||t>=a)&&(!b||t<=b)});
  const missingDate=all.filter(m=>!iso(m));
  const excluded=relevant.filter(m=>m.contabilizarIndicadores===false);
  const undecided=relevant.filter(m=>m.contabilizarIndicadores!==true&&m.contabilizarIndicadores!==false);
  const unclassified=relevant.filter(m=>m.contabilizarIndicadores===true&&!types.has(norm(m.tipoIndicador)));
  const counts=new Map();
  relevant.filter(m=>m.contabilizarIndicadores===true&&types.has(norm(m.tipoIndicador))).forEach(m=>{
   const t=norm(m.tipoIndicador);counts.set(t,(counts.get(t)||0)+1);
  });
  let area=d.getElementById('hsj-auditoria-integridade-20261028');
  if(!area){area=d.createElement('section');area.id='hsj-auditoria-integridade-20261028';area.style.cssText='margin:12px 0;padding:15px;background:#fff;border:2px solid #cbd5e1;border-radius:10px;color:#1e293b';const host=d.getElementById('indicadores');const pos=host.querySelector('#kpi-container');if(pos)pos.before(area);else host.prepend(area);}
  const invalid=a&&b&&a>b;
  const bad=invalid||missingDate.length||undecided.length||unclassified.length;
  area.style.borderColor=bad?'#e6a23c':'#22a06b';
  const heading=d.createElement('h3');heading.style.margin='0 0 8px';heading.textContent='Conferência da integridade dos indicadores';
  const status=d.createElement('p');status.style.margin='0 0 10px';status.textContent=invalid?'ERRO: data inicial posterior à final. Corrija o período.':bad?'ATENÇÃO: existem registros que exigem conferência; não considerar os totais legados como indicadores validados.':'Sem inconsistências de classificação identificadas nos eventos consultados. Indicadores de permanência e ocupação histórica ainda exigem censo diário.';
  const info=d.createElement('div');info.style.cssText='display:flex;gap:14px;flex-wrap:wrap;font-size:13px';
  const metrics=[['Eventos com data no período',relevant.length],['Confirmados e classificados',[...counts.values()].reduce((x,y)=>x+y,0)],['Marcados NÃO',excluded.length],['Sem decisão SIM/NÃO',undecided.length],['SIM sem classificação válida',unclassified.length],['Sem data válida no histórico',missingDate.length]];
  for(const [label,value] of metrics){const el=d.createElement('span');el.textContent=label+': '+value;info.appendChild(el)}
  const note=d.createElement('p');note.style.cssText='font-size:12px;margin:10px 0 0;color:#475569';note.textContent='Esta conferência é somente leitura: não altera pacientes, leitos ou histórico. Não transforma ausência de dados em zero. Uma contagem de eventos confirmados não comprova que o histórico esteja completo.';
  area.replaceChildren(heading,status,info,note);
 }
 const before=w.renderizarIndicadores;
 w.renderizarIndicadores=function(...args){try{return before.apply(this,args)}finally{audit()}};
 const selected=d.getElementById('indicadores');if(selected?.classList.contains('active')){try{w.renderizarIndicadores()}catch(e){console.warn('Falha no cálculo legado; conferência disponível',e);audit()}}
}
frame.addEventListener('load',()=>setTimeout(install,600));
let tries=0;const timer=setInterval(()=>{install();if(frame.contentWindow?.__hsjAuditSafeguards20261028||++tries>100)clearInterval(timer)},250);
})();