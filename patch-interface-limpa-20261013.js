(()=>{
const frame=document.getElementById('appFrame');if(!frame)return;
frame.addEventListener('load',function(){
try{
 const w=frame.contentWindow,d=frame.contentDocument;
 if(!w||!d||!Array.isArray(w.setoresData))return;
 const css=d.createElement('style');
 css.textContent='#hsj-drawer-wrap{position:fixed;inset:0;background:#0f172a88;z-index:100000;display:none;justify-content:flex-end}#hsj-drawer{width:min(700px,100%);height:100%;overflow:auto;background:white;box-shadow:-8px 0 32px #0002}#hsj-drawer-head{position:sticky;top:0;background:white;padding:18px;border-bottom:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:center;z-index:2}#hsj-drawer-body{padding:18px}#hsj-drawer-body .form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}#hsj-trans-tools{background:#fff;border:1px solid #e2e8f0;padding:16px;margin:12px 0 16px;border-radius:12px}#hsj-trans-tools input,#hsj-trans-tools select{padding:9px;border:1px solid #cbd5e1;border-radius:8px}.hsj-kpi{border:1px solid #e2e8f0;background:#f8fafc;padding:10px 15px;border-radius:9px;min-width:105px;flex:1}.hsj-kpi strong{display:block;font-size:24px;color:#0f2747}#transferencias .table-container{overflow-x:auto;border:1px solid #e2e8f0;border-radius:10px}#transferencias th{background:#f1f5f9;white-space:nowrap}#regra-indicadores-multiusuario{display:none!important}@media(max-width:650px){#hsj-drawer-body .form-grid{grid-template-columns:1fr}}';
 d.head.appendChild(css);
 const nav=[...d.querySelectorAll('.subnav .nav-item')].find(e=>(e.getAttribute('onclick')||'').includes("'movimentacao'"));if(nav)nav.remove();
 const form=d.getElementById('box-form-mov');if(!form)return;
 const wrap=d.createElement('div');wrap.id='hsj-drawer-wrap';
 wrap.innerHTML='<section id="hsj-drawer" role="dialog" aria-modal="true"><header id="hsj-drawer-head"><div><strong id="hsj-bed-title" style="font-size:20px;color:#0f2747">Gerenciar leito</strong><div id="hsj-bed-desc" style="font-size:13px;color:#64748b"></div></div><button type="button" class="btn" id="hsj-bed-close">Fechar ✕</button></header><div id="hsj-drawer-body"></div></section>';
 d.body.appendChild(wrap);d.getElementById('hsj-drawer-body').appendChild(form);
 const fechar=()=>wrap.style.display='none';d.getElementById('hsj-bed-close').onclick=fechar;
 wrap.addEventListener('click',e=>{if(e.target===wrap)fechar()});
 d.addEventListener('keydown',e=>{if(e.key==='Escape')fechar()});
 const oldOpen=w.abrirHistoricoPacienteLeito;
 const btnHist=d.createElement('button');btnHist.className='btn';btnHist.type='button';btnHist.textContent='Ver histórico do leito';btnHist.style.marginBottom='14px';
 d.getElementById('hsj-drawer-body').prepend(btnHist);
 btnHist.onclick=()=>{const a=d.getElementById('mov-setor').value,b=d.getElementById('mov-leito').value;fechar();if(typeof oldOpen==='function')oldOpen.call(w,a,b)};
 w.abrirHistoricoPacienteLeito=function(setor,numero){
   const s=w.setoresData.find(x=>x.nome===setor),l=s?.leitos.find(x=>String(x.n)===String(numero));
   if(!l){w.alert('Leito indisponível; atualize o painel.');return}
   if(w.usuarioAtual?.perfil==='Visitante'){if(typeof oldOpen==='function')oldOpen.call(w,setor,numero);return}
   const set=(id,v)=>{const e=d.getElementById(id);if(e)e.value=v??''};
   ['mov-atendimento','mov-paciente','mov-nascimento','mov-sexo','mov-convenio','mov-origem','mov-perfil-vaga','mov-precaucao','mov-previsao-alta-paciente'].forEach(id=>set(id,''));
   set('mov-setor',setor);if(typeof w.atualizarSelectLeitosMov==='function')w.atualizarSelectLeitosMov();set('mov-leito',numero);
   if(typeof w.ajustarPerfilPorSetor==='function')w.ajustarPerfilPorSetor(setor);
   const b=w.basePacientesCadastrados?.[l.prontuario]||{};
   set('mov-atendimento',l.prontuario||'');set('mov-paciente',l.paciente||b.nome||'');
   set('mov-nascimento',b.nascimento);set('mov-sexo',b.sexo);set('mov-convenio',b.convenio);set('mov-origem',b.origem);
   set('mov-perfil-vaga',b.perfil);set('mov-precaucao',b.precaucao);set('mov-previsao-alta-paciente',b.previsaoAlta);
   set('mov-acao',l.status==='disponivel'?'Admissão':'');
   d.getElementById('mov-acao')?.dispatchEvent(new w.Event('change',{bubbles:true}));
   d.getElementById('hsj-bed-title').textContent='Leito '+numero+' · '+setor;
   d.getElementById('hsj-bed-desc').textContent='Status atual: '+l.status+(l.paciente?' | Paciente: '+l.paciente:'')+'. Salve somente após conferir os dados.';
   wrap.style.display='flex';
 };
 // Bloqueio/alta/transferência usam as funções nativas e protegidas já instaladas.
 const transfer=d.getElementById('transferencias'),tbody=d.getElementById('tabela-transf-ativas');
 if(transfer&&tbody){
  const formTrans=transfer.querySelector('.notes-box');
  const tools=d.createElement('div');tools.id='hsj-trans-tools';
  tools.innerHTML='<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap"><strong style="font-size:18px;color:#0f2747">Transferências em andamento</strong><button class="btn btn-success" type="button" id="hsj-new-trans">+ Nova solicitação</button></div><div id="hsj-trans-kpis" style="display:flex;gap:10px;flex-wrap:wrap;margin:14px 0"></div><div style="display:flex;gap:8px;flex-wrap:wrap"><input id="hsj-trans-query" placeholder="Paciente, prontuário ou destino" style="flex:2;min-width:175px"><select id="hsj-trans-filter" style="flex:1;min-width:155px"><option value="">Todos os status</option><option>Solicitação Pendente</option><option>Vaga Solicitada</option><option>Vaga Liberada</option></select><button type="button" class="btn" id="hsj-trans-reset">Limpar</button></div><small id="hsj-trans-result" style="color:#64748b"></small>';
  transfer.querySelector('.page-header')?.after(tools);
  if(formTrans){formTrans.style.display='none';d.getElementById('hsj-new-trans').onclick=()=>{const show=formTrans.style.display==='none';formTrans.style.display=show?'block':'none';d.getElementById('hsj-new-trans').textContent=show?'Fechar cadastro':'+ Nova solicitação';if(show)formTrans.scrollIntoView({block:'nearest',behavior:'smooth'})}}
  const finished=d.getElementById('tabela-transf-finalizadas')?.closest('.table-container');
  if(finished){const b=d.createElement('button');b.className='btn';b.type='button';b.textContent='Ver / ocultar transferências finalizadas';b.style.margin='12px 0';finished.before(b);finished.style.display='none';b.onclick=()=>finished.style.display=finished.style.display==='none'?'block':'none'}
  const atualizar=()=>{
   const list=Array.isArray(w.transferenciasAtivas)?w.transferenciasAtivas:[];
   const query=(d.getElementById('hsj-trans-query').value||'').toLowerCase().trim(),status=d.getElementById('hsj-trans-filter').value;
   let count=0;
   [...tbody.querySelectorAll('tr')].forEach((tr,i)=>{
      const t=list[i];if(!t)return;
      const hay=[t.paciente,t.atendimento,t.destino,t.perfil,t.pendencias].join(' ').toLowerCase();
      const visible=(!query||hay.includes(query))&&(!status||t.status===status);
      tr.style.display=visible?'':'none';if(visible)count++;
      if(!tr.querySelector('.hsj-elapsed')&&t.dataIso){const dt=new Date(t.dataIso);if(!isNaN(dt)){const days=Math.max(0,Math.floor((Date.now()-dt)/86400000));const x=d.createElement('small');x.className='hsj-elapsed';x.style.cssText='display:block;color:#64748b';x.textContent=days?'Há '+days+' dia(s)':'Hoje';tr.cells[0]?.appendChild(x)}}
   });
   const num=st=>list.filter(x=>x.status===st).length;
   d.getElementById('hsj-trans-kpis').innerHTML=[['Ativas',list.length],['Pendentes',num('Solicitação Pendente')],['Vaga solicitada',num('Vaga Solicitada')],['Vaga liberada',num('Vaga Liberada')]].map(([x,n])=>'<div class="hsj-kpi"><strong>'+n+'</strong><small>'+x+'</small></div>').join('');
   d.getElementById('hsj-trans-result').textContent='Exibindo '+count+' de '+list.length+' solicitações ativas';
  };
  d.getElementById('hsj-trans-query').oninput=atualizar;d.getElementById('hsj-trans-filter').onchange=atualizar;
  d.getElementById('hsj-trans-reset').onclick=()=>{d.getElementById('hsj-trans-query').value='';d.getElementById('hsj-trans-filter').value='';atualizar()};
  const oldRender=w.atualizarTabelasTransferencias;
  if(typeof oldRender==='function')w.atualizarTabelasTransferencias=function(){const r=oldRender.apply(this,arguments);atualizar();return r};
  const oldSwitch=w.switchTab;
  if(typeof oldSwitch==='function')w.switchTab=function(tab,element){if(tab==='movimentacao')return oldSwitch.call(this,'painel',d.querySelector('.subnav .nav-item'));const r=oldSwitch.apply(this,arguments);if(tab==='transferencias')atualizar();return r};
  atualizar();
 }
}catch(e){console.error('Interface HSJ (sem alteração de dados):',e)}
});
})();