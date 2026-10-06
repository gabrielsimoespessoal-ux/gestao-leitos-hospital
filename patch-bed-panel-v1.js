(()=>{
  let filtroPainelLeitosV1='todos';

  function escV1(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
  function setorByNameV1(nome){return setoresData.find(s=>s.nome===nome);}
  function leitoByRefV1(nomeSetor,numLeito){const s=setorByNameV1(nomeSetor);return s?{setor:s,leito:s.leitos.find(l=>l.n===numLeito)}:null;}
  function statusLabelV1(status){return ({disponivel:'Disponível',ocupado:'Ocupado',higienizacao:'Higienização',bloqueado:'Bloqueado',reservado:'Reservado'})[status]||status;}

  window.filtrarPainelLeitosV1=function(tipo){
    filtroPainelLeitosV1=tipo||'todos';
    renderizarPainelLeitos();
  };

  window.alternarBloqueioLeitoPainelV1=async function(nomeSetor,numLeito){
    if(usuarioAtual?.perfil==='Visitante'){alert('Acesso negado. Apenas Administrador ou Operador pode bloquear/liberar leitos.');return;}
    const ref=leitoByRefV1(nomeSetor,numLeito); if(!ref||!ref.leito)return;
    const l=ref.leito;
    const estavaBloqueado=l.status==='bloqueado';
    if(!estavaBloqueado && (l.status==='ocupado'||l.status==='reservado')){
      alert('Este leito está '+statusLabelV1(l.status)+'. Libere ou remaneje o paciente antes de bloquear o leito.');
      return;
    }
    const acao=estavaBloqueado?'LIBERAR':'BLOQUEAR';
    if(!confirm(`${acao} o leito ${numLeito} de ${nomeSetor}?`))return;
    if(!confirm(`Confirma a alteração para ${estavaBloqueado?'DISPONÍVEL':'BLOQUEADO'}?`))return;

    l.status=estavaBloqueado?'disponivel':'bloqueado';
    if(l.status==='disponivel'){l.paciente='';l.prontuario='';}
    const agora=new Date();
    const hora=agora.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
    const dataCompleta=agora.toLocaleDateString('pt-BR')+' '+hora;
    movimentacoesHistorico.unshift({
      data:dataCompleta,dataIso:agora.toISOString(),hora,
      atendimentoNasc:'-',atendimento:'-',nascimento:'',paciente:'Gestão de Leito',
      setor:nomeSetor+' (Leito '+numLeito+')',origem:nomeSetor,destino:nomeSetor,
      perfil:'Gestão de Leitos',convenio:'-',
      acao:(estavaBloqueado?'Liberação de Leito':'Bloqueio de Leito')+' — '+(usuarioAtual?.nome||'Usuário'),
      dataDesfecho:dataCompleta,dataDesfechoObj:agora,dataAdmissaoObj:agora
    });
    try{await salvarDadosNoFirebase();}catch(e){console.error(e);}
    renderizarPainelLeitos();
    atualizarTabelaMovimentacoes();
    atualizarTabelaHistoricoGeral();
    atualizarResumoPlantao();
    document.getElementById('modal-historico-paciente').style.display='none';
    alert(`Leito ${numLeito} ${estavaBloqueado?'liberado':'bloqueado'} com sucesso.`);
  };

  window.abrirHistoricoPacienteLeito=function(nomeSetor,numLeito){
    const ref=leitoByRefV1(nomeSetor,numLeito); if(!ref||!ref.leito)return;
    const l=ref.leito;
    const nomePaciente=l.paciente||'Nenhum paciente associado no momento';
    document.getElementById('paciente-modal-titulo').innerText='Leito '+numLeito+' — '+nomeSetor;
    const hist=movimentacoesHistorico.filter(m=>String(m.setor||'').includes(nomeSetor)&&String(m.setor||'').includes(numLeito));
    let lista='<ul style="padding-left:20px">';
    if(!hist.length) lista+='<li>Nenhum registro histórico recente para este leito.</li>';
    else hist.slice(0,30).forEach(h=>{lista+=`<li>[${escV1(h.data||'')}] <strong>${escV1(h.paciente||'')}</strong> — ${escV1(String(h.acao||'').replace(/<[^>]+>/g,''))}</li>`;});
    lista+='</ul>';
    const bloqueado=l.status==='bloqueado';
    const podeAlterar=usuarioAtual?.perfil!=='Visitante';
    const bloqueioPermitido=bloqueado || (l.status!=='ocupado'&&l.status!=='reservado');
    document.getElementById('paciente-modal-conteudo').innerHTML=`
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px">
        <div style="background:#f8fafc;border:1px solid #e2e8f0;padding:10px;border-radius:6px"><small>STATUS</small><br><strong style="color:${bloqueado?'var(--purple)':'var(--secondary)'}">${escV1(statusLabelV1(l.status))}</strong></div>
        <div style="background:#f8fafc;border:1px solid #e2e8f0;padding:10px;border-radius:6px"><small>PACIENTE</small><br><strong>${escV1(nomePaciente)}</strong></div>
      </div>
      ${podeAlterar?`<div style="margin:0 0 16px;display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn ${bloqueado?'btn-success':'btn-danger'}" ${bloqueioPermitido?'':'disabled style="opacity:.5;cursor:not-allowed"'} onclick="alternarBloqueioLeitoPainelV1('${String(nomeSetor).replace(/'/g,"\\'")}','${String(numLeito).replace(/'/g,"\\'")}')">${bloqueado?'🔓 Liberar leito':'🔒 Bloquear leito'}</button>
        ${!bloqueioPermitido?'<span style="font-size:.8rem;color:var(--danger);align-self:center">Leito ocupado/reservado: remaneje ou libere o paciente antes de bloquear.</span>':''}
      </div>`:''}
      <hr style="margin:10px 0"><h4 style="margin-bottom:8px">Movimentações vinculadas</h4>${lista}`;
    document.getElementById('modal-historico-paciente').style.display='flex';
  };

  window.renderizarPainelLeitos=function(){
    let htmlPainel=''; let htmlPlantao=''; let totalBloqueadosGeral=0;
    setoresData.forEach(s=>{totalBloqueadosGeral+=s.leitos.filter(l=>l.status==='bloqueado').length;});

    const painel=document.getElementById('painel');
    if(painel && !document.getElementById('controles-bloqueio-painel-v1')){
      const header=painel.querySelector('.page-header');
      const ctr=document.createElement('div');
      ctr.id='controles-bloqueio-painel-v1';
      ctr.style.cssText='background:white;border:1px solid var(--border);border-left:4px solid var(--purple);border-radius:8px;padding:12px 14px;margin-bottom:14px;display:flex;gap:10px;align-items:center;flex-wrap:wrap';
      ctr.innerHTML='<strong style="color:var(--purple)">Gestão rápida de leitos</strong><span style="font-size:.82rem;color:var(--text-muted)">Clique em qualquer leito para bloquear ou liberar diretamente pelo painel.</span><span id="badge-bloqueados-v1" style="background:#ede9fe;color:#6d28d9;padding:5px 9px;border-radius:999px;font-weight:700;font-size:.8rem"></span><button class="btn" style="background:var(--purple);padding:.45rem .8rem" onclick="filtrarPainelLeitosV1('bloqueados')">🔒 Leitos bloqueados</button><button class="btn" style="background:var(--text-muted);padding:.45rem .8rem" onclick="filtrarPainelLeitosV1('todos')">Mostrar todos</button>';
      header.after(ctr);
    }
    const badge=document.getElementById('badge-bloqueados-v1'); if(badge)badge.textContent=totalBloqueadosGeral+' bloqueado(s)';

    setoresData.forEach(function(s){
      const total=s.leitos.length;
      const livres=s.leitos.filter(l=>l.status==='disponivel').length;
      const ocupados=s.leitos.filter(l=>l.status==='ocupado').length;
      const higienizacao=s.leitos.filter(l=>l.status==='higienizacao').length;
      const reservados=s.leitos.filter(l=>l.status==='reservado').length;
      const bloqueados=s.leitos.filter(l=>l.status==='bloqueado').length;
      const ocupPercent=total>0?Math.round((ocupados/total)*100):0;
      const leitosVisiveis=filtroPainelLeitosV1==='bloqueados'?s.leitos.filter(l=>l.status==='bloqueado'):s.leitos;
      if(filtroPainelLeitosV1==='bloqueados' && !leitosVisiveis.length) return;
      let pillsHtml='';
      leitosVisiveis.forEach(function(l){
        let classeCor='leito-disponivel';
        if(l.status==='ocupado')classeCor='leito-ocupado';
        else if(l.status==='higienizacao')classeCor='leito-higienizacao';
        else if(l.status==='bloqueado')classeCor='leito-bloqueado';
        else if(l.status==='reservado')classeCor='leito-reservado';
        const tooltip=l.paciente?'Paciente: '+l.paciente:'Status: '+statusLabelV1(l.status);
        pillsHtml+=`<div class="leito-pill ${classeCor}" title="Leito ${escV1(l.n)} - ${escV1(tooltip)} — clique para gerenciar" onclick="abrirHistoricoPacienteLeito('${String(s.nome).replace(/'/g,"\\'")}','${String(l.n).replace(/'/g,"\\'")}')">${escV1(l.n)}</div>`;
      });
      const bloco=`<div class="sector-box"><div class="sector-title-row"><div><h3>${escV1(s.nome)}</h3><p>${escV1(s.tipo)} • Total: ${total}</p></div><span class="ocup-badge">${ocupPercent}% Ocup.</span></div><div class="leitos-grid">${pillsHtml||'<span style="color:var(--text-muted);font-size:.85rem">Nenhum leito neste filtro.</span>'}</div><div class="sector-summary"><span style="color:var(--secondary)">Total: <strong>${total}</strong></span><span style="color:var(--success)">Livres: <strong>${livres}</strong></span><span style="color:var(--danger)">Ocupados: <strong>${ocupados}</strong></span><span style="color:var(--warning)">Higieniz.: <strong>${higienizacao}</strong></span><span style="color:var(--info)">Reservados: <strong>${reservados}</strong></span><span style="color:var(--purple)">Bloqueados: <strong>${bloqueados}</strong></span></div></div>`;
      htmlPainel+=bloco; htmlPlantao+=bloco;
    });
    if(filtroPainelLeitosV1==='bloqueados'&&!htmlPainel)htmlPainel='<div class="sector-box" style="text-align:center;color:var(--text-muted)">Nenhum leito bloqueado no momento.</div>';
    const cp=document.getElementById('painel-setores-detalhado'); if(cp)cp.innerHTML=htmlPainel;
    const cpl=document.getElementById('panorama-plantao-container'); if(cpl)cpl.innerHTML=htmlPlantao;
    atualizarSelectsGerais();
  };

  renderizarPainelLeitos();
})();