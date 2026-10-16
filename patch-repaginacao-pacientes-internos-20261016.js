(()=>{
const frame=document.getElementById('appFrame');if(!frame)return;
let started=false;
function init(){
 if(started)return;
 let w,d;try{w=frame.contentWindow;d=frame.contentDocument}catch(_){return}
 if(!w||!d||!d.getElementById('tabela-pacientes-internos')||typeof w.atualizarTabelaPacientesInternos!=='function')return;
 started=true;
 const table=d.getElementById('tabela-pacientes-internos').closest('table'),tbody=d.getElementById('tabela-pacientes-internos');
 if(!table)return;
 const section=tbody.closest('.tab-content')||table.parentElement;
 const header=section.querySelector('.page-header');
 const css=d.createElement('style');css.textContent=`
 #hsj-internos-toolbar{margin:14px 0 18px;background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:17px 18px;box-shadow:0 4px 15px #1a35550a}
 #hsj-internos-summary{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:14px}
 .hsj-interno-counter{background:#f1f6fb;padding:8px 13px;border-radius:9px;font-size:12px;color:#52657b}
 .hsj-interno-counter b{font-size:19px;color:#124d79;margin-right:5px}
 #hsj-internos-controls{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
 #hsj-internos-controls input,#hsj-internos-controls select{font:inherit;border:1px solid #d4deea;border-radius:9px;padding:11px 12px;background:#fff;min-height:43px;box-sizing:border-box}
 #hsj-internos-controls input{flex:2;min-width:210px}
 #hsj-internos-controls select{flex:1;min-width:160px}
 #hsj-internos-controls button{border:1px solid #d3dfea;background:#f8fafc;padding:10px 14px;border-radius:9px;cursor:pointer;font-weight:600;color:#245176}
 #hsj-internos-controls button:hover{background:#edf4fa}
 #internos .table-container, #pacientes-internos .table-container{border:1px solid #e2e8f0;border-radius:13px;overflow:auto;background:white}
 #tabela-pacientes-internos{font-size:13px}
 #tabela-pacientes-internos tr{background:white!important;transition:background .15s}
 #tabela-pacientes-internos tr:nth-child(even){background:#fafcfe!important}
 #tabela-pacientes-internos tr:hover{background:#f1f7fc!important}
 #tabela-pacientes-internos td{padding:15px 13px!important;border-bottom:1px solid #e6edf4!important;vertical-align:middle;line-height:1.45}
 #tabela-pacientes-internos td:nth-child(2) a{font-size:14px;font-weight:700!important;text-decoration:none!important;color:#075a92!important}
 #tabela-pacientes-internos td:nth-child(2) a:hover{text-decoration:underline!important}
 #tabela-pacientes-internos td:nth-child(1){color:#55687c;font-variant-numeric:tabular-nums}
 #tabela-pacientes-internos td:nth-child(4) span{display:inline-block;padding:5px 9px;border-radius:15px;background:#e4f5ee;color:#176044!important;font-size:11px;text-transform:capitalize}
 #tabela-pacientes-internos td:nth-child(5){color:#50657b;font-size:12px}
 #tabela-pacientes-internos .hsj-bed-action{border:0!important;border-radius:8px!important;padding:8px 11px!important;white-space:nowrap}
 #hsj-interno-empty{padding:18px;text-align:center;color:#63748b;display:none}
 @media(max-width:750px){#hsj-internos-toolbar{padding:12px}#hsj-internos-controls input,#hsj-internos-controls select{flex:1 1 100%;min-width:0}#tabela-pacientes-internos td{padding:11px 8px!important}}
 `;d.head.appendChild(css);
 const toolbar=d.createElement('div');toolbar.id='hsj-internos-toolbar';
 toolbar.innerHTML='<div id="hsj-internos-summary"><span class="hsj-interno-counter"><b id="hsj-i-total">—</b> Pacientes listados</span><span class="hsj-interno-counter"><b id="hsj-i-ocupados">—</b> Ocupados</span><span class="hsj-interno-counter"><b id="hsj-i-reservados">—</b> Reservados</span></div><div id="hsj-internos-controls"><input type="search" id="hsj-i-search" placeholder="🔎 Buscar paciente ou prontuário" aria-label="Buscar paciente ou prontuário"><select id="hsj-i-setor" aria-label="Filtrar setor"><option value="">Todos os setores</option></select><button type="button" id="hsj-i-reset">Limpar filtros</button></div>';
 const container=table.closest('.table-container')||table.parentElement;
 container.before(toolbar);
 const empty=d.createElement('div');empty.id='hsj-interno-empty';empty.textContent='Nenhum paciente corresponde aos filtros selecionados.';container.after(empty);
 const search=d.getElementById('hsj-i-search'),sector=d.getElementById('hsj-i-setor');
 const norm=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
 let pending=false;
 function refresh(){
  pending=false;
  const rows=[...tbody.querySelectorAll('tr')].filter(tr=>tr.cells.length>=5);
  const sectors=[...new Set(rows.map(tr=>tr.cells[2]?.textContent?.replace(/\s*\(Leito.*$/i,'').trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'pt-BR'));
  const selected=sector.value;
  sector.innerHTML='<option value="">Todos os setores</option>';
  sectors.forEach(s=>{const opt=d.createElement('option');opt.value=s;opt.textContent=s;sector.appendChild(opt)});
  if(sectors.includes(selected))sector.value=selected;
  const q=norm(search.value),s=sector.value;let visible=0,occupied=0,reserved=0;
  rows.forEach(tr=>{
   const cells=tr.cells;
   const sectorText=(cells[2]?.textContent||'').replace(/\s*\(Leito.*$/i,'').trim();
   const match=(!q||norm((cells[0]?.textContent||'')+' '+(cells[1]?.textContent||'')).includes(q))&&(!s||s===sectorText);
   tr.style.display=match?'':'none';
   if(match){visible++;const status=norm(cells[3]?.textContent);if(status.includes('ocupado'))occupied++;if(status.includes('reservado'))reserved++}
  });
  d.getElementById('hsj-i-total').textContent=visible;
  d.getElementById('hsj-i-ocupados').textContent=occupied;
  d.getElementById('hsj-i-reservados').textContent=reserved;
  empty.style.display=rows.length&&!visible?'block':'none';
 }
 const later=()=>{if(pending)return;pending=true;setTimeout(refresh,80)};
 new MutationObserver(later).observe(tbody,{childList:true,subtree:false});
 search.addEventListener('input',refresh);sector.addEventListener('change',refresh);
 d.getElementById('hsj-i-reset').addEventListener('click',()=>{search.value='';sector.value='';refresh()});
 refresh();
}
frame.addEventListener('load',()=>{started=false;setTimeout(init,150)});
if(frame.contentDocument?.readyState==='complete')init();
else setTimeout(init,600);
})();