(()=>{
const frame=document.getElementById('appFrame');if(!frame)return;
let timer=null;
function attach(){
 let w,d;try{w=frame.contentWindow;d=frame.contentDocument}catch{return false}
 const wrap=d?.getElementById('hsj-drawer-wrap'),panel=d?.getElementById('hsj-drawer'),body=d?.getElementById('hsj-drawer-body'),form=d?.getElementById('box-form-mov');
 if(!wrap||!panel||!body||!form)return false;
 if(w.__hsjDrawerEstavel20261027)return true;
 w.__hsjDrawerEstavel20261027=true;
 const css=d.createElement('style');css.id='hsj-drawer-estavel-20261027';
 css.textContent='#hsj-drawer-wrap[style*="flex"] #hsj-drawer{display:block!important;visibility:visible!important;opacity:1!important;overflow-y:auto!important;position:relative!important}#hsj-drawer-wrap[style*="flex"] #hsj-drawer-body{display:block!important;visibility:visible!important;opacity:1!important;height:auto!important;max-height:none!important;min-height:350px!important;overflow:visible!important;padding:18px!important;position:relative!important}#hsj-drawer-wrap[style*="flex"] #box-form-mov{display:block!important;visibility:visible!important;opacity:1!important;position:relative!important;height:auto!important;max-height:none!important;content-visibility:visible!important;overflow:visible!important}#hsj-drawer-wrap[style*="flex"] #box-form-mov .form-grid{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;visibility:visible!important;opacity:1!important;height:auto!important}#hsj-drawer-wrap[style*="flex"] #box-form-mov .form-group{display:block!important;visibility:visible!important;opacity:1!important;height:auto!important}#hsj-drawer-wrap[style*="flex"] #box-form-mov input,#hsj-drawer-wrap[style*="flex"] #box-form-mov select,#hsj-drawer-wrap[style*="flex"] #box-form-mov textarea{visibility:visible!important;opacity:1!important}#hsj-drawer-wrap[style*="flex"] #hsj-drawer-body>[data-hsj-repair]{display:block!important} @media(max-width:620px){#hsj-drawer-wrap[style*="flex"] #box-form-mov .form-grid{grid-template-columns:1fr!important}}';
 d.head.appendChild(css);
 const repair=()=>{
  if(wrap.style.display!=='flex')return;
  if(form.parentElement!==body)body.appendChild(form);
  for(const el of [wrap,panel,body,form]){
   el.hidden=false;el.removeAttribute('inert');
   el.style.setProperty('visibility','visible','important');el.style.setProperty('opacity','1','important');
  }
  body.style.setProperty('display','block','important');body.style.setProperty('min-height','350px','important');
  form.style.setProperty('display','block','important');
  form.style.setProperty('content-visibility','visible','important');
  form.style.setProperty('height','auto','important');
  form.style.setProperty('overflow','visible','important');
  const grid=form.querySelector('.form-grid');if(grid){grid.hidden=false;grid.style.setProperty('display','grid','important')}
  for(const el of form.querySelectorAll('.form-group')){el.hidden=false;el.style.setProperty('display','block','important');el.style.setProperty('visibility','visible','important')}
  const critical=['mov-setor','mov-leito','mov-acao'].map(id=>d.getElementById(id));
  const visible=critical.every(el=>el&&el.getClientRects().length>0&&el.getBoundingClientRect().height>8);
  let warning=d.getElementById('hsj-drawer-estavel-warning');
  if(!visible){
    if(!warning){warning=d.createElement('div');warning.id='hsj-drawer-estavel-warning';warning.dataset.hsjRepair='1';warning.style.cssText='display:block!important;padding:14px;border:1px solid #f59e0b;background:#fffbeb;color:#92400e;font:14px Arial;margin:12px';warning.textContent='Os campos do leito não estão visíveis. Não execute nenhuma movimentação. Feche a janela e atualize a página.';body.prepend(warning)}
  }else warning?.remove();
 };
 const earlier=w.abrirHistoricoPacienteLeito;
 if(typeof earlier==='function')w.abrirHistoricoPacienteLeito=function(){const out=earlier.apply(this,arguments);repair();w.requestAnimationFrame(repair);setTimeout(repair,120);return out};
 const observer=new MutationObserver(()=>{if(wrap.style.display==='flex')repair()});
 observer.observe(wrap,{attributes:true,attributeFilter:['style']});
 const interval=w.setInterval(()=>{if(wrap.style.display==='flex')repair()},1000);
 frame.addEventListener('load',()=>{w.clearInterval(interval);observer.disconnect()},{once:true});
 repair();return true;
}
function start(){if(timer)clearInterval(timer);let n=0;timer=setInterval(()=>{if(attach()||++n>100)clearInterval(timer)},250);attach()}
frame.addEventListener('load',start);start();
})();