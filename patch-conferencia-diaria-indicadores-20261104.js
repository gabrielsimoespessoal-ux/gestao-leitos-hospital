(()=>{
'use strict';
const frame=document.getElementById('appFrame');
if(!frame)return;
const TZ='America/Maceio';
const today=()=>{
 const p=new Intl.DateTimeFormat('en-US',{timeZone:TZ,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
 const d={};p.forEach(x=>d[x.type]=x.value);return d.year+'-'+d.month+'-'+d.day;
};
const dateOf=m=>{
 const raw=m.dataIso||m.dataDesfechoObj||m.data||'';
 if(raw&&typeof raw.toDate==='function')return dateOf({dataIso:raw.toDate().toISOString()});
 const s=String(raw);
 const iso=s.match(/^(\d{4})-(\d{2})-(\d{2})(?:T([\d:.]+)(Z|[+-]\d\d:?\d\d)?)?/);
 if(iso){
  if(iso[4]&&iso[5]){
   const dt=new Date(s);if(Number.isFinite(dt.getTime())){
    const p=new Intl.DateTimeFormat('en-US',{timeZone:TZ,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(dt);
    const o={};p.forEach(x=>o[x.type]=x.value);return o.year+'-'+o.month+'-'+o.day;
   }
  }
  return iso[1]+'-'+iso[2]+'-'+iso[3];
 }
 const br=s.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
 return br?br[3]+'-'+br[2]+'-'+br[1]:'';
};
const norm=x=>String(x??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','"':'&quot;',"'":'&#39;'}[c]));
const category=m=>{
 const a=norm(m.acao),ind=norm(m.tipoIndicador);
 if(a.includes('transferencia interna'))return 'Transferência interna';
 if(a.includes('transferencia externa'))return 'Transferência externa';
 if(a.includes('solicitacao de transferencia')||a.includes('cancelamento de transferencia'))return 'Solicitação / cancelamento';
 if(a==='admissao'||a.startsWith('admissao '))return 'Admissão';
 if(a.includes('obito')||a.includes('falecimento'))return 'Óbito';
 if(a.includes('alta hospitalar')||a==='alta'||a.includes('alta a pedido')||a.includes('evasao'))return 'Alta';
 if(a.includes('alta')&&ind.includes('alta'))return 'Alta';
 return 'Outros';
};
const keyDay=(value,delta)=>{
 const dt=new Date(value+'T12:00:00Z');dt.setUTCDate(dt.getUTCDate()+delta);return dt.toISOString().slice(0,10)
};
function init(){
 let w,d;try{w=frame.contentWindow;d=frame.contentDocument}catch{return}
 if(!w||!d||!Array.isArray(w.movimentacoesHistorico)||!d.getElementById('indicadores'))return;
 if(d.getElementById('hsj-indicadores-conferencia-diaria'))return;
 const section=d.getElementById('indicadores');
 const block=d.createElement('section');
 block.id='hsj-indicadores-conferencia-diaria';
 block.style.cssText='margin:12px 0;padding:15px;background:#fff;border:1px solid #b4ccdf;border-radius:10px;color:#193b54';
 block.innerHTML='<h3 style="margin:0 0 5px;font-size:17px">Conferência diária de indicadores</h3>'+
 '<p style="font-size:12px;color:#607086;margin-bottom:10px">Consulte admissões, altas, óbitos e transferências por data, com identificação dos eventos para auditoria. Contagens separadas por confirmação.</p>'+
 '<div style="display:flex;flex-wrap:wrap;gap:9px;align-items:end;margin-bottom:12px">'+
 '<label style="font-size:12px;font-weight:700">Dia para conferência<input type="date" id="hsj-conf-day" style="display:block;padding:8px;border:1px solid #b7cade;border-radius:5px;min-width:165px"></label>'+
 '<button type="button" class="btn" id="hsj-conf-prev">Dia anterior</button><button type="button" class="btn" id="hsj-conf-next">Dia seguinte</button>'+
 '<label style="font-size:12px;font-weight:700">Movimentação<select id="hsj-conf-type" style="display:block;padding:8px;border:1px solid #b7cade;border-radius:5px"><option value="">Todas as 4 categorias</option><option>Admissão</option><option>Alta</option><option>Óbito</option><option>Transferência interna</option><option>Transferência externa</option></select></label>'+
 '<label style="font-size:12px;font-weight:700">Setor<select id="hsj-conf-sector" style="display:block;padding:8px;border:1px solid #b7cade;border-radius:5px;max-width:270px"><option value="">Todos os setores</option></select></label>'+
 '<button type="button" class="btn" id="hsj-conf-csv">Exportar conferência CSV</button><button type="button" class="btn" id="hsj-conf-print">Imprimir</button></div>'+
 '<div id="hsj-conf-summary"></div><div style="margin:8px 0;font-size:12px;color:#63768b" id="hsj-conf-status"></div>'+
 '<div style="overflow-x:auto"><table style="border-collapse:collapse;width:100%;min-width:900px;font-size:12px"><thead><tr style="background:#eaf2f9"><th style="padding:8px;text-align:left">Data e hora</th><th style="padding:8px;text-align:left">Paciente</th><th style="padding:8px;text-align:left">Prontuário</th><th style="padding:8px;text-align:left">Movimentação</th><th style="padding:8px;text-align:left">Setor / origem</th><th style="padding:8px;text-align:left">Destino</th><th style="padding:8px;text-align:left">Classificação</th><th style="padding:8px;text-align:left">Indicador</th></tr></thead><tbody id="hsj-conf-rows"></tbody></table></div>';
 const anchor=section.querySelector('#hsj-indicadores-auditaveis')||section.querySelector('.page-header');
 if(anchor)anchor.after(block);else section.prepend(block);
 const get=id=>block.querySelector('#'+id);
 get('hsj-conf-day').value=today();
 get('hsj-conf-prev').onclick=()=>{get('hsj-conf-day').value=keyDay(get('hsj-conf-day').value||today(),-1);render()};
 get('hsj-conf-next').onclick=()=>{get('hsj-conf-day').value=keyDay(get('hsj-conf-day').value||today(),1);render()};
 ['hsj-conf-day','hsj-conf-type','hsj-conf-sector'].forEach(id=>get(id).addEventListener('change',render));
 let exportRows=[];
 get('hsj-conf-csv').onclick=()=>{
  const fields=['data','paciente','prontuario','movimentacao','origem','destino','classificacao','indicador'];
  const quote=v=>'"'+String(v??'').replace(/"/g,'""')+'"';
  const content='\ufeff'+[fields.join(';'),...exportRows.map(x=>fields.map(k=>quote(x[k])).join(';'))].join('\r\n');
  const url=URL.createObjectURL(new Blob([content],{type:'text/csv;charset=utf-8'}));
  const a=d.createElement('a');a.href=url;a.download='SIGMA_conferencia_diaria_'+get('hsj-conf-day').value+'.csv';d.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);
 };
 get('hsj-conf-print').onclick=()=>{
  const popup=window.open('','_blank','width=1100,height=850');
  if(!popup){alert('Permita a janela de impressão do SIGMA.');return}
  const clone=block.cloneNode(true);
  [...clone.querySelectorAll('button,input,select')].forEach(n=>n.remove());
  popup.document.write('<!doctype html><html><head><title>Conferência de indicadores</title><meta charset="utf-8"><style>body{font:12px Arial;padding:20px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:5px;text-align:left}</style></head><body><h2>Conferência diária: '+esc(get('hsj-conf-day').value)+'</h2>'+clone.innerHTML+'</body></html>');
  popup.document.close();popup.focus();popup.print();
 };
 function render(){
  const value=get('hsj-conf-day').value||today(),rows=w.movimentacoesHistorico||[];
  const dayRows=rows.filter(m=>dateOf(m)===value);
  const sectors=[...new Set(dayRows.flatMap(m=>[m.origem,m.destino,m.setor]).map(x=>String(x||'').replace(/\s+\(Leito.*$/i,'').trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'pt-BR'));
  const sector=get('hsj-conf-sector'),chosen=sector.value;
  sector.innerHTML='<option value="">Todos os setores</option>'+sectors.map(x=>'<option value="'+esc(x)+'">'+esc(x)+'</option>').join('');
  sector.value=sectors.includes(chosen)?chosen:'';
  const selected=sector.value,type=get('hsj-conf-type').value;
  const match=dayRows.filter(m=>{
   const cat=category(m);
   return ['Admissão','Alta','Óbito','Transferência interna','Transferência externa'].includes(cat)
    &&(!type||cat===type)
    &&(!selected||[m.origem,m.destino,m.setor].some(v=>norm(v).includes(norm(selected))));
  });
  const metrics=['Admissão','Alta','Óbito','Transferência interna','Transferência externa'];
  const counts=metrics.map(cat=>{
   const relevant=match.filter(m=>category(m)===cat);
   return {cat,total:relevant.length,confirmed:relevant.filter(m=>m.contabilizarIndicadores===true).length,
    excluded:relevant.filter(m=>m.contabilizarIndicadores===false).length,
    legacy:relevant.filter(m=>m.contabilizarIndicadores!==true&&m.contabilizarIndicadores!==false).length};
  });
  get('hsj-conf-summary').innerHTML='<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px">'+counts.map(x=>
   '<div style="background:#f0f6fc;border:1px solid #d4e2ed;border-radius:8px;padding:10px"><b>'+esc(x.cat)+'</b><div style="font-size:23px;font-weight:700">'+x.total+'</div><small>Confirmados: '+x.confirmed+' · Não computados: '+x.excluded+' · Sem confirmação: '+x.legacy+'</small></div>'
  ).join('')+'</div>';
  exportRows=match.map(m=>({
   data:String(m.dataIso||m.dataDesfechoObj||m.data||''),paciente:String(m.paciente||''),
   prontuario:String(m.atendimento||m.prontuario||''),movimentacao:String(m.acao||''),
   origem:String(m.origem||m.setor||''),destino:String(m.destino||''),
   classificacao:String(m.tipoIndicador||'Não classificado'),
   indicador:m.contabilizarIndicadores===true?'Sim':m.contabilizarIndicadores===false?'Não':'Sem confirmação'
  }));
  get('hsj-conf-rows').innerHTML=exportRows.map(row=>'<tr>'+['data','paciente','prontuario','movimentacao','origem','destino','classificacao','indicador'].map(k=>'<td style="border-bottom:1px solid #dce7f1;padding:7px">'+esc(row[k])+'</td>').join('')+'</tr>').join('')||'<tr><td colspan="8" style="text-align:center;padding:12px">Nenhum evento dessas categorias na data e filtros selecionados.</td></tr>';
  get('hsj-conf-status').textContent='Movimentações do dia no histórico: '+dayRows.length+' · Eventos nas categorias selecionadas: '+match.length+' · Atualização automática com os dados sincronizados do SIGMA. Solicitações ainda não concluídas não são contadas como transferências realizadas.';
 }
 render();
 const timer=w.setInterval(()=>{if(!block.isConnected){w.clearInterval(timer);return}if(d.hidden||!d.getElementById('indicadores')?.classList.contains('active'))return;render()},15000);
}
frame.addEventListener('load',()=>setTimeout(init,1300));
setInterval(init,3000);init();
})();