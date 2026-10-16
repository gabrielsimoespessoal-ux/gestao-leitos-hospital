(()=>{
const frame=document.getElementById('appFrame');if(!frame)return;let started=false;
function init(){
 if(started)return;let w,d;try{w=frame.contentWindow;d=frame.contentDocument}catch(e){return}
 if(!w||!d||typeof w.renderizarIndicadores!=='function'||!d.getElementById('tabela-indicadores-detalhada'))return;started=true;
 const norm=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
 const isUti=v=>/\buti\b/.test(norm(v));
 const isVirtual=s=>s.virtual||norm(s.nome).includes('espera virtual')||norm(s.tipo).includes('centro cirurgico');
 const dateOf=m=>{const t=m.dataIso||m.dataDesfechoObj;const d=new Date(t);return isFinite(d.getTime())?d:null};
 const dateRange=()=>{const a=d.getElementById('filtro-data-inicio')?.value||'',b=d.getElementById('filtro-data-fim')?.value||'';return [a?new Date(a+'T00:00:00'):new Date('2026-01-01T00:00:00'),b?new Date(b+'T23:59:59.999'):new Date('2026-12-31T23:59:59.999')]};
 const has= (s,t)=>norm(s).includes(t);
 function compute(movements,sector){
  const counts={adm:0,alta:0,uti:0,ob:0,ext:0,int:0,resI:0,resE:0,ev:0,legacy:0,missing:0};
  const [from,to]=dateRange();
  for(const m of movements){
   if(m.contabilizarIndicadores===false)continue;
   const dt=dateOf(m);if(!dt){counts.missing++;continue}if(dt<from||dt>to)continue;
   const a=norm(m.acao),src=m.origem||m.setor||'',dest=m.destino||'';
   const srcMatch=!sector||norm(m.setor).startsWith(norm(sector.nome))||norm(src)===norm(sector.nome);
   const destMatch=!sector||norm(dest)===norm(sector.nome);
   if(!srcMatch&&!destMatch)continue;
   if(m.contabilizarIndicadores!==true)counts.legacy++;
   if(a==='admissao'&&destMatch)counts.adm++;
   else if(a==='alta hospitalar'||a==='alta a pedido'){if(srcMatch)counts.alta++}
   else if(a.includes('obito')){if(srcMatch)counts.ob++}
   else if(a.includes('evasao')){if(srcMatch)counts.ev++}
   else if(a.includes('transferencia externa')){if(srcMatch)counts.ext++}
   else if(a.includes('transferencia interna')){
    if(srcMatch)counts.int++;
    if(srcMatch&&isUti(src)&&!isUti(dest))counts.uti++;
   }else if(a.includes('reserva')&&!a.includes('cancelamento')&&destMatch){
    const all=(w.setoresData||[]).some(s=>norm(s.nome)===norm(src));
    if(all)counts.resI++;else counts.resE++;
   }
  }return counts;
 }
 function format(v){return Number(v||0).toLocaleString('pt-BR')}
 function render(){
  const tbody=d.getElementById('tabela-indicadores-detalhada');const kpi=d.getElementById('kpi-container');if(!tbody||!kpi)return;
  const all=w.movimentacoesHistorico||[];
  const sectors=w.setoresData||[];
  const selected=[...d.querySelectorAll('#checkboxes-setores-container input:checked')].map(x=>x.value);
  const filtered=selected.includes('GERAL')||!selected.length?sectors:sectors.filter(s=>selected.includes(s.nome));
  const total=compute(all,null);
  let warning=d.getElementById('hsj-auditoria-indicadores');if(!warning){warning=d.createElement('div');warning.id='hsj-auditoria-indicadores';kpi.before(warning)}
  warning.style.cssText='padding:12px 14px;margin:12px 0;background:#fff7ed;border:1px solid #fdba74;border-radius:10px;color:#803d08;font-size:13px';
  warning.innerHTML='<b>Indicadores auditados — não usar estimativas como resultados reais.</b> Taxas acumuladas, pacientes-dia acumulados, permanência média e intervalo de substituição dependem de censo diário e histórico completo de permanências; aparecem como “N/D” até existirem dados suficientes. Eventos legados sem confirmação explícita no histórico: <b>'+format(total.legacy)+'</b>. Eventos sem data confiável: <b>'+format(total.missing)+'</b>. Contagens de eventos exigem validação operacional.';
  const current=filtered.filter(s=>!isVirtual(s)).flatMap(s=>s.leitos||[]);
  const occupied=current.filter(l=>l.status==='ocupado').length,capacity=current.filter(l=>l.status!=='bloqueado').length;
  const cells=[['Ocupação atual',capacity?(100*occupied/capacity).toFixed(1)+'%':'N/D'],['Admissões',total.adm],['Altas hospitalares',total.alta],['Altas UTI → outro setor',total.uti],['Transferências externas',total.ext],['Óbitos',total.ob],['Transferências internas',total.int],['Reservas internas',total.resI],['Reservas externas',total.resE],['Média permanência','N/D'],['Ocupação acumulada','N/D'],['Pacientes-dia acumulados','N/D'],['Intervalo de substituição','N/D'],['Índice de rotatividade','N/D']];
  kpi.innerHTML=cells.map(([label,value])=>'<div class="kpi-card"><h4>'+label+'</h4><div class="kpi-value">'+value+'</div></div>').join('');
  const table=tbody.closest('table');if(!table)return;
  const columns=['Setor','Média permanência','Ocupação atual','Ocupação acumulada','Desocupação atual','Desocupação acumulada','Pacientes-dia atual','Pacientes-dia acumulados','Intervalo substituição','Índice rotatividade','Admissões','Reservas internas','Reservas externas','Altas (incl. UTI)','Óbitos','Transferências externas'];
  table.querySelector('thead').innerHTML='<tr>'+columns.map(x=>'<th>'+x+'</th>').join('')+'</tr>';
  tbody.innerHTML='';
  const make=(s)=>{
   const c=compute(all,s),beds=(s.leitos||[]),usable=beds.filter(l=>l.status!=='bloqueado').length,occ=beds.filter(l=>l.status==='ocupado').length;
   const pc=usable?(100*occ/usable).toFixed(1)+'%':'N/D';
   const values=[s.nome,'N/D',pc,'N/D',usable?(100*(usable-occ)/usable).toFixed(1)+'%':'N/D','N/D',occ,'N/D','N/D','N/D',c.adm,c.resI,c.resE,c.alta+c.uti,c.ob,c.ext];
   const tr=d.createElement('tr');values.forEach(v=>{const td=d.createElement('td');td.textContent=v;tr.appendChild(td)});return tr;
  };
  filtered.forEach(s=>tbody.appendChild(make(s)));
  const note=d.createElement('caption');note.textContent='N/D = não determinado com segurança a partir dos registros disponíveis. As altas da UTI e hospitalares são contadas separadamente na síntese superior.';note.style.cssText='caption-side:bottom;text-align:left;padding:9px;font-size:12px';
  table.querySelector('caption')?.remove();table.appendChild(note);
 }
 const original=w.renderizarIndicadores;
 w.renderizarIndicadores=function(){const result=original.apply(this,arguments);render();return result};
 if(d.getElementById('indicadores')?.classList.contains('active'))render();
}
frame.addEventListener('load',()=>{started=false;setTimeout(init,400)});
if(frame.contentDocument?.readyState==='complete')init();else setTimeout(init,750);
})();