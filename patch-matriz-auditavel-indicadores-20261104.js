(()=>{
const frame=document.getElementById('appFrame');if(!frame)return;
const norm=x=>String(x||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const date=x=>{const s=String(x.dataIso||x.dataDesfechoObj||x.data||'');const iso=s.match(/^\d{4}-\d{2}-\d{2}/);if(iso)return iso[0];const br=s.match(/^(\d{2})\/(\d{2})\/(\d{4})/);return br?br[3]+'-'+br[2]+'-'+br[1]:''};
const q=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let docRef=null;
function start(){
let w,d;try{w=frame.contentWindow;d=frame.contentDocument}catch{return}
const host=d?.getElementById('indicadores');if(!host||!Array.isArray(w.movimentacoesHistorico))return;
if(docRef===d&&d.getElementById('hsj-matriz-auditavel'))return;docRef=d;
const root=d.createElement('section');root.id='hsj-matriz-auditavel';root.style.cssText='background:white;padding:14px;margin:13px 0;border:1px solid #c7d7e7;border-radius:9px';
root.innerHTML='<h3>Matriz de indicadores — conferência e rastreabilidade</h3><p style="font-size:12px">Apuração por período, usando somente registros confirmados. Métricas que exigem dados externos ou censos completos permanecem pendentes.</p><div id="hsj-matriz-kpis"></div>';
const anchor=host.querySelector('#hsj-indicadores-conferencia-diaria')||host.querySelector('.page-header');anchor?.after(root);
function draw(){
const a=d.getElementById('filtro-data-inicio')?.value||'',b=d.getElementById('filtro-data-fim')?.value||'';
const selected=[...d.querySelectorAll('#checkboxes-setores-container input:checked')].map(el=>el.value),general=!selected.length||selected.includes('GERAL');
const events=(w.movimentacoesHistorico||[]).filter(m=>{const dt=date(m);return dt&&(!a||dt>=a)&&(!b||dt<=b)&&(general||selected.some(s=>[m.setor,m.origem,m.destino].some(v=>norm(v).includes(norm(s)))))});
const adm=events.filter(m=>norm(m.acao)==='admissao'),alta=events.filter(m=>/alta hospitalar|alta a pedido|evasao/.test(norm(m.acao))),ob=events.filter(m=>/obito/.test(norm(m.acao))),ti=events.filter(m=>/transferencia interna/.test(norm(m.acao))),te=events.filter(m=>/transferencia externa/.test(norm(m.acao)));
const confirmed=x=>x.filter(m=>m.contabilizarIndicadores===true).length,unknown=x=>x.filter(m=>typeof m.contabilizarIndicadores!=='boolean').length;
const items=[['Admissões',adm],['Altas hospitalares',alta],['Óbitos',ob],['Transferências internas',ti],['Transferências externas',te]];
const summary=items.map(([n,x])=>({nome:n,valor:confirmed(x),pendentes:unknown(x),eventos:x}));
summary.push({nome:'Altas + transferências externas',valor:confirmed(alta)+confirmed(te),pendentes:unknown([...alta,...te]),eventos:[...alta,...te]});
summary.push({nome:'Altas + transferências externas + óbitos',valor:confirmed(alta)+confirmed(te)+confirmed(ob),pendentes:unknown([...alta,...te,...ob]),eventos:[...alta,...te,...ob]});
const exits=confirmed(alta)+confirmed(te)+confirmed(ob);summary.push({nome:'Mortalidade entre saídas confirmadas',valor:exits?(100*confirmed(ob)/exits).toFixed(2).replace('.',',')+'%':'N/D',pendentes:unknown([...alta,...te,...ob]),eventos:[...alta,...te,...ob]});
const pending=['Óbitos após 24h','Número e taxa de reinternações','Pacientes-dia e taxa de ocupação','Tempo médio de permanência','Giro de leitos','Pacientes residentes ≥ 90 dias','Cirurgias agendadas e realizadas','Suspensões cirúrgicas e taxa','Solicitações de UTI pós-operatória'];
const el=root.querySelector('#hsj-matriz-kpis');
el.innerHTML='<p style="font-size:12px">Período: '+q(a)+' a '+q(b)+' · Eventos encontrados: '+events.length+'</p><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:8px">'+summary.map((x,i)=>'<button type="button" data-audit="'+i+'" style="text-align:left;border:1px solid #dae4ee;border-radius:8px;padding:10px;background:#f5f9ff;cursor:pointer"><b>'+q(x.nome)+'</b><div style="font-size:21px;font-weight:700">'+x.valor+'</div><small>Sem confirmação: '+x.pendentes+' · Ver registros</small></button>').join('')+'</div><p style="font-size:12px;margin-top:9px"><b>Dependem de fonte ou validação adicional:</b> '+pending.map(q).join(' · ')+'</p><div id="hsj-audit-details" style="max-height:280px;overflow:auto"></div>';
el.querySelectorAll('[data-audit]').forEach(btn=>btn.onclick=()=>{
const row=summary[Number(btn.dataset.audit)];
el.querySelector('#hsj-audit-details').innerHTML='<h4>'+q(row.nome)+'</h4><table style="font-size:12px;width:100%"><tr><th>Data</th><th>Prontuário</th><th>Paciente</th><th>Movimentação</th><th>Contabilizar</th></tr>'+row.eventos.map(m=>'<tr>'+[date(m),m.atendimento||'',m.paciente||'',m.acao||'',m.contabilizarIndicadores===true?'Sim':m.contabilizarIndicadores===false?'Não':'Sem confirmação'].map(v=>'<td style="border-bottom:1px solid #eee;padding:5px">'+q(v)+'</td>').join('')+'</tr>').join('')+'</table>'});
}
draw();const t=setInterval(()=>{if(!root.isConnected){clearInterval(t);return}if(d.hidden||!d.getElementById('indicadores')?.classList.contains('active'))return;draw()},8000);
}
frame.addEventListener('load',()=>setTimeout(start,1500));setInterval(start,3500);start();
})();