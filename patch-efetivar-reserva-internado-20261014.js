(()=>{
const frame=document.getElementById('appFrame');if(!frame)return;
let timer;
function setup(){
 let w,d;try{w=frame.contentWindow;d=frame.contentDocument}catch(_){return false}
 if(!w||!d||typeof w.executarMovimentacaoLeito!=='function'||typeof w.executarTransferenciaSeguraV20261009!=='function'||!Array.isArray(w.setoresData))return false;
 if(w.__hsjEfetivarReservaInternado20261014)return true;
 const anterior=w.executarMovimentacaoLeito;
 w.executarMovimentacaoLeito=async function(){
  const v=id=>String(d.getElementById(id)?.value||'').trim();
  const ac=v('mov-acao'),pr=v('mov-atendimento'),setor=v('mov-setor'),n=v('mov-leito');
  if(ac!=='Admissão'||!pr||!setor||!n)return anterior.apply(this,arguments);
  const origem=[];
  w.setoresData.forEach(s=>(s.leitos||[]).forEach(l=>{if(l.status==='ocupado'&&String(l.prontuario||'')===pr)origem.push({s,l})}));
  if(!origem.length)return anterior.apply(this,arguments);
  const destino=w.setoresData.find(s=>s.nome===setor)?.leitos?.find(l=>String(l.n)===n);
  if(!destino||destino.status!=='reservado'||String(destino.prontuario||'')!==pr){
   w.alert('Este paciente já está internado. Para mudar de leito, selecione Transferência Interna e o leito de destino. Nenhuma segunda admissão foi realizada.');return;
  }
  if(origem.length!==1){w.alert('Paciente possui ocupações duplicadas. Regularize os leitos antes de transferir.');return}
  if(w.usuarioAtual?.perfil==='Visitante'){w.alert('Acesso negado.');return}
  const o=origem[0],nome=o.l.paciente||v('mov-paciente');
  if(!w.confirm('EFETIVAR RESERVA POR TRANSFERÊNCIA INTERNA?\n\nPaciente: '+nome+'\nProntuário: '+pr+'\nSAIR: '+o.s.nome+' / '+o.l.n+'\nOCUPAR: '+setor+' / '+n+'\n\nA reserva será consumida e o leito anterior liberado somente após confirmação do banco.'))return;
  const btn=d.querySelector('#box-form-mov .btn-success');if(btn)btn.disabled=true;
  try{
   const r=await w.executarTransferenciaSeguraV20261009({pr,setorDestino:setor,leitoDestino:n,nome,contabilizarIndicadores:false,usuario:w.usuarioAtual?.nome||'usuario'});
   if(!r?.ok)throw Error('Banco não confirmou transferência.');
   w.alert('TRANSFERÊNCIA CONFIRMADA NO BANCO.\n\nLeito '+n+' ocupado pelo paciente e leito '+o.l.n+' liberado. Aguarde a sincronização e confira o painel.');
  }catch(e){w.alert('Transferência NÃO realizada: '+(e?.message||e)+'\nNenhum outro leito deve ser liberado manualmente.');}
  finally{if(btn)btn.disabled=false}
 };
 // O botão original possui onclick inline apontando para a função antiga.
 // Substitui o handler do botão físico pelo fluxo seguro, sem alterar outros botões.
 const execButton=d.querySelector('#box-form-mov button[onclick*="executarMovimentacaoLeito"]');
 if(!execButton)return false;
 execButton.onclick=function(event){
   event?.preventDefault();
   return w.executarMovimentacaoLeito();
 };
 execButton.removeAttribute('onclick');
 w.__hsjEfetivarReservaInternado20261014=true;return true;
}
function start(){if(timer)clearInterval(timer);let n=0;timer=setInterval(()=>{if(setup()||++n>120)clearInterval(timer)},250);setup()}
frame.addEventListener('load',start);start();
})();