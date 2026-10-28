(()=>{
const frame=document.getElementById('appFrame');if(!frame)return;
function init(){
 let w,d;try{w=frame.contentWindow;d=frame.contentDocument}catch{return false}
 const wrap=d?.getElementById('hsj-drawer-wrap'),panel=d?.getElementById('hsj-drawer'),body=d?.getElementById('hsj-drawer-body');
 if(!w||!wrap||!panel||!body||typeof w.abrirHistoricoPacienteLeito!=='function')return false;
 if(w.__hsjDrawerUnificado20261028)return true;
 w.__hsjDrawerUnificado20261028=true;
 const css=d.createElement('style');css.textContent='#hsj-drawer-wrap[style*="flex"] #hsj-drawer-body{display:block!important;visibility:visible!important;opacity:1!important;min-height:400px!important;overflow:visible!important}#hsj-drawer-wrap[style*="flex"] #box-form-mov{display:block!important;visibility:visible!important;opacity:1!important;content-visibility:visible!important;min-height:300px!important;height:auto!important;position:static!important;clip-path:none!important;transform:none!important}#hsj-drawer-wrap[style*="flex"] #box-form-mov .form-grid{display:grid!important;visibility:visible!important}';d.head.appendChild(css);
 let busy=false;
 function restore(){
  if(busy||wrap.style.display!=='flex')return;
  busy=true;
  try{
   const form=d.getElementById('box-form-mov');
   let notice=d.getElementById('hsj-drawer-erro-unificado');
   if(!form){
    if(!notice){notice=d.createElement('p');notice.id='hsj-drawer-erro-unificado';body.prepend(notice)}
    notice.textContent='O formulário de gerenciamento não foi encontrado. Não realize movimentações.';
   }else{
    if(form.parentNode!==body)body.appendChild(form);
    for(const el of [body,form]){el.hidden=false;el.removeAttribute('inert');el.style.setProperty('display','block','important');el.style.setProperty('visibility','visible','important');el.style.setProperty('opacity','1','important')}
    const grid=form.querySelector('.form-grid');if(grid){grid.hidden=false;grid.style.setProperty('display','grid','important')}
    for(const g of form.querySelectorAll('.form-group')){g.hidden=false;g.style.setProperty('display','block','important')}
    const key=['mov-setor','mov-leito','mov-acao'].map(id=>d.getElementById(id));
    const valid=key.every(el=>el?.getBoundingClientRect().height>5);
    if(!valid){
     if(!notice){notice=d.createElement('p');notice.id='hsj-drawer-erro-unificado';body.prepend(notice)}
     notice.textContent='Os campos do leito continuam indisponíveis. Não execute movimentações. Feche e atualize a página.';
    }else notice?.remove();
   }
   if(notice)notice.style.cssText='display:block!important;visibility:visible!important;opacity:1!important;background:#fff7ed;color:#92400e;padding:16px;margin:12px;border:2px solid #f59e0b;position:relative;z-index:99';
  }finally{busy=false}
 }
 const open=w.abrirHistoricoPacienteLeito;
 w.abrirHistoricoPacienteLeito=function(...args){const result=open.apply(this,args);w.setTimeout(restore,0);w.setTimeout(restore,120);return result};
 const watch=new MutationObserver(()=>{if(wrap.style.display==='flex')w.setTimeout(restore,0)});
 watch.observe(wrap,{attributes:true,attributeFilter:['style']});
 restore();return true;
}
frame.addEventListener('load',()=>setTimeout(init,350));
let count=0;const timer=setInterval(()=>{if(init()||++count>100)clearInterval(timer)},250);
})();