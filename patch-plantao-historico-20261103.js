(()=>{
const frame=document.getElementById('appFrame');if(!frame)return;
let mounted=false;
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=x=>String(x??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const display=x=>{let t=new Date(x);return isNaN(t)?'Data não informada':t.toLocaleString('pt-BR')};
const dateOf=x=>{let t=new Date(x?.dataIso||x?.dataDesfechoObj||'');return t.getTime()};
function start(){
let w,d;try{w=frame.contentWindow;d=frame.contentDocument}catch{return}
if(!w||!d||!w.db||!w.firebaseModules?.runTransaction||!Array.isArray(w.setoresData)||!d.getElementById('plantao')||!w.switchTab)return;
if(w.__hsjPlantaoHistorico20261103)return;w.__hsjPlantaoHistorico20261103=true;mounted=true;
const {doc,getDoc,runTransaction}=w.firebaseModules,root=d.getElementById('plantao');
const style=d.createElement('style');style.textContent='#plantao .hsj-bloco{background:white;border:1px solid #cbd5e1;padding:15px;border-radius:10px;margin:12px 0}#plantao table{width:100%;border-collapse:collapse;font-size:13px}#plantao td,#plantao th{padding:8px;border-bottom:1px solid #e2e8f0;text-align:left;vertical-align:top}#plantao input,#plantao textarea{padding:10px;border:1px solid #94a3b8;border-radius:7px;max-width:100%}#plantao .hsj-nums{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:8px}#plantao .hsj-num{padding:12px;background:#f1f5f9;border-radius:8px}#plantao .hsj-num b{font-size:24px;display:block;color:#075985}#plantao h3{margin-bottom:12px;color:#123f69}#plantao .hsj-help{color:#64748b;font-size:12px;margin:8px 0}';
d.head.appendChild(style);
root.innerHTML='<div class="page-header"><div><h2>Passagem de plantão — NIR</h2><p>Resumo dos setores, movimentações e transferências pendentes.</p></div></div><section class="hsj-bloco" id="hsj-plantao-resumo"></section><section class="hsj-bloco" id="hsj-plantao-pendentes"></section><section class="hsj-bloco"><h3>Registrar e liberar passagem</h3><label><strong>Nome completo de quem libera *</strong></label><div><input id="hsj-plantao-autor" maxlength="120" style="width:min(480px,100%)" placeholder="Nome do profissional responsável"></div><p class="hsj-help">O login é compartilhado; o nome é obrigatório.</p><label><strong>Observações para o próximo plantão</strong></label><div><textarea id="hsj-plantao-obs" rows="5" maxlength="12000" style="width:100%" placeholder="Intercorrências, avisos, prioridades..."></textarea></div><p class="hsj-help">O relatório será arquivado como retrato do momento e não alterará leitos ou indicadores.</p><button class="btn btn-success" id="hsj-plantao-gravar">Liberar e arquivar passagem</button><button type="button" class="btn" id="hsj-plantao-imprimir" style="margin-left:8px">Imprimir última passagem (A4)</button><p id="hsj-plantao-status" role="status"></p></section><section class="hsj-bloco"><h3>Histórico de passagens anteriores</h3><label>Mês <input type="month" id="hsj-plantao-mes"></label> <button class="btn" id="hsj-plantao-consultar">Consultar</button><p class="hsj-help">Histórico a partir desta atualização; registros antigos não são inventados.</p><div id="hsj-plantao-historico"></div></section>';
const $=id=>d.getElementById(id),period=()=>{let z=new Date();return z.getFullYear()+'-'+String(z.getMonth()+1).padStart(2,'0')};
$('hsj-plantao-mes').value=period();
const refMonth=m=>doc(w.db,'hospital','passagens_plantao_'+m.replace('-','_'));
function calculate(state,start,end){
const setores=(state.setoresData||[]).filter(s=>!s.virtual&&s.nome!=='ESPERA VIRTUAL INTERNA');
const ocupacao=setores.map(s=>({nome:s.nome,internos:(s.leitos||[]).filter(l=>l.status==='ocupado').length}));
const mov=(state.movimentacoesHistorico||[]).filter(m=>m.contabilizarIndicadores!==false&&dateOf(m)>start&&dateOf(m)<=end);
const isInterna=m=>norm(m.acao).includes('transferencia interna')&&norm(m.origem)!==norm(m.destino);
const intern=mov.filter(isInterna),adm=mov.filter(m=>norm(m.acao)==='admissao');
const altas=mov.filter(m=>{let a=norm(m.acao);return a.includes('alta hospitalar')||a.includes('alta a pedido')||a.includes('alta para casa')||a.includes('alta com assistencia domiciliar')||a.includes('alta administrativa')||a.includes('transferencia externa')||a==='evasao'});
const obitos=mov.filter(m=>norm(m.acao).includes('obito'));
const admSetorial=ocupacao.map(s=>({nome:s.nome,total:adm.filter(m=>norm(m.destino)===norm(s.nome)||norm(m.setor).startsWith(norm(s.nome))).length+intern.filter(m=>norm(m.destino)===norm(s.nome)).length}));
const pendentes=(state.transferenciasAtivas||[]).map(t=>({paciente:String(t.paciente||''),atendimento:String(t.atendimento||''),destino:String(t.destino||''),status:String(t.status||''),pendencias:String(t.pendencias||''),dusv:String(t.dusv||''),data:String(t.dataIso||t.data||'')}));
return {ocupacao,admSetorial,admissoes:adm.length,altas:altas.length,obitos:obitos.length,internas:intern.length,altasUti:intern.filter(m=>norm(m.origem).includes('uti')&&!norm(m.destino).includes('uti')).length,pendentes};
}
function table(headers,rows){return '<div style="overflow:auto"><table><thead><tr>'+headers.map(h=>'<th>'+esc(h)+'</th>').join('')+'</tr></thead><tbody>'+rows.map(r=>'<tr>'+r.map(c=>'<td>'+esc(c)+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>'}
function summary(s){const stats=[['Internos',s.ocupacao.reduce((n,x)=>n+x.internos,0)],['Admissões hospitalares',s.admissoes],['Altas hospitalares',s.altas],['Óbitos',s.obitos],['Transferências internas',s.internas],['Altas UTI',s.altasUti]];return '<div class="hsj-nums">'+stats.map(x=>'<div class="hsj-num">'+esc(x[0])+'<b>'+esc(x[1])+'</b></div>').join('')+'</div><h4 style="margin:14px 0 5px">Internos por setor</h4>'+table(['Setor','Internos'],s.ocupacao.map(x=>[x.nome,x.internos]))+'<h4 style="margin:14px 0 5px">Admissões por setor, inclusive transferências internas</h4>'+table(['Setor','Admissões'],s.admSetorial.map(x=>[x.nome,x.total]))}
function transfers(s){return '<h3>Transferências pendentes ('+s.pendentes.length+')</h3>'+(s.pendentes.length?table(['Paciente','Prontuário','Destino','Situação','Pendências','DUSV','Data da solicitação'],s.pendentes.map(x=>[x.paciente,x.atendimento,x.destino,x.status,x.pendencias||'Não informado',x.dusv||'—',x.data||'—'])):'<p>Nenhuma transferência pendente.</p>')}
function refresh(){if(!root.classList.contains('active'))return;let s=calculate({setoresData:w.setoresData,movimentacoesHistorico:w.movimentacoesHistorico,transferenciasAtivas:w.transferenciasAtivas},Date.now()-12*3600000,Date.now());$('hsj-plantao-resumo').innerHTML='<h3>Resumo atual</h3><p class="hsj-help">Movimentações das últimas 12 horas (prévia). Ao liberar, o período parte do último fechamento registrado no mês.</p>'+summary(s);$('hsj-plantao-pendentes').innerHTML=transfers(s)}
async function read(){let mes=$('hsj-plantao-mes').value,host=$('hsj-plantao-historico');if(!/^\d{4}-\d{2}$/.test(mes))return;host.textContent='Consultando histórico...';try{let docSnap=await getDoc(refMonth(mes));if(docSnap.metadata?.fromCache)throw Error('Servidor não confirmou a consulta');let rows=docSnap.exists()?(docSnap.data().registros||[]):[];host.innerHTML=rows.length?rows.slice().reverse().map(x=>'<details style="border-top:1px solid #cbd5e1;padding:12px 0"><summary><strong>'+esc(display(x.criadoEm))+'</strong> · '+esc(x.responsavel)+'</summary><p class="hsj-help">Período: '+esc(display(x.inicio))+' a '+esc(display(x.criadoEm))+'</p>'+summary(x.resumo)+'<div style="margin-top:12px">'+transfers(x.resumo)+'</div><h4>Observações</h4><p style="white-space:pre-wrap;overflow-wrap:anywhere">'+esc(x.observacoes||'Sem observações')+'</p></details>').join(''):'Nenhuma passagem registrada neste mês.'}catch(e){host.textContent='Histórico indisponível: '+String(e.message||e)}}

function printRecord(item){
  if(!item||!item.resumo)throw Error('Passagem arquivada inválida.');
  const data=display(item.criadoEm),inicio=display(item.inicio),responsavel=esc(item.responsavel||'');
  const resumo=item.resumo;
  const numPendentes=(resumo.pendentes||[]).length;
  // A página é compacta, mas não corta solicitações extensas quando o conteúdo não couber.
  const compact=numPendentes>8?'compacto':'';
  const content='<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Passagem de plantão NIR - '+esc(data)+'</title><style>'+
  '@page{size:A4 portrait;margin:8mm}*{box-sizing:border-box}html,body{padding:0;margin:0;background:white;color:#182638;font-family:Arial,sans-serif;font-size:9pt;line-height:1.2}h1{font-size:15pt;margin:0;color:#123f69}h2{font-size:10pt;margin:8px 0 4px;color:#123f69}h3,h4{font-size:9pt;margin:6px 0 3px}header{border-bottom:2px solid #123f69;padding-bottom:5px;margin-bottom:6px}p{margin:4px 0}.dados{font-size:9pt}.grade{display:grid;grid-template-columns:repeat(4,1fr);gap:5px;margin:7px 0}.kpi{padding:5px;border:1px solid #ced8e3;border-radius:4px}.kpi b{display:block;font-size:12pt}table{width:100%;border-collapse:collapse;font-size:8pt}th,td{border:1px solid #dbe2eb;text-align:left;vertical-align:top;padding:3px 4px;overflow-wrap:anywhere}th{background:#f1f5f9}.resumo-setores{display:grid;grid-template-columns:1fr 1fr;gap:9px}.obs{white-space:pre-wrap;overflow-wrap:anywhere;border:1px solid #dbe2eb;padding:7px;min-height:22px}.rodape{border-top:1px solid #cbd5e1;margin-top:7px;padding-top:5px;color:#475569;font-size:7.5pt}tr{break-inside:avoid}.compacto table{font-size:7.2pt}.compacto td,.compacto th{padding:2px 3px}.compacto .grade{gap:3px}.compacto .kpi{padding:3px}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}'+
  '</style></head><body class="'+compacto+'"><header><h1>Hospital São José · NIR</h1><strong>PASSAGEM DE PLANTÃO</strong><div class="dados">Liberada por: <b>'+responsavel+'</b> · Data e hora: '+esc(data)+'</div><div>Período: '+esc(inicio)+' até '+esc(data)+'</div></header>'+
  '<div class="grade">'+[['Internos',resumo.ocupacao.reduce((n,x)=>n+x.internos,0)],['Admissões',resumo.admissoes],['Altas',resumo.altas],['Óbitos',resumo.obitos]].map(x=>'<div class="kpi">'+esc(x[0])+'<b>'+esc(x[1])+'</b></div>').join('')+'</div>'+
  '<div class="resumo-setores"><section><h2>Internos por setor</h2>'+table(['Setor','Total'],resumo.ocupacao.map(x=>[x.nome,x.internos]))+'</section><section><h2>Admissões por setor</h2>'+table(['Setor','Total'],resumo.admSetorial.map(x=>[x.nome,x.total]))+'</section></div>'+
  '<h2>Transferências pendentes ('+numPendentes+')</h2>'+(numPendentes?table(['Paciente / prontuário','Destino','Situação','Pendências','DUSV'],resumo.pendentes.map(x=>[x.paciente+' / '+x.atendimento,x.destino,x.status,x.pendencias||'—',x.dusv||'—'])):'<p>Nenhuma transferência pendente.</p>')+
  '<h2>Observações do plantão</h2><div class="obs">'+esc(item.observacoes||'Sem observações registradas')+'</div><div class="rodape">Registro arquivado · Transferências internas: '+esc(resumo.internas)+' · Saídas da UTI: '+esc(resumo.altasUti)+'. Documento gerado a partir da passagem gravada.</div></body></html>';
  const printFrame=d.createElement('iframe');
  printFrame.style.cssText='position:fixed;right:0;bottom:0;width:1px;height:1px;opacity:0;border:0';
  d.body.appendChild(printFrame);
  printFrame.onload=()=>{try{printFrame.contentWindow.focus();printFrame.contentWindow.print()}catch(e){w.alert('Falha ao abrir impressão: '+e.message)}setTimeout(()=>printFrame.remove(),120000)};
  printFrame.contentDocument.open();printFrame.contentDocument.write(content);printFrame.contentDocument.close();
}
$('hsj-plantao-imprimir').onclick=async()=>{
 const btn=$('hsj-plantao-imprimir'),status=$('hsj-plantao-status');
 btn.disabled=true;
 try{
  const now=new Date(),m=now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0');
  const snap=await getDoc(refMonth(m));
  if(snap.metadata?.fromCache)throw Error('Servidor não confirmou o histórico.');
  const records=snap.data()?.registros||[];
  if(!records.length)throw Error('Nenhuma passagem arquivada neste mês. Libere uma passagem antes de imprimir.');
  printRecord(records[records.length-1]);
 }catch(e){status.textContent=String(e.message||e)}finally{btn.disabled=false}
};

$('hsj-plantao-consultar').onclick=read;
$('hsj-plantao-gravar').onclick=async()=>{
const autor=$('hsj-plantao-autor').value.trim().replace(/\s+/g,' '),observacoes=$('hsj-plantao-obs').value.trim(),status=$('hsj-plantao-status'),btn=$('hsj-plantao-gravar');
if(autor.length<3){status.textContent='Informe obrigatoriamente o nome completo de quem libera.';return}
if(w.usuarioAtual?.perfil==='Visitante'||!w.hsjAuthReady){status.textContent='Sem autorização ou sem autenticação válida.';return}
if(!w.confirm('Liberar passagem de plantão em nome de '+autor+'? O registro será arquivado.'))return;
btn.disabled=true;status.textContent='Salvando no servidor...';
try{
 const snap=await getDoc(doc(w.db,'hospital','dados'));if(!snap.exists()||snap.metadata?.fromCache)throw Error('Dados principais sem confirmação do servidor');
 const state=snap.data();if(!Array.isArray(state.setoresData))throw Error('Setores inválidos');
 const now=new Date(),iso=now.toISOString(),mes=iso.slice(0,7),archive=refMonth(mes);
 await runTransaction(w.db,async tx=>{const existing=await tx.get(archive),list=existing.exists()?(existing.data().registros||[]):[],previous=list.length?new Date(list[list.length-1].criadoEm).getTime():now.getTime()-12*3600000;const from=Number.isFinite(previous)?previous:now.getTime()-12*3600000;const record={criadoEm:iso,inicio:new Date(from).toISOString(),responsavel:autor,observacoes,resumo:calculate(state,from,now.getTime()),revisaoFonte:Number(state._meta?.revision||0)};tx.set(archive,w.JSON.parse(w.JSON.stringify({registros:[...list,record],atualizadoEm:iso})))});
status.textContent='Passagem arquivada com sucesso em '+display(iso);$('hsj-plantao-obs').value='';$('hsj-plantao-mes').value=mes;await read();refresh()
}catch(e){status.textContent='Falha ao salvar: '+String(e.message||e)}
finally{btn.disabled=false}
};
const oldSwitch=w.switchTab;w.switchTab=function(tab){const result=oldSwitch.apply(this,arguments);if(tab==='plantao'){refresh();read()}return result};
const oldUpdate=w.atualizarResumoPlantao;if(typeof oldUpdate==='function')w.atualizarResumoPlantao=function(){refresh()};
if(root.classList.contains('active')){refresh();read()}
const timer=setInterval(()=>{if(!d.isConnected||frame.contentDocument!==d){clearInterval(timer);return}refresh()},20000);
}
frame.addEventListener('load',()=>{mounted=false;setTimeout(start,300)});
let n=0;let timer=setInterval(()=>{start();if(mounted||++n>100)clearInterval(timer)},250);
})();