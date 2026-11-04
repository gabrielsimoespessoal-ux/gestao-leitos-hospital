(()=>{
'use strict';
const frame=document.getElementById('appFrame');if(!frame)return;
const shortcut=document.createElement('button');
shortcut.type='button';shortcut.id='hsj-export-sigma-fixed';
shortcut.textContent='⬇ Exportar histórico outubro/2026';
shortcut.title='Exportação de leitura para cálculo de ocupação mensal';
shortcut.style.cssText='position:fixed;right:18px;bottom:18px;z-index:2147483000;background:#075c91;color:#fff;border:1px solid white;border-radius:9px;padding:12px 16px;font:600 13px Arial,sans-serif;box-shadow:0 3px 15px #0004;cursor:pointer';
document.body.appendChild(shortcut);
shortcut.onclick=()=>{
 init();
 const doc=frame.contentDocument;
 const button=doc?.querySelector('#hsj-export-ocupacao-outubro button');
 if(button)button.click();
 else alert('Exportação indisponível: confirme seu login no Firebase e recarregue o SIGMA.');
};
let installed=false;
function init(){
 let w,d;try{w=frame.contentWindow;d=frame.contentDocument}catch{return}
 if(!w||!d||!w.hsjAuthReady||!Array.isArray(w.movimentacoesHistorico))return;
 if(installed&&d.getElementById('hsj-export-ocupacao-outubro'))return;
 const target=d.getElementById('indicadores')||d.getElementById('historico-geral');
 if(!target)return;
 installed=true;
 const bar=d.createElement('div');bar.id='hsj-export-ocupacao-outubro';
 bar.style.cssText='padding:12px;margin:12px 0;border:1px solid #b7d4e7;background:#eef7fc;border-radius:9px;display:flex;gap:10px;align-items:center;flex-wrap:wrap';
 const btn=d.createElement('button');btn.type='button';btn.className='btn';btn.textContent='Exportar histórico para taxa mensal — outubro/2026';
 const info=d.createElement('small');info.textContent='Exportação de leitura, sem nomes, CPF ou prontuários. Não altera dados. A taxa mensal permanece N/D até validar pacientes-dia e leitos-dia.';
 bar.append(btn,info);
 target.prepend(bar);
 btn.onclick=()=>{
  if(!w.hsjAuthReady){alert('Entre com seu acesso autorizado antes de exportar.');return}
  const start='2026-10-01',end='2026-10-31';
  const aliases=new Map();let unknownDate=0;
  function anon(v){const raw=String(v??'').trim();if(!raw)return null;if(!aliases.has(raw))aliases.set(raw,'PAC-'+String(aliases.size+1).padStart(5,'0'));return aliases.get(raw)}
  function dateOf(e){
   const v=e.dataIso||e.dataDesfechoObj||e.data||'';
   const s=String(v);
   if(/^\d{4}-\d{2}-\d{2}/.test(s))return s.slice(0,10);
   const m=s.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
   return m?m[3]+'-'+m[2]+'-'+m[1]:'';
  }
  const events=[];
  for(const e of w.movimentacoesHistorico){
   const day=dateOf(e);
   if(!day){unknownDate++;continue}
   if(day>end)continue;
   const id=e.atendimento||e.prontuario||e.pr||e.atendimentoNasc||'';
   events.push({
    data:day,dataHora:e.dataIso||e.dataDesfechoObj||e.data||null,
    pacienteCodigo:anon(id),
    acao:e.acao||null,origem:e.origem||e.setorOrigem||e.setor||null,
    destino:e.destino||e.setorDestino||null,
    leitoOrigem:e.leitoOrigem||null,leitoDestino:e.leitoDestino||null,
    setor:e.setor||null,tipoIndicador:e.tipoIndicador||null,
    contabilizarIndicadores:e.contabilizarIndicadores===undefined?null:e.contabilizarIndicadores
   });
  }
  const sectors=(w.setoresData||[]).map(s=>({
   setor:s.nome,tipo:s.tipo,
   leitosAtuais:(s.leitos||[]).map(l=>({numero:l.n,statusAtual:l.status}))
  }));
  const file={
   relatorio:'SIGMA - movimentos para reconstituicao da ocupacao mensal',
   periodo:{inicio:start,fim:end},
   origem:'Exportacao local via sessao autenticada do aplicativo',
   anonimizado:true,
   aviso:'Setores e status de leitos representam o momento da exportacao, nao necessariamente outubro. A base de 01/10 e o historico de leitos operacionais precisam ser validados.',
   totalEventosExportados:events.length,
   eventosSemData:unknownDate,
   totalIdentificadoresAnonimizados:aliases.size,
   movimentacoes:events,setoresSituacaoAtual:sectors
  };
  const blob=new Blob([JSON.stringify(file,null,2)],{type:'application/json;charset=utf-8'});
  const url=URL.createObjectURL(blob);const a=d.createElement('a');a.href=url;a.download='SIGMA_historico_ocupacao_outubro_2026.json';
  d.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),15000);
 };
}
frame.addEventListener('load',()=>{installed=false;setTimeout(init,950)});
setInterval(init,2000);
init();
})();