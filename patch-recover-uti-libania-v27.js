(()=>{
const frame=document.getElementById('appFrame'); if(!frame)return;
function install(){
  const w=frame.contentWindow; if(!w||!Array.isArray(w.setoresData)||!Array.isArray(w.movimentacoesHistorico))return;
  const norm=v=>String(v||'').trim().toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  const ts=m=>{try{if(m.dataIso){const t=Date.parse(m.dataIso);if(!isNaN(t))return t;} const s=String(m.data||''); const z=s.match(/(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2}))?/); if(z)return new Date(+z[3],+z[2]-1,+z[1],+(z[4]||0),+(z[5]||0)).getTime();}catch(e){} return 0};
  const act=m=>String(m.acao||'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
  const entrada=m=>act(m).includes('Admissão')||act(m).includes('Transferência Interna');
  const saida=m=>['Alta Hospitalar','Alta a Pedido','Óbito','Evasão','Transferência Externa','Liberação de Leito'].some(x=>act(m).includes(x));
  const dest=m=>norm(m.destino||m.setor||'');
  const bed=m=>{const s=String(m.setor||''); const a=s.match(/LEITO\s*([A-Z0-9]+)/i); return a?String(a[1]).toUpperCase():''};

  async function recover(){
    let changed=false;
    for(const alvo of ['UTI IRMÃ DULCE (SUS)','IRMÃ LIBÂNIA']){
      const an=norm(alvo), setor=w.setoresData.find(s=>norm(s.nome)===an); if(!setor)continue;
      const perBed={};
      w.movimentacoesHistorico.forEach(m=>{if(!entrada(m)||!dest(m).includes(an))return; const b=bed(m),t=ts(m); if(b&&(!perBed[b]||t>perBed[b].t))perBed[b]={m,t};});
      for(const [b,o] of Object.entries(perBed)){
        const m=o.m, pr=String(m.atendimento||'').trim(), nome=String(m.paciente||'').trim(); if(!pr||pr==='-'||!nome)continue;
        const later=w.movimentacoesHistorico.some(x=>String(x.atendimento||'').trim()===pr&&ts(x)>o.t&&(saida(x)||(entrada(x)&&!dest(x).includes(an))));
        if(later)continue;
        const l=setor.leitos.find(x=>norm(x.n)===norm(b)); if(!l)continue;
        if((l.status==='ocupado'||l.status==='reservado')&&l.prontuario&&l.prontuario!==pr)continue;
        if(l.status!=='ocupado'||l.prontuario!==pr||l.paciente!==nome){l.status='ocupado';l.prontuario=pr;l.paciente=nome;changed=true;}
        if(!w.basePacientesCadastrados[pr])w.basePacientesCadastrados[pr]={};
        Object.assign(w.basePacientesCadastrados[pr],{nome,nascimento:m.nascimento||w.basePacientesCadastrados[pr].nascimento||'',statusInternacao:'ativo'});
        delete w.basePacientesCadastrados[pr].motivoSaida; delete w.basePacientesCadastrados[pr].dataSaida;
      }
    }
    if(changed){
      w.renderizarPainelLeitos?.(); w.atualizarTabelaPacientesInternos?.(); w.atualizarTabelaMovimentacoes?.(); w.atualizarTabelaHistoricoGeral?.();
      if(typeof w.salvarDadosNoFirebase==='function')await w.salvarDadosNoFirebase(true);
    }
  }
  setTimeout(recover,700); setTimeout(recover,3000);
}
if(frame.contentDocument?.readyState==='complete')install(); else frame.addEventListener('load',()=>setTimeout(install,300));
})();