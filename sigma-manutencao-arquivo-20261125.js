/* SIGMA — manutenção controlada do arquivo histórico (uso administrativo) */
(()=>{
'use strict';
const frame=document.getElementById('appFrame');if(!frame)return;
function mount(){
 let w,d;try{w=frame.contentWindow;d=frame.contentDocument}catch{return false}
 if(!w||!d||!d.getElementById('admin')||typeof w.hsjCompactarDadosComArquivo!=='function')return false;
 if(d.getElementById('hsj-manutencao-arquivo'))return true;
 const card=d.createElement('section');
 card.id='hsj-manutencao-arquivo';card.style.cssText='background:#fff;border:1px solid #bfd5e7;border-left:5px solid #0c8d96;border-radius:12px;padding:18px;margin:14px 0;box-shadow:0 3px 12px #1935520d';
 card.innerHTML='<div style="font-size:11px;font-weight:800;letter-spacing:.08em;color:#0e829a">ADMINISTRAÇÃO · INTEGRIDADE DE DADOS</div>'+
 '<h3 style="font-size:19px;color:#15456e;margin:7px 0">Arquivo histórico e espaço do Firestore</h3>'+
 '<p style="font-size:13px;color:#516b7e;line-height:1.5">A ferramenta transfere movimentações antigas para documentos históricos separados, preservando os eventos, indicadores e auditoria. Nenhum leito, paciente ou transferência ativa é alterado. A operação é atômica: se a validação não for concluída, nada é gravado.</p>'+
 '<div style="display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin:12px 0"><button type="button" id="hsj-arquivar-historico" class="btn" style="background:#0a7e91;color:white;font-weight:800">Arquivar histórico antigo com segurança</button>'+
 '<span style="font-size:12px;color:#6a7c8c">Execute uma vez, com as demais estações do SIGMA atualizadas.</span></div>'+
 '<div id="hsj-arquivo-status" role="status" aria-live="polite" style="font-weight:700;color:#1b536f;font-size:12px;white-space:pre-wrap"></div>';
 const admin=d.getElementById('admin');admin.prepend(card);
 const btn=d.getElementById('hsj-arquivar-historico'),status=d.getElementById('hsj-arquivo-status');
 btn.addEventListener('click',async()=>{
  if(btn.disabled)return;
  if(!w.hsjAuthReady){status.textContent='Entre com a conta administrativa do SIGMA para executar a manutenção.';return}
  if(w.usuarioAtual?.perfil!=='Administrador'){status.textContent='A manutenção está disponível somente no perfil Administrador.';return}
  if(!w.confirm('MANUTENÇÃO DO SIGMA\n\nEste procedimento criará documentos de arquivo e reduzirá o tamanho do documento central, preservando todos os registros. Não feche a tela durante a confirmação. Confirma a manutenção?'))return;
  btn.disabled=true;status.textContent='Verificando e arquivando históricos antigos no Firestore. Não realize outra movimentação nesta estação durante a operação...';
  try{
   const result=await w.hsjCompactarDadosComArquivo();
   const kb=b=>Math.round(Number(b||0)/1024);
   status.textContent=result.already?
      'O banco central já está com margem de armazenamento suficiente. Tamanho estimado do conteúdo: '+kb(result.after)+' KiB.':
      '✓ MANUTENÇÃO CONFIRMADA PELO SERVIDOR. '+result.arquivadosMov+' movimentos e '+result.arquivadasTransferencias+' transferências finalizadas arquivados em '+result.totalArquivos+' documentos. Conteúdo principal: '+kb(result.before)+' → '+kb(result.after)+' KiB (estimativa JSON). Atualize a página antes de testar o salvamento.';
  }catch(err){status.textContent='A manutenção NÃO foi confirmada: '+String(err.message||err)+'. Nenhum resultado deve ser presumido; confira o banco antes de repetir.'}
  finally{btn.disabled=false}
 });
 return true;
}
frame.addEventListener('load',()=>setTimeout(mount,450));
let tries=0;const timer=setInterval(()=>{if(mount()||++tries>150)clearInterval(timer)},250);
})();