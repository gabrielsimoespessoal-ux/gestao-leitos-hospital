(()=>{
const frame=document.getElementById('appFrame');if(!frame)return;
function attach(){
 let w,d;try{w=frame.contentWindow;d=frame.contentDocument}catch{return false}
 if(!w||!d||!d.getElementById('hsj-drawer-wrap')||w.__hsjDrawerRestore20261028)return false;
 w.__hsjDrawerRestore20261028=true;
 const wrap=d.getElementById('hsj-drawer-wrap'),panel=d.getElementById('hsj-drawer'),body=d.getElementById('hsj-drawer-body');
 const form=d.getElementById('box-form-mov');
 if(!panel||!body||!form)return false;
 const style=d.createElement('style');style.textContent='#hsj-drawer-wrap[style*="flex"]{display:flex!important}#hsj-drawer-wrap[style*="flex"] #hsj-drawer{display:flex!important;flex-direction:column!important;overflow-y:auto!important}#hsj-drawer-wrap[style*="flex"] #hsj-drawer-body{display:block!important;flex:1 0 auto!important;min-height:400px!important;overflow:visible!important}#hsj-drawer-wrap[style*="flex"] #box-form-mov{display:block!important;position:static!important;visibility:visible!important;opacity:1!important;transform:none!important;clip:auto!important;clip-path:none!important;content-visibility:visible!important}#hsj-drawer-wrap[style*="flex"] #box-form-mov>.form-grid{display:grid!important}';d.head.appendChild(style);
 function fix(){
  if(wrap.style.display!=='flex')return;
  if(form.parentElement!==body)body.appendChild(form);
  [body,form].forEach(el=>{el.hidden=false;el.removeAttribute('inert');el.style.setProperty('display','block','important');el.style.setProperty('visibility','visible','important');el.style.setProperty('opacity','1','important')});
  const grid=form.querySelector('.form-grid');if(grid){grid.hidden=false;grid.style.setProperty('display','grid','important')}
  form.querySelectorAll('.form-group').forEach(el=>{el.hidden=false;el.style.setProperty('display','block','important')});
  const els=['mov-setor','mov-leito','mov-acao'].map(id=>d.getElementById(id));
  const ok=els.every(el=>el&&el.getBoundingClientRect().height>5&&w.getComputedStyle(el).visibility==='visible');
  let msg=d.getElementById('hsj-drawer-resgate-mensagem');
  if(!ok){if(!msg){msg=d.createElement('div');msg.id='hsj-drawer-resgate-mensagem';msg.style.cssText='padding:15px;margin:12px;background:#fff7ed;border:1px solid #f59e0b;color:#92400e';msg.textContent='Não foi possível exibir os campos do leito. Feche o painel e atualize a página antes de realizar movimentações.';panel.querySelector('#hsj-drawer-head')?.after(msg)}}
  else msg?.remove();
 }
 const old=w.abrirHistoricoPacienteLeito;
 if(typeof old==='function')w.abrirHistoricoPacienteLeito=function(...args){const r=old.apply(this,args);w.setTimeout(fix,0);w.setTimeout(fix,150);return r};
 setInterval(fix,700);fix();return true;
}
frame.addEventListener('load',()=>setTimeout(attach,400));let count=0;const timer=setInterval(()=>{if(attach()||++count>100)clearInterval(timer)},250);
})();