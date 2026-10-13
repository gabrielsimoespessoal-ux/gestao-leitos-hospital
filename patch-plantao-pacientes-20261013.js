(()=>{
const frame=document.getElementById('appFrame');if(!frame)return;
let initialized=false;
function start(){
if(initialized)return;
let w,d;try{w=frame.contentWindow;d=frame.contentDocument;}catch(_){return}
if(!w||!d||!d.getElementById('plantao')||!Array.isArray(w.setoresData)||typeof w.atualizarTabelaPacientesInternos!=='function')return;
initialized=true;
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const nav=[...d.querySelectorAll('.subnav .nav-item')].find(x=>(x.getAttribute('onclick')||'').includes("'movimentacao'"));if(nav)nav.remove();
const css=d.createElement('style');css.textContent='#movimentacao{display:none!important}#hsj-pendentes-plantao{margin:16px 0;padding:16px;background:#fff;border:1px solid #dbe4f0;border-left:4px solid #0e7490;border-radius:10px}#hsj-pendentes-plantao table{width:100%;border-collapse:collapse;font-size:13px}#hsj-pendentes-plantao td,#hsj-pendentes-plantao th{padding:10px;border-bottom:1px solid #e2e8f0;text-align:left}#hsj-internal-move{position:fixed;inset:0;background:#10203899;z-index:100005;display:none;align-items:center;justify-content:center;padding:15px}#hsj-internal-move>section{width:min(520px,100%);background:#fff;border-radius:12px;padding:20px;max-height:85vh;overflow:auto}#hsj-internal-move label{display:block;font-weight:600;margin:12px 0 5px}#hsj-internal-move select{width:100%;padding:10px;border:1px solid #cbd5e1;border-radius:8px}#tabela-pacientes-internos .hsj-bed-action{font-size:12px;padding:6px 9px;margin-top:6px;background:#0e7490;color:white}';d.head.appendChild(css);
const p=d.getElementById('plantao');const block=d.createElement('section');block.id='hsj-pendentes-plantao';p.querySelector('.page-header')?.after(block);
function pending(){
const items=Array.isArray(w.transferenciasAtivas)?w.transferenciasAtivas:[];
const rows=items.map(t=>'<tr><td><strong>'+esc(t.paciente)+'</strong><div style="font-size:12px;color:#64748b">Pront. '+esc(t.atendimento)+'</div></td><td>'+esc(t.destino)+'</td><td>'+esc(t.status)+'</td><td>'+esc(t.pendencias||'Sem pendências registradas')+'</td><td>'+esc(t.dusv||'-')+'</td></tr>').join('');
block.innerHTML='<h3 style="font-size:17px;margin:0 0 6px;color:#0f2747">Transferências pendentes / em andamento ('+items.length+')</h3><p style="font-size:12px;color:#64748b;margin:0 0 12px">Atualizado automaticamente a partir das solicitações ativas da aba Transferências.</p>'+(items.length?'<div style="overflow:auto"><table><thead><tr><th>Paciente</th><th>Destino</th><th>Situação</th><th>Pendências</th><th>DUSV</th></tr></thead><tbody>'+rows+'</tbody></table></div>':'<p>Nenhuma transferência pendente no momento.</p>');
}
const modal=d.createElement('div');modal.id='hsj-internal-move';modal.innerHTML='<section role="dialog" aria-modal="true"><h3 id="hsj-moving-title" style="margin:0">Mudar leito</h3><p id="hsj-moving-current" style="color:#64748b"></p><label for="hsj-dest-sector">Setor de destino</label><select id="hsj-dest-sector"></select><label for="hsj-dest-bed">Leito disponível</label><select id="hsj-dest-bed"></select><div style="display:flex;gap:10px;margin-top:20px"><button type="button" class="btn btn-success" id="hsj-confirm-move">Confirmar transferência</button><button type="button" class="btn" id="hsj-cancel-move">Cancelar</button></div><p id="hsj-move-info" style="font-size:12px;color:#64748b;margin-top:10px">A alteração será confirmada no banco central antes de ser considerada concluída.</p></section>';d.body.appendChild(modal);
const sector=d.getElementById('hsj-dest-sector'), bed=d.getElementById('hsj-dest-bed');let current=null;
const close=()=>{modal.style.display='none';current=null};d.getElementById('hsj-cancel-move').onclick=close;modal.addEventListener('click',e=>{if(e.target===modal)close()});
const available=()=>{const s=w.setoresData.find(x=>x.nome===sector.value);bed.innerHTML='';(s?.leitos||[]).filter(l=>l.status==='disponivel').forEach(l=>{const opt=d.createElement('option');opt.value=l.n;opt.textContent='Leito '+l.n;bed.appendChild(opt)});if(!bed.options.length)bed.add(new Option('Nenhum leito disponível',''))};
sector.onchange=available;
function changeBed(setor,numero){
const s=w.setoresData.find(x=>x.nome===setor),l=s?.leitos.find(x=>String(x.n)===String(numero));
if(!l||l.status!=='ocupado'||!l.prontuario){w.alert('Mudança disponível somente para paciente com leito ocupado e prontuário identificado.');return}
if(w.usuarioAtual?.perfil==='Visitante'){w.alert('Perfil sem permissão para movimentação.');return}
current={pr:l.prontuario,setor,numero,paciente:l.paciente};
d.getElementById('hsj-moving-title').textContent='Mudar leito · '+l.paciente;
d.getElementById('hsj-moving-current').textContent='Origem: '+setor+' · Leito '+numero+' · Prontuário '+l.prontuario;
sector.innerHTML='';w.setoresData.filter(x=>x.leitos.some(b=>b.status==='disponivel')).forEach(x=>sector.add(new Option(x.nome,x.nome)));available();modal.style.display='flex';
}
d.getElementById('hsj-confirm-move').onclick=async()=>{
if(!current||!sector.value||!bed.value){w.alert('Escolha um destino disponível.');return}
if(!w.confirm('Confirmar transferência de '+current.paciente+' para '+sector.value+' / Leito '+bed.value+'?'))return;
const btn=d.getElementById('hsj-confirm-move');btn.disabled=true;
try{
if(typeof w.executarTransferenciaSeguraV20261009!=='function')throw Error('Rotina transacional indisponível.');
const contabilizarIndicadores=w.confirm('Computar esta transferência interna nos indicadores hospitalares?\nOK = Sim | Cancelar = Não (a transferência prossegue).');
await w.executarTransferenciaSeguraV20261009({pr:current.pr,setorDestino:sector.value,leitoDestino:bed.value,contabilizarIndicadores,usuario:w.usuarioAtual?.nome||'usuario'});
close();if(typeof w.carregarDadosDoFirebase==='function')await w.carregarDadosDoFirebase();
if(typeof w.renderizarPainelLeitos==='function')w.renderizarPainelLeitos();
if(typeof w.atualizarTabelaPacientesInternos==='function')w.atualizarTabelaPacientesInternos();
w.alert('Transferência confirmada no banco central.');
}catch(e){w.alert('Transferência não confirmada: '+(e?.message||e)+'\nVerifique o estado do leito antes de tentar novamente.')}finally{btn.disabled=false}
};
function actions(){
const body=d.getElementById('tabela-pacientes-internos');if(!body)return;
const occupied=[];
w.setoresData.forEach(s=>s.leitos.forEach(l=>{if(l.status==='ocupado'||l.status==='reservado')occupied.push({setor:s.nome,leito:l.n,status:l.status})}));
const th=body.closest('table')?.querySelector('thead tr');if(th&&!th.querySelector('.hsj-actions-th')){const col=d.createElement('th');col.className='hsj-actions-th';col.textContent='Mudança de leito';th.appendChild(col)}
[...body.querySelectorAll('tr')].forEach((tr,i)=>{
if(tr.querySelector('.hsj-move-cell'))return;
const x=occupied[i];if(!x)return;const td=d.createElement('td');td.className='hsj-move-cell';
if(x.status==='ocupado'){const btn=d.createElement('button');btn.type='button';btn.className='btn hsj-bed-action';btn.textContent='Alterar leito';btn.onclick=()=>changeBed(x.setor,x.leito);td.appendChild(btn)}else td.textContent='Reservado';
tr.appendChild(td);
});
}
const oldList=w.atualizarTabelaPacientesInternos;
w.atualizarTabelaPacientesInternos=function(){const r=oldList.apply(this,arguments);actions();return r};
const oldShift=w.atualizarResumoPlantao;
if(typeof oldShift==='function')w.atualizarResumoPlantao=function(){const r=oldShift.apply(this,arguments);pending();return r};
const oldTrans=w.atualizarTabelasTransferencias;
if(typeof oldTrans==='function')w.atualizarTabelasTransferencias=function(){const r=oldTrans.apply(this,arguments);pending();return r};
const oldSwitch=w.switchTab;
if(typeof oldSwitch==='function')w.switchTab=function(tab,element){
if(tab==='movimentacao'){tab='painel';element=[...d.querySelectorAll('.subnav .nav-item')].find(x=>(x.getAttribute('onclick')||'').includes("'painel'"))}
const res=oldSwitch.call(this,tab,element);if(tab==='plantao')pending();if(tab==='pacientes-internos')actions();return res;
};
if(d.getElementById('movimentacao')?.classList.contains('active'))w.switchTab('painel',d.querySelector('.subnav .nav-item'));
pending();w.atualizarTabelaPacientesInternos();
}
frame.addEventListener('load',()=>{initialized=false;start()});start();let n=0;const timer=setInterval(()=>{start();if(initialized||++n>80)clearInterval(timer)},250);
})();