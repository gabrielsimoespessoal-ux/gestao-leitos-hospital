(()=>{const frame=document.getElementById('appFrame');if(!frame)return;let t;
function install(){let w,d;try{w=frame.contentWindow;d=frame.contentDocument}catch{return false}
const wrap=d?.getElementById('hsj-drawer-wrap'),panel=d?.getElementById('hsj-drawer'),body=d?.getElementById('hsj-drawer-body'),form=d?.getElementById('box-form-mov');if(!wrap||!panel||!body||!form||typeof w.abrirHistoricoPacienteLeito!=='function')return false;
if(w.__hsjDrawerScrollReset20261027)return true;w.__hsjDrawerScrollReset20261027=true;
let last='',fixing=false;
function fix(){if(fixing||wrap.style.display!=='flex')return;fixing=true;try{
if(form.parentElement!==body)body.appendChild(form);
for(const el of [body,form]){el.hidden=false;el.style.setProperty('display','block','important');el.style.setProperty('visibility','visible','important');el.style.setProperty('opacity','1','important')}
const grid=form.querySelector('.form-grid');if(grid){grid.hidden=false;grid.style.setProperty('display','grid','important')}
for(const el of form.querySelectorAll('.form-group')){el.hidden=false;el.style.setProperty('display','block','important')}
panel.scrollTop=0;body.scrollTop=0;form.scrollTop=0;
const fields=['mov-setor','mov-leito','mov-acao'].map(id=>d.getElementById(id));
const valid=fields.every(el=>el&&el.getClientRects().length&&el.getBoundingClientRect().height>8);
let alert=d.getElementById('hsj-scroll-repair-warning');
if(!valid){if(!alert){alert=d.createElement('p');alert.id='hsj-scroll-repair-warning';alert.style.cssText='padding:12px;margin:8px;background:#fff7ed;color:#92400e;border:1px solid #f59e0b';alert.textContent='Formulário oculto. Nenhuma ação foi executada. Por segurança, feche e atualize caso os campos não reapareçam.';d.getElementById('hsj-drawer-head')?.after(alert)}}else alert?.remove();
}finally{fixing=false}}
const old=w.abrirHistoricoPacienteLeito;
w.abrirHistoricoPacienteLeito=function(){const res=old.apply(this,arguments);fix();w.requestAnimationFrame(()=>fix());w.setTimeout(fix,80);w.setTimeout(fix,300);return res};
const obs=new MutationObserver(()=>{if(wrap.style.display==='flex'&&last!=='flex'){last='flex';fix();w.setTimeout(fix,100)}else if(wrap.style.display!=='flex')last=wrap.style.display});
obs.observe(wrap,{attributes:true,attributeFilter:['style']});
return true;
}
function start(){if(t)clearInterval(t);let n=0;t=setInterval(()=>{if(install()||++n>120)clearInterval(t)},200);install()}
frame.addEventListener('load',start);start();
})();