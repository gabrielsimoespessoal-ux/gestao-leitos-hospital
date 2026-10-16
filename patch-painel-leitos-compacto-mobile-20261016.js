(()=>{
const frame=document.getElementById('appFrame');if(!frame)return;
let active=false;
function boot(){
 if(active)return;
 let d,w;try{d=frame.contentDocument;w=frame.contentWindow}catch(e){return}
 if(!d||!w||!d.getElementById('painel-setores-detalhado'))return;
 active=true;
 const meta=d.querySelector('meta[name="viewport"]');if(meta)meta.content='width=device-width, initial-scale=1, viewport-fit=cover';
 const style=d.createElement('style');style.id='hsj-mobile-compact-panel-css';
 style.textContent=`
 #painel .page-header{margin-bottom:12px!important;gap:8px;align-items:center}
 #painel .page-header h2{font-size:clamp(18px,2.2vw,23px)!important;margin:0 0 3px!important}
 #painel .page-header p{font-size:12px!important}
 #hsj-leitos-filtros-compactos{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:0 0 12px;padding:10px;background:#fff;border:1px solid #dce6ef;border-radius:11px}
 #hsj-leitos-filtros-compactos input,#hsj-leitos-filtros-compactos select{border:1px solid #cfdae5;background:white;border-radius:9px;padding:10px 12px;min-height:42px;font:inherit;font-size:13px;max-width:100%}
 #hsj-leitos-filtros-compactos input{flex:2;min-width:150px}
 #hsj-leitos-filtros-compactos select{flex:1;min-width:180px}
 #hsj-leitos-filtros-compactos button{border:1px solid #d3deea;border-radius:8px;background:#f4f8fc;min-height:42px;padding:9px 14px;font-weight:600;color:#19446d;cursor:pointer}
 #painel-setores-detalhado{display:grid!important;grid-template-columns:repeat(auto-fit,minmax(min(100%,340px),1fr));gap:12px!important;align-items:start}
 #painel-setores-detalhado .sector-box{width:auto!important;min-width:0!important;margin:0!important;padding:13px!important;background:#fff;border:1px solid #dbe5ef;border-radius:12px;box-shadow:0 3px 12px #17324a0a}
 #painel-setores-detalhado .sector-title-row{gap:8px;margin-bottom:10px!important;align-items:start}
 #painel-setores-detalhado .sector-title-row h3{font-size:15px!important;margin:0 0 3px!important;line-height:1.25}
 #painel-setores-detalhado .sector-title-row p{font-size:11px!important;margin:0!important}
 #painel-setores-detalhado .ocup-badge{font-size:11px!important;padding:5px 8px!important;white-space:nowrap}
 #painel-setores-detalhado .leitos-grid{display:grid!important;grid-template-columns:repeat(auto-fill,minmax(50px,1fr))!important;gap:7px!important;margin:10px 0!important}
 #painel-setores-detalhado .leito-pill{box-sizing:border-box!important;min-width:0!important;width:100%!important;height:45px!important;min-height:45px!important;padding:0 4px!important;margin:0!important;border-radius:9px!important;font-size:13px!important;display:flex!important;align-items:center!important;justify-content:center!important;cursor:pointer;touch-action:manipulation}
 #painel-setores-detalhado .leito-pill:focus-visible{outline:3px solid #2563eb;outline-offset:2px}
 #painel-setores-detalhado .sector-summary{display:flex!important;flex-wrap:wrap!important;gap:6px 12px!important;margin-top:10px!important;padding-top:8px!important;border-top:1px solid #e7edf5!important;font-size:10px!important;line-height:1.3}
 #controles-bloqueio-painel-v1{padding:10px 12px!important;border-radius:10px!important;margin-bottom:12px!important;gap:8px!important}
 #controles-bloqueio-painel-v1 span,#controles-bloqueio-painel-v1 strong{font-size:12px!important}
 #hsj-overview-20261015{margin-top:18px!important}
 @media(max-width:720px){
 html,body{max-width:100%;overflow-x:hidden!important}
 .container,.main-content,.content-wrapper{max-width:100%!important;min-width:0!important}
 .subnav{display:flex!important;flex-wrap:nowrap!important;overflow-x:auto!important;overscroll-behavior-x:contain;gap:5px!important;-webkit-overflow-scrolling:touch;scrollbar-width:thin}
 .subnav .nav-item{white-space:nowrap!important;flex:none!important;padding:11px 13px!important}
 #painel{padding-left:8px!important;padding-right:8px!important;max-width:100%!important}
 #painel .page-header{flex-wrap:wrap!important}
 #painel .page-header .btn{font-size:12px!important;padding:9px 11px!important}
 #hsj-leitos-filtros-compactos{padding:9px!important}
 #hsj-leitos-filtros-compactos input,#hsj-leitos-filtros-compactos select{flex:1 1 100%;min-width:0;width:100%}
 #painel-setores-detalhado{grid-template-columns:repeat(auto-fit,minmax(min(100%,280px),1fr))!important;gap:10px!important}
 #painel-setores-detalhado .sector-box{padding:12px!important}
 #painel-setores-detalhado .leitos-grid{grid-template-columns:repeat(auto-fill,minmax(48px,1fr))!important;gap:7px!important}
 #painel-setores-detalhado .leito-pill{min-height:46px!important;height:46px!important}
 #hsj-overview-20261015{padding:12px!important}
 #hsj-overview-20261015 .kpis{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:7px!important}
 #hsj-overview-20261015 .kpi{padding:9px!important;min-width:0!important}
 #hsj-overview-20261015 .kpi b{font-size:21px!important}
 #hsj-drawer,#hsj-internal-move>section{max-width:100vw!important}
 }
 @media(max-width:390px){#painel-setores-detalhado{grid-template-columns:minmax(0,1fr)!important}}
 `;
 d.head.appendChild(style);
 const painel=d.getElementById('painel'),grid=d.getElementById('painel-setores-detalhado');
 const controls=d.createElement('div');controls.id='hsj-leitos-filtros-compactos';
 controls.innerHTML='<input id="hsj-leitos-pesquisa" type="search" placeholder="Buscar setor ou leito" aria-label="Buscar setor ou leito"><select id="hsj-leitos-setor" aria-label="Selecionar setor"><option value="">Todos os setores</option></select><button type="button" id="hsj-leitos-limpar">Limpar</button>';
 grid.before(controls);
 const input=d.getElementById('hsj-leitos-pesquisa'),select=d.getElementById('hsj-leitos-setor');
 let scheduled=false;
 const norm=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
 function refresh(){
  scheduled=false;
  const cards=[...grid.querySelectorAll('.sector-box')];
  const options=cards.map(c=>c.querySelector('.sector-title-row h3')?.textContent?.trim()).filter(Boolean);
  const selected=select.value;select.innerHTML='<option value="">Todos os setores</option>';
  [...new Set(options)].sort((a,b)=>a.localeCompare(b,'pt-BR')).forEach(x=>{const opt=d.createElement('option');opt.value=x;opt.textContent=x;select.appendChild(opt)});
  if(options.includes(selected))select.value=selected;
  const query=norm(input.value),sector=select.value;
  cards.forEach(c=>{
   const name=c.querySelector('.sector-title-row h3')?.textContent?.trim()||'';
   const beds=[...c.querySelectorAll('.leito-pill')];
   const byName=norm(name).includes(query);
   let visible=0;
   beds.forEach(b=>{
    const match=!query||byName||norm(b.textContent).includes(query);
    if(match)b.style.removeProperty('display');else b.style.setProperty('display','none','important');
    if(match)visible++;
   });
   c.style.display=(!sector||sector===name)&&(!query||byName||visible>0)?'':'none';
  });
 }
 const queue=()=>{if(scheduled)return;scheduled=true;setTimeout(refresh,80)};
 new MutationObserver(queue).observe(grid,{childList:true});
 input.addEventListener('input',refresh);select.addEventListener('change',refresh);
 d.getElementById('hsj-leitos-limpar').onclick=()=>{input.value='';select.value='';refresh()};
 refresh();
}
frame.addEventListener('load',()=>{active=false;setTimeout(boot,220)});
if(frame.contentDocument?.readyState==='complete')boot();else setTimeout(boot,700);
})();