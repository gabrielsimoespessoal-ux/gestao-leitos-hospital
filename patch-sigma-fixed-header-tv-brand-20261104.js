(()=>{
'use strict';
const frame=document.getElementById('appFrame');if(!frame)return;
const outerStyle=document.createElement('style');
outerStyle.id='hsj-sigma-tv-brand-style-20261104';
outerStyle.textContent="#hsj-tv-screen .hsj-sigma-tv-brand{display:flex;gap:9px;align-items:center;min-width:0}#hsj-tv-screen .hsj-sigma-tv-mark{display:block;width:43px;height:43px;object-fit:contain;flex:0 0 43px}#hsj-tv-screen .hsj-sigma-tv-name{display:block;font-size:clamp(14px,1.4vw,23px);line-height:1;font-weight:900;letter-spacing:.9px}#hsj-tv-screen .hsj-sigma-tv-tagline{font-size:clamp(7px,.77vw,10px);color:#cfebff;line-height:1.15}#hsj-tv-screen .hsj-sigma-tv-hospital{font-size:clamp(7px,.7vw,10px);color:#7de5e0;font-weight:700}@media(max-width:700px){#hsj-tv-screen .hsj-sigma-tv-mark{width:32px;height:32px}#hsj-tv-screen .hsj-sigma-tv-tagline{max-width:160px}}";
document.head.appendChild(outerStyle);
const tvLogoUrl=new URL('./sigma-mark.svg?v=1',document.baseURI).href;
function addTvBrand(){
 const screen=document.getElementById('hsj-tv-screen');
 if(!screen)return false;
 const heading=screen.querySelector('.tv-header .tv-heading');
 if(!heading)return !!screen.querySelector('.hsj-sigma-tv-brand');
 const original=heading.parentElement;
 const brand=document.createElement('div');
 brand.className='hsj-sigma-tv-brand';
 const logo=document.createElement('img');
 logo.className='hsj-sigma-tv-mark';logo.alt='SIGMA';logo.src=tvLogoUrl;
 const texts=document.createElement('div');
 texts.innerHTML='<span class="hsj-sigma-tv-name">SIGMA</span><div class="hsj-sigma-tv-tagline">Sistema Inteligente de Gestão e Monitoramento Assistencial</div><div class="hsj-sigma-tv-hospital">Hospital São José · NIR · Painel de Leitos</div>';
 brand.append(logo,texts);original.replaceWith(brand);return true;
}
function installFrame(){
 let w,d;try{w=frame.contentWindow;d=frame.contentDocument}catch{return false}
 if(!w||!d||!d.body||!d.querySelector('body > header.hsj-sigma-head')||!d.querySelector('body > .main-container')||!d.querySelector('nav.subnav.hsj-sigma-side'))return false;
 if(d.getElementById('hsj-sigma-fixed-shell-style-20261104'))return true;
 const style=d.createElement('style');
 style.id='hsj-sigma-fixed-shell-style-20261104';
 style.textContent="\n:root{--hsj-fixed-header-height:86px}\nhtml,body{height:100%!important;max-height:100%!important;overflow:hidden!important;background:#f8fafc!important}\nbody{min-height:0!important;display:block!important}\nbody > header.hsj-sigma-head{\nposition:fixed!important;top:0!important;left:0!important;right:0!important;\nwidth:100%!important;height:var(--hsj-fixed-header-height)!important;min-height:var(--hsj-fixed-header-height)!important;\nz-index:1000!important;box-sizing:border-box!important}\nbody > nav.subnav.hsj-sigma-side{\nposition:fixed!important;top:var(--hsj-fixed-header-height)!important;bottom:0!important;\nheight:calc(100% - var(--hsj-fixed-header-height))!important;overflow-y:auto!important}\nbody:has(nav.hsj-sigma-side)>.main-container{\nmargin-top:var(--hsj-fixed-header-height)!important;\nheight:calc(100% - var(--hsj-fixed-header-height))!important;\nmax-height:calc(100% - var(--hsj-fixed-header-height))!important;\noverflow-y:auto!important;overflow-x:hidden!important;overscroll-behavior-y:contain;\nscrollbar-gutter:stable;box-sizing:border-box!important}\nbody > header.hsj-sigma-head .header-brand{padding-left:100px!important}\n@media(max-width:850px){:root{--hsj-fixed-header-height:76px}}\n@media(max-width:600px){body > header.hsj-sigma-head .header-brand{padding-left:86px!important}body > header.hsj-sigma-head .hsj-sigma-titles small{display:none!important}}\n@media print{\nhtml,body{height:auto!important;max-height:none!important;overflow:visible!important}\nbody > header.hsj-sigma-head,body > nav.subnav.hsj-sigma-side{display:none!important}\nbody:has(nav.hsj-sigma-side)>.main-container{margin:0!important;height:auto!important;max-height:none!important;overflow:visible!important;width:100%!important}}\n";
 d.head.appendChild(style);return true;
}
function retryFrame(){let n=0;const timer=setInterval(()=>{if(installFrame()||++n>=100)clearInterval(timer)},200)}
retryFrame();frame.addEventListener('load',retryFrame);
let n=0;const tvTimer=setInterval(()=>{if(addTvBrand()||++n>=100)clearInterval(tvTimer)},200);addTvBrand();
})();