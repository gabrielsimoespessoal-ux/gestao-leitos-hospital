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
        badge.style.cssText='position:absolute;bottom:-11px;top:auto;left:-9px;min-width:24px;height:18px;padding:0 4px;border-radius:9px;display:flex;align-items:center;justify-content:center;background:#0f766e;color:#fff;font-size:9px;font-weight:900;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.28);z-index:5;line-height:1';
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
        atalhoUti17();
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

      // Todas as operações passam pela transação Firestore, sem gravação do estado inteiro.
      w.alternarBloqueioLeitoPainelV2=async function(setor,leito,statusForcado){
        if(w.usuarioAtual&&w.usuarioAtual.perfil==='Visitante'){w.alert('Acesso negado.');return;}
        const ref=achar(setor,leito);if(!ref||!ref.l){w.alert('Leito não localizado.');return;}
        const atual=ref.l.status;
        if(['ocupado','reservado'].includes(atual)){
          w.alert('Leito '+leito+' está '+statusLabel(atual)+'. Transfira ou dê alta ao paciente pelo fluxo regular antes de alterar.');return;
        }
        const destino=statusForcado||(atual==='bloqueado'?'disponivel':'bloqueado');
        if(atual===destino)return;
        if(typeof w.executarStatusLeitoAtomico!=='function'){
          w.alert('Operação segura indisponível. Atualize a página e tente novamente.');return;
        }
        if(!w.confirm((destino==='bloqueado'?'BLOQUEAR':'DESBLOQUEAR / DISPONIBILIZAR')+' o leito '+leito+' de '+setor+'?'))return;
        try{
          await w.executarStatusLeitoAtomico({setor,leito,statusDestino:destino,usuario:(w.usuarioAtual&&w.usuarioAtual.nome)||'Usuário'});
          w.alert('Status do leito '+leito+' salvo no banco compartilhado: '+statusLabel(destino)+'.');
        }catch(e){w.alert('Não foi possível alterar o leito: '+(e&&e.message||e));}
      };

      // Controle de um clique para o leito 17, sem alterar nenhum outro leito.
      function atalhoUti17(){
        const painel=d.getElementById('painel');
        if(!painel)return;
        const setor='UTI IRMÃ DULCE (SUS)',leito='17';
        const ref=achar(setor,leito);
        if(!ref||!ref.l)return;
        let botao=d.getElementById('atalho-uti17-gestao');
        if(!botao){
          botao=d.createElement('button');botao.id='atalho-uti17-gestao';botao.type='button';
          botao.className='btn';botao.style.cssText='padding:8px 12px;background:#047857;color:white;border-radius:8px;font-weight:700';
          const barra=d.getElementById('gestao-bloqueios-v2');
          if(barra)barra.appendChild(botao);
          botao.onclick=()=>w.alternarBloqueioLeitoPainelV2(setor,leito,'disponivel');
        }
        const st=ref.l.status;
        botao.textContent='UTI 17: '+statusLabel(st)+' · Disponibilizar';
        botao.disabled=(st==='disponivel'||st==='ocupado'||st==='reservado');
        botao.title=botao.disabled?'Leito disponível ou em uso: nenhuma alteração permitida':'Clique para deixar somente o leito 17 disponível';
      }

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