(()=>{
const frame=document.getElementById('appFrame');if(!frame)return;
let ready=false;
function init(){
 if(ready)return;let d,w;
 try{d=frame.contentDocument;w=frame.contentWindow}catch(e){return}
 if(!d||!w||!Array.isArray(w.setoresData)||!d.getElementById('painel-setores-detalhado'))return;
 ready=true;
 const css=d.createElement('style');
 css.textContent=`
 #painel-setores-detalhado .leito-pill.hsj-reserva-masculina{background:#dbeafe!important;border:2px solid #2563eb!important;color:#153e86!important}
 #painel-setores-detalhado .leito-pill.hsj-reserva-feminina{background:#fce7f3!important;border:2px solid #db2777!important;color:#831843!important}
 #painel-setores-detalhado .leito-pill.hsj-pediatria{box-shadow:inset 0 0 0 2px #b45309!important}
 #painel-setores-detalhado .leito-pill.hsj-isolamento{outline:3px solid #dc2626!important;outline-offset:1px!important}
 #painel-setores-detalhado .leito-pill.hsj-isolamento.hsj-pediatria{outline:3px solid #dc2626!important}
 #painel-setores-detalhado .leito-pill .hsj-leito-mini{position:absolute;inset:0;display:block;transform:none;pointer-events:none} #painel-setores-detalhado .leito-pill .hsj-leito-mini .hsj-tag{position:absolute;top:-6px;right:-3px} #painel-setores-detalhado .leito-pill .hsj-leito-mini .hsj-tag.iso{right:auto;left:-5px}
 #painel-setores-detalhado .leito-pill{position:relative!important;overflow:visible!important}
 #painel-setores-detalhado .leito-pill .hsj-tag{font-size:9px;line-height:1;border-radius:4px;padding:3px 3px;font-weight:800;background:#f59e0b;color:#3f2205;box-shadow:0 1px 3px #0002}
 #painel-setores-detalhado .leito-pill .hsj-tag.iso{background:#b91c1c;color:white}
 #hsj-legenda-identificacao{background:#fff;border:1px solid #dbe5ef;border-radius:10px;padding:10px 12px;display:flex;gap:8px 14px;align-items:center;flex-wrap:wrap;margin-bottom:12px;font-size:12px;color:#31465b}
 #hsj-legenda-identificacao span{display:inline-flex;gap:6px;align-items:center}
 #hsj-legenda-identificacao i{width:13px;height:13px;display:inline-block;border-radius:3px;border:1px solid #94a3b8}
 #hsj-legenda-identificacao .male{background:#dbeafe;border-color:#2563eb}
 #hsj-legenda-identificacao .female{background:#fce7f3;border-color:#db2777}
 #hsj-legenda-identificacao .ped{background:#fef3c7;border:2px solid #b45309}
 #hsj-legenda-identificacao .iso{background:#fee2e2;border:2px solid #dc2626}
 @media(max-width:720px){#hsj-legenda-identificacao{font-size:11px;gap:8px}#painel-setores-detalhado .leito-pill .hsj-tag{font-size:8px}}
 `;d.head.appendChild(css);
 const grid=d.getElementById('painel-setores-detalhado');
 const legend=d.createElement('div');legend.id='hsj-legenda-identificacao';
 legend.innerHTML='<strong>Identificação rápida:</strong><span><i class="male"></i> Reserva masculina</span><span><i class="female"></i> Reserva feminina</span><span><i class="ped"></i> P = Pediatria</span><span><i class="iso"></i> ISO = Isolamento</span>';
 grid.before(legend);
 const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
 let queued=false;
 function annotate(){
  queued=false;
  const sectors=Array.isArray(w.setoresData)?w.setoresData:[];
  const base=w.basePacientesCadastrados||{};
  const cards=[...grid.querySelectorAll('.sector-box')];
  sectors.forEach(sector=>{
   const card=cards.find(c=>norm(c.querySelector('.sector-title-row h3')?.textContent)===norm(sector.nome));
   if(!card)return;
   const pills=[...card.querySelectorAll('.leito-pill')];
   (sector.leitos||[]).forEach(bed=>{
    const pill=pills.find(p=>String(p.firstChild?.textContent||'').trim()===String(bed.n));
    if(!pill)return;
    pill.classList.remove('hsj-reserva-masculina','hsj-reserva-feminina','hsj-pediatria','hsj-isolamento');
    pill.querySelector('.hsj-leito-mini')?.remove();
    const data=base[bed.prontuario]||{};
    const sexo=norm(data.sexo||bed.sexo);
    if(bed.status==='reservado'){
     if(sexo.startsWith('mascul'))pill.classList.add('hsj-reserva-masculina');
     if(sexo.startsWith('feminin'))pill.classList.add('hsj-reserva-feminina');
    }
    const pediatric=/pediatr|infantil/.test(norm(sector.nome)+' '+norm(sector.tipo)+' '+norm(data.perfil));
    const precaucao=norm(data.precaucao||bed.precaucao);
    const isolated=!!precaucao&&!['nenhuma','nenhuma (padrao)','padrao','não','nao'].includes(precaucao)&&/isolamento|precaucao|contato|goticulas|aeross/.test(precaucao);
    if(pediatric)pill.classList.add('hsj-pediatria');
    if(isolated)pill.classList.add('hsj-isolamento');
    if(pediatric||isolated){
     const badges=d.createElement('span');badges.className='hsj-leito-mini';badges.setAttribute('aria-hidden','true');
     if(pediatric){const a=d.createElement('span');a.className='hsj-tag';a.textContent='P';badges.appendChild(a)}
     if(isolated){const a=d.createElement('span');a.className='hsj-tag iso';a.textContent='ISO';badges.appendChild(a)}
     pill.appendChild(badges);
    }
    const summary=[bed.status==='reservado'&&sexo.startsWith('mascul')?'Reserva masculina':null,bed.status==='reservado'&&sexo.startsWith('feminin')?'Reserva feminina':null,pediatric?'Pediatria':null,isolated?'Isolamento: '+String(data.precaucao||bed.precaucao):null].filter(Boolean).join(' • ');
    if(summary)pill.title=(pill.title||'')+' | '+summary;
   });
  });
 }
 const schedule=()=>{if(queued)return;queued=true;setTimeout(annotate,100)};
 new MutationObserver(schedule).observe(grid,{childList:true,subtree:false});
 annotate();
}
frame.addEventListener('load',()=>{ready=false;setTimeout(init,180)});
if(frame.contentDocument?.readyState==='complete')init();else setTimeout(init,650);
})();