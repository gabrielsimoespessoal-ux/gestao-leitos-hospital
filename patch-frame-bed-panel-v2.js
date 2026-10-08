(()=>{
  const frame=document.getElementById('appFrame');
  if(!frame) return;
  frame.addEventListener('load',()=>{
    try{
      const w=frame.contentWindow;
      const d=frame.contentDocument;
      if(!w||!d||!Array.isArray(w.setoresData)) return;
      let filtro='todos';
      const oldRender=w.renderizarPainelLeitos;
      const oldAbrir=w.abrirHistoricoPacienteLeito;

      function statusLabel(s){return ({disponivel:'Disponível',ocupado:'Ocupado',higienizacao:'Higienização',bloqueado:'Bloqueado',reservado:'Reservado'})[s]||s;}
      function achar(setor,leito){const s=w.setoresData.find(x=>x.nome===setor);return s?{s,l:s.leitos.find(x=>x.n===leito)}:null;}
      function totalBloqueados(){return w.setoresData.reduce((n,s)=>n+s.leitos.filter(l=>l.status==='bloqueado').length,0);}
      function sexoDoLeito(l){
        if(!l||l.status!=='ocupado'||!l.prontuario||!w.basePacientesCadastrados) return '';
        const p=w.basePacientesCadastrados[l.prontuario];
        if(!p||!p.sexo) return '';
        const s=String(p.sexo).toLowerCase();
        if(s.includes('femin')) return 'F';
        if(s.includes('mascul')) return 'M';
        return '';
      }
      function aplicarIconeSexo(pill,l){
        pill.querySelectorAll('.sexo-leito-v3').forEach(x=>x.remove());
        const sx=sexoDoLeito(l);
        if(!sx) return;
        pill.style.position='relative';
        pill.style.overflow='visible';
        const badge=d.createElement('span');
        badge.className='sexo-leito-v3';
        badge.textContent=sx==='F'?'♀':'♂';
        badge.title=sx==='F'?'Paciente feminino':'Paciente masculino';
        badge.style.cssText='position:absolute;top:-11px;right:-7px;width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:'+(sx==='F'?'#ec4899':'#2563eb')+';color:#fff;font-size:13px;font-weight:900;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.28);z-index:5;line-height:1';
        pill.appendChild(badge);
      }

      function aplicarIconeClinica(pill,l){
        const antigo=pill.querySelector('.perfil-clinica-v3');
        if(antigo)antigo.remove();
        if(!l||l.status!=='ocupado'||!l.prontuario)return;
        const b=w.basePacientesCadastrados?.[l.prontuario]||{};
        const perfil=String(b.perfil||'').trim().toLowerCase();
        if(perfil!=='enfermaria clínica' && perfil!=='enfermaria clinica')return;

        pill.style.position='relative';
        pill.style.overflow='visible';
        const badge=d.createElement('span');
        badge.className='perfil-clinica-v3';
        badge.textContent='C.M';
        badge.title='Paciente de Enfermaria Clínica';
        badge.style.cssText='position:absolute;top:-11px;left:-9px;min-width:24px;height:18px;padding:0 4px;border-radius:9px;display:flex;align-items:center;justify-content:center;background:#0f766e;color:#fff;font-size:9px;font-weight:900;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.28);z-index:5;line-height:1';
        pill.appendChild(badge);
      }

      function aplicarExtras(){
        const painel=d.getElementById('painel');
        if(!painel) return;
        let ctr=d.getElementById('gestao-bloqueios-v2');
        if(!ctr){
          ctr=d.createElement('div');
          ctr.id='gestao-bloqueios-v2';
          ctr.style.cssText='background:#fff;border:1px solid #e2e8f0;border-left:5px solid #8b5cf6;border-radius:8px;padding:12px 14px;margin:0 0 16px;display:flex;gap:10px;align-items:center;flex-wrap:wrap';
          ctr.innerHTML='<strong style="color:#6d28d9">Gestão rápida de leitos</strong><span style="font-size:.82rem;color:#64748b">Clique em qualquer leito para bloquear ou liberar diretamente pelo painel.</span><span id="badge-bloqueios-v2" style="background:#ede9fe;color:#6d28d9;padding:5px 9px;border-radius:999px;font-weight:700;font-size:.8rem"></span><button id="btn-bloqueados-v2" class="btn" style="background:#8b5cf6;padding:.45rem .8rem">🔒 Leitos bloqueados</button><button id="btn-todos-v2" class="btn" style="background:#64748b;padding:.45rem .8rem">Mostrar todos</button><span style="margin-left:auto;font-size:.8rem;color:#64748b;font-weight:700">C.M Enfermaria Clínica &nbsp; ♀ Feminino &nbsp; ♂ Masculino</span>';
          const header=painel.querySelector('.page-header');
          if(header) header.after(ctr);
          d.getElementById('btn-bloqueados-v2').onclick=()=>{filtro='bloqueados';aplicarExtras();};
          d.getElementById('btn-todos-v2').onclick=()=>{filtro='todos';aplicarExtras();};
        }
        const badge=d.getElementById('badge-bloqueios-v2'); if(badge) badge.textContent=totalBloqueados()+' bloqueado(s)';
        const boxes=[...d.querySelectorAll('#painel-setores-detalhado .sector-box')];
        boxes.forEach((box,i)=>{
          const s=w.setoresData[i]; if(!s)return;
          const bloqueados=s.leitos.filter(l=>l.status==='bloqueado').length;
          let sum=box.querySelector('.sector-summary');
          if(sum){
            let span=sum.querySelector('.bloq-count-v2');
            if(!span){span=d.createElement('span');span.className='bloq-count-v2';span.style.color='#8b5cf6';sum.appendChild(span);}
            span.innerHTML='Bloqueados: <strong>'+bloqueados+'</strong>';
          }
          const pills=[...box.querySelectorAll('.leito-pill')];
          pills.forEach((p,j)=>{
            const l=s.leitos[j]; if(!l)return;
            if(l.status==='bloqueado') p.style.background='#8b5cf6';
            p.style.display=(filtro==='bloqueados'&&l.status!=='bloqueado')?'none':'flex';
            aplicarIconeSexo(p,l);
            aplicarIconeClinica(p,l);
            const sx=sexoDoLeito(l);
            if(sx){
              const sexoTxt=sx==='F'?'Feminino':'Masculino';
              if(!String(p.title||'').includes(sexoTxt)) p.title=(p.title?p.title+' — ':'')+sexoTxt;
            }
          });
          box.style.display=(filtro==='bloqueados'&&bloqueados===0)?'none':'block';
        });
      }

      w.renderizarPainelLeitos=function(){
        if(typeof oldRender==='function') oldRender.apply(w,arguments);
        setTimeout(aplicarExtras,0);
      };

      w.alternarBloqueioLeitoPainelV2=async function(setor,leito){
        if(w.usuarioAtual&&w.usuarioAtual.perfil==='Visitante'){w.alert('Acesso negado.');return;}
        const ref=achar(setor,leito); if(!ref||!ref.l)return;
        const l=ref.l; const bloqueado=l.status==='bloqueado';
        if(!bloqueado&&(l.status==='ocupado'||l.status==='reservado')){w.alert('Este leito está '+statusLabel(l.status)+'. Remaneje ou libere o paciente antes de bloquear.');return;}
        if(!w.confirm((bloqueado?'LIBERAR':'BLOQUEAR')+' o leito '+leito+' de '+setor+'?'))return;
        l.status=bloqueado?'disponivel':'bloqueado';
        if(l.status==='disponivel'){l.paciente='';l.prontuario='';}
        const agora=new Date(); const hora=agora.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}); const data=agora.toLocaleDateString('pt-BR')+' '+hora;
        if(Array.isArray(w.movimentacoesHistorico)) w.movimentacoesHistorico.unshift({data,dataIso:agora.toISOString(),hora,atendimentoNasc:'-',atendimento:'-',nascimento:'',paciente:'Gestão de Leito',setor:setor+' (Leito '+leito+')',origem:setor,destino:setor,perfil:'Gestão de Leitos',convenio:'-',acao:(bloqueado?'Liberação de Leito':'Bloqueio de Leito')+' — '+((w.usuarioAtual&&w.usuarioAtual.nome)||'Usuário'),dataDesfecho:data,dataDesfechoObj:agora,dataAdmissaoObj:agora});
        if(typeof w.salvarDadosNoFirebase==='function') await w.salvarDadosNoFirebase();
        if(typeof w.renderizarPainelLeitos==='function') w.renderizarPainelLeitos();
        if(typeof w.atualizarTabelaMovimentacoes==='function') w.atualizarTabelaMovimentacoes();
        if(typeof w.atualizarTabelaHistoricoGeral==='function') w.atualizarTabelaHistoricoGeral();
        const m=d.getElementById('modal-historico-paciente'); if(m)m.style.display='none';
        w.alert('Leito '+leito+' '+(bloqueado?'liberado':'bloqueado')+' com sucesso.');
      };

      w.abrirHistoricoPacienteLeito=function(setor,leito){
        if(typeof oldAbrir==='function') oldAbrir.call(w,setor,leito);
        const ref=achar(setor,leito); if(!ref||!ref.l)return;
        const l=ref.l; const bloqueado=l.status==='bloqueado'; const pode=!w.usuarioAtual||w.usuarioAtual.perfil!=='Visitante';
        const cont=d.getElementById('paciente-modal-conteudo'); if(!cont||!pode)return;
        const wrap=d.createElement('div'); wrap.style.cssText='margin:14px 0;padding:12px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px';
        const permitido=bloqueado||(l.status!=='ocupado'&&l.status!=='reservado');
        const sx=sexoDoLeito(l); const sexoTxt=sx==='F'?'Feminino':sx==='M'?'Masculino':'';
        wrap.innerHTML='<strong>Status do leito: '+statusLabel(l.status)+'</strong>'+(sexoTxt?'<div style="margin-top:6px;font-weight:700">'+(sx==='F'?'♀':'♂')+' Sexo: '+sexoTxt+'</div>':'')+'<div style="margin-top:10px"><button class="btn '+(bloqueado?'btn-success':'btn-danger')+'" '+(permitido?'':'disabled')+' id="acao-bloq-v2">'+(bloqueado?'🔓 Liberar leito':'🔒 Bloquear leito')+'</button></div>'+(permitido?'':'<small style="color:#ef4444">Leito ocupado/reservado: remaneje ou libere o paciente antes de bloquear.</small>');
        cont.prepend(wrap);
        const b=wrap.querySelector('#acao-bloq-v2'); if(b&&permitido)b.onclick=()=>w.alternarBloqueioLeitoPainelV2(setor,leito);
      };

      aplicarExtras();
    }catch(e){console.error('Erro no patch de gestão de leitos:',e);}
  });
})();