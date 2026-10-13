(()=>{
const frame=document.getElementById('appFrame');if(!frame)return;
let watcher;
function init(){
 let w,d;try{w=frame.contentWindow;d=frame.contentDocument}catch(_){return}
 if(!w||!d)return false;
 const modal=d.getElementById('modal-editar-paciente');
 const action=d.getElementById('atalho-acao-operacional-v4');
 if(!modal||!action)return false;
 if(d.getElementById('hsj-encaminhar-transferencia-modal'))return true;
 const btn=d.createElement('button');
 btn.type='button';btn.className='btn';btn.id='hsj-encaminhar-transferencia-modal';
 btn.textContent='↗ Encaminhar para Transferências';
 btn.style.cssText='display:block;width:100%;margin:12px 0 0;padding:12px 15px;background:#0e7490;color:#fff;border-radius:8px;font-size:14px;font-weight:700';
 const tip=d.createElement('small');
 tip.style.cssText='display:block;margin-top:6px;color:#475569;font-size:12px';
 tip.textContent='Preenche a solicitação de transferência com os dados deste paciente. A solicitação só será registrada ao salvar na aba Transferências.';
 action.after(btn,tip);
 btn.addEventListener('click',()=>{
   if(w.usuarioAtual?.perfil==='Visitante'){w.alert('Perfil visitante não pode registrar transferências.');return}
   const value=id=>String(d.getElementById(id)?.value||'').trim();
   const oldPr=value('edit-prontuario'),pr=value('edit-prontuario-vis-v3')||oldPr;
   const name=value('edit-nome'),birth=value('edit-nasc'),profile=value('edit-perfil');
   const sex=value('edit-sexo-v3');
   if(!pr||!name){w.alert('Informe o nome e o prontuário para encaminhar às Transferências.');return}
   const existing=(Array.isArray(w.transferenciasAtivas)?w.transferenciasAtivas:[]).find(t=>String(t.atendimento||'')===pr);
   if(existing&&!w.confirm('Já existe uma transferência ativa para este prontuário. Deseja abrir a tela de Transferências para conferi-la?'))return;
   const set=(id,v)=>{const e=d.getElementById(id);if(e&&v)e.value=v};
   set('transf-atendimento',pr);set('transf-paciente',name);
   set('transf-nascimento',birth);set('transf-perfil',profile);set('transf-sexo',sex);
   modal.style.display='none';
   const transferNav=[...d.querySelectorAll('.subnav .nav-item')].find(el=>(el.getAttribute('onclick')||'').includes("'transferencias'"));
   if(typeof w.switchTab==='function')w.switchTab('transferencias',transferNav);
   const container=d.getElementById('transferencias');
   const form=container?.querySelector('.notes-box');
   if(form){
     form.style.display='block';
     const toggle=d.getElementById('hsj-new-trans');if(toggle)toggle.textContent='Fechar cadastro';
     let notice=d.getElementById('hsj-encaminhamento-aviso');
     if(!notice){notice=d.createElement('div');notice.id='hsj-encaminhamento-aviso';notice.style.cssText='background:#eff6ff;color:#075985;border:1px solid #bae6fd;padding:12px;border-radius:8px;margin:0 0 12px;font-size:13px';form.prepend(notice)}
     notice.textContent='Cadastro de '+name+' preenchido. Confira o destino e as pendências e clique em Salvar e Registrar Solicitação. Nenhum registro foi criado automaticamente.';
     form.scrollIntoView({behavior:'smooth',block:'start'});
   }
 });
 return true;
}
function schedule(){
 if(watcher)clearInterval(watcher);
 let count=0;watcher=setInterval(()=>{if(init()||++count>=120)clearInterval(watcher)},250);
 init();
}
frame.addEventListener('load',schedule);schedule();
})();