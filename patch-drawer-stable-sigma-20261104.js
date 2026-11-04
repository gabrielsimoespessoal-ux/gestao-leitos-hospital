(()=>{
 'use strict';
 const frame=document.getElementById('appFrame');if(!frame)return;
 const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function init(){
  let w,d;try{w=frame.contentWindow;d=frame.contentDocument}catch{return false}
  const wrap=d?.getElementById('hsj-drawer-wrap'),body=d?.getElementById('hsj-drawer-body'),panel=d?.getElementById('hsj-drawer'),grid=d?.getElementById('painel-setores-detalhado');
  if(!w||!wrap||!body||!panel||!grid||typeof w.abrirHistoricoPacienteLeito!=='function')return false;
  if(w.__sigmaDrawerStable20261104)return true;
  w.__sigmaDrawerStable20261104=true;
  const style=d.createElement('style');style.id='sigma-drawer-stable-css';style.textContent="\n#hsj-drawer-wrap.sigma-drawer-fixed{z-index:100010!important}\n#hsj-drawer-wrap.sigma-drawer-fixed #hsj-drawer{display:block!important;width:min(700px,100vw)!important;min-width:min(360px,100vw)!important;height:100%!important;overflow-y:auto!important;background:#fff!important}\n#hsj-drawer-wrap.sigma-drawer-fixed #hsj-drawer-body{display:block!important;visibility:visible!important;opacity:1!important;min-height:180px!important;height:auto!important;overflow:visible!important;padding:18px!important;background:white!important}\n#hsj-drawer-wrap.sigma-drawer-fixed #box-form-mov{display:block!important;visibility:visible!important;opacity:1!important;position:relative!important;left:auto!important;top:auto!important;transform:none!important;clip:auto!important;clip-path:none!important;height:auto!important;max-height:none!important;overflow:visible!important;content-visibility:visible!important}\n#hsj-drawer-wrap.sigma-drawer-fixed #box-form-mov .form-grid{display:grid!important;visibility:visible!important;opacity:1!important;grid-template-columns:repeat(2,minmax(0,1fr))!important}\n#hsj-drawer-wrap.sigma-drawer-fixed #box-form-mov .form-group{display:block!important;visibility:visible!important;opacity:1!important}\n#hsj-drawer-wrap.sigma-drawer-fixed #box-form-mov input,#hsj-drawer-wrap.sigma-drawer-fixed #box-form-mov select,#hsj-drawer-wrap.sigma-drawer-fixed #box-form-mov textarea{visibility:visible!important;opacity:1!important;max-width:100%!important}\n#hsj-drawer-wrap.sigma-drawer-fixed #hsj-bed-title{font-size:17px!important}\n#hsj-drawer-wrap.sigma-drawer-fixed #sigma-drawer-context{background:#eff6ff;color:#0f4677;border:1px solid #bfd9f0;padding:12px;margin-bottom:12px;border-radius:9px;font-size:13px;line-height:1.5}\n#hsj-drawer-wrap.sigma-drawer-fixed #sigma-drawer-fail{display:none;background:#fff7ed;color:#92400e;border:1px solid #f59e0b;padding:12px;border-radius:9px;margin-bottom:12px;font-weight:600}\n@media(max-width:650px){#hsj-drawer-wrap.sigma-drawer-fixed #box-form-mov .form-grid{grid-template-columns:1fr!important}}\n";d.head.appendChild(style);
  wrap.classList.add('sigma-drawer-fixed');
  const msg=d.createElement('div');msg.id='sigma-drawer-context';body.prepend(msg);
  const error=d.createElement('div');error.id='sigma-drawer-fail';body.prepend(error);
  let selection=null,lastOpen=0;
  function findBed(setor,leito){
   const s=(w.setoresData||[]).find(s=>s.nome===setor);
   if(!s)return null;
   const l=(s.leitos||[]).find(l=>String(l.n)===String(leito));
   return l?{sector:s,bed:l}:null;
  }
  function verified(){return w.multiusuarioStatus!=='conflito'&&d.getElementById('hsj-bloqueio-conexao')?.style.display==='none'}
  function set(id,value){const el=d.getElementById(id);if(el)el.value=value??''}
  function renderContext(found){
   const title=d.getElementById('hsj-bed-title'),desc=d.getElementById('hsj-bed-desc');
   const {sector,bed}=found;
   if(title)title.textContent='Gerenciar leito '+bed.n;
   if(desc)desc.textContent=sector.nome+' · '+bed.status;
   msg.replaceChildren();
   const heading=d.createElement('strong');heading.textContent=sector.nome+' · Leito '+bed.n;
   const details=d.createElement('div');
   details.textContent='Situação: '+bed.status+(bed.paciente?' | Paciente: '+bed.paciente:'')+(bed.prontuario?' | Prontuário: '+bed.prontuario:'');
   msg.append(heading,details);
  }
  function repair(){
   if(wrap.style.display!=='flex')return;
   const form=d.getElementById('box-form-mov');
   if(!form||!form.querySelector('#mov-setor')||!form.querySelector('#mov-acao')){
    error.style.display='block';error.textContent='Não foi possível localizar o formulário de movimentação. Nenhum dado foi alterado. Feche e atualize o SIGMA.';return;
   }
   if(form.parentElement!==body)body.appendChild(form);
   for(const e of [wrap,panel,body,form]){
    e.hidden=false;e.removeAttribute('inert');
    e.style.setProperty('visibility','visible','important');
    e.style.setProperty('opacity','1','important');
   }
   body.style.setProperty('display','block','important');
   form.style.setProperty('display','block','important');
   form.style.setProperty('content-visibility','visible','important');
   const inner=form.querySelector('.form-grid');
   if(inner){inner.hidden=false;inner.style.setProperty('display','grid','important')}
   const fields=['mov-setor','mov-leito','mov-acao'].map(id=>d.getElementById(id));
   const ok=fields.every(x=>x&&x.getClientRects().length&&x.getBoundingClientRect().height>8);
   error.style.display=ok?'none':'block';
   if(!ok)error.textContent='Os campos de movimentação não ficaram visíveis. Nenhum registro foi alterado. Feche o painel e atualize a página.';
  }
  function open(setor,leito){
   const found=findBed(setor,leito);
   if(!found)return;
   // Visualizar cadastro atual e preservar handlers originais de admissão, reserva e alta.
   if(w.usuarioAtual?.perfil==='Visitante'){w.abrirHistoricoPacienteLeito(setor,leito);return}
   selection={setor,leito};lastOpen=Date.now();
   try{w.abrirHistoricoPacienteLeito(setor,leito)}
   catch(e){w.console?.error?.('Falha na abertura do leito',e)}
   const {bed}=found;
   wrap.style.display='flex';
   renderContext(found);
   const base=w.basePacientesCadastrados?.[bed.prontuario]||{};
   const val=(id,v)=>set(id,v);
   val('mov-setor',setor);
   if(typeof w.atualizarSelectLeitosMov==='function')try{w.atualizarSelectLeitosMov()}catch(e){w.console?.warn?.(e)}
   val('mov-leito',leito);
   // Somente leitura de dados já presentes; estes campos não são gravados aqui.
   val('mov-atendimento',bed.prontuario||'');
   val('mov-paciente',bed.paciente||base.nome||'');
   for(const [id,key] of [['mov-nascimento','nascimento'],['mov-sexo','sexo'],['mov-perfil-vaga','perfil'],['mov-convenio','convenio'],['mov-origem','origem'],['mov-precaucao','precaucao'],['mov-previsao-alta-paciente','previsaoAlta']]){
    if(base[key]!=null)val(id,base[key]);
   }
   repair();
   w.setTimeout(repair,80);w.setTimeout(repair,350);
  }
  // Intercepta somente o clique em um leito do painel central.
  // Não interfere em histórico, botões de salvar nem em transações de indicadores.
  grid.addEventListener('click',e=>{
   const pill=e.target.closest('.leito-pill');if(!pill||!grid.contains(pill))return;
   const sector=pill.closest('.sector-box');
   const sectorName=pill.dataset.recoverSector||sector?.querySelector('.sector-title-row h3')?.textContent?.trim();
   const bedNumber=pill.dataset.recoverBed||[...sector?.querySelectorAll('.leito-pill')||[]].indexOf(pill);
   const s=(w.setoresData||[]).find(x=>x.nome===sectorName);
   const n=pill.dataset.recoverBed||s?.leitos?.[[...sector?.querySelectorAll('.leito-pill')||[]].indexOf(pill)]?.n;
   if(!sectorName||n==null)return;
   // Evento da abertura nativa é substituído por uma única chamada consistente.
   e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
   open(sectorName,String(n));
  },true);
  const observer=new MutationObserver(()=>{if(wrap.style.display==='flex')repair()});
  observer.observe(wrap,{attributes:true,attributeFilter:['style']});
  const timer=w.setInterval(()=>{if(!d.isConnected||frame.contentDocument!==d){w.clearInterval(timer);return}if(wrap.style.display==='flex'&&Date.now()-lastOpen<120000)repair()},1200);
  return true;
 }
 function start(){let tries=0;const t=setInterval(()=>{if(init()||++tries>120)clearInterval(t)},200)}
 frame.addEventListener('load',start);start();
})();