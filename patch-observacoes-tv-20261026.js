(()=>{
'use strict';
const frame=document.getElementById('appFrame');
const screen=document.getElementById('hsj-tv-screen');
if(!frame||!screen)return;
const style=document.createElement('style');
style.textContent=`
#hsj-tv-screen .tv-observacoes{grid-column:2;min-width:0;min-height:0;display:flex;flex-direction:column;border:2px solid #536880;border-radius:8px;background:#17263a;padding:9px 12px;gap:6px;overflow:hidden}
#hsj-tv-screen .tv-observacoes-header{display:flex;justify-content:space-between;align-items:center;gap:8px;font-size:clamp(13px,1.15vw,18px);font-weight:800}
#hsj-tv-screen .tv-observacoes textarea{width:100%;flex:1;min-height:38px;resize:none;border:1px solid #526a88;border-radius:6px;background:#0e1b2b;color:#fff;padding:9px 10px;font:500 clamp(12px,1vw,17px)/1.35 system-ui;outline-offset:1px}
#hsj-tv-screen .tv-observacoes-bar{display:flex;justify-content:space-between;align-items:center;gap:8px}
#hsj-tv-screen .tv-observacoes-status{font-size:11px;color:#d0deee;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
#hsj-tv-screen .tv-observacoes button{background:#0f766e;padding:5px 14px}
@media(max-width:650px){#hsj-tv-screen .tv-observacoes{grid-column:1}}
`;
document.head.appendChild(style);
const card=document.createElement('section');
card.className='tv-observacoes';
card.id='hsj-tv-observacoes';
card.innerHTML='<div class="tv-observacoes-header"><span>Observações do Plantão</span><small style="font-size:11px;font-weight:500;color:#cbd5e1">Compartilhadas</small></div><textarea id="hsj-tv-observacoes-texto" maxlength="12000" placeholder="Registre avisos e pendências gerais do NIR. Evite dados sensíveis de pacientes."></textarea><div class="tv-observacoes-bar"><span class="tv-observacoes-status" id="hsj-tv-observacoes-status">Conectando…</span><button type="button" id="hsj-tv-observacoes-salvar">Salvar observações</button></div>';
const input=card.querySelector('textarea'),status=card.querySelector('#hsj-tv-observacoes-status'),button=card.querySelector('button');
let unsubscribe=null,connection=null,remoteText='',changed=false,busy=false,remoteVersion=null;
function setStatus(t){status.textContent=t}
function connect(){
  const w=frame.contentWindow;
  const fm=w?.firebaseModules;
  if(!w?.db||!fm?.doc||!fm?.onSnapshot||!fm?.setDoc)return false;
  if(connection===w)return true;
  if(unsubscribe){unsubscribe();unsubscribe=null}
  connection=w;
  const ref=fm.doc(w.db,'hospital','observacoes_plantao_tv');
  unsubscribe=fm.onSnapshot(ref,snap=>{
    const val=snap.data()||{};
    const texto=String(val.texto||'');
    remoteVersion=val.atualizadoEm||null;
    if(!changed&&!busy){remoteText=texto;input.value=texto;setStatus(val.atualizadoEm?'Atualizado: '+new Date(val.atualizadoEm).toLocaleString('pt-BR'):'Pronto para editar');}
    else if(texto!==remoteText){setStatus('Há uma atualização de outro computador. Revise antes de salvar.');}
  },err=>setStatus('Erro de sincronização: '+(err?.message||'verifique a conexão')));
  return true;
}
input.addEventListener('input',()=>{changed=input.value!==remoteText;setStatus(changed?'Alterações não salvas':'Sem alterações pendentes')});
button.addEventListener('click',async()=>{
 if(busy||!connect())return;
 const w=frame.contentWindow, fm=w.firebaseModules;
 if(!changed){setStatus('Nenhuma alteração pendente');return}
 busy=true;button.disabled=true;setStatus('Salvando…');
 try{
  const ref=fm.doc(w.db,'hospital','observacoes_plantao_tv');
  const texto=input.value;
  // Compare o texto recebido antes de sobrescrever mudanças de outro computador.
  const snap=await fm.getDoc(ref);
  if(snap.metadata?.fromCache)throw Error('Sem confirmação do servidor. Nenhuma gravação efetuada.');
  const atual=String(snap.data()?.texto||'');
  if(atual!==remoteText){setStatus('Conflito: outro computador alterou as observações. Copie seu texto antes de atualizar.');return}
  const stamp=new Date().toISOString();
  await fm.setDoc(ref,{texto,atualizadoEm:stamp,editor:w.usuarioAtual?.nome||'Equipe NIR'},{merge:true});
  remoteText=texto;remoteVersion=stamp;changed=input.value!==texto;
  setStatus('Salvo e sincronizado às '+new Date(stamp).toLocaleTimeString('pt-BR'));
 }catch(e){setStatus('Não foi possível salvar: '+(e?.message||e))}
 finally{busy=false;button.disabled=false}
});
function mount(){
 const grid=screen.querySelector('#hsj-tv-sectors');
 if(!grid)return;
 // O modo TV reconstrói os cards dos leitos periodicamente.
 if(card.parentElement!==grid)grid.appendChild(card);
 // 11 setores: a última célula é a área vazia inferior direita.
 // Ajustar a geometria do grid mantendo os leitos intactos.
 const cards=[...grid.querySelectorAll('.tv-sector')];
 if(cards.length===11){
   card.style.gridRow='6';
   grid.style.gridTemplateRows=grid.style.gridTemplateRows;
 }
 connect();
}
const observer=new MutationObserver(()=>{if(screen.classList.contains('active')&&card.parentElement!==screen.querySelector('#hsj-tv-sectors'))mount()});
observer.observe(screen,{childList:true,subtree:true});
frame.addEventListener('load',()=>{if(unsubscribe)unsubscribe();unsubscribe=null;connection=null;setStatus('Reconectando…');});
setInterval(()=>{if(screen.classList.contains('active'))mount()},1300);
mount();
})();