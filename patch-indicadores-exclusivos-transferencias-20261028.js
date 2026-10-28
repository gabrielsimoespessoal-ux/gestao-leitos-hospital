(()=>{
const frame=document.getElementById('appFrame');if(!frame)return;
function attach(){
 let w,d;try{w=frame.contentWindow;d=frame.contentDocument}catch{return false}
 if(!w||!d||!d.getElementById('transferencias')||typeof w.atualizarTabelasTransferencias!=='function')return false;
 if(w.__hsjIndicadoresTransferenciaExterna20261028)return true;
 w.__hsjIndicadoresTransferenciaExterna20261028=true;
 const root=d.createElement('section');root.id='hsj-indicadores-transferencias-externas';root.style.cssText='background:#fff;border:1px solid #cbd5e1;border-radius:12px;padding:16px;margin:18px 0;max-width:100%;overflow:auto;color:#19324d';
 const panel=d.getElementById('transferencias');
 const title=d.createElement('h3');title.textContent='📊 Indicadores exclusivos — Transferências externas concluídas';root.appendChild(title);
 const row=d.createElement('div');row.style.cssText='display:flex;gap:12px;align-items:end;flex-wrap:wrap;margin:12px 0';
 const mk=(label,type)=>{const l=d.createElement('label');l.textContent=label;l.style.cssText='font-size:12px;font-weight:bold';const input=d.createElement('input');input.type=type;input.style.cssText='display:block;padding:9px;border:1px solid #cbd5e1;border-radius:6px';l.appendChild(input);row.appendChild(l);return input};
 const initial=new Date();const today=initial.toLocaleDateString('en-CA',{timeZone:'America/Araguaina'});const start=mk('Data de conclusão — de','date'),end=mk('Até','date');start.value=today.slice(0,7)+'-01';end.value=today;
 const profile=mk('Filtrar perfil','text'),destination=mk('Filtrar instituição/local destino','text');profile.placeholder='Todos os perfis';destination.placeholder='Todos os destinos';
 root.appendChild(row);
 const status=d.createElement('p');status.style.cssText='font-size:12px;color:#475569';root.appendChild(status);
 const cards=d.createElement('div');cards.style.cssText='display:flex;gap:12px;flex-wrap:wrap;margin:12px 0';root.appendChild(cards);
 const tables=d.createElement('div');root.appendChild(tables);
 const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const date=t=>{const z=new Date(t||'');return Number.isFinite(z.getTime())?z:null};
 const day=t=>t?new Intl.DateTimeFormat('en-CA',{timeZone:'America/Araguaina',year:'numeric',month:'2-digit',day:'2-digit'}).format(t):'';
 const norm=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 function table(heading,items,secondary){const section=d.createElement('div');section.style.margin='18px 0';const h=d.createElement('h4');h.textContent=heading;section.appendChild(h);const t=d.createElement('table');t.style.cssText='border-collapse:collapse;width:100%;font-size:13px';const hr=t.insertRow();for(const label of [secondary?'Local de origem':'Categoria','Transferências','Tempo médio (horas)']){const th=d.createElement('th');th.textContent=label;th.style.cssText='padding:9px;text-align:left;background:#edf2f7;border:1px solid #dbe3eb';hr.appendChild(th)}for(const [key,arr] of items){const tr=t.insertRow();const times=arr.map(x=>x.hours).filter(Number.isFinite);for(const value of [key,arr.length,times.length?(times.reduce((a,b)=>a+b,0)/times.length).toFixed(1):'N/D']){const td=tr.insertCell();td.textContent=value;td.style.cssText='padding:9px;border:1px solid #dbe3eb'}}section.appendChild(t);return section}
 function group(rows,key){const map=new Map();rows.forEach(x=>{const k=String(x[key]||'Não informado').trim()||'Não informado';if(!map.has(k))map.set(k,[]);map.get(k).push(x)});return [...map].sort((a,b)=>b[1].length-a[1].length)}
 function render(){
  const list=Array.isArray(w.transferenciasFinalizadas)?w.transferenciasFinalizadas:[];
  const all=list.filter(t=>/finalizada\s*\/\s*baixada/i.test(t.statusFinal||'')&&!!t.setorOrigem&&t.setorOrigem!=='Sem leito ocupado');
  const invalid=all.filter(x=>!date(x.dataFinalizacao));
  const filtered=all.filter(t=>{const finish=date(t.dataFinalizacao);if(!finish)return false;const dateStr=day(finish);return(!start.value||dateStr>=start.value)&&(!end.value||dateStr<=end.value)&&norm(t.perfil).includes(norm(profile.value))&&norm(t.destino).includes(norm(destination.value))});
  const rows=filtered.map(t=>{const finish=date(t.dataFinalizacao),begin=date(t.dataIso)||date(t.data);let hours=begin&&finish?(finish-begin)/36e5:NaN;if(hours<0)hours=NaN;return {perfil:t.perfil||'Não informado',destino:t.destino||'Não informado',origem:t.setorOrigem||'Não informado',hours}});
  const valid=rows.map(x=>x.hours).filter(Number.isFinite);
  const avg=valid.length?valid.reduce((a,b)=>a+b,0)/valid.length:NaN;
  status.textContent='Fonte: somente Transferências Finalizadas (Baixadas) com leito de origem identificado. Solicitações ativas, canceladas e baixas administrativas sem leito não entram nesta apuração. Registros sem data válida de baixa: '+invalid.length+'.';
  cards.replaceChildren();
  for(const [name,val] of [['Transferências externas concluídas',rows.length],['Destinos diferentes',new Set(rows.map(x=>x.destino)).size],['Tempo médio de transferência',Number.isFinite(avg)?avg.toFixed(1)+' h':'N/D'],['Sem dados suficientes de duração',rows.length-valid.length]]){
   const c=d.createElement('div');c.style.cssText='background:#eef4fc;border:1px solid #dbe6f4;border-radius:9px;padding:12px;min-width:180px';const small=d.createElement('div');small.textContent=name;small.style.fontSize='12px';const b=d.createElement('b');b.textContent=String(val);b.style.fontSize='23px';c.append(small,b);cards.appendChild(c)
  }
  tables.replaceChildren(table('Transferências por perfil',group(rows,'perfil')),table('Transferências por instituição / local de destino',group(rows,'destino')),table('Transferências por setor de origem',group(rows,'origem'),true));
  const n=d.createElement('p');n.style.cssText='font-size:12px;color:#52657b';n.textContent='Tempo de transferência = baixa confirmada − solicitação registrada. N/D indica ausência de datas suficientes; não há estimativas. Período filtrado pela data da baixa.';tables.appendChild(n);
 }
 [start,end,profile,destination].forEach(el=>el.addEventListener(el.type==='date'?'change':'input',render));
 const header=panel.querySelector('.page-header');if(header)header.after(root);else panel.prepend(root);
 const original=w.atualizarTabelasTransferencias;
 w.atualizarTabelasTransferencias=function(...args){const result=original.apply(this,args);render();return result};
 render();setInterval(()=>{if(!d.hidden&&panel.classList.contains('active'))render()},12000);
 return true;
}
frame.addEventListener('load',()=>setTimeout(attach,500));let k=0;const timer=setInterval(()=>{if(attach()||++k>100)clearInterval(timer)},250);
})();