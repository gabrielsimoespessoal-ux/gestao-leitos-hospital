(()=>{
 const frame=document.getElementById('appFrame');if(!frame)return;
 let activated=false;
 function init(){
  if(activated)return;
  let w,d;try{w=frame.contentWindow;d=frame.contentDocument}catch(e){return}
  if(!w||!d||!d.getElementById('tabela-transf-ativas')||typeof w.atualizarTabelasTransferencias!=='function'||typeof w.hsjSalvarObservacoesTransferenciaAtomico!=='function')return;
  activated=true;
  const body=d.getElementById('tabela-transf-ativas');
  function decorate(){
   const list=Array.isArray(w.transferenciasAtivas)?w.transferenciasAtivas:[];
   [...body.querySelectorAll('tr')].forEach((tr,i)=>{
    const t=list[i],cell=tr.cells?.[7];if(!t||!cell||cell.querySelector('.hsj-edit-observacoes'))return;
    const btn=d.createElement('button');btn.type='button';btn.className='hsj-edit-observacoes';
    btn.textContent='✎ Editar observações';btn.style.cssText='display:block;margin-top:7px;padding:5px 9px;border:1px solid #0e7490;background:#ecfeff;color:#155e75;border-radius:6px;cursor:pointer;font-weight:700;font-size:12px';
    btn.onclick=()=>openEditor(t);cell.appendChild(btn);
   });
  }
  function openEditor(item){
   if(w.usuarioAtual?.perfil==='Visitante'){w.alert('Sem permissão para editar observações.');return}
   const old=d.getElementById('hsj-obs-editor-overlay');if(old)old.remove();
   const overlay=d.createElement('div');overlay.id='hsj-obs-editor-overlay';overlay.style.cssText='position:fixed;inset:0;background:#0f172a99;z-index:999999;display:flex;align-items:center;justify-content:center;padding:16px';
   const box=d.createElement('section');box.style.cssText='width:min(640px,100%);max-height:90vh;overflow:auto;background:white;padding:22px;border-radius:12px;box-shadow:0 15px 35px #0003';
   const h=d.createElement('h3');h.textContent='Editar observações da transferência';h.style.margin='0 0 10px';
   const info=d.createElement('p');info.textContent=(item.paciente||'Paciente')+' — Prontuário '+item.atendimento;info.style.cssText='font-size:14px;color:#475569';
   const help=d.createElement('p');help.textContent='Acrescente ou corrija informações. As observações anteriores permanecerão no campo até você alterá-las. Salvar não altera o status nem a localização do paciente.';help.style.cssText='font-size:13px;color:#475569';
   const area=d.createElement('textarea');area.value=String(item.pendencias||'');area.rows=9;area.maxLength=12000;area.style.cssText='width:100%;box-sizing:border-box;padding:12px;border:1px solid #94a3b8;border-radius:8px;font:14px Arial;resize:vertical';area.setAttribute('aria-label','Observações da transferência');
   const footer=d.createElement('div');footer.style.cssText='display:flex;justify-content:flex-end;gap:10px;margin-top:14px;flex-wrap:wrap';
   const cancel=d.createElement('button');cancel.type='button';cancel.textContent='Cancelar';cancel.style.cssText='padding:10px 16px;border:1px solid #cbd5e1;border-radius:7px;background:#fff;cursor:pointer';
   const save=d.createElement('button');save.type='button';save.textContent='Salvar observações';save.style.cssText='padding:10px 16px;border:0;border-radius:7px;background:#047857;color:white;font-weight:700;cursor:pointer';
   cancel.onclick=()=>overlay.remove();overlay.onclick=e=>{if(e.target===overlay)overlay.remove()};
   save.onclick=async()=>{
    save.disabled=true;save.textContent='Salvando...';
    try{
     await w.hsjSalvarObservacoesTransferenciaAtomico({atendimento:item.atendimento,dataIso:item.dataIso||item.data,anterior:item.pendencias||'',observacoes:area.value,usuario:w.usuarioAtual?.nome||'Usuário'});
     overlay.remove();w.alert('Observações salvas no banco compartilhado.');
    }catch(e){w.alert('Não foi possível salvar as observações: '+(e?.message||e))}
    finally{save.disabled=false;save.textContent='Salvar observações'}
   };
   footer.append(cancel,save);box.append(h,info,help,area,footer);overlay.appendChild(box);d.body.appendChild(overlay);area.focus();
  }
  const previous=w.atualizarTabelasTransferencias;
  w.atualizarTabelasTransferencias=function(){const result=previous.apply(this,arguments);decorate();return result};
  decorate();
  // Restaura o botão após atualizações e sincronização com outros computadores.
  let last='';
  setInterval(()=>{if(!d.getElementById('tabela-transf-ativas'))return;const count=body.querySelectorAll('tr').length;const buttons=body.querySelectorAll('.hsj-edit-observacoes').length;if(count!==buttons)decorate()},1300);
 }
 frame.addEventListener('load',()=>{activated=false;let n=0;const t=setInterval(()=>{init();if(activated||++n>120)clearInterval(t)},250)});
 init();
})();