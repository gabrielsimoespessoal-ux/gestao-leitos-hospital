(()=>{
const frame=document.getElementById('appFrame');if(!frame)return;
let done=false;
function init(){
 if(done)return;let w,d;try{w=frame.contentWindow;d=frame.contentDocument}catch(e){return}
 if(!w||!d||typeof w.executarEntradaLeitoAtomica!=='function'||typeof w.executarTransferenciaSeguraV20261009!=='function'||!d.getElementById('indicadores'))return;
 done=true;
 const choose=(label)=>w.confirm('INDICADORES HOSPITALARES\n\nDeseja computar esta '+label+' nos indicadores?\n\nOK = SIM / Cancelar = NÃO.\nA movimentação continuará normalmente em ambos os casos.');
 const originalEntry=w.executarEntradaLeitoAtomica;
 w.executarEntradaLeitoAtomica=async function(a){
  const b={...a};
  if(b.acao==='Admissão'&&typeof b.contabilizarIndicadores!=='boolean')b.contabilizarIndicadores=choose('admissão');
  return originalEntry.call(this,b);
 };
 const originalTransfer=w.executarTransferenciaSeguraV20261009;
 w.executarTransferenciaSeguraV20261009=async function(a){
  const b={...a};
  if(typeof b.contabilizarIndicadores!=='boolean'){
   const from=(w.setoresData||[]).filter(s=>(s.leitos||[]).some(l=>l.status==='ocupado'&&String(l.prontuario||'')===String(b.pr||'')));
   const src=from.length===1?from[0].nome:'';
   const fromUTI=/\buti\b/i.test(src),toUTI=/\buti\b/i.test(String(b.setorDestino||''));
   b.contabilizarIndicadores=choose(fromUTI&&!toUTI?'transferência interna (alta da UTI)':'transferência interna');
  }
  return originalTransfer.call(this,b);
 };
 const style=d.createElement('style');style.textContent='#hsj-indicadores-auditaveis{border:1px solid #cbd5e1;background:#fff;border-radius:12px;padding:16px;margin:14px 0}#hsj-indicadores-auditaveis .hsj-kpis-eventos{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:10px;margin:12px 0}#hsj-indicadores-auditaveis .hsj-evento{background:#f7fafc;border:1px solid #dfe7f0;border-radius:9px;padding:12px}#hsj-indicadores-auditaveis .hsj-evento strong{font-size:25px;display:block;color:#0f456f}#hsj-indicadores-auditaveis .hsj-evento small{display:block;color:#475569}';d.head.appendChild(style);
 const fmt=v=>Number(v||0).toLocaleString('pt-BR');
 const norm=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 function draw(){
  const root=d.getElementById('indicadores');if(!root)return;
  let section=d.getElementById('hsj-indicadores-auditaveis');
  if(!section){section=d.createElement('section');section.id='hsj-indicadores-auditaveis';const heading=root.querySelector('.page-header');heading?.after(section);if(!section.isConnected)root.prepend(section)}
  const from=d.getElementById('filtro-data-inicio')?.value||'',to=d.getElementById('filtro-data-fim')?.value||'';
  const selected=[...d.querySelectorAll('#checkboxes-setores-container input:checked')].map(e=>e.value);
  const allSectors=selected.includes('GERAL')||selected.length===0;
  const rows=(w.movimentacoesHistorico||[]).filter(m=>{
   if(m.contabilizarIndicadores===false)return false;
   const dt=String(m.dataIso||m.dataDesfechoObj||'').slice(0,10);
   if(!/^\d{4}-\d{2}-\d{2}$/.test(dt)||from&&dt<from||to&&dt>to)return false;
   return allSectors||selected.some(s=>[m.setor,m.origem,m.destino].some(k=>norm(k).includes(norm(s))));
  });
  let adm=0,alta=0,uti=0,ext=0,death=0,int=0,excluded=(w.movimentacoesHistorico||[]).filter(m=>m.contabilizarIndicadores===false).length;
  for(const m of rows){
   const action=norm(m.acao),source=norm(m.origem||m.setor),destination=norm(m.destino);
   if(action==='admissao')adm++;
   if(/alta hospitalar|alta a pedido/.test(action))alta++;
   if(action.includes('obito'))death++;
   if(action.includes('transferencia externa'))ext++;
   if(action.includes('transferencia interna')){
     int++;
     if((m.altaUTI===true||source.includes('uti'))&&!destination.includes('uti'))uti++;
   }
  }
  const card=(label,value)=>'<div class="hsj-evento"><small>'+label+'</small><strong>'+fmt(value)+'</strong></div>';
  section.innerHTML='<h3 style="margin:0;color:#123f69">Indicadores por eventos confirmados</h3><p style="font-size:12px;color:#52657b;margin:5px 0">Apuração baseada no histórico de movimentações e na opção de contabilização. Alta da UTI não equivale a alta hospitalar. Óbitos são apresentados separadamente.</p><div class="hsj-kpis-eventos">'+card('Admissões',adm)+card('Altas hospitalares',alta)+card('Altas da UTI para enfermaria',uti)+card('Transferências externas',ext)+card('Óbitos',death)+card('Transferências internas',int)+'</div><p style="font-size:11px;color:#64748b;margin:0">Eventos não contabilizados no histórico total: '+fmt(excluded)+'. Os indicadores históricos anteriores podem não ter confirmação explícita registrada. Os demais cálculos legados da aba não foram recalculados por esta atualização.</p>';
 }
 const prior=w.renderizarIndicadores;
 w.renderizarIndicadores=function(){const r=prior.apply(this,arguments);draw();return r};
 draw();
}
frame.addEventListener('load',()=>{done=false;setTimeout(init,450)});
if(frame.contentDocument?.readyState==='complete')init();else setTimeout(init,850);
})();