(()=>{
const frame=document.getElementById('appFrame');if(!frame)return;
let timer;
function init(){
 let w,d;try{w=frame.contentWindow;d=frame.contentDocument}catch(_){return false}
 if(!w||!d||!Array.isArray(w.setoresData)||typeof w.executarTransferenciaSeguraV20261009!=='function')return false;
 if(d.__hsjCaptureEfetivarReservaV3)return true;
 d.__hsjCaptureEfetivarReservaV3=true;
 let busy=false;
 d.addEventListener('click',async event=>{
   const button=event.target?.closest?.('button');
   if(!button||!d.getElementById('box-form-mov')?.contains(button))return;
   if(!button.matches('.btn-success')||!String(button.getAttribute('onclick')||'').includes('executarMovimentacaoLeito')&&!button.dataset.hsjMoveAction)return;
   const val=id=>String(d.getElementById(id)?.value||'').trim();
   const action=val('mov-acao'),pr=val('mov-atendimento'),setor=val('mov-setor'),leito=val('mov-leito');
   if(action!=='Admissão'||!pr||!setor||!leito)return;
   const destino=w.setoresData.find(s=>s.nome===setor)?.leitos?.find(l=>String(l.n)===leito);
   const origens=[];w.setoresData.forEach(s=>(s.leitos||[]).forEach(l=>{if(l.status==='ocupado'&&String(l.prontuario||'')===pr)origens.push({s,l})}));
   if(!origens.length)return;
   event.preventDefault();event.stopImmediatePropagation();
   if(busy)return;
   if(!destino||destino.status!=='reservado'||String(destino.prontuario||'')!==pr){
     w.alert('Este paciente ja ocupa outro leito. Selecione Transferencia Interna para outro destino. Nenhuma admissao foi realizada.');return;
   }
   if(origens.length!==1){w.alert('Ha mais de uma ocupacao para este prontuario. Regularize antes de transferir.');return}
   if(w.usuarioAtual?.perfil==='Visitante'){w.alert('Acesso negado.');return}
   const origem=origens[0],nome=origem.l.paciente||val('mov-paciente');
   const msg='EFETIVAR RESERVA COMO TRANSFERENCIA INTERNA?\\n\\nPaciente: '+nome+'\\nOrigem: '+origem.s.nome+' / '+origem.l.n+'\\nDestino: '+setor+' / '+leito+'\\n\\nAo confirmar no banco, o destino ficara ocupado e a origem sera liberada.';
   if(!w.confirm(msg))return;
   busy=true;button.disabled=true;
   try{
     const r=await w.executarTransferenciaSeguraV20261009({pr,setorDestino:setor,leitoDestino:leito,nome,contabilizarIndicadores:false,usuario:w.usuarioAtual?.nome||'usuario'});
     if(!r?.ok)throw Error('Banco nao confirmou transferencia.');
     w.alert('TRANSFERENCIA CONFIRMADA NO BANCO. Atualize o painel e confira os dois leitos.');
     if(typeof w.carregarDadosDoFirebase==='function')await w.carregarDadosDoFirebase();
   }catch(e){w.alert('TRANSFERENCIA NAO REALIZADA: '+(e?.message||e)+'\\nNao libere manualmente nenhum leito.');}
   finally{busy=false;button.disabled=false}
 },true);
 // Mantem a chamada inline existente, interceptando apenas a admissao incorreta.
 return true;
}
function start(){if(timer)clearInterval(timer);let attempts=0;timer=setInterval(()=>{if(init()||++attempts>160)clearInterval(timer)},250);init()}
frame.addEventListener('load',start);start();
})();