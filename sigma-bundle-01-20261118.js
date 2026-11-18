/* SIGMA: bundle 1/5; ordem original preservada, fontes individuais intactas */
;/* FILE: patch-frame-bed-panel-v2.js */
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
        pill.querySelectorAll('.perfil-clinica-v3,.perfil-cirurgica-v3').forEach(x=>x.remove());
        if(!l||!['ocupado','reservado'].includes(l.status)||!l.prontuario)return;
        const b=w.basePacientesCadastrados?.[l.prontuario]||{};
        const perfil=String(b.perfil||b.perfilVaga||l.perfil||l.perfilVaga||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase();
        // Reserva cirúrgica eletiva também deve receber C.C mesmo antes da admissão.
        // Considerar informação cirúrgica vinculada ao próprio leito, mas nunca o setor sozinho.
        const dc=l.dadosCirurgicos;
        const reservaCirurgica=l.status==='reservado' && !!dc && typeof dc==='object';
        if(!/cirurg/.test(perfil)&&!reservaCirurgica)return;
        pill.style.position='relative';
        pill.style.overflow='visible';
        const badge=d.createElement('span');
        badge.className='perfil-cirurgica-v3';
        badge.textContent='C.C';
        badge.title=l.status==='reservado'?'Reserva cirúrgica':'Paciente cirúrgico';
        badge.style.cssText='position:absolute;bottom:-11px;top:auto;left:-9px;min-width:24px;height:18px;padding:0 4px;border-radius:9px;display:flex;align-items:center;justify-content:center;background:#7c3aed;color:#fff;font-size:9px;font-weight:900;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.28);z-index:5;line-height:1';
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
          ctr.innerHTML='<strong style="color:#6d28d9">Gestão rápida de leitos</strong><span style="font-size:.82rem;color:#64748b">Clique em qualquer leito para bloquear ou liberar diretamente pelo painel.</span><span id="badge-bloqueios-v2" style="background:#ede9fe;color:#6d28d9;padding:5px 9px;border-radius:999px;font-weight:700;font-size:.8rem"></span><button id="btn-bloqueados-v2" class="btn" style="background:#8b5cf6;padding:.45rem .8rem">🔒 Leitos bloqueados</button><button id="btn-todos-v2" class="btn" style="background:#64748b;padding:.45rem .8rem">Mostrar todos</button><span style="margin-left:auto;font-size:.8rem;color:#64748b;font-weight:700">C.C Paciente/Reserva Cirúrgica &nbsp; ♀ Feminino &nbsp; ♂ Masculino</span>';
          const header=painel.querySelector('.page-header');
          if(header) header.after(ctr);
          d.getElementById('btn-bloqueados-v2').onclick=()=>{filtro='bloqueados';aplicarExtras();};
          d.getElementById('btn-todos-v2').onclick=()=>{filtro='todos';aplicarExtras();};
        }
        atalhoDesbloquear();
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

      // Ação geral de desbloqueio: lista somente leitos bloqueados.
      function atalhoDesbloquear(){
        const barra=d.getElementById('gestao-bloqueios-v2');
        if(!barra)return;
        const velho=d.getElementById('atalho-uti17-gestao');if(velho)velho.remove();
        let botao=d.getElementById('atalho-desbloquear-leitos');
        if(!botao){
          botao=d.createElement('button');botao.id='atalho-desbloquear-leitos';
          botao.type='button';botao.className='btn';
          botao.style.cssText='padding:8px 12px;background:#047857;color:white;border-radius:8px;font-weight:700';
          botao.textContent='🔓 Desbloquear leitos';
          barra.appendChild(botao);
          botao.onclick=()=>{
            const bloqueados=w.setoresData.flatMap(s=>(s.leitos||[]).filter(l=>l.status==='bloqueado').map(l=>({setor:s.nome,leito:l.n})));
            if(!bloqueados.length){w.alert('Nenhum leito bloqueado no momento.');return;}
            const antigo=d.getElementById('modal-desbloquear-leitos');if(antigo)antigo.remove();
            const overlay=d.createElement('div');overlay.id='modal-desbloquear-leitos';
            overlay.style.cssText='position:fixed;inset:0;z-index:999999;background:#0f172a99;display:flex;align-items:center;justify-content:center;padding:16px';
            const box=d.createElement('section');box.style.cssText='background:white;border-radius:12px;padding:20px;width:min(540px,100%);max-height:85vh;overflow:auto;box-shadow:0 20px 55px #0004';
            const heading=d.createElement('h3');heading.textContent='🔓 Desbloquear leitos';heading.style.margin='0 0 8px';
            const info=d.createElement('p');info.textContent='Escolha o leito bloqueado que deseja disponibilizar. Nenhum outro leito será alterado.';info.style.cssText='font-size:14px;color:#475569';
            const select=d.createElement('select');select.style.cssText='width:100%;padding:12px;border:1px solid #cbd5e1;border-radius:8px;margin:12px 0';
            bloqueados.forEach((l,i)=>{const opt=d.createElement('option');opt.value=String(i);opt.textContent=l.setor+' — Leito '+l.leito;select.appendChild(opt);});
            const actions=d.createElement('div');actions.style.cssText='display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap';
            const cancelar=d.createElement('button');cancelar.type='button';cancelar.className='btn';cancelar.textContent='Cancelar';cancelar.onclick=()=>overlay.remove();
            const confirmar=d.createElement('button');confirmar.type='button';confirmar.className='btn';confirmar.textContent='🔓 Desbloquear selecionado';confirmar.style.background='#047857';
            confirmar.onclick=async()=>{const escolhido=bloqueados[Number(select.value)];if(!escolhido)return;overlay.remove();await w.alternarBloqueioLeitoPainelV2(escolhido.setor,escolhido.leito,'disponivel');};
            actions.append(cancelar,confirmar);box.append(heading,info,select,actions);overlay.appendChild(box);d.body.appendChild(overlay);
            overlay.addEventListener('click',e=>{if(e.target===overlay)overlay.remove();});
          };
        }
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

      // Regularização assistida apenas para duplicidade confirmada na mesma identidade.
      function adicionarRegularizador(){
        const barra=d.getElementById('gestao-bloqueios-v2');
        if(!barra||d.getElementById('hsj-regularizar-vinculos'))return;
        const btn=d.createElement('button');btn.type='button';btn.id='hsj-regularizar-vinculos';
        btn.className='btn';btn.textContent='↔ Corrigir leito duplicado';
        btn.style.cssText='background:#b45309;color:#fff;padding:8px 12px;border-radius:8px';
        barra.appendChild(btn);
        btn.onclick=async()=>{
          const origemSetor='ALA A',origemLeito='L1';
          const destinoSetor='UTI IRMÃ DULCE (INTERNO / FILANTRÓPICO)',destinoLeito='02';
          const origem=achar(origemSetor,origemLeito)?.l,destino=achar(destinoSetor,destinoLeito)?.l;
          if(!origem||!destino){w.alert('Não foi possível localizar os leitos.');return;}
          if(origem.status!=='ocupado'||destino.status!=='ocupado'){
            w.alert('A situação já mudou ou um leito não está ocupado. Atualize o painel.');return;
          }
          if(!origem.prontuario||String(origem.prontuario)!==String(destino.prontuario)){
            w.alert('Prontuários diferentes ou ausentes. Não é seguro liberar o leito L1 automaticamente.');return;
          }
          if(w.usuarioAtual?.perfil==='Visitante'){w.alert('Acesso negado.');return;}
          const pr=String(origem.prontuario);
          const aviso='Regularizar duplicidade do mesmo paciente?\\n\\nMANTER: UTI INTERNO/FILANTRÓPICO — LEITO 02 (OCUPADO)\\nLIBERAR: ALA A — LEITO L1\\n\\nProntuário: '+pr+'\\n\\nO banco validará novamente os dados antes de qualquer alteração.';
          if(!w.confirm(aviso))return;
          try{
            if(typeof w.hsjLiberarOrigemDuplicadaAtomica!=='function')throw Error('Módulo de regularização não carregado. Atualize a página.');
            await w.hsjLiberarOrigemDuplicadaAtomica({pr,setorOrigem:origemSetor,leitoOrigem:origemLeito,
               setorDestino:destinoSetor,leitoDestino:destinoLeito,usuario:w.usuarioAtual?.nome||'usuario'});
            w.alert('Regularização confirmada no banco: UTI 02 mantido ocupado e L1 liberado. Atualize o painel para conferir.');
          }catch(e){w.alert('Regularização não executada: '+(e?.message||e));}
        };
      }
      const renderAnteriorRegularizacao=w.renderizarPainelLeitos;
      if(typeof renderAnteriorRegularizacao==='function'){
        w.renderizarPainelLeitos=function(){
          const retorno=renderAnteriorRegularizacao.apply(this,arguments);
          setTimeout(adicionarRegularizador,0);
          return retorno;
        };
      }
      adicionarRegularizador();

      // Para admissão, permite selecionar a própria reserva do prontuário informado.
      // A transação original valida novamente prontuário e estado no Firebase.
      const atualizarLeitosOriginal=w.atualizarSelectLeitosMov;
      if(typeof atualizarLeitosOriginal==='function'){
        function oferecerReservaPropria(){
          const setorNome=d.getElementById('mov-setor')?.value;
          const pr=String(d.getElementById('mov-atendimento')?.value||'').trim();
          const acao=d.getElementById('mov-acao')?.value;
          const select=d.getElementById('mov-leito');
          if(!select||acao!=='Admissão'||!pr)return;
          const setor=w.setoresData.find(x=>x.nome===setorNome);
          if(!setor)return;
          const reservas=(setor.leitos||[]).filter(l=>l.status==='reservado'&&String(l.prontuario||'').trim()===pr);
          if(!reservas.length)return;
          const atual=select.value;
          for(const l of reservas){
            if(!Array.from(select.options).some(o=>o.value===String(l.n))){
              const option=d.createElement('option');
              option.value=String(l.n);
              option.textContent='Leito '+l.n+' (reservado para este paciente — confirmar internação)';
              select.appendChild(option);
            }
          }
          const reservado=reservas.find(l=>String(l.n)===String(atual))||reservas[0];
          select.value=String(reservado.n);
        }
        w.atualizarSelectLeitosMov=function(){
          const retorno=atualizarLeitosOriginal.apply(this,arguments);
          oferecerReservaPropria();
          return retorno;
        };
        const prInput=d.getElementById('mov-atendimento');
        if(prInput)prInput.addEventListener('input',()=>setTimeout(oferecerReservaPropria,0));
        const acaoInput=d.getElementById('mov-acao');
        if(acaoInput)acaoInput.addEventListener('change',()=>setTimeout(()=>w.atualizarSelectLeitosMov(),0));
        const setorInput=d.getElementById('mov-setor');
        if(setorInput)setorInput.addEventListener('change',()=>setTimeout(oferecerReservaPropria,0));
        const obs=new MutationObserver(()=>oferecerReservaPropria());
        const select=d.getElementById('mov-leito');
        // Observar somente abertura/preenchimento do formulário, evitando loops.
        const drawer=d.getElementById('hsj-drawer-wrap');
        if(drawer)obs.observe(drawer,{attributes:true,attributeFilter:['style']});
        oferecerReservaPropria();
      }

      aplicarExtras();
    }catch(e){console.error('Erro no patch de gestão de leitos:',e);}
  });
})();
;
;/* FILE: patch-simple-patient-flow-v4.js */
(()=>{
  const frame=document.getElementById('appFrame');
  if(!frame) return;
  frame.addEventListener('load',()=>{
    setTimeout(()=>{
      try{
        const w=frame.contentWindow,d=frame.contentDocument;
        if(!w||!d||!Array.isArray(w.setoresData)) return;

        const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
        const isTemp=pr=>String(pr||'').startsWith('EXT-');
        const getBase=pr=>w.basePacientesCadastrados?.[pr]||{};
        const setorAtualPorPr=(pr)=>{
          for(const s of w.setoresData){const l=s.leitos.find(x=>x.prontuario===pr&&(x.status==='ocupado'||x.status==='reservado'));if(l)return {s,l};}
          return null;
        };
        const perfilCompativel=(setorNome,perfil)=>{
          const s=w.setoresData.find(x=>x.nome===setorNome); if(!s)return true;
          const p=String(perfil||'').toUpperCase();
          if(s.tipo==='UTI') return p.startsWith('UTI');
          if(s.tipo==='Pronto Socorro Psiquiátrico') return p.includes('MENTAL');
          return !p.startsWith('UTI')&&!p.includes('MENTAL');
        };
        const msgConflito=(setorNome,perfil)=>{
          const s=w.setoresData.find(x=>x.nome===setorNome);
          if(!s)return '';
          if(s.tipo==='UTI')return 'CONFLITO DE PERFIL: o setor selecionado é UTI. Selecione um perfil de UTI Clínica ou UTI Cirúrgica.';
          if(s.tipo==='Pronto Socorro Psiquiátrico')return 'CONFLITO DE PERFIL: este setor é de saúde mental. Selecione Enfermaria Mental.';
          return 'CONFLITO DE PERFIL: o setor selecionado é de enfermaria/internamento e não aceita perfil de UTI.';
        };

        // --- formulário mais simples e objetivo ---
        const grid=d.querySelector('#box-form-mov .form-grid');
        if(grid){
          const ids=['mov-acao','mov-convenio','mov-atendimento','mov-paciente','mov-nascimento','mov-sexo','mov-precaucao','mov-perfil-vaga','mov-origem','mov-setor','mov-leito'];
          ids.forEach(id=>{const el=d.getElementById(id);const g=el?.closest('.form-group');if(g)grid.appendChild(g);});
          const h=d.querySelector('#box-form-mov h3'); if(h)h.textContent='Cadastro e Movimentação do Paciente';
          const btn=d.querySelector('#box-form-mov .btn-success'); if(btn)btn.textContent='Salvar / Executar';
          const ac=d.getElementById('mov-acao');
          if(ac){
            const res=[...ac.options].find(o=>o.value==='Reservado');
            if(res)res.textContent='Reserva Externa / Reserva de Leito';
            ac.insertAdjacentHTML('afterbegin','<option value="" selected>Selecione a ação operacional...</option>');
            ac.onchange=()=>{if(typeof w.alternarCamposCirurgicosMov==='function')w.alternarCamposCirurgicosMov(); atualizarRegraProntuario();};
          }
          const pr=d.getElementById('mov-atendimento');
          const lab=pr?.closest('.form-group')?.querySelector('label');
          if(lab)lab.innerHTML='Número do Prontuário <span id="regra-prontuario-v3" style="font-weight:400;color:#64748b"></span>';
        }
        function atualizarRegraProntuario(){
          const ac=d.getElementById('mov-acao')?.value;
          const pr=d.getElementById('mov-atendimento');
          const sp=d.getElementById('regra-prontuario-v3');
          if(!pr)return;
          const ehReserva=['Reservado','Reserva Cirúrgica Eletiva','Reserva Cirúrgica com Previsão de Alta'].includes(ac);
          if(ehReserva){
            pr.required=false; pr.placeholder='Opcional em qualquer reserva — obrigatório somente ao efetivar ocupação';
            if(sp)sp.textContent='(opcional na reserva; obrigatório ao ocupar o leito)';
          }else{
            pr.required=true; pr.placeholder='Digite o nº — obrigatório para ocupação/movimentação do paciente';
            if(sp)sp.textContent='(obrigatório)';
          }
        }
        atualizarRegraProntuario();

        // --- filtros no topo do Painel de Leitos ---
        const painel=d.getElementById('painel');
        if(painel&&!d.getElementById('filtro-painel-pac-v3')){
          const bar=d.createElement('div'); bar.id='filtro-painel-pac-v3';
          bar.style.cssText='background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:12px 14px;margin-bottom:14px;display:grid;grid-template-columns:2fr 1fr 1fr auto;gap:8px;align-items:end';
          bar.innerHTML='<div class="form-group"><label>Paciente ou prontuário</label><input id="fp-q-v3" placeholder="Nome ou nº do prontuário"></div><div class="form-group"><label>Data inicial</label><input id="fp-di-v3" type="date"></div><div class="form-group"><label>Data final</label><input id="fp-df-v3" type="date"></div><div style="display:flex;gap:6px"><button class="btn" id="fp-buscar-v3">🔎 Pesquisar</button><button class="btn" id="fp-limpar-v3" style="background:#64748b">Limpar</button></div>';
          const gest=d.getElementById('gestao-bloqueios-v2');
          if(gest)gest.after(bar); else painel.querySelector('.page-header')?.after(bar);
          d.getElementById('fp-buscar-v3').onclick=()=>aplicarFiltroPainel();
          d.getElementById('fp-limpar-v3').onclick=()=>{['fp-q-v3','fp-di-v3','fp-df-v3'].forEach(id=>d.getElementById(id).value='');aplicarFiltroPainel();};
          d.getElementById('fp-q-v3').addEventListener('keydown',e=>{if(e.key==='Enter')aplicarFiltroPainel();});
        }

        function parseDate(v){if(!v)return null;const x=new Date(v);return isNaN(x)?null:x;}
        function aplicarFiltroPainel(){
          const q=(d.getElementById('fp-q-v3')?.value||'').trim().toLowerCase();
          const di=parseDate(d.getElementById('fp-di-v3')?.value);
          const df=parseDate(d.getElementById('fp-df-v3')?.value); if(df)df.setHours(23,59,59,999);
          const boxes=[...d.querySelectorAll('#painel-setores-detalhado .sector-box')];
          boxes.forEach((box,i)=>{
            const s=w.setoresData[i]; if(!s)return;
            let any=false;
            const pills=[...box.querySelectorAll('.leito-pill')];
            pills.forEach((p,j)=>{
              const l=s.leitos[j]; if(!l)return;
              const b=getBase(l.prontuario);
              const texto=((l.paciente||'')+' '+(isTemp(l.prontuario)?'':(l.prontuario||''))).toLowerCase();
              let ok=!q||texto.includes(q);
              const adm=b.dataAdmissao?new Date(b.dataAdmissao):null;
              if(di)ok=ok&&adm&&adm>=di;
              if(df)ok=ok&&adm&&adm<=df;
              if(q||di||df){p.style.display=ok?'flex':'none'; if(ok)any=true;} else {if(p.style.display!=='none')any=true;}
            });
            if(q||di||df)box.style.display=any?'block':'none';
          });
        }

        // --- validação de perfil/setor + Reserva Externa sem prontuário ---
        const oldExec=w.executarMovimentacaoLeito;
        w.executarMovimentacaoLeito=async function(){
          const ac=d.getElementById('mov-acao')?.value;
          if(!ac){w.alert('Selecione primeiro a Ação Operacional.');return;}

          const setor=d.getElementById('mov-setor')?.value;
          const leito=d.getElementById('mov-leito')?.value;
          const perfil=d.getElementById('mov-perfil-vaga')?.value;
          if(!perfilCompativel(setor,perfil)){w.alert(msgConflito(setor,perfil));return;}

          const prEl=d.getElementById('mov-atendimento');
          let gerado=false;
          const ehReserva=['Reservado','Reserva Cirúrgica Eletiva','Reserva Cirúrgica com Previsão de Alta'].includes(ac);
          if(ehReserva&&!prEl.value.trim()){prEl.value='RES-'+Date.now();gerado=true;}
          if(!ehReserva&&!prEl.value.trim()){
            w.alert('Informe o número do prontuário. Ele é opcional apenas durante uma reserva e obrigatório para efetivar a ocupação do leito.');
            return;
          }

          const pr=prEl.value.trim();
          const nome=d.getElementById('mov-paciente')?.value.trim();
          const nasc=d.getElementById('mov-nascimento')?.value;
          const sexo=d.getElementById('mov-sexo')?.value;
          const conv=d.getElementById('mov-convenio')?.value;
          const prec=d.getElementById('mov-precaucao')?.value;
          const origem=d.getElementById('mov-origem')?.value;
          const previsao=d.getElementById('mov-previsao-alta-paciente')?.value||'';

          if(['Admissão','Reservado'].includes(ac)){
            if(!nome||!nasc||!perfil||!sexo||!origem){
              w.alert('Atenção: preencha todos os campos obrigatórios do paciente.');
              return;
            }
            if(typeof w.executarEntradaLeitoAtomica!=='function'){
              w.alert('Módulo seguro de admissão ainda não carregou. Faça Ctrl + F5 e tente novamente.');
              return;
            }

            try{
              const resultado=await w.executarEntradaLeitoAtomica({
                acao:ac,setor:setor,leito:leito,pr:pr,nome:nome,nasc:nasc,
                sexo:sexo,perfil:perfil,convenio:conv,precaucao:prec,origem:origem,
                previsaoAlta:previsao,usuario:w.usuarioAtual?.nome||'usuario'
              });

              // Atualiza somente a representação local correspondente ao commit confirmado.
              const sObj=w.setoresData.find(x=>x.nome===setor);
              const lObj=sObj?.leitos.find(x=>String(x.n)===String(leito));
              if(lObj){lObj.status=resultado.status;lObj.paciente=nome;lObj.prontuario=pr;}
              w.basePacientesCadastrados[pr]={
                ...(w.basePacientesCadastrados[pr]||{}),
                nome,nascimento:nasc,sexo,perfil,convenio:conv,precaucao:prec,origem,
                previsaoAlta:previsao,statusInternacao:resultado.status==='ocupado'?'ativo':'reservado',
                prontuarioPendente:gerado
              };

              if(typeof w.renderizarPainelLeitos==='function')w.renderizarPainelLeitos();
              if(typeof w.atualizarTabelaPacientesInternos==='function')w.atualizarTabelaPacientesInternos();

              ['mov-atendimento','mov-paciente','mov-nascimento'].forEach(id=>{const el=d.getElementById(id);if(el)el.value='';});
              if(d.getElementById('mov-previsao-alta-paciente'))d.getElementById('mov-previsao-alta-paciente').value='';
              const acEl=d.getElementById('mov-acao');if(acEl)acEl.selectedIndex=0;

              w.alert((ac==='Admissão'?'Admissão':'Reserva')+' gravada com sucesso no banco. A alteração permanecerá após atualizar a página.');
            }catch(err){
              console.error('Falha na entrada atômica:',err);
              if(err?.code==='CONFLITO_REAL'){
                w.alert('CONFLITO REAL DETECTADO.\n\n'+err.message+'\n\nNenhum dado foi sobrescrito. Atualize a página e confira o leito.');
              }else{
                w.alert('Não foi possível gravar a movimentação no banco: '+(err?.message||err));
              }
            }
            return;
          }

          // Demais ações continuam no fluxo existente até migração individual.
          return oldExec.apply(w,arguments);
        };

        // --- modal de edição completo, incluindo prontuário posterior ---
        const modal=d.getElementById('modal-editar-paciente');
        if(modal&&!d.getElementById('edit-prontuario-vis-v3')){
          const body=modal.firstElementChild;
          body.style.width='560px'; body.style.maxHeight='90vh'; body.style.overflowY='auto';
          const hidden=d.getElementById('edit-prontuario');
          const bloco=d.createElement('div');
          bloco.innerHTML='<div class="form-group" style="margin-bottom:1rem"><label>Número do Prontuário</label><input type="text" id="edit-prontuario-vis-v3" style="width:100%;padding:.5rem;border:1px solid var(--border);border-radius:6px" placeholder="Inclua quando estiver disponível"></div><div class="form-group" style="margin-bottom:1rem"><label>Sexo</label><select id="edit-sexo-v3" style="width:100%;padding:.5rem;border:1px solid var(--border);border-radius:6px"><option value="">Selecione...</option><option>Feminino</option><option>Masculino</option></select></div><div class="form-group" style="margin-bottom:1rem"><label>Caráter / Convênio</label><select id="edit-convenio-v3" style="width:100%;padding:.5rem;border:1px solid var(--border);border-radius:6px"><option>SUS</option><option>Particular</option><option>Convênio</option><option>Filantrópico</option></select></div><div class="form-group" style="margin-bottom:1rem"><label>Precaução / Isolamento</label><select id="edit-precaucao-v3" style="width:100%;padding:.5rem;border:1px solid var(--border);border-radius:6px"><option value="Nenhuma">Nenhuma (Padrão)</option><option value="Isolamento Contato">Isolamento Contato</option><option value="Isolamento Reverso">Isolamento Reverso</option><option value="Isolamento Gotículas">Isolamento Gotículas</option><option value="Isolamento Aerossóis">Isolamento Aerossóis</option><option value="Isolamento Contato+Gotículas">Contato + Gotículas</option><option value="Isolamento Contato+Aerossóis">Contato + Aerossóis</option></select></div><div class="form-group" style="margin-bottom:1rem"><label>Setor / Unidade de Origem</label><select id="edit-origem-v3" style="width:100%;padding:.5rem;border:1px solid var(--border);border-radius:6px"></select></div>';
          hidden.after(bloco);

          const blocoAcao=d.createElement('div');
          blocoAcao.id='atalho-acao-operacional-v4';
          blocoAcao.style.cssText='margin:0 0 1rem;padding:12px;background:#eef6ff;border:1px solid #bfdbfe;border-left:4px solid #0284c7;border-radius:8px';
          blocoAcao.innerHTML='<label style="display:block;font-size:.8rem;font-weight:700;color:#0f172a;margin-bottom:6px">Ação Operacional — Atalho</label><div style="display:grid;grid-template-columns:1fr auto auto;gap:8px"><select id="edit-acao-v4" style="width:100%;padding:.55rem;border:1px solid var(--border);border-radius:6px"><option value="">Selecione a ação...</option><option value="Admissão">Admissão</option><option value="Transferência Interna">Transferência Interna</option><option value="Transferência Externa">Transferência Externa</option><option value="Reservado">Reserva Externa / Reserva de Leito</option><option value="Reserva Cirúrgica Eletiva">Reserva Cirúrgica Eletiva</option><option value="Alta Hospitalar">Alta Hospitalar</option><option value="Alta a Pedido">Alta a Pedido</option><option value="Evasão">Evasão</option><option value="Óbito">Óbito</option><option value="Bloqueio">Bloquear Leito / Manutenção</option><option value="Disponível">Liberar Leito</option></select><button type="button" class="btn" id="btn-acao-operacional-v4">Abrir ação</button><button type="button" class="btn btn-success" id="btn-confirmar-acao-v5">Confirmar ação agora</button></div><small style="display:block;margin-top:6px;color:#64748b">“Abrir ação” leva para a tela de movimentação. “Confirmar ação agora” executa diretamente pelo Painel de Leitos e registra no Histórico Geral e nas Movimentações.</small>';
          body.querySelector('div[style*="justify-content:flex-end"]')?.before(blocoAcao);

          const so=d.getElementById('edit-origem-v3');
          (w.unidadesOrigemDestino||[]).concat((w.setoresData||[]).map(s=>s.nome)).forEach(x=>{const o=d.createElement('option');o.textContent=x;so.appendChild(o);});
        }

        const oldOpen=w.abrirEdicaoPaciente;
        w.abrirEdicaoPaciente=function(pr,nome,nasc,perfil){
          oldOpen.call(w,pr,nome,nasc,perfil);
          const b=getBase(pr);
          d.getElementById('edit-prontuario-vis-v3').value=isTemp(pr)?'':pr;
          d.getElementById('edit-sexo-v3').value=b.sexo||'';
          d.getElementById('edit-convenio-v3').value=b.convenio||'SUS';
          d.getElementById('edit-precaucao-v3').value=b.precaucao||'Nenhuma';
          d.getElementById('edit-origem-v3').value=b.origem||'';
          const ea=d.getElementById('edit-acao-v4'); if(ea)ea.value='';
        };

        function prepararAcaoOperacionalPainel(irParaTela){
          const acao=d.getElementById('edit-acao-v4')?.value;
          if(!acao){w.alert('Selecione a Ação Operacional.');return null;}
          const oldPr=d.getElementById('edit-prontuario').value;
          const atual=setorAtualPorPr(oldPr);
          const b=getBase(oldPr);
          const informado=(d.getElementById('edit-prontuario-vis-v3')?.value||'').trim();
          const nome=(d.getElementById('edit-nome')?.value||b.nome||'').trim();
          const nasc=d.getElementById('edit-nasc')?.value||b.nascimento||'';
          const perfil=d.getElementById('edit-perfil')?.value||b.perfil||'';
          const sexo=d.getElementById('edit-sexo-v3')?.value||b.sexo||'';
          const conv=d.getElementById('edit-convenio-v3')?.value||b.convenio||'SUS';
          const prec=d.getElementById('edit-precaucao-v3')?.value||b.precaucao||'Nenhuma';
          const origem=d.getElementById('edit-origem-v3')?.value||b.origem||'';

          if(!nome||!nasc||!perfil||!sexo||!origem){w.alert('Antes de executar a ação, complete Nome, Data de Nascimento, Sexo, Perfil e Setor/Unidade de Origem.');return null;}
          if(atual&&!perfilCompativel(atual.s.nome,perfil)){w.alert(msgConflito(atual.s.nome,perfil));return null;}
          if(acao!=='Reservado'&&!informado&&isTemp(oldPr)){
            w.alert('Para confirmar esta ação, informe primeiro o número definitivo do prontuário do paciente.');
            return null;
          }

          let finalPr=informado||oldPr;
          if(informado&&informado!==oldPr){
            const existente=w.basePacientesCadastrados[informado];
            const normaliza=x=>String(x||'').trim().toUpperCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g,'');
            const mesmoPaciente=!!existente && normaliza(existente.nome)===normaliza(nome) && (!existente.nascimento||!nasc||String(existente.nascimento)===String(nasc));
            if(existente&&!mesmoPaciente){
              w.alert('Este prontuário já pertence a outro paciente: '+(existente.nome||'cadastro existente')+'. Confira o número informado.');
              return null;
            }
            const dados={...(existente||{}),...b,nome,nascimento:nasc,perfil,sexo,convenio:conv,precaucao:prec,origem,prontuarioPendente:false};
            delete w.basePacientesCadastrados[oldPr];
            w.basePacientesCadastrados[informado]=dados;
            w.setoresData.forEach(s=>s.leitos.forEach(l=>{if(l.prontuario===oldPr){l.prontuario=informado;l.paciente=nome;}}));
            (w.movimentacoesHistorico||[]).forEach(m=>{if(m.atendimento===oldPr){m.atendimento=informado;m.atendimentoNasc='Pront: '+informado+'<br><small>Nasc: '+nasc+'</small>';};});
            d.getElementById('edit-prontuario').value=informado;
            finalPr=informado;
          }

          const atualizado=setorAtualPorPr(finalPr)||atual;
          if(!atualizado){w.alert('Não foi possível identificar o leito atual deste paciente.');return null;}

          const set=(id,val)=>{const el=d.getElementById(id);if(el&&val!==undefined&&val!==null)el.value=val;};
          set('mov-acao',acao);
          set('mov-atendimento',isTemp(finalPr)?'':finalPr);
          set('mov-paciente',nome);
          set('mov-nascimento',nasc);
          set('mov-sexo',sexo);
          set('mov-convenio',conv);
          set('mov-precaucao',prec);
          set('mov-perfil-vaga',perfil);
          set('mov-origem',origem);
          set('mov-setor',atualizado.s.nome);
          if(typeof w.atualizarSelectLeitosMov==='function')w.atualizarSelectLeitosMov();
          set('mov-leito',atualizado.l.n);
          if(typeof w.alternarCamposCirurgicosMov==='function')w.alternarCamposCirurgicosMov();
          atualizarRegraProntuario();

          if(irParaTela){
            d.getElementById('modal-editar-paciente').style.display='none';
            const movNav=[...d.querySelectorAll('.nav-item')].find(x=>String(x.getAttribute('onclick')||'').includes("movimentacao"));
            if(typeof w.switchTab==='function')w.switchTab('movimentacao',movNav||null);
            setTimeout(()=>d.getElementById('box-form-mov')?.scrollIntoView({behavior:'smooth',block:'start'}),50);
          }
          return {acao,pr:finalPr,setor:atualizado.s.nome,leito:atualizado.l.n};
        }

        function abrirAtalhoAcaoOperacional(){prepararAcaoOperacionalPainel(true);}

        async function confirmarAcaoOperacionalPainel(){
          // Compatibilidade: qualquer handler antigo delega obrigatoriamente ao fluxo atômico atual.
          return confirmarAcaoPainelV13();
        }

        const botaoAtalho=d.getElementById('btn-acao-operacional-v4');
        if(botaoAtalho)botaoAtalho.onclick=abrirAtalhoAcaoOperacional;
        const botaoConfirmar=d.getElementById('btn-confirmar-acao-v5');
        if(botaoConfirmar)botaoConfirmar.onclick=confirmarAcaoOperacionalPainel;

        // Botão inserido no MESMO modal real de edição do paciente.
        if(blocoAcao && !d.getElementById('hsj-encaminhamento-real-v6')){
          const bt=d.createElement('button');bt.type='button';bt.id='hsj-encaminhamento-real-v6';
          bt.className='btn';bt.textContent='↗ Encaminhar para Transferências';
          bt.style.cssText='display:block;width:100%;padding:12px;margin-top:12px;background:#0e7490;color:white;border-radius:8px;font-weight:700';
          blocoAcao.appendChild(bt);
          bt.onclick=function(){
            if(w.usuarioAtual?.perfil==='Visitante'){w.alert('Acesso de visitante não permite solicitação de transferência.');return}
            const val=id=>String(d.getElementById(id)?.value||'').trim();
            const pr=val('edit-prontuario-vis-v3')||val('edit-prontuario');
            const nome=val('edit-nome');
            if(!pr||!nome){w.alert('Informe o nome e o prontuário do paciente.');return}
            const ja=(w.transferenciasAtivas||[]).some(t=>String(t.atendimento||'')===pr);
            if(ja&&!w.confirm('Já existe transferência ativa para este prontuário. Abrir a aba para conferir?'))return;
            const set=(id,v)=>{const field=d.getElementById(id);if(field&&v)field.value=v};
            set('transf-atendimento',pr);set('transf-paciente',nome);
            set('transf-nascimento',val('edit-nasc'));set('transf-sexo',val('edit-sexo-v3'));set('transf-perfil',val('edit-perfil'));
            const modal=d.getElementById('modal-editar-paciente');if(modal)modal.style.display='none';
            const nav=[...d.querySelectorAll('.subnav .nav-item')].find(e=>(e.getAttribute('onclick')||'').includes("'transferencias'"));
            if(typeof w.switchTab==='function')w.switchTab('transferencias',nav);
            const form=d.getElementById('transferencias')?.querySelector('.notes-box');
            if(form){
              form.style.display='block';
              const toggle=d.getElementById('hsj-new-trans');if(toggle)toggle.textContent='Fechar cadastro';
              let alertBox=d.getElementById('hsj-forward-alert-v6');
              if(!alertBox){alertBox=d.createElement('p');alertBox.id='hsj-forward-alert-v6';alertBox.style.cssText='background:#eff6ff;color:#075985;padding:12px;border-radius:8px';form.prepend(alertBox)}
              alertBox.textContent='Dados de '+nome+' preenchidos. Confira o destino e as pendências antes de salvar a solicitação.';
              form.scrollIntoView({block:'start',behavior:'smooth'});
            }
          };
        }


        w.salvarEdicaoPaciente=async function(){
          const oldPr=d.getElementById('edit-prontuario').value;
          const newPr=d.getElementById('edit-prontuario-vis-v3').value.trim()||oldPr;
          const nome=d.getElementById('edit-nome').value.trim();
          const nasc=d.getElementById('edit-nasc').value;
          const perfil=d.getElementById('edit-perfil').value;
          const sexo=d.getElementById('edit-sexo-v3').value;
          const convenio=d.getElementById('edit-convenio-v3').value;
          const precaucao=d.getElementById('edit-precaucao-v3').value;
          const origem=d.getElementById('edit-origem-v3').value;
          if(!nome){w.alert('Informe o nome completo do paciente.');return;}
          const atual=setorAtualPorPr(oldPr);
          if(atual&&!perfilCompativel(atual.s.nome,perfil)){w.alert(msgConflito(atual.s.nome,perfil));return;}
          const antigo=getBase(oldPr);
          const existenteDestino=newPr!==oldPr?w.basePacientesCadastrados[newPr]:null;
          const normaliza=x=>String(x||'').trim().toUpperCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g,'');
          const mesmoPacienteDestino=!!existenteDestino && normaliza(existenteDestino.nome)===normaliza(nome) && (!existenteDestino.nascimento||!nasc||String(existenteDestino.nascimento)===String(nasc));
          if(newPr!==oldPr&&existenteDestino&&!mesmoPacienteDestino){w.alert('Este prontuário já pertence a outro paciente: '+(existenteDestino.nome||'cadastro existente')+'.');return;}
          const dados={...(existenteDestino||{}),...antigo,nome,nascimento:nasc,perfil,sexo,convenio,precaucao,origem,prontuarioPendente:isTemp(newPr)};
          if(newPr!==oldPr){delete w.basePacientesCadastrados[oldPr];w.basePacientesCadastrados[newPr]=dados;}
          else w.basePacientesCadastrados[oldPr]=dados;
          w.setoresData.forEach(s=>s.leitos.forEach(l=>{if(l.prontuario===oldPr){l.prontuario=newPr;l.paciente=nome;}}));
          (w.movimentacoesHistorico||[]).forEach(m=>{if(m.atendimento===oldPr){m.atendimento=newPr;m.atendimentoNasc='Pront: '+(isTemp(newPr)?'AGUARDANDO':newPr)+'<br><small>Nasc: '+nasc+'</small>';}if(m.paciente===antigo.nome)m.paciente=nome;});
          d.getElementById('edit-prontuario').value=newPr;
          if(typeof w.salvarDadosNoFirebase==='function')await w.salvarDadosNoFirebase();
          if(typeof w.atualizarTabelaPacientesInternos==='function')w.atualizarTabelaPacientesInternos();
          if(typeof w.renderizarPainelLeitos==='function')w.renderizarPainelLeitos();
          d.getElementById('modal-editar-paciente').style.display='none';
          w.alert('Cadastro do paciente atualizado com sucesso.');
        };

        // --- editar diretamente ao clicar no leito ---
        const oldBedOpen=w.abrirHistoricoPacienteLeito;

        function garantirModalEdicaoReserva(){
          if(d.getElementById('modal-editar-reserva-v9'))return;
          const modal=d.createElement('div');
          modal.id='modal-editar-reserva-v9';
          modal.style.cssText='display:none;position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:10020;justify-content:center;align-items:center;padding:16px';
          modal.innerHTML='<div style="background:white;padding:1.5rem;border-radius:10px;width:620px;max-width:96%;max-height:90vh;overflow:auto;box-shadow:0 10px 35px rgba(0,0,0,.2)">'+
            '<h3 style="margin:0 0 1rem;color:var(--secondary)">Editar Reserva Cirúrgica com Previsão de Alta</h3>'+
            '<input type="hidden" id="res-setor-v9"><input type="hidden" id="res-leito-v9">'+
            '<div class="form-grid">'+
            '<div class="form-group"><label>Prontuário *</label><input id="res-pr-v9" type="text"></div>'+
            '<div class="form-group"><label>Nome do paciente reservado *</label><input id="res-nome-v9" type="text"></div>'+
            '<div class="form-group"><label>Data de nascimento *</label><input id="res-nasc-v9" type="date"></div>'+
            '<div class="form-group"><label>Sexo *</label><select id="res-sexo-v9"><option value="">Selecione...</option><option>Feminino</option><option>Masculino</option></select></div>'+
            '<div class="form-group"><label>Perfil / Categoria *</label><select id="res-perfil-v9"><option>Enfermaria Clínica</option><option>Enfermaria Cirúrgica</option><option>UTI Clínica</option><option>UTI Cirúrgica</option><option>Enfermaria Mental</option></select></div>'+
            '<div class="form-group"><label>Caráter / Convênio</label><select id="res-convenio-v9"><option>SUS</option><option>Particular</option><option>Convênio</option><option>Filantrópico</option></select></div>'+
            '<div class="form-group"><label>Setor / Unidade de Origem</label><select id="res-origem-v9"></select></div>'+
            '<div class="form-group"><label>Precaução / Isolamento</label><select id="res-prec-v9"><option value="Nenhuma">Nenhuma (Padrão)</option><option value="Isolamento Contato">Isolamento Contato</option><option value="Isolamento Reverso">Isolamento Reverso</option><option value="Isolamento Gotículas">Isolamento Gotículas</option><option value="Isolamento Aerossóis">Isolamento Aerossóis</option><option value="Isolamento Contato+Gotículas">Contato + Gotículas</option><option value="Isolamento Contato+Aerossóis">Contato + Aerossóis</option></select></div>'+
            '<div class="form-group" style="grid-column:1/-1"><label>Previsão de alta do paciente que ocupa o leito *</label><input id="res-prev-v9" type="datetime-local"></div>'+
            '</div>'+
            '<div style="display:flex;justify-content:flex-end;gap:8px;margin-top:1rem"><button class="btn" id="res-cancel-v9">Cancelar</button><button class="btn btn-success" id="res-save-v9">Salvar reserva</button></div>'+
            '</div>';
          d.body.appendChild(modal);
          const origem=d.getElementById('res-origem-v9');
          origem.innerHTML='<option value="">Selecione origem...</option>';
          [...(w.unidadesOrigemDestino||[]),...(w.setoresData||[]).map(s=>s.nome)].forEach(x=>{
            const o=d.createElement('option');o.value=x;o.textContent=x;origem.appendChild(o);
          });
          d.getElementById('res-cancel-v9').onclick=()=>modal.style.display='none';
          d.getElementById('res-save-v9').onclick=async()=>{
            const setor=d.getElementById('res-setor-v9').value;
            const leito=d.getElementById('res-leito-v9').value;
            const s=w.setoresData.find(x=>x.nome===setor),l=s?.leitos.find(x=>x.n===leito);
            if(!l?.reservaPrevAlta){w.alert('Reserva não encontrada neste leito.');modal.style.display='none';return;}
            const antigoPr=l.reservaPrevAlta.prontuario;
            const pr=d.getElementById('res-pr-v9').value.trim();
            const nome=d.getElementById('res-nome-v9').value.trim();
            const nasc=d.getElementById('res-nasc-v9').value;
            const sexo=d.getElementById('res-sexo-v9').value;
            const perfil=d.getElementById('res-perfil-v9').value;
            const convenio=d.getElementById('res-convenio-v9').value;
            const origemVal=d.getElementById('res-origem-v9').value;
            const prec=d.getElementById('res-prec-v9').value;
            const prev=d.getElementById('res-prev-v9').value;
            if(!pr||!nome||!nasc||!sexo||!perfil||!origemVal||!prev){w.alert('Preencha todos os campos obrigatórios da reserva.');return;}
            if(!perfilCompativel(setor,perfil)){w.alert(msgConflito(setor,perfil));return;}
            if(pr!==antigoPr && w.basePacientesCadastrados?.[pr]){
              const e=w.basePacientesCadastrados[pr];
              const norm=x=>String(x||'').trim().toUpperCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g,'');
              if(norm(e.nome)!==norm(nome)){w.alert('Este prontuário já pertence a outro paciente: '+(e.nome||'cadastro existente')+'.');return;}
            }
            l.reservaPrevAlta={...l.reservaPrevAlta,paciente:nome,prontuario:pr,nascimento:nasc,sexo,perfil,convenio,origem:origemVal,precaucao:prec,previsaoAlta:prev,atualizadoEm:new Date().toISOString(),atualizadoPor:w.usuarioAtual?.nome||'Usuário'};
            const baseAntiga=getBase(antigoPr);
            if(pr!==antigoPr && w.basePacientesCadastrados?.[antigoPr]){
              delete w.basePacientesCadastrados[antigoPr];
            }
            if(!w.basePacientesCadastrados[pr])w.basePacientesCadastrados[pr]={};
            Object.assign(w.basePacientesCadastrados[pr],baseAntiga,{nome,nascimento:nasc,sexo,perfil,convenio,origem:origemVal,precaucao:prec,reservaComPrevisaoAlta:true});
            if(typeof w.salvarDadosNoFirebase==='function')await w.salvarDadosNoFirebase();
            if(typeof w.renderizarPainelLeitos==='function')w.renderizarPainelLeitos();
            modal.style.display='none';
            d.getElementById('modal-historico-paciente').style.display='none';
            w.alert('Reserva atualizada com sucesso.');
          };
        }

        w.editarReservaPrevAltaV9=function(setor,leito){
          garantirModalEdicaoReserva();
          const s=w.setoresData.find(x=>x.nome===setor),l=s?.leitos.find(x=>x.n===leito);
          const r=l?.reservaPrevAlta;if(!r){w.alert('Este leito não possui reserva com previsão de alta.');return;}
          d.getElementById('res-setor-v9').value=setor;
          d.getElementById('res-leito-v9').value=leito;
          d.getElementById('res-pr-v9').value=r.prontuario||'';
          d.getElementById('res-nome-v9').value=r.paciente||'';
          d.getElementById('res-nasc-v9').value=r.nascimento||'';
          d.getElementById('res-sexo-v9').value=r.sexo||'';
          d.getElementById('res-perfil-v9').value=r.perfil||'Enfermaria Clínica';
          d.getElementById('res-convenio-v9').value=r.convenio||'SUS';
          d.getElementById('res-origem-v9').value=r.origem||'';
          d.getElementById('res-prec-v9').value=r.precaucao||'Nenhuma';
          d.getElementById('res-prev-v9').value=r.previsaoAlta||'';
          d.getElementById('modal-editar-reserva-v9').style.display='flex';
        };

        function abrirAtalhoCadastroNoLeito(setor,leito){
          const s=w.setoresData.find(x=>x.nome===setor),l=s?.leitos.find(x=>String(x.n)===String(leito));
          if(!s||!l)return;

          let modal=d.getElementById('modal-atalho-cadastro-leito-v16');
          if(!modal){
            modal=d.createElement('div');
            modal.id='modal-atalho-cadastro-leito-v16';
            modal.style.cssText='display:none;position:fixed;inset:0;background:rgba(0,0,0,.48);z-index:10050;justify-content:center;align-items:center;padding:16px';
            modal.innerHTML='<div style="background:white;width:520px;max-width:96%;border-radius:12px;padding:20px;box-shadow:0 12px 35px rgba(0,0,0,.25)">'+
              '<h3 style="margin:0 0 8px;color:#0f172a">Atalho do Leito</h3>'+
              '<div id="atalho-leito-info-v16" style="font-size:.9rem;color:#475569;margin-bottom:16px"></div>'+
              '<div style="display:grid;grid-template-columns:1fr;gap:10px">'+
                '<button class="btn btn-success" id="atalho-cadastrar-v16" style="justify-content:center">➕ Cadastrar paciente neste leito</button>'+
                '<button class="btn" id="atalho-reservar-v16" style="justify-content:center;background:#2563eb">📌 Fazer reserva neste leito</button>'+
                '<button class="btn" id="atalho-bloquear-v16" style="justify-content:center;background:#7c3aed">🔒 Bloquear leito</button>'+
                '<button class="btn" id="atalho-higienizar-v16" style="justify-content:center;background:#f59e0b;color:#fff">🧹 Aguardar higienização</button>'+
                '<button class="btn" id="atalho-liberar-v16" style="justify-content:center;background:#059669">✅ Liberar leito</button>'+
                '<button class="btn" id="atalho-historico-v16" style="justify-content:center;background:#64748b">🕘 Abrir histórico / gestão do leito</button>'+
                '<button class="btn" id="atalho-cancel-v16" style="justify-content:center;background:#e2e8f0;color:#334155">Cancelar</button>'+
              '</div>'+
            '</div>';
            d.body.appendChild(modal);
          }

          d.getElementById('atalho-leito-info-v16').innerHTML='<b>'+esc(setor)+'</b> · Leito <b>'+esc(leito)+'</b> · Status: <b>'+esc(l.status)+'</b>';

          const abrirFormulario=(acao)=>{
            const set=(id,val)=>{const el=d.getElementById(id);if(el&&val!==undefined&&val!==null)el.value=val;};
            set('mov-acao',acao);
            set('mov-setor',setor);
            if(typeof w.atualizarSelectLeitosMov==='function')w.atualizarSelectLeitosMov();
            set('mov-leito',leito);
            set('mov-atendimento','');
            set('mov-paciente','');
            set('mov-nascimento','');
            set('mov-sexo','');
            set('mov-perfil-vaga','');
            set('mov-origem','');
            set('mov-convenio','SUS');
            set('mov-precaucao','Nenhuma');
            if(typeof w.alternarCamposCirurgicosMov==='function')w.alternarCamposCirurgicosMov();
            atualizarRegraProntuario();
            modal.style.display='none';
            const movNav=[...d.querySelectorAll('.nav-item')].find(x=>String(x.getAttribute('onclick')||'').includes("movimentacao"));
            if(typeof w.switchTab==='function')w.switchTab('movimentacao',movNav||null);
            setTimeout(()=>{
              d.getElementById('box-form-mov')?.scrollIntoView({behavior:'smooth',block:'start'});
              d.getElementById('mov-atendimento')?.focus();
            },80);
          };

          d.getElementById('atalho-cadastrar-v16').onclick=()=>abrirFormulario('Admissão');
          d.getElementById('atalho-reservar-v16').onclick=()=>abrirFormulario('Reservado');

          const aplicarStatusLeito=async(statusDestino,rotulo)=>{
            if(typeof w.executarStatusLeitoAtomico!=='function'){
              w.alert('Módulo seguro de gestão de leito ainda não carregou. Faça Ctrl + F5 e tente novamente.');
              return;
            }
            if(!w.confirm(rotulo+' o leito '+leito+' de '+setor+'?'))return;
            try{
              const resultado=await w.executarStatusLeitoAtomico({
                setor:setor,leito:leito,statusDestino:statusDestino,
                usuario:w.usuarioAtual?.nome||'usuario'
              });
              l.status=resultado.status;l.paciente='';l.prontuario='';
              modal.style.display='none';
              if(typeof w.renderizarPainelLeitos==='function')w.renderizarPainelLeitos();
              if(typeof w.atualizarTabelaMovimentacoes==='function')w.atualizarTabelaMovimentacoes();
              if(typeof w.atualizarTabelaHistoricoGeral==='function')w.atualizarTabelaHistoricoGeral();
              w.alert('Leito '+leito+' atualizado com sucesso para '+rotulo.toUpperCase()+'.');
            }catch(err){
              console.error('Erro ao alterar status do leito:',err);
              w.alert(err?.code==='LEITO_EM_USO'
                ? 'Este leito está em uso e não pode ser alterado por este atalho.'
                : 'Não foi possível alterar o status do leito: '+(err?.message||err));
            }
          };

          const btnBloq=d.getElementById('atalho-bloquear-v16');
          const btnHig=d.getElementById('atalho-higienizar-v16');
          const btnLib=d.getElementById('atalho-liberar-v16');
          if(btnBloq){btnBloq.style.display=l.status==='bloqueado'?'none':'block';btnBloq.onclick=()=>aplicarStatusLeito('bloqueado','Bloquear');}
          if(btnHig){btnHig.style.display=l.status==='higienizacao'?'none':'block';btnHig.onclick=()=>aplicarStatusLeito('higienizacao','Aguardar higienização');}
          if(btnLib){btnLib.style.display=(l.status==='bloqueado'||l.status==='higienizacao')?'block':'none';btnLib.onclick=()=>aplicarStatusLeito('disponivel','Liberar');}

          d.getElementById('atalho-historico-v16').onclick=()=>{modal.style.display='none';oldBedOpen.call(w,setor,leito);};
          d.getElementById('atalho-cancel-v16').onclick=()=>modal.style.display='none';
          modal.style.display='flex';
        }

        w.abrirHistoricoPacienteLeito=function(setor,leito){
          const s=w.setoresData.find(x=>x.nome===setor),l=s?.leitos.find(x=>String(x.n)===String(leito));
          if(!l)return;

          // Leito disponível/higienização/bloqueado: abre atalho com opção de cadastrar/reservar ou ver histórico.
          if(!(l.status==='ocupado'||l.status==='reservado') || !l.prontuario){
            abrirAtalhoCadastroNoLeito(setor,leito);
            return;
          }

          // Leito ocupado/reservado: abre diretamente o cadastro do paciente.
          const b=getBase(l.prontuario);
          w.abrirEdicaoPaciente(l.prontuario,l.paciente,b.nascimento||'',b.perfil||'Enfermaria Clínica');

          const modal=d.getElementById('modal-editar-paciente');
          if(!modal)return;
          const body=modal.querySelector('.modal-content')||modal.querySelector('[style*="background:white"]')||modal.firstElementChild;
          if(!body)return;

          const antigo=d.getElementById('resumo-acoes-leito-v15');
          if(antigo)antigo.remove();

          const hist=(w.movimentacoesHistorico||[])
            .filter(m=>String(m.atendimento||'')===String(l.prontuario||'') || (m.paciente&&String(m.paciente).trim().toUpperCase()===String(l.paciente||'').trim().toUpperCase()))
            .slice(0,6);

          const resumo=d.createElement('div');
          resumo.id='resumo-acoes-leito-v15';
          resumo.style.cssText='margin:0 0 1rem;padding:12px;background:#f8fafc;border:1px solid #cbd5e1;border-left:4px solid #0ea5e9;border-radius:8px';
          resumo.innerHTML=
            '<div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:8px">'+
              '<strong style="color:#0f172a">Resumo do Leito / Ações Recentes</strong>'+
              '<span style="font-size:.8rem;color:#475569">'+esc(setor)+' · Leito '+esc(leito)+' · '+esc(l.status)+'</span>'+
            '</div>'+
            '<div style="font-size:.85rem;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:5px 12px">'+
              '<div><b>Paciente:</b> '+esc(l.paciente||'-')+'</div>'+
              '<div><b>Prontuário:</b> '+esc(l.prontuario||'-')+'</div>'+
              '<div><b>Sexo:</b> '+esc(b.sexo||'-')+'</div>'+
              '<div><b>Perfil:</b> '+esc(b.perfil||'-')+'</div>'+
              '<div><b>Convênio:</b> '+esc(b.convenio||'-')+'</div>'+
              '<div><b>Previsão de alta:</b> '+esc(b.previsaoAlta ? new Date(b.previsaoAlta).toLocaleString('pt-BR') : 'Não informada')+'</div>'+
            '</div>'+
            '<div style="margin-top:10px;font-size:.82rem"><b>Últimas ações:</b>'+
              (hist.length
                ? '<ul style="margin:6px 0 0 18px">'+hist.map(h=>'<li><b>'+esc(h.data||h.dataDesfecho||'-')+'</b> — '+esc(String(h.acao||'').replace(/<[^>]*>/g,' '))+'</li>').join('')+'</ul>'
                : '<div style="margin-top:5px;color:#64748b">Nenhuma movimentação recente localizada para este prontuário.</div>')+
            '</div>';

          const acaoBox=d.getElementById('atalho-acao-operacional-v4');
          if(acaoBox)acaoBox.before(resumo);
          else body.appendChild(resumo);

          if(l.reservaPrevAlta){
            const btn=d.createElement('button');
            btn.className='btn';
            btn.style.cssText='margin-top:10px;background:#2563eb';
            btn.textContent='✏️ Editar reserva com previsão de alta';
            btn.onclick=()=>w.editarReservaPrevAltaV9(setor,leito);
            resumo.appendChild(btn);
          }
        };

        // manter extras/filtros após renderizações
        const currentRender=w.renderizarPainelLeitos;
        w.renderizarPainelLeitos=function(){const r=currentRender.apply(w,arguments);setTimeout(()=>{aplicarFiltroPainel();},20);return r;};

        // --- exclusão de movimentação deve manter o painel de leitos consistente ---
        w.excluirMovimentacao=async function(index){
          if(w.usuarioAtual?.perfil!=='Administrador'){w.alert('Acesso restrito.');return;}
          const m=(w.movimentacoesHistorico||[])[index];
          if(!m){w.alert('Registro não encontrado.');return;}
          const vinculados=[];
          w.setoresData.forEach(s=>s.leitos.forEach(l=>{
            const mesmoPr=m.atendimento&&l.prontuario===m.atendimento;
            const mesmoNome=m.paciente&&String(l.paciente||'').trim().toUpperCase()===String(m.paciente||'').trim().toUpperCase();
            if((mesmoPr||mesmoNome)&&(l.status==='ocupado'||l.status==='reservado'))vinculados.push({s,l});
          }));
          let mensagem='Deseja excluir este registro de movimentação?';
          if(vinculados.length){
            mensagem+='\n\nO paciente ainda está vinculado a '+vinculados.map(x=>x.s.nome+' / Leito '+x.l.n+' ('+x.l.status+')').join(', ')+'.\nAo confirmar, o leito também será LIBERADO para evitar paciente excluído permanecendo reservado/ocupado.';
          }
          if(!w.confirm(mensagem))return;
          w.movimentacoesHistorico.splice(index,1);
          vinculados.forEach(({l})=>{l.status='disponivel';l.paciente='';l.prontuario='';});
          const aindaExiste=(w.movimentacoesHistorico||[]).some(x=>x.atendimento===m.atendimento)||w.setoresData.some(s=>s.leitos.some(l=>l.prontuario===m.atendimento));
          if(!aindaExiste&&m.atendimento&&w.basePacientesCadastrados?.[m.atendimento]){
            delete w.basePacientesCadastrados[m.atendimento];
          }
          if(typeof w.renderizarPainelLeitos==='function')w.renderizarPainelLeitos();
          if(typeof w.atualizarTabelaMovimentacoes==='function')w.atualizarTabelaMovimentacoes();
          if(typeof w.atualizarTabelaHistoricoGeral==='function')w.atualizarTabelaHistoricoGeral();
          if(typeof w.atualizarTabelaPacientesInternos==='function')w.atualizarTabelaPacientesInternos();
          if(typeof w.salvarDadosNoFirebase==='function')await w.salvarDadosNoFirebase();
          w.alert(vinculados.length?'Registro excluído e leito liberado com sucesso.':'Registro excluído com sucesso.');
        };

        // reparo pontual do leito órfão informado: OLIVIA MATOS
        async function repararOliviaOrfa(){
          const norm=x=>String(x||'').normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').trim().toUpperCase();
          let alterou=false;
          w.setoresData.forEach(s=>s.leitos.forEach(l=>{
            if(l.status!=='reservado' || !norm(l.paciente).includes('OLIVIA MATOS'))return;
            const existeMov=(w.movimentacoesHistorico||[]).some(m=>(l.prontuario&&m.atendimento===l.prontuario)||norm(m.paciente)===norm(l.paciente));
            if(!existeMov){l.status='disponivel';l.paciente='';l.prontuario='';alterou=true;}
          }));
          if(alterou){
            if(typeof w.renderizarPainelLeitos==='function')w.renderizarPainelLeitos();
            if(typeof w.atualizarTabelaPacientesInternos==='function')w.atualizarTabelaPacientesInternos();
            if(typeof w.salvarDadosNoFirebase==='function')await w.salvarDadosNoFirebase();
            console.info('Leito órfão de Olivia Matos foi liberado e sincronizado.');
          }
        }
        setTimeout(repararOliviaOrfa,1200);
        setTimeout(repararOliviaOrfa,3000);

        // --- Mudança de leito: destacar e selecionar automaticamente a reserva do paciente ---
        const oldMudarLeitoPaciente=w.mudarLeitoPaciente;
        w.mudarLeitoPaciente=function(index){
          w.indexMovimentoAtual=index;
          const select=d.getElementById('modal-select-novo-leito');
          const acaoSel=d.getElementById('modal-acao-leito');
          const modalMud=d.getElementById('modal-mudar-leito');
          const m=(w.movimentacoesHistorico||[])[index];
          if(!select||!m)return oldMudarLeitoPaciente?oldMudarLeitoPaciente.call(w,index):undefined;

          const reservas=[];
          const outros=[];
          (w.setoresData||[]).forEach(s=>s.leitos.forEach(l=>{
            if(l.status!=='disponivel'&&l.status!=='reservado')return;
            const item={s,l};
            if(l.status==='reservado'&&((m.atendimento&&l.prontuario===m.atendimento)||(m.paciente&&String(l.paciente||'').trim().toUpperCase()===String(m.paciente||'').trim().toUpperCase()))) reservas.push(item);
            else outros.push(item);
          }));

          select.innerHTML='';
          [...reservas,...outros].forEach(({s,l})=>{
            const opt=d.createElement('option');
            opt.value=s.nome+'||'+l.n;
            const propria=reservas.some(x=>x.s===s&&x.l===l);
            opt.textContent=(propria?'★ RESERVA DO PACIENTE — ':'')+s.nome+' - Leito '+l.n+' ('+(l.status==='reservado'?'reservado':'disponível')+')';
            if(propria)opt.dataset.reservaPaciente='1';
            select.appendChild(opt);
          });

          if(!select.options.length){w.alert('Não há leitos disponíveis ou reservados no momento.');return;}
          if(reservas.length){
            select.value=reservas[0].s.nome+'||'+reservas[0].l.n;
            if(acaoSel)acaoSel.value='ocupado';
          }
          let aviso=d.getElementById('aviso-reserva-paciente-v6');
          if(!aviso){
            aviso=d.createElement('div');aviso.id='aviso-reserva-paciente-v6';
            aviso.style.cssText='margin:0 0 12px;padding:9px 11px;border-radius:6px;background:#eef6ff;border-left:4px solid #2563eb;font-size:.85rem';
            select.closest('.form-group')?.before(aviso);
          }
          aviso.style.display=reservas.length?'block':'none';
          aviso.innerHTML=reservas.length?'<strong>Reserva encontrada:</strong> '+reservas.map(x=>x.s.nome+' — Leito '+x.l.n).join(', ')+'. O leito reservado já foi selecionado automaticamente.':'';
          if(modalMud)modalMud.style.display='flex';
        };

        const oldConfirmarMudanca=w.confirmarMudancaLeitoModal;
        w.confirmarMudancaLeitoModal=async function(){
          const idx=w.indexMovimentoAtual;
          const m=(w.movimentacoesHistorico||[])[idx];
          const valor=d.getElementById('modal-select-novo-leito')?.value;
          const acao=d.getElementById('modal-acao-leito')?.value;

          if(m&&valor&&acao==='ocupado'){
            let prontuarioAtual=String(m.atendimento||'').trim();

            // Reservas sem prontuário usam chave temporária RES-/EXT-.
            // Ao efetivar ocupação, obrigatoriamente solicita o prontuário real.
            if(!prontuarioAtual || isTemp(prontuarioAtual) || prontuarioAtual.startsWith('RES-')){
              const novo=String(w.prompt('Para EFETIVAR A OCUPAÇÃO do leito, informe obrigatoriamente o número definitivo do prontuário deste paciente:')||'').trim();
              if(!novo){
                w.alert('O prontuário é obrigatório para efetivar a ocupação. A reserva foi mantida e nenhuma ocupação foi realizada.');
                return;
              }

              const existente=w.basePacientesCadastrados?.[novo];
              const norm=x=>String(x||'').trim().toUpperCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g,'');
              if(existente && norm(existente.nome)!==norm(m.paciente)){
                w.alert('O prontuário informado já pertence a outro paciente: '+(existente.nome||'cadastro existente')+'.');
                return;
              }

              const antigo=prontuarioAtual;
              const dadosAntigos=w.basePacientesCadastrados?.[antigo]||{};
              w.basePacientesCadastrados[novo]={...(existente||{}),...dadosAntigos,nome:m.paciente,nascimento:m.nascimento||dadosAntigos.nascimento||'',prontuarioPendente:false};
              if(antigo&&w.basePacientesCadastrados?.[antigo])delete w.basePacientesCadastrados[antigo];

              // Migra todos os vínculos da chave temporária para o prontuário real.
              (w.setoresData||[]).forEach(s=>s.leitos.forEach(l=>{
                if(l.prontuario===antigo){l.prontuario=novo;l.paciente=m.paciente;}
                if(l.reservaPrevAlta?.prontuario===antigo)l.reservaPrevAlta.prontuario=novo;
              }));
              (w.movimentacoesHistorico||[]).forEach(mm=>{
                if(mm.atendimento===antigo){
                  mm.atendimento=novo;
                  mm.atendimentoNasc='Pront: '+novo+'<br><small>Nasc: '+(mm.nascimento||m.nascimento||'-')+'</small>';
                }
              });
              m.atendimento=novo;
              prontuarioAtual=novo;
            }

            const partes=valor.split('||');
            // Ao efetivar ocupação, remove outras reservas do MESMO paciente para evitar duplicidade.
            (w.setoresData||[]).forEach(s=>s.leitos.forEach(l=>{
              const mesmaReserva=l.status==='reservado'&&((prontuarioAtual&&l.prontuario===prontuarioAtual)||(m.paciente&&String(l.paciente||'').trim().toUpperCase()===String(m.paciente||'').trim().toUpperCase()));
              const selecionado=s.nome===partes[0]&&l.n===partes[1];
              if(mesmaReserva&&!selecionado){l.status='disponivel';l.paciente='';l.prontuario='';}
            }));
          }

          const r=oldConfirmarMudanca?oldConfirmarMudanca.apply(w,arguments):undefined;
          if(r&&typeof r.then==='function')await r;
          if(typeof w.salvarDadosNoFirebase==='function')await w.salvarDadosNoFirebase();
          return r;
        };

        // --- Estrutura do Centro Cirúrgico e SRPA ---
        async function garantirCentroCirurgicoESRPA(){
          let alterou=false;

          let cc=(w.setoresData||[]).find(s=>String(s.nome||'').toUpperCase()==='SALAS OPERATÓRIAS');
          if(!cc){
            cc={
              nome:'SALAS OPERATÓRIAS',
              tipo:'Centro Cirúrgico',
              leitos:['SALA 01','SALA 02','SALA 03','SALA 04','SALA 05','SALA 06'].map(n=>({n,status:'disponivel',paciente:'',prontuario:''}))
            };
            w.setoresData.push(cc);
            alterou=true;
          }else{
            ['SALA 01','SALA 02','SALA 03','SALA 04','SALA 05','SALA 06'].forEach(n=>{
              if(!cc.leitos.some(l=>String(l.n).toUpperCase()===n)){
                cc.leitos.push({n,status:'disponivel',paciente:'',prontuario:''});
                alterou=true;
              }
            });
          }

          let srpa=(w.setoresData||[]).find(s=>String(s.nome||'').toUpperCase()==='SRPA');
          if(!srpa){
            srpa={
              nome:'SRPA',
              tipo:'Recuperação Pós-Anestésica',
              leitos:['SRPA 01','SRPA 02','SRPA 03','SRPA 04','SRPA 05','SRPA 06','SRPA 07','SRPA 08'].map(n=>({n,status:'disponivel',paciente:'',prontuario:''}))
            };
            w.setoresData.push(srpa);
            alterou=true;
          }else{
            ['SRPA 01','SRPA 02','SRPA 03','SRPA 04','SRPA 05','SRPA 06','SRPA 07','SRPA 08'].forEach(n=>{
              if(!srpa.leitos.some(l=>String(l.n).toUpperCase()===n)){
                srpa.leitos.push({n,status:'disponivel',paciente:'',prontuario:''});
                alterou=true;
              }
            });
          }

          if(alterou){
            if(typeof w.renderizarPainelLeitos==='function')w.renderizarPainelLeitos();
            if(typeof w.atualizarSelectsGerais==='function')w.atualizarSelectsGerais();
            if(typeof w.atualizarTabelaPacientesInternos==='function')w.atualizarTabelaPacientesInternos();
            if(typeof w.salvarDadosNoFirebase==='function')await w.salvarDadosNoFirebase();
          }else{
            if(typeof w.atualizarSelectsGerais==='function')w.atualizarSelectsGerais();
          }
        }
        setTimeout(garantirCentroCirurgicoESRPA,1200);
        setTimeout(garantirCentroCirurgicoESRPA,3000);


        // --- Reserva Cirúrgica com Previsão de Alta ---
        const acaoPrincipal=d.getElementById('mov-acao');
        if(acaoPrincipal && ![...acaoPrincipal.options].some(o=>o.value==='Reserva Cirúrgica com Previsão de Alta')){
          const opt=d.createElement('option');
          opt.value='Reserva Cirúrgica com Previsão de Alta';
          opt.textContent='Reserva Cirúrgica com Previsão de Alta';
          const ref=[...acaoPrincipal.options].find(o=>o.value==='Reserva Cirúrgica Eletiva');
          if(ref)ref.after(opt);else acaoPrincipal.appendChild(opt);
        }

        if(!d.getElementById('bloco-prev-alta-v8')){
          const bloco=d.createElement('div');
          bloco.id='bloco-prev-alta-v8';
          bloco.style.cssText='display:none;background:#eff6ff;border:1px solid #bfdbfe;border-left:4px solid #2563eb;padding:12px;border-radius:7px;margin:0 0 12px';
          bloco.innerHTML='<strong style="display:block;margin-bottom:8px;color:#1e3a8a">Reserva Cirúrgica com Previsão de Alta</strong><div class="form-grid"><div class="form-group"><label>Previsão de Alta do paciente que ocupa o leito *</label><input type="datetime-local" id="mov-previsao-alta-v8"></div></div><small style="color:#475569">Nesta modalidade, o paciente atual permanece ocupando o leito e um segundo paciente fica reservado para este mesmo leito.</small>';
          d.getElementById('bloco-campos-cirurgicos')?.before(bloco);
        }

        const oldAlternarCampos=w.alternarCamposCirurgicosMov;
        w.alternarCamposCirurgicosMov=function(){
          if(typeof oldAlternarCampos==='function')oldAlternarCampos.apply(w,arguments);
          const ac=d.getElementById('mov-acao')?.value;
          const b=d.getElementById('bloco-prev-alta-v8');
          if(b)b.style.display=ac==='Reserva Cirúrgica com Previsão de Alta'?'block':'none';
        };

        async function registrarReservaComPrevisaoAlta(){
          const setorNome=d.getElementById('mov-setor')?.value;
          const leitoNum=d.getElementById('mov-leito')?.value;
          const atendimento=d.getElementById('mov-atendimento')?.value.trim();
          const paciente=d.getElementById('mov-paciente')?.value.trim();
          const nascimento=d.getElementById('mov-nascimento')?.value;
          const perfil=d.getElementById('mov-perfil-vaga')?.value;
          const sexo=d.getElementById('mov-sexo')?.value;
          const convenio=d.getElementById('mov-convenio')?.value;
          const origem=d.getElementById('mov-origem')?.value;
          const precaucao=d.getElementById('mov-precaucao')?.value;
          const previsao=d.getElementById('mov-previsao-alta-v8')?.value;

          if(!atendimento||!paciente||!nascimento||!perfil||!sexo||!origem||!previsao){
            w.alert('Preencha prontuário, nome, nascimento, sexo, perfil, origem e a previsão de alta.');
            return;
          }
          if(!perfilCompativel(setorNome,perfil)){w.alert(msgConflito(setorNome,perfil));return;}

          const setor=(w.setoresData||[]).find(s=>s.nome===setorNome);
          const leito=setor?.leitos.find(l=>l.n===leitoNum);
          if(!leito){w.alert('Leito não encontrado.');return;}
          if(leito.status!=='ocupado'){
            w.alert('Esta modalidade só pode ser usada em um leito atualmente OCUPADO. Para leito livre, use a reserva normal.');
            return;
          }
          if(leito.prontuario===atendimento){
            w.alert('O paciente da reserva não pode ser o mesmo paciente que está ocupando o leito.');
            return;
          }
          if(leito.reservaPrevAlta && leito.reservaPrevAlta.prontuario!==atendimento){
            if(!w.confirm('Este leito já possui uma reserva com previsão de alta para '+leito.reservaPrevAlta.paciente+'. Deseja substituir pela nova reserva?'))return;
          }

          const agora=new Date();
          const hora=agora.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
          const data=agora.toLocaleDateString('pt-BR')+' '+hora;
          leito.reservaPrevAlta={
            paciente,
            prontuario:atendimento,
            nascimento,
            perfil,
            sexo,
            convenio,
            origem,
            precaucao,
            previsaoAlta:previsao,
            criadoEm:agora.toISOString(),
            criadoPor:w.usuarioAtual?.nome||'Usuário'
          };

          if(!w.basePacientesCadastrados[atendimento])w.basePacientesCadastrados[atendimento]={};
          Object.assign(w.basePacientesCadastrados[atendimento],{
            nome:paciente,nascimento,sexo,perfil,convenio,precaucao,origem,
            reservaComPrevisaoAlta:true
          });

          w.movimentacoesHistorico.unshift({
            data,dataIso:agora.toISOString(),hora,
            atendimentoNasc:'Pront: '+atendimento+'<br><small>Nasc: '+nascimento+'</small>',
            atendimento,nascimento,paciente,
            setor:setorNome+' (Leito '+leitoNum+')',
            origem,destino:setorNome,
            perfil:perfil+' ('+sexo+')',
            convenio,
            acao:'Reserva Cirúrgica com Previsão de Alta<br><small>Leito permanece ocupado por '+(leito.paciente||'paciente atual')+' até '+new Date(previsao).toLocaleString('pt-BR')+'</small>',
            dataDesfecho:data,dataDesfechoObj:agora,dataAdmissaoObj:agora
          });

          if(typeof w.renderizarPainelLeitos==='function')w.renderizarPainelLeitos();
          if(typeof w.atualizarTabelaMovimentacoes==='function')w.atualizarTabelaMovimentacoes();
          if(typeof w.atualizarTabelaHistoricoGeral==='function')w.atualizarTabelaHistoricoGeral();
          if(typeof w.salvarDadosNoFirebase==='function')await w.salvarDadosNoFirebase();

          ['mov-atendimento','mov-paciente','mov-nascimento','mov-previsao-alta-v8'].forEach(id=>{const el=d.getElementById(id);if(el)el.value='';});
          const ac=d.getElementById('mov-acao');if(ac)ac.value='';
          if(typeof w.alternarCamposCirurgicosMov==='function')w.alternarCamposCirurgicosMov();
          w.alert('Reserva cirúrgica com previsão de alta registrada. O leito continua ocupado e agora também exibe a reserva.');
        }

        // interceptar a ação especial antes do fluxo original
        const execAntesReserva=w.executarMovimentacaoLeito;
        w.executarMovimentacaoLeito=async function(){
          const ac=d.getElementById('mov-acao')?.value;
          if(ac==='Reserva Cirúrgica com Previsão de Alta')return registrarReservaComPrevisaoAlta();

          const setorNome=d.getElementById('mov-setor')?.value;
          const leitoNum=d.getElementById('mov-leito')?.value;
          const setor=(w.setoresData||[]).find(s=>s.nome===setorNome);
          const leito=setor?.leitos.find(l=>l.n===leitoNum);
          const reservaGuardada=leito?.reservaPrevAlta ? {...leito.reservaPrevAlta} : null;
          const atendimentoAntes=d.getElementById('mov-atendimento')?.value.trim();
          const r=execAntesReserva.apply(w,arguments);
          if(r&&typeof r.then==='function')await r;

          // Se o ocupante teve alta/saída, a reserva dupla passa a ser a reserva principal do leito.
          if(leito && reservaGuardada && ['Alta Hospitalar','Alta a Pedido','Óbito','Evasão','Transferência Externa','Disponível'].includes(ac)){
            leito.status='reservado';
            leito.paciente=reservaGuardada.paciente;
            leito.prontuario=reservaGuardada.prontuario;
            delete leito.reservaPrevAlta;
            if(typeof w.renderizarPainelLeitos==='function')w.renderizarPainelLeitos();
            if(typeof w.atualizarTabelaPacientesInternos==='function')w.atualizarTabelaPacientesInternos();
            if(typeof w.salvarDadosNoFirebase==='function')await w.salvarDadosNoFirebase();
          }

          // Quando o paciente reservado for efetivamente admitido no mesmo leito, encerra o marcador duplo.
          if(leito && leito.reservaPrevAlta && (ac==='Admissão'||ac==='Transferência Interna') && atendimentoAntes===leito.reservaPrevAlta.prontuario){
            delete leito.reservaPrevAlta;
            if(typeof w.salvarDadosNoFirebase==='function')await w.salvarDadosNoFirebase();
          }
          return r;
        };

        function aplicarVisualReservaPrevAlta(){
          const boxes=[...d.querySelectorAll('#painel-setores-detalhado .sector-box')];
          boxes.forEach((box,i)=>{
            const s=w.setoresData?.[i];if(!s)return;
            const pills=[...box.querySelectorAll('.leito-pill')];
            pills.forEach((pill,j)=>{
              const l=s.leitos?.[j];if(!l)return;
              pill.querySelectorAll('.reserva-prev-alta-v8').forEach(x=>x.remove());
              if(!l.reservaPrevAlta)return;

              pill.style.background='linear-gradient(90deg,#dc2626 0%,#dc2626 50%,#2563eb 50%,#2563eb 100%)';
              pill.style.color='#fff';
              pill.style.minWidth='86px';
              pill.style.height='58px';
              pill.style.display='flex';
              pill.style.alignItems='center';
              pill.style.justifyContent='center';
              pill.style.position='relative';
              pill.style.overflow='hidden';
              pill.style.padding='3px';

              const info=d.createElement('div');
              info.className='reserva-prev-alta-v8';
              info.style.cssText='position:absolute;inset:0;display:grid;grid-template-columns:1fr 1fr;pointer-events:none;font-size:8px;font-weight:800;line-height:1.05;text-align:center;color:white';
              const atual=esc(l.paciente||'OCUPADO');
              const reservado=esc(l.reservaPrevAlta.paciente||'RESERVA');
              info.innerHTML='<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:2px"><span style="font-size:10px">'+esc(l.n)+'</span><span>'+atual+'</span></div><div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:2px"><span>RESERVA</span><span>'+reservado+'</span></div>';
              pill.appendChild(info);
              const prev=l.reservaPrevAlta.previsaoAlta?new Date(l.reservaPrevAlta.previsaoAlta).toLocaleString('pt-BR'):'não informada';
              pill.title='Leito '+l.n+' — OCUPADO: '+(l.paciente||'-')+' | RESERVA: '+(l.reservaPrevAlta.paciente||'-')+' | Previsão de alta: '+prev;
            });
          });
        }

        const renderComReserva=w.renderizarPainelLeitos;
        w.renderizarPainelLeitos=function(){
          const r=renderComReserva.apply(w,arguments);
          setTimeout(aplicarVisualReservaPrevAlta,30);
          return r;
        };
        setTimeout(()=>{if(typeof w.renderizarPainelLeitos==='function')w.renderizarPainelLeitos();},500);
        // --- Médico digitável e cadastro inteligente persistente ---
        async function carregarMedicosPersistidosV10(){
          try{
            const {doc,getDoc}=w.firebaseModules||{};
            if(!w.db||!doc||!getDoc)return;
            const snap=await getDoc(doc(w.db,'hospital','config-medicos'));
            if(snap.exists()){
              const data=snap.data();
              if(Array.isArray(data.medicos)){
                const base=[...(w.listaMedicosSistema||[])];
                const mapa=new Map();
                [...base,...data.medicos].forEach(m=>{
                  const nome=String(m||'').trim();
                  if(nome&&!mapa.has(nome.toUpperCase()))mapa.set(nome.toUpperCase(),nome);
                });
                w.listaMedicosSistema=[...mapa.values()].sort((a,b)=>a.localeCompare(b,'pt-BR'));
              }
            }
          }catch(e){console.error('Erro ao carregar médicos persistidos:',e);}
        }

        async function salvarMedicosPersistidosV10(){
          try{
            const {doc,setDoc}=w.firebaseModules||{};
            if(!w.db||!doc||!setDoc)return;
            await setDoc(doc(w.db,'hospital','config-medicos'),{
              medicos:[...(w.listaMedicosSistema||[])],
              atualizadoEm:new Date().toISOString(),
              atualizadoPor:w.usuarioAtual?.nome||'Usuário'
            });
          }catch(e){console.error('Erro ao salvar médicos persistidos:',e);}
        }

        function normalizarNomeMedicoV10(nome){
          const n=String(nome||'').trim().replace(/\s+/g,' ');
          if(!n)return '';
          return n;
        }

        function garantirCampoMedicoInteligenteV10(){
          const select=d.getElementById('mov-medico');
          if(!select||d.getElementById('mov-medico-texto-v10'))return;
          const grupo=select.closest('.form-group');
          const input=d.createElement('input');
          input.type='text';
          input.id='mov-medico-texto-v10';
          input.setAttribute('list','lista-medicos-v10');
          input.placeholder='Digite ou selecione o nome do médico';
          input.autocomplete='off';
          input.style.cssText='width:100%;padding:.55rem;border:1px solid var(--border);border-radius:6px;background:#fff';
          const dl=d.createElement('datalist');
          dl.id='lista-medicos-v10';
          grupo.appendChild(input);
          grupo.appendChild(dl);
          select.style.display='none';

          function atualizarDatalist(){
            dl.innerHTML='';
            (w.listaMedicosSistema||[]).forEach(m=>{
              const o=d.createElement('option');o.value=m;dl.appendChild(o);
            });
          }
          atualizarDatalist();

          input.addEventListener('change',async()=>{
            const nome=normalizarNomeMedicoV10(input.value);
            if(!nome)return;
            const existe=(w.listaMedicosSistema||[]).some(m=>String(m).trim().toUpperCase()===nome.toUpperCase());
            if(!existe){
              w.listaMedicosSistema.push(nome);
              w.listaMedicosSistema.sort((a,b)=>a.localeCompare(b,'pt-BR'));
              await salvarMedicosPersistidosV10();
              atualizarDatalist();
            }
            let opt=[...select.options].find(o=>String(o.value||o.textContent).trim().toUpperCase()===nome.toUpperCase());
            if(!opt){
              opt=d.createElement('option');opt.value=nome;opt.textContent=nome;select.appendChild(opt);
            }
            select.value=nome;
          });

          input.addEventListener('input',()=>{
            select.value=input.value;
          });

          w.atualizarCampoMedicoInteligenteV10=atualizarDatalist;
        }

        const oldAtualizarSelectMedicosV10=w.atualizarSelectMedicos;
        w.atualizarSelectMedicos=function(){
          if(typeof oldAtualizarSelectMedicosV10==='function')oldAtualizarSelectMedicosV10.apply(w,arguments);
          garantirCampoMedicoInteligenteV10();
          if(typeof w.atualizarCampoMedicoInteligenteV10==='function')w.atualizarCampoMedicoInteligenteV10();
        };

        // garantir que o fluxo cirúrgico use o nome digitado, mesmo se for novo
        const execMedicoInteligenteV10=w.executarMovimentacaoLeito;
        w.executarMovimentacaoLeito=async function(){
          const ac=d.getElementById('mov-acao')?.value;
          if(ac==='Reserva Cirúrgica Eletiva'){
            const input=d.getElementById('mov-medico-texto-v10');
            const select=d.getElementById('mov-medico');
            const nome=normalizarNomeMedicoV10(input?.value);
            if(nome){
              const existe=(w.listaMedicosSistema||[]).some(m=>String(m).trim().toUpperCase()===nome.toUpperCase());
              if(!existe){
                w.listaMedicosSistema.push(nome);
                w.listaMedicosSistema.sort((a,b)=>a.localeCompare(b,'pt-BR'));
                await salvarMedicosPersistidosV10();
                if(typeof w.atualizarCampoMedicoInteligenteV10==='function')w.atualizarCampoMedicoInteligenteV10();
              }
              let opt=[...select.options].find(o=>String(o.value||o.textContent).trim().toUpperCase()===nome.toUpperCase());
              if(!opt){opt=d.createElement('option');opt.value=nome;opt.textContent=nome;select.appendChild(opt);}
              select.value=nome;
            }
          }
          return execMedicoInteligenteV10.apply(w,arguments);
        };

        setTimeout(async()=>{
          await carregarMedicosPersistidosV10();
          if(typeof w.atualizarSelectMedicos==='function')w.atualizarSelectMedicos();
          garantirCampoMedicoInteligenteV10();
        },900);


        // --- Reserva com previsão de alta: médico/procedimento obrigatórios + persistência dedicada ---
        function garantirCamposReservaPrevAltaV11(){
          const bloco=d.getElementById('bloco-prev-alta-v8');
          if(bloco&&!d.getElementById('mov-medico-prev-v11')){
            const grid=bloco.querySelector('.form-grid');
            const gMed=d.createElement('div');
            gMed.className='form-group';
            gMed.innerHTML='<label>Nome do Médico *</label><input id="mov-medico-prev-v11" type="text" list="lista-medicos-prev-v11" placeholder="Digite ou selecione o médico"><datalist id="lista-medicos-prev-v11"></datalist>';
            const gProc=d.createElement('div');
            gProc.className='form-group';
            gProc.innerHTML='<label>Procedimento Proposto *</label><input id="mov-procedimento-prev-v11" type="text" placeholder="Descreva o procedimento">';
            grid?.prepend(gProc);
            grid?.prepend(gMed);
          }
          atualizarListaMedicosPrevAltaV11();
        }

        function atualizarListaMedicosPrevAltaV11(){
          const dl=d.getElementById('lista-medicos-prev-v11');
          if(!dl)return;
          dl.innerHTML='';
          (w.listaMedicosSistema||[]).forEach(m=>{
            const o=d.createElement('option');o.value=m;dl.appendChild(o);
          });
        }

        async function aprenderMedicoV11(nome){
          const n=normalizarNomeMedicoV10?normalizarNomeMedicoV10(nome):String(nome||'').trim();
          if(!n)return '';
          const existe=(w.listaMedicosSistema||[]).some(m=>String(m).trim().toUpperCase()===n.toUpperCase());
          if(!existe){
            w.listaMedicosSistema.push(n);
            w.listaMedicosSistema.sort((a,b)=>a.localeCompare(b,'pt-BR'));
            if(typeof salvarMedicosPersistidosV10==='function')await salvarMedicosPersistidosV10();
            if(typeof w.atualizarCampoMedicoInteligenteV10==='function')w.atualizarCampoMedicoInteligenteV10();
            atualizarListaMedicosPrevAltaV11();
          }
          return n;
        }

        async function persistirReservasPrevAltaV11(){
          try{
            const {doc,setDoc}=w.firebaseModules||{};
            if(!w.db||!doc||!setDoc)return;
            const reservas={};
            (w.setoresData||[]).forEach(s=>s.leitos.forEach(l=>{
              if(l.reservaPrevAlta)reservas[encodeURIComponent(s.nome)+'||'+encodeURIComponent(l.n)]={setor:s.nome,leito:l.n,...l.reservaPrevAlta};
            }));
            await setDoc(doc(w.db,'hospital','reservas-prev-alta'),{
              reservas,
              atualizadoEm:new Date().toISOString(),
              atualizadoPor:w.usuarioAtual?.nome||'Usuário'
            });
          }catch(e){console.error('Erro ao persistir reservas com previsão de alta:',e);}
        }

        function aplicarReservasPersistidasV11(reservas){
          let alterou=false;
          Object.values(reservas||{}).forEach(r=>{
            const s=(w.setoresData||[]).find(x=>x.nome===r.setor);
            const l=s?.leitos.find(x=>x.n===r.leito);
            if(l){
              const dados={...r};delete dados.setor;delete dados.leito;
              l.reservaPrevAlta=dados;
              alterou=true;
            }
          });
          if(alterou&&typeof w.renderizarPainelLeitos==='function')w.renderizarPainelLeitos();
        }

        function assinarReservasPrevAltaV11(){
          try{
            const {doc,onSnapshot}=w.firebaseModules||{};
            if(!w.db||!doc||!onSnapshot)return;
            onSnapshot(doc(w.db,'hospital','reservas-prev-alta'),snap=>{
              if(snap.exists())aplicarReservasPersistidasV11(snap.data()?.reservas||{});
            });
          }catch(e){console.error('Erro ao sincronizar reservas com previsão de alta:',e);}
        }

        garantirCamposReservaPrevAltaV11();
        setTimeout(garantirCamposReservaPrevAltaV11,1000);
        setTimeout(assinarReservasPrevAltaV11,1300);

        // intercepta e completa o cadastro especial com médico e procedimento
        const execPrevAltaV11=w.executarMovimentacaoLeito;
        w.executarMovimentacaoLeito=async function(){
          const ac=d.getElementById('mov-acao')?.value;
          if(ac!=='Reserva Cirúrgica com Previsão de Alta')return execPrevAltaV11.apply(w,arguments);

          garantirCamposReservaPrevAltaV11();
          const medico=await aprenderMedicoV11(d.getElementById('mov-medico-prev-v11')?.value);
          const procedimento=String(d.getElementById('mov-procedimento-prev-v11')?.value||'').trim();
          if(!medico||!procedimento){
            w.alert('Na Reserva Cirúrgica com Previsão de Alta, Nome do Médico e Procedimento Proposto são obrigatórios.');
            return;
          }

          const setorNome=d.getElementById('mov-setor')?.value;
          const leitoNum=d.getElementById('mov-leito')?.value;
          const pacienteReserva=d.getElementById('mov-paciente')?.value.trim();
          const r=execPrevAltaV11.apply(w,arguments);
          if(r&&typeof r.then==='function')await r;

          const setor=(w.setoresData||[]).find(s=>s.nome===setorNome);
          const leito=setor?.leitos.find(l=>l.n===leitoNum);
          if(leito?.reservaPrevAlta){
            leito.reservaPrevAlta.medico=medico;
            leito.reservaPrevAlta.procedimento=procedimento;
            const hist=(w.movimentacoesHistorico||[]).find(m=>m.paciente===pacienteReserva&&String(m.acao||'').includes('Reserva Cirúrgica com Previsão de Alta'));
            if(hist&&!String(hist.acao||'').includes('Médico:')){
              hist.acao=String(hist.acao||'')+'<br><small>Médico: '+medico+' | Procedimento: '+procedimento+'</small>';
            }
            if(typeof w.salvarDadosNoFirebase==='function')await w.salvarDadosNoFirebase();
            await persistirReservasPrevAltaV11();
            if(typeof w.renderizarPainelLeitos==='function')w.renderizarPainelLeitos();
          }
          const mi=d.getElementById('mov-medico-prev-v11');if(mi)mi.value='';
          const pi=d.getElementById('mov-procedimento-prev-v11');if(pi)pi.value='';
          return r;
        };

        // completar modal de edição da reserva
        const oldGarantirModalReservaV11=w.editarReservaPrevAltaV9;
        w.editarReservaPrevAltaV9=function(setor,leito){
          if(typeof oldGarantirModalReservaV11==='function')oldGarantirModalReservaV11.call(w,setor,leito);
          const modal=d.getElementById('modal-editar-reserva-v9');
          if(!modal)return;
          const r=w.setoresData.find(x=>x.nome===setor)?.leitos.find(x=>x.n===leito)?.reservaPrevAlta;
          const grid=modal.querySelector('.form-grid');
          if(grid&&!d.getElementById('res-medico-v11')){
            const gm=d.createElement('div');gm.className='form-group';
            gm.innerHTML='<label>Nome do Médico *</label><input id="res-medico-v11" type="text" list="lista-medicos-res-v11" placeholder="Digite ou selecione"><datalist id="lista-medicos-res-v11"></datalist>';
            const gp=d.createElement('div');gp.className='form-group';
            gp.innerHTML='<label>Procedimento Proposto *</label><input id="res-procedimento-v11" type="text" placeholder="Descreva o procedimento">';
            grid.appendChild(gm);grid.appendChild(gp);
          }
          const dl=d.getElementById('lista-medicos-res-v11');
          if(dl){dl.innerHTML='';(w.listaMedicosSistema||[]).forEach(m=>{const o=d.createElement('option');o.value=m;dl.appendChild(o);});}
          if(d.getElementById('res-medico-v11'))d.getElementById('res-medico-v11').value=r?.medico||'';
          if(d.getElementById('res-procedimento-v11'))d.getElementById('res-procedimento-v11').value=r?.procedimento||'';

          const btn=d.getElementById('res-save-v9');
          if(btn&&!btn.dataset.v11){
            btn.dataset.v11='1';
            const antigo=btn.onclick;
            btn.onclick=async()=>{
              const med=await aprenderMedicoV11(d.getElementById('res-medico-v11')?.value);
              const proc=String(d.getElementById('res-procedimento-v11')?.value||'').trim();
              if(!med||!proc){w.alert('Nome do Médico e Procedimento Proposto são obrigatórios.');return;}
              const sNome=d.getElementById('res-setor-v9').value;
              const lNum=d.getElementById('res-leito-v9').value;
              if(typeof antigo==='function'){
                const rr=antigo();
                if(rr&&typeof rr.then==='function')await rr;
              }
              const l=w.setoresData.find(x=>x.nome===sNome)?.leitos.find(x=>x.n===lNum);
              if(l?.reservaPrevAlta){
                l.reservaPrevAlta.medico=med;
                l.reservaPrevAlta.procedimento=proc;
                if(typeof w.salvarDadosNoFirebase==='function')await w.salvarDadosNoFirebase();
                await persistirReservasPrevAltaV11();
              }
            };
          }
        };

        // persistir remoções/transições da reserva especial também
        const oldSalvarGeralV11=w.salvarDadosNoFirebase;
        w.salvarDadosNoFirebase=async function(){
          const r=oldSalvarGeralV11.apply(w,arguments);
          if(r&&typeof r.then==='function')await r;
          // não dispara em loop: grava somente o espelho das reservas atuais
          await persistirReservasPrevAltaV11();
          return r;
        };

        // --- Resumo geral de ocupação no rodapé do Painel de Leitos ---
        function calcularResumoOcupacaoV12(){
          const resumo={
            total:0,ocupados:0,disponiveis:0,bloqueados:0,reservados:0,higienizacao:0,
            utiTotal:0,utiOcupados:0,utiDisponiveis:0,
            sexo:{Feminino:0,Masculino:0,'Não informado':0},
            especialidades:{}
          };
          (w.setoresData||[]).forEach(s=>{
            const nomeSetor=String(s.nome||'').toUpperCase();
            const tipoSetor=String(s.tipo||'').toUpperCase();
            const ehCirurgicoNaoCensitario =
              nomeSetor==='SALAS OPERATÓRIAS' ||
              nomeSetor==='SALAS OPERATORIAS' ||
              nomeSetor==='SRPA' ||
              tipoSetor==='CENTRO CIRÚRGICO' ||
              tipoSetor==='CENTRO CIRURGICO' ||
              tipoSetor==='RECUPERAÇÃO PÓS-ANESTÉSICA' ||
              tipoSetor==='RECUPERACAO POS-ANESTESICA';
            if(ehCirurgicoNaoCensitario)return;

            const ehUti=tipoSetor==='UTI'||nomeSetor.includes('UTI');
            s.leitos.forEach(l=>{
              resumo.total++;
              if(ehUti)resumo.utiTotal++;
              if(l.status==='ocupado'){
                resumo.ocupados++;
                if(ehUti)resumo.utiOcupados++;
                const b=l.prontuario?w.basePacientesCadastrados?.[l.prontuario]:null;
                const sexo=String(b?.sexo||'').toLowerCase();
                if(sexo.includes('femin'))resumo.sexo.Feminino++;
                else if(sexo.includes('mascul'))resumo.sexo.Masculino++;
                else resumo.sexo['Não informado']++;

                const esp=String(b?.especialidade||b?.perfil||'Não informado').trim()||'Não informado';
                resumo.especialidades[esp]=(resumo.especialidades[esp]||0)+1;
              }else if(l.status==='disponivel'){
                resumo.disponiveis++;
                if(ehUti)resumo.utiDisponiveis++;
              }else if(l.status==='bloqueado')resumo.bloqueados++;
              else if(l.status==='reservado')resumo.reservados++;
              else if(l.status==='higienizacao')resumo.higienizacao++;
            });
          });
          return resumo;
        }

        function renderResumoOcupacaoV12(){
          const painel=d.getElementById('painel');
          const container=d.getElementById('painel-setores-detalhado');
          if(!painel||!container)return;
          let box=d.getElementById('resumo-ocupacao-v12');
          if(!box){
            box=d.createElement('div');
            box.id='resumo-ocupacao-v12';
            box.style.cssText='margin-top:18px;background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:16px;box-shadow:0 2px 8px rgba(15,23,42,.05)';
            container.after(box);
          }
          const r=calcularResumoOcupacaoV12();
          const ocupPct=r.total?Math.round((r.ocupados/r.total)*100):0;
          const utiPct=r.utiTotal?Math.round((r.utiOcupados/r.utiTotal)*100):0;
          const espEntries=Object.entries(r.especialidades).sort((a,b)=>b[1]-a[1]);

          const cards=[
            ['Ocupação total',ocupPct+'%'],
            ['Leitos totais',r.total],
            ['Ocupados',r.ocupados],
            ['Disponíveis',r.disponiveis],
            ['Bloqueados',r.bloqueados],
            ['Reservados',r.reservados],
            ['Higienização',r.higienizacao],
            ['UTI — pacientes',r.utiOcupados],
            ['UTI — leitos totais',r.utiTotal],
            ['UTI — disponíveis',r.utiDisponiveis],
            ['UTI — ocupação',utiPct+'%']
          ];

          box.innerHTML=
            '<h3 style="margin:0 0 6px;color:#0f172a">Resumo Geral da Ocupação</h3>'+
            '<div style="margin:0 0 12px;color:#64748b;font-size:.78rem">Não inclui Salas Operatórias nem leitos de SRPA.</div>'+
            '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px">'+
              cards.map(([t,v])=>'<div style="border:1px solid #e2e8f0;border-radius:8px;padding:10px;background:#f8fafc"><div style="font-size:.76rem;color:#64748b;font-weight:700">'+esc(t)+'</div><div style="font-size:1.35rem;font-weight:800;color:#0f172a;margin-top:3px">'+esc(v)+'</div></div>').join('')+
            '</div>'+
            '<div style="display:grid;grid-template-columns:1fr 2fr;gap:14px;margin-top:16px">'+
              '<div style="border:1px solid #e2e8f0;border-radius:8px;padding:12px">'+
                '<h4 style="margin:0 0 8px">Pacientes ocupando leito por sexo</h4>'+
                '<div>♀ Feminino: <strong>'+r.sexo.Feminino+'</strong></div>'+
                '<div>♂ Masculino: <strong>'+r.sexo.Masculino+'</strong></div>'+
                '<div>Não informado: <strong>'+r.sexo['Não informado']+'</strong></div>'+
              '</div>'+
              '<div style="border:1px solid #e2e8f0;border-radius:8px;padding:12px">'+
                '<h4 style="margin:0 0 8px">Pacientes ocupando leito por especialidade / perfil</h4>'+
                (espEntries.length
                  ? '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:6px">'+espEntries.map(([k,v])=>'<div style="background:#f8fafc;border-radius:6px;padding:7px 9px"><span>'+esc(k)+'</span>: <strong>'+v+'</strong></div>').join('')+'</div>'
                  : '<span style="color:#64748b">Nenhum paciente ocupado no momento.</span>')+
              '</div>'+
            '</div>';
        }

        const renderComResumoV12=w.renderizarPainelLeitos;
        w.renderizarPainelLeitos=function(){
          const r=renderComResumoV12.apply(w,arguments);
          setTimeout(renderResumoOcupacaoV12,50);
          return r;
        };
        setTimeout(renderResumoOcupacaoV12,1200);

        // --- Ações operacionais do atalho: execução direta e consistente ---
        async function registrarEventoAtalhoV13({acao,pr,nome,nasc,perfil,sexo,convenio,origem,setor,leito,detalhe}){
          const agora=new Date();
          const hora=agora.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
          const data=agora.toLocaleDateString('pt-BR')+' '+hora;
          if(!Array.isArray(w.movimentacoesHistorico))w.movimentacoesHistorico=[];
          w.movimentacoesHistorico.unshift({
            data,dataIso:agora.toISOString(),hora,
            atendimentoNasc:'Pront: '+(pr||'-')+'<br><small>Nasc: '+(nasc||'-')+'</small>',
            atendimento:pr||'-',nascimento:nasc||'',paciente:nome||'-',
            setor:setor+' (Leito '+leito+')',
            origem:origem||setor,destino:setor,
            perfil:(perfil||'-')+(sexo?' ('+sexo+')':''),
            convenio:convenio||'-',
            acao:acao+(detalhe?'<br><small>'+detalhe+'</small>':''),
            dataDesfecho:data,dataDesfechoObj:agora,
            dataAdmissaoObj:w.basePacientesCadastrados?.[pr]?.dataAdmissao||agora
          });
        }

        async function finalizarAtualizacaoAtalhoV13(){
          if(typeof w.renderizarPainelLeitos==='function')w.renderizarPainelLeitos();
          if(typeof w.atualizarTabelaMovimentacoes==='function')w.atualizarTabelaMovimentacoes();
          if(typeof w.atualizarTabelaHistoricoGeral==='function')w.atualizarTabelaHistoricoGeral();
          if(typeof w.atualizarTabelaPacientesInternos==='function')w.atualizarTabelaPacientesInternos();
          if(typeof w.salvarDadosNoFirebase==='function')await w.salvarDadosNoFirebase();
          const modal=d.getElementById('modal-editar-paciente');if(modal)modal.style.display='none';
        }

        async function confirmarAcaoPainelV13(){
          const acao=d.getElementById('edit-acao-v4')?.value;
          if(!acao){w.alert('Selecione a Ação Operacional.');return;}

          const oldPr=d.getElementById('edit-prontuario')?.value||'';
          const novoPr=(d.getElementById('edit-prontuario-vis-v3')?.value||'').trim();
          const pr=novoPr||oldPr;
          const nome=(d.getElementById('edit-nome')?.value||'').trim();
          const nasc=d.getElementById('edit-nasc')?.value||'';
          const perfil=d.getElementById('edit-perfil')?.value||'';
          const sexo=d.getElementById('edit-sexo-v3')?.value||'';
          const convenio=d.getElementById('edit-convenio-v3')?.value||'SUS';
          const origem=d.getElementById('edit-origem-v3')?.value||'';

          const atual=setorAtualPorPr(oldPr)||setorAtualPorPr(pr);
          if(!atual){w.alert('Não foi possível localizar o leito atual deste paciente.');return;}
          const s=atual.s,l=atual.l;

          // Atualiza prontuário informado no cadastro, se necessário.
          if(novoPr&&novoPr!==oldPr){
            const existente=w.basePacientesCadastrados?.[novoPr];
            const norm=x=>String(x||'').trim().toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
            if(existente&&norm(existente.nome)!==norm(nome)){
              w.alert('O prontuário '+novoPr+' já pertence a outro paciente: '+(existente.nome||'cadastro existente')+'.');
              return;
            }
            const antigo=w.basePacientesCadastrados?.[oldPr]||{};
            delete w.basePacientesCadastrados[oldPr];
            w.basePacientesCadastrados[novoPr]={...(existente||{}),...antigo,nome,nascimento:nasc,perfil,sexo,convenio,origem};
            w.setoresData.forEach(ss=>ss.leitos.forEach(ll=>{if(ll.prontuario===oldPr){ll.prontuario=novoPr;ll.paciente=nome;}}));
            d.getElementById('edit-prontuario').value=novoPr;
          }

          // Ações que dependem de escolha/dados adicionais: abre a tela completa já preenchida.
          if(['Transferência Interna','Reservado','Reserva Cirúrgica Eletiva'].includes(acao)){
            if(acao==='Transferência Interna'){
              w.alert('Para Transferência Interna é necessário escolher o novo setor e leito. A tela completa será aberta já com o paciente preenchido.');
            }else if(acao==='Reservado'){
              w.alert('A reserva comum é destinada à criação/alocação de uma reserva. A tela completa será aberta para selecionar o leito.');
            }else{
              w.alert('Para Reserva Cirúrgica Eletiva é necessário informar médico, data/hora e procedimento. A tela completa será aberta.');
            }
            prepararAcaoOperacionalPainel(true);
            return;
          }

          if(acao==='Reserva Cirúrgica com Previsão de Alta'){
            w.alert('Esta modalidade exige previsão de alta, médico e procedimento. Use a tela completa de Movimentação & Reserva Cirúrgica.');
            prepararAcaoOperacionalPainel(true);
            return;
          }

          if(acao==='Bloqueio'){
            if(l.status==='ocupado'||l.status==='reservado'){
              w.alert('Não é permitido bloquear um leito ocupado ou reservado. Primeiro registre a saída/transferência do paciente.');
              return;
            }
            if(!w.confirm('Confirmar BLOQUEIO do leito '+l.n+' de '+s.nome+'?'))return;
            l.status='bloqueado';l.paciente='';l.prontuario='';
            await registrarEventoAtalhoV13({acao:'Bloqueio de Leito',pr,nome,nasc,perfil,sexo,convenio,origem,setor:s.nome,leito:l.n});
            await finalizarAtualizacaoAtalhoV13();
            w.alert('Leito bloqueado com sucesso.');
            return;
          }

          if(acao==='Admissão'){
            if(l.status==='ocupado'&&l.prontuario===pr){
              w.alert('Este paciente já está admitido e ocupa este leito.');
              return;
            }
            if(l.status!=='reservado'&&l.status!=='disponivel'){
              w.alert('A admissão direta só pode ser feita em leito reservado para o paciente ou disponível.');
              return;
            }
            if(l.status==='reservado'&&l.prontuario&&l.prontuario!==pr){
              w.alert('Este leito está reservado para outro paciente.');
              return;
            }
            if(!pr||isTemp(pr)){w.alert('Informe o prontuário definitivo antes de confirmar a admissão.');return;}
            if(!nome||!nasc||!perfil||!sexo){w.alert('Complete nome, nascimento, perfil e sexo antes de admitir.');return;}
            if(!perfilCompativel(s.nome,perfil)){w.alert(msgConflito(s.nome,perfil));return;}
            if(!w.confirm('Confirmar ADMISSÃO de '+nome+' no leito '+l.n+' de '+s.nome+'?'))return;

            // Fluxo atômico específico para converter RESERVA -> OCUPADO.
            // A execução real ocorre dentro do app-v2.html, no mesmo realm do Firebase.
            try{
              if(typeof w.executarAdmissaoReservaAtomica!=='function'){
                throw new Error('Módulo nativo de admissão ainda não carregou. Atualize a página e tente novamente.');
              }

              const resultado=await w.executarAdmissaoReservaAtomica({
                setor:s.nome,
                leito:l.n,
                pr:pr,
                nome:nome,
                nasc:nasc,
                perfil:perfil,
                sexo:sexo,
                convenio:convenio,
                origem:origem,
                usuario:w.usuarioAtual?.nome||'usuario'
              });

              l.status='ocupado';l.paciente=nome;l.prontuario=pr;
              if(!w.basePacientesCadastrados[pr])w.basePacientesCadastrados[pr]={};
              Object.assign(w.basePacientesCadastrados[pr],{
                nome,nascimento:nasc,perfil,sexo,convenio,origem,
                statusInternacao:'ativo',dataAdmissao:new Date().toISOString()
              });

              if(typeof w.renderizarPainelLeitos==='function')w.renderizarPainelLeitos();
              if(typeof w.atualizarTabelaPacientesInternos==='function')w.atualizarTabelaPacientesInternos();
              if(typeof w.atualizarTabelaMovimentacoes==='function')w.atualizarTabelaMovimentacoes();
              if(typeof w.atualizarTabelaHistoricoGeral==='function')w.atualizarTabelaHistoricoGeral();
              const modal=d.getElementById('modal-editar-paciente');if(modal)modal.style.display='none';

              w.alert(resultado?.jaAdmitido
                ? 'Este paciente já constava como admitido no banco.'
                : 'Admissão registrada. A reserva do leito '+l.n+' foi convertida em OCUPAÇÃO.');
            }catch(e){
              console.error('Erro na admissão atômica da reserva:',e);
              if(e?.code==='CONFLITO_REAL'){
                w.alert('CONFLITO REAL DETECTADO.\n\n'+e.message+'\n\nAtualize a página para ver o estado mais recente. Nenhum dado foi sobrescrito.');
              }else{
                w.alert('Não foi possível concluir a admissão com segurança: '+(e?.message||e));
              }
            }
            return;
          }

          const saidas=['Alta Hospitalar','Alta a Pedido','Evasão','Óbito','Transferência Externa','Disponível'];
          if(saidas.includes(acao)){
            if(!w.confirm('Confirmar '+acao.toUpperCase()+' de '+nome+' no leito '+l.n+' de '+s.nome+'?'))return;
            const acaoHistorico=acao==='Disponível'?'Liberação de Leito':acao;

            try{
              if(typeof w.executarSaidaLeitoAtomica!=='function'){
                throw new Error('Módulo nativo de saída ainda não carregou. Atualize a página e tente novamente.');
              }
              const resultado=(acao==='Disponível') ? await w.liberarLeitoSelecionadoAtomico({setor:s.nome,leito:l.n,pr:pr,usuario:w.usuarioAtual?.nome||'usuario'}) : await w.executarSaidaLeitoAtomica({
                acao:acaoHistorico,
                pr:pr,
                nome:nome,
                nasc:nasc,
                perfil:perfil,
                sexo:sexo,
                convenio:convenio,
                origem:origem,
                setor:s.nome,
                leito:l.n,
                usuario:w.usuarioAtual?.nome||'usuario'
              });

              // Atualiza somente o leito selecionado no estado local.
              if(resultado?.reservaPromovida){
                // o snapshot do Firebase trará os dados da reserva promovida; não inventar localmente
              }else{
                l.status='disponivel';l.paciente='';l.prontuario='';
              }
              if(pr&&w.basePacientesCadastrados?.[pr] && acao!=='Disponível'){
                w.basePacientesCadastrados[pr].statusInternacao='encerrado';
                w.basePacientesCadastrados[pr].motivoSaida=acaoHistorico;
                w.basePacientesCadastrados[pr].dataSaida=new Date().toISOString();
                w.basePacientesCadastrados[pr].previsaoAlta='';
              }

              if(typeof w.renderizarPainelLeitos==='function')w.renderizarPainelLeitos();
              if(typeof w.atualizarTabelaPacientesInternos==='function')w.atualizarTabelaPacientesInternos();
              if(typeof w.atualizarTabelaMovimentacoes==='function')w.atualizarTabelaMovimentacoes();
              if(typeof w.atualizarTabelaHistoricoGeral==='function')w.atualizarTabelaHistoricoGeral();
              const modal=d.getElementById('modal-editar-paciente');if(modal)modal.style.display='none';

              w.alert(
                acaoHistorico+' registrada com sucesso. Somente o leito '+l.n+' foi alterado.'+
                (resultado?.reservaPromovida?' A reserva futura deste mesmo leito foi promovida.':'')
              );
            }catch(e){
              console.error('Erro na saída atômica:',e);
              if(e?.code==='CONFLITO_REAL'){
                w.alert('CONFLITO REAL DETECTADO.\n\n'+e.message+'\n\nAtualize a página para ver o estado mais recente. Nenhum dado foi sobrescrito.');
              }else{
                w.alert('Não foi possível concluir a saída com segurança: '+(e?.message||e));
              }
            }
            return;
          }

          w.alert('A ação selecionada ainda exige a tela completa de Movimentação. Clique em “Abrir ação”.');
        }

        const btnConfirmarV13=d.getElementById('btn-confirmar-acao-v5');
        if(btnConfirmarV13){
          // Impede clique repetido enquanto a gravação está sendo confirmada.
          // Não desabilita a transação nem enfraquece validações de concorrência.
          let acaoV13EmAndamento=false;
          btnConfirmarV13.onclick=null;
          btnConfirmarV13.addEventListener('click',function(ev){
            ev.preventDefault();
            ev.stopPropagation();
            if(typeof ev.stopImmediatePropagation==='function')ev.stopImmediatePropagation();
            if(acaoV13EmAndamento)return;
            acaoV13EmAndamento=true;
            btnConfirmarV13.disabled=true;
            Promise.resolve().then(()=>confirmarAcaoPainelV13())
              .catch(err=>{
                console.error('Erro no atalho operacional SIGMA:',err);
                w.alert('A ação não pôde ser concluída. Confira o painel antes de tentar novamente.');
              })
              .finally(()=>{
                acaoV13EmAndamento=false;
                btnConfirmarV13.disabled=false;
              });
          },true);
        }

        // --- Previsão de alta opcional para todos os pacientes ---
        function garantirCampoPrevisaoAltaV14(){
          const modal=d.getElementById('modal-editar-paciente');
          if(modal&&!d.getElementById('edit-previsao-alta-v14')){
            const body=modal.firstElementChild;
            const blocoAcao=d.getElementById('atalho-acao-operacional-v4');
            const wrap=d.createElement('div');
            wrap.className='form-group';
            wrap.style.marginBottom='1rem';
            wrap.innerHTML='<label>Previsão de Alta <span style="font-weight:400;color:#64748b">(opcional)</span></label><input type="datetime-local" id="edit-previsao-alta-v14" style="width:100%;padding:.5rem;border:1px solid var(--border);border-radius:6px">';
            if(blocoAcao)blocoAcao.before(wrap);else body?.appendChild(wrap);
          }

          const formMov=d.querySelector('#box-form-mov .form-grid');
          if(formMov&&!d.getElementById('mov-previsao-alta-paciente-v14')){
            const g=d.createElement('div');
            g.className='form-group';
            g.innerHTML='<label>Previsão de Alta <span style="font-weight:400;color:#64748b">(opcional)</span></label><input type="datetime-local" id="mov-previsao-alta-paciente-v14">';
            formMov.appendChild(g);
          }
        }

        const abrirEdicaoAntesV14=w.abrirEdicaoPaciente;
        w.abrirEdicaoPaciente=function(pr,nome,nasc,perfil){
          garantirCampoPrevisaoAltaV14();
          const r=abrirEdicaoAntesV14.apply(w,arguments);
          const b=w.basePacientesCadastrados?.[pr]||{};
          const el=d.getElementById('edit-previsao-alta-v14');
          if(el)el.value=b.previsaoAlta||'';
          return r;
        };

        const salvarEdicaoAntesV14=w.salvarEdicaoPaciente;
        w.salvarEdicaoPaciente=async function(){
          const prAntigo=d.getElementById('edit-prontuario')?.value||'';
          const prNovo=(d.getElementById('edit-prontuario-vis-v3')?.value||'').trim()||prAntigo;
          const previsao=d.getElementById('edit-previsao-alta-v14')?.value||'';
          const r=salvarEdicaoAntesV14.apply(w,arguments);
          if(r&&typeof r.then==='function')await r;
          const chave=w.basePacientesCadastrados?.[prNovo]?prNovo:prAntigo;
          if(chave&&w.basePacientesCadastrados?.[chave]){
            w.basePacientesCadastrados[chave].previsaoAlta=previsao;
            if(typeof w.salvarDadosNoFirebase==='function')await w.salvarDadosNoFirebase();
            if(typeof w.renderizarPainelLeitos==='function')w.renderizarPainelLeitos();
          }
          return r;
        };

        const execAntesPrevAltaPacienteV14=w.executarMovimentacaoLeito;
        w.executarMovimentacaoLeito=async function(){
          garantirCampoPrevisaoAltaV14();
          const pr=d.getElementById('mov-atendimento')?.value.trim();
          const acaoAntesPrevAltaV14=d.getElementById('mov-acao')?.value||'';
          const previsao=d.getElementById('mov-previsao-alta-paciente-v14')?.value||'';
          const r=execAntesPrevAltaPacienteV14.apply(w,arguments);
          if(r&&typeof r.then==='function')await r;
          // Saídas e reservas atômicas já foram gravadas no servidor.
          // Regravar todo o estado local aqui pode restaurar um paciente após a alta.
          if(pr&&w.basePacientesCadastrados?.[pr] &&
             !['Alta Hospitalar','Alta a Pedido','Evasão','Óbito','Transferência Externa','Disponível','Reservado','Admissão','Reserva Cirúrgica Eletiva'].includes(acaoAntesPrevAltaV14)){
            w.basePacientesCadastrados[pr].previsaoAlta=previsao;
            if(typeof w.salvarDadosNoFirebase==='function')await w.salvarDadosNoFirebase();
            if(typeof w.renderizarPainelLeitos==='function')w.renderizarPainelLeitos();
          }
          return r;
        };

        function formatarPrevAltaV14(v){
          if(!v)return '';
          const dt=new Date(v);
          if(isNaN(dt))return String(v);
          return dt.toLocaleString('pt-BR');
        }

        function aplicarPrevisaoAltaNoPainelV14(){
          const boxes=[...d.querySelectorAll('#painel-setores-detalhado .sector-box')];
          boxes.forEach((box,i)=>{
            const s=w.setoresData?.[i];if(!s)return;
            const pills=[...box.querySelectorAll('.leito-pill')];
            pills.forEach((pill,j)=>{
              const l=s.leitos?.[j];if(!l)return;
              pill.querySelectorAll('.prev-alta-badge-v14').forEach(x=>x.remove());
              if(l.status!=='ocupado'||!l.prontuario)return;
              const b=w.basePacientesCadastrados?.[l.prontuario];
              if(!b?.previsaoAlta)return;
              pill.style.position='relative';
              pill.style.overflow='visible';
              const badge=d.createElement('span');
              badge.className='prev-alta-badge-v14';
              badge.textContent='ALTA';
              badge.title='Previsão de alta: '+formatarPrevAltaV14(b.previsaoAlta);
              badge.style.cssText='position:absolute;left:-6px;bottom:-12px;background:#f59e0b;color:#111827;border:2px solid #fff;border-radius:999px;padding:2px 5px;font-size:8px;font-weight:900;z-index:6;white-space:nowrap;box-shadow:0 1px 3px rgba(0,0,0,.2)';
              pill.appendChild(badge);
              const info='Previsão de alta: '+formatarPrevAltaV14(b.previsaoAlta);
              if(!String(pill.title||'').includes('Previsão de alta'))pill.title=(pill.title?pill.title+' — ':'')+info;
            });
          });
        }

        const renderAntesPrevAltaV14=w.renderizarPainelLeitos;
        w.renderizarPainelLeitos=function(){
          const r=renderAntesPrevAltaV14.apply(w,arguments);
          setTimeout(aplicarPrevisaoAltaNoPainelV14,70);
          return r;
        };

        const abrirLeitoAntesPrevAltaV14=w.abrirHistoricoPacienteLeito;
        w.abrirHistoricoPacienteLeito=function(setor,leito){
          const r=abrirLeitoAntesPrevAltaV14.apply(w,arguments);
          const s=w.setoresData.find(x=>x.nome===setor),l=s?.leitos.find(x=>x.n===leito);
          if(!l?.prontuario)return r;
          const b=w.basePacientesCadastrados?.[l.prontuario];
          const cont=d.getElementById('paciente-modal-conteudo');
          if(b?.previsaoAlta&&cont&&!cont.querySelector('#prev-alta-detalhe-v14')){
            const div=d.createElement('div');
            div.id='prev-alta-detalhe-v14';
            div.style.cssText='margin:10px 0;padding:10px;background:#fffbeb;border:1px solid #fde68a;border-left:4px solid #f59e0b;border-radius:7px';
            div.innerHTML='<strong>📅 Previsão de alta:</strong> '+esc(formatarPrevAltaV14(b.previsaoAlta));
            cont.prepend(div);
          }
          return r;
        };

        function aplicarBadgeClinicaMedicaV15(){
          const boxes=[...d.querySelectorAll('#painel-setores-detalhado .sector-box')];
          boxes.forEach((box,i)=>{
            const s=w.setoresData?.[i]; if(!s)return;
            const pills=[...box.querySelectorAll('.leito-pill')];
            pills.forEach((pill,j)=>{
              const l=s.leitos?.[j]; if(!l)return;
              pill.querySelectorAll('.badge-clinica-medica-v15').forEach(x=>x.remove());
              if(l.status!=='ocupado'||!l.prontuario)return;

              const b=w.basePacientesCadastrados?.[l.prontuario]||{};
              const perfil=String(b.perfil||b.especialidade||'').trim().toLowerCase();
              const ehClinica=perfil.includes('enfermaria clínica')||perfil.includes('enfermaria clinica');
              if(!ehClinica)return;

              pill.style.position='relative';
              pill.style.overflow='visible';

              const badge=d.createElement('span');
              badge.className='badge-clinica-medica-v15';
              badge.textContent='C.M';
              badge.title='Enfermaria Clínica / Clínica Médica';
              badge.style.cssText=
                'position:absolute;left:-7px;bottom:-9px;'+
                'background:#0f766e;color:#fff;border:2px solid #fff;border-radius:999px;'+
                'min-width:22px;height:16px;padding:0 4px;display:flex;align-items:center;justify-content:center;'+
                'font-size:8px;font-weight:900;letter-spacing:.2px;z-index:8;'+
                'box-shadow:0 1px 3px rgba(0,0,0,.28);pointer-events:none;white-space:nowrap';
              pill.appendChild(badge);
            });
          });
        }

        const renderAntesClinicaMedicaV15=w.renderizarPainelLeitos;
        w.renderizarPainelLeitos=function(){
          const r=renderAntesClinicaMedicaV15.apply(w,arguments);
          setTimeout(aplicarBadgeClinicaMedicaV15,90);
          return r;
        };
        setTimeout(aplicarBadgeClinicaMedicaV15,1300);

        garantirCampoPrevisaoAltaV14();
        setTimeout(garantirCampoPrevisaoAltaV14,1000);
        setTimeout(()=>{if(typeof w.renderizarPainelLeitos==='function')w.renderizarPainelLeitos();},1200);
        // contraste visual do perfil incompatível em mudança manual de setor
        const perfilEl=d.getElementById('mov-perfil-vaga'),setorEl=d.getElementById('mov-setor');
        function pintarConflito(){if(!perfilEl||!setorEl)return;const bad=!perfilCompativel(setorEl.value,perfilEl.value);perfilEl.style.borderColor=bad?'#ef4444':'';perfilEl.style.background=bad?'#fff1f2':'';}
        perfilEl?.addEventListener('change',pintarConflito); setorEl?.addEventListener('change',()=>setTimeout(pintarConflito,0));

      }catch(e){console.error('Erro patch simplificação cadastro:',e);}
    },350);
  });
})();
;
;/* FILE: patch-seguranca-multiusuario-20261009.js */
(()=>{
const frame=document.getElementById('appFrame');if(!frame)return;
frame.addEventListener('load',()=>{
const w=frame.contentWindow,d=frame.contentDocument;if(!w||!d)return;
const promptIndicador=(acao,setor)=>{
 const relevante=/admiss|alta|óbito|obito|transfer|evas|reserv/i.test(acao||'');
 if(!relevante)return false;
 const uti=String(setor||'').toUpperCase().includes('UTI');
 return w.confirm('INDICADORES HOSPITALARES\\n\\nDeseja COMPUTAR esta movimentação nos indicadores?\\n\\nAção: '+acao+(uti?'\\nOrigem UTI: se computada, qualquer transferência também será alta da UTI.':'')+'\\n\\nOK = SIM, COMPUTAR\\nCancelar = NÃO COMPUTAR\\n\\nA movimentação será executada normalmente em ambas as opções.');
};
// Validação de indicadores centralizada no módulo obrigatório: não interceptar transações atômicas aqui.
const original=w.executarMovimentacaoLeito;
if(typeof original==='function')w.executarMovimentacaoLeito=async function(){
 const ac=d.getElementById('mov-acao')?.value||'';
 if(ac==='Reserva Cirúrgica Eletiva'){
  const get=id=>d.getElementById(id)?.value?.trim()||'';
  const setor=get('mov-setor'),leito=get('mov-leito'),nome=get('mov-paciente'),nasc=get('mov-nascimento'),sexo=get('mov-sexo'),perfil=get('mov-perfil-vaga'),origem=get('mov-origem');
  const medico=get('mov-medico'),dataHora=get('mov-data-cirurgia'),procedimento=get('mov-procedimento');
  if(!setor||!leito||!nome||!nasc||!sexo||!perfil||!origem||!medico||!dataHora||!procedimento){w.alert('Preencha os campos obrigatórios e os dados específicos da cirurgia.');return;}
  const pr=get('mov-atendimento')||('RES-'+Date.now()+'-'+Math.random().toString(36).slice(2,6));
  // Reserva não é admissão e não contabiliza ocupação ou entrada nos indicadores.
  try{
   const r=await w.executarEntradaLeitoAtomica({acao:ac,setor,leito,pr,nome,nasc,sexo,perfil,origem,convenio:get('mov-convenio'),precaucao:get('mov-precaucao'),previsaoAlta:get('mov-previsao-alta-paciente'),medicoCirurgiao:medico,dataHoraCirurgia:dataHora,procedimentoProposto:procedimento,contabilizarIndicadores:false,usuario:w.usuarioAtual?.nome||'usuario'});
   if(r?.status!=='reservado')throw Error('Banco não confirmou status reservado.');
   ['mov-atendimento','mov-paciente','mov-nascimento'].forEach(id=>{const el=d.getElementById(id);if(el)el.value='';});
   w.alert('Reserva cirúrgica '+(r.jaExistia?'já existente e confirmada':'GRAVADA NO BANCO')+' para '+setor+' / leito '+leito+'. Aguarde a atualização do painel.');
  }catch(e){w.alert('RESERVA NÃO CONFIRMADA: '+(e?.message||e)+'\\nConfira o status do leito antes de repetir.');}
  return;
 }
 if(ac==='Transferência Interna'){
  if(w.usuarioAtual?.perfil==='Visitante'){w.alert('Acesso negado.');return;}
  const get=id=>d.getElementById(id)?.value?.trim()||'';
  const pr=get('mov-atendimento'),dest=get('mov-setor'),leito=get('mov-leito');
  if(!pr||!dest||!leito){w.alert('Informe prontuário, setor e leito de destino.');return;}
  try{
   if(typeof w.hsjEscolherIndicadorMovimentacao!=='function')throw Error('Módulo de indicadores indisponível. Recarregue o sistema antes de transferir.');
   const escolha=await w.hsjEscolherIndicadorMovimentacao('Transferência interna entre setores');
   if(!escolha)return;
   if(typeof w.executarTransferenciaSeguraV20261009!=='function')throw Error('Transação segura indisponível.');
   await w.executarTransferenciaSeguraV20261009({pr,setorDestino:dest,leitoDestino:leito,...escolha,usuario:w.usuarioAtual?.nome});
   if(typeof w.carregarDadosDoFirebase==='function')w.carregarDadosDoFirebase();
   w.alert('Transferência CONFIRMADA no banco. Acomodação de origem liberada e destino ocupado.');
   if(typeof w.renderizarPainelLeitos==='function')w.renderizarPainelLeitos();
  }catch(e){w.alert('Transferência NÃO realizada: '+(e?.message||e));}
  return;
 }
 return original.apply(w,arguments);
};
const aviso=d.createElement('div');aviso.id='regra-indicadores-multiusuario';aviso.style.cssText='position:fixed;bottom:12px;right:12px;z-index:9999;background:#e0f2fe;color:#075985;padding:7px 12px;border:1px solid #38bdf8;border-radius:8px;font:600 12px sans-serif;max-width:270px';aviso.textContent='Banco central: confirme a gravação antes de considerar uma movimentação concluída.';d.body.appendChild(aviso);
});
})();
;
;/* FILE: patch-interface-limpa-20261013.js */
(()=>{
const frame=document.getElementById('appFrame');if(!frame)return;
let didInit=false;
function init(){
if(didInit)return;
try{
 const w=frame.contentWindow,d=frame.contentDocument;
 if(!w||!d||!Array.isArray(w.setoresData)||typeof w.abrirHistoricoPacienteLeito!=='function'||!d.getElementById('box-form-mov'))return;
 didInit=true;
 const css=d.createElement('style');
 css.textContent='#hsj-drawer-wrap{position:fixed;inset:0;background:#0f172a88;z-index:100000;display:none;justify-content:flex-end}#hsj-drawer{width:min(700px,100%);height:100%;overflow:auto;background:white;box-shadow:-8px 0 32px #0002}#hsj-drawer-head{position:sticky;top:0;background:white;padding:18px;border-bottom:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:center;z-index:2}#hsj-drawer-body{padding:18px}#hsj-drawer-body .form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}#hsj-trans-tools{background:#fff;border:1px solid #e2e8f0;padding:16px;margin:12px 0 16px;border-radius:12px}#hsj-trans-tools input,#hsj-trans-tools select{padding:9px;border:1px solid #cbd5e1;border-radius:8px}.hsj-kpi{border:1px solid #e2e8f0;background:#f8fafc;padding:10px 15px;border-radius:9px;min-width:105px;flex:1}.hsj-kpi strong{display:block;font-size:24px;color:#0f2747}#transferencias .table-container{overflow-x:auto;border:1px solid #e2e8f0;border-radius:10px}#transferencias th{background:#f1f5f9;white-space:nowrap}#regra-indicadores-multiusuario{display:none!important}@media(max-width:650px){#hsj-drawer-body .form-grid{grid-template-columns:1fr}}';
 d.head.appendChild(css);
 const nav=[...d.querySelectorAll('.subnav .nav-item')].find(e=>(e.getAttribute('onclick')||'').includes("'movimentacao'"));if(nav)nav.remove();
 const form=d.getElementById('box-form-mov');if(!form)return;
 const wrap=d.createElement('div');wrap.id='hsj-drawer-wrap';
 wrap.innerHTML='<section id="hsj-drawer" role="dialog" aria-modal="true"><header id="hsj-drawer-head"><div><strong id="hsj-bed-title" style="font-size:20px;color:#0f2747">Gerenciar leito</strong><div id="hsj-bed-desc" style="font-size:13px;color:#64748b"></div></div><button type="button" class="btn" id="hsj-bed-close">Fechar ✕</button></header><div id="hsj-drawer-body"></div></section>';
 d.body.appendChild(wrap);
 // Manter o formulário original no painel, com todos os eventos já conectados.
 d.getElementById('hsj-drawer-body').appendChild(form);
 // A mensagem fica fora do corpo para que um CSS que esconda o corpo não deixe a janela vazia.
 const aviso=d.createElement('div');aviso.id='hsj-drawer-diagnostico';
 aviso.style.cssText='display:none;padding:12px 18px;color:#9a3412;background:#fff7ed;border-bottom:1px solid #fed7aa;font-size:13px';
 aviso.textContent='O formulário não está visível. Tente fechar e reabrir esta janela. Nenhuma movimentação foi realizada.';
 d.getElementById('hsj-drawer-head').after(aviso);
 // Recupera o formulário quando estilos de outras abas o ocultam.
 function restaurarFormulario(){
   const body=d.getElementById('hsj-drawer-body');
   const formulario=d.getElementById('box-form-mov');
   if(!body||!formulario)return;
   if(formulario.parentElement!==body)body.appendChild(formulario);
   formulario.style.setProperty('display','block','important');
   formulario.style.setProperty('visibility','visible','important');
   formulario.style.setProperty('opacity','1','important');
   body.style.setProperty('display','block','important');
   body.style.setProperty('visibility','visible','important');
   body.style.setProperty('min-height','250px');
 }
 restaurarFormulario();
 // Reparação defensiva: outros módulos podem mover ou ocultar o formulário depois da abertura.
 // Não altera ocupação, reserva ou dados armazenados.
 function garantirConteudoVisivel(){
   if(wrap.style.display!=='flex')return;
   const body=d.getElementById('hsj-drawer-body');
   const formulario=d.getElementById('box-form-mov');
   if(!body||!formulario)return;
   restaurarFormulario();
   // Alguns estilos globais escondem descendentes do painel com regras !important.
   // Forçar toda a cadeia visual, sem alterar qualquer dado hospitalar.
   [wrap,d.getElementById('hsj-drawer'),body,formulario].filter(Boolean).forEach(el=>{
     el.style.setProperty('visibility','visible','important');
     el.style.setProperty('opacity','1','important');
   });
   body.style.setProperty('display','block','important');
   body.style.setProperty('height','auto','important');
   body.style.setProperty('overflow','visible','important');
   formulario.style.setProperty('display','block','important');
   formulario.style.setProperty('position','relative','important');
   formulario.style.setProperty('height','auto','important');
   formulario.style.setProperty('max-height','none','important');
   formulario.style.setProperty('overflow','visible','important');
   formulario.querySelectorAll('.form-grid,.form-group,h3,button').forEach(el=>{
     el.style.setProperty('visibility','visible','important');
     el.style.setProperty('opacity','1','important');
   });
   const grid=formulario.querySelector('.form-grid');
   if(grid)grid.style.setProperty('display','grid','important');
   // Corrige a ocultação causada por regras em elementos ancestrais do formulário.
   let pai=formulario.parentElement;
   while(pai&&pai!==d.body){
     if(pai!==wrap){
       pai.style.setProperty('visibility','visible','important');
       pai.style.setProperty('opacity','1','important');
       if(pai===body)pai.style.setProperty('display','block','important');
     }
     pai=pai.parentElement;
   }
   const aviso=d.getElementById('hsj-drawer-diagnostico');
   if(aviso)aviso.style.display=(formulario.getClientRects().length===0||formulario.getBoundingClientRect().height<50)?'block':'none';
   const warning=d.getElementById('hsj-drawer-recovery-warning');
   if(!formulario.querySelector('#mov-acao')||!formulario.querySelector('#mov-leito')){
     if(!warning){
       const p=d.createElement('p');p.id='hsj-drawer-recovery-warning';
       p.style.cssText='padding:12px;background:#fef2f2;color:#991b1b;border:1px solid #fecaca';
       p.textContent='O formulário de gerenciamento não foi encontrado. Feche esta janela e atualize a página. Nenhuma operação foi executada.';
       body.prepend(p);
     }
   }else if(warning)warning.remove();
   const botoes=['hsj-forward-transfer','hsj-save-patient-drawer'];
   botoes.forEach(id=>{const el=d.getElementById(id);if(el&&el.parentElement!==body)body.prepend(el);});
   const hist=[...body.querySelectorAll('button')].find(el=>el.textContent==='Ver histórico do leito');
   if(hist)hist.style.setProperty('display','inline-block','important');
 }
 setInterval(garantirConteudoVisivel,450);

 // Recuperação do formulário quando regras legadas deixam os campos invisíveis.
 const cssFix=d.createElement('style');
 cssFix.id='hsj-drawer-visibility-20261026';
 cssFix.textContent='#hsj-drawer-wrap[style*="flex"] #hsj-drawer-body,#hsj-drawer-wrap[style*="flex"] #box-form-mov{display:block!important;visibility:visible!important;opacity:1!important;content-visibility:visible!important;min-height:180px!important;height:auto!important;max-height:none!important;overflow:visible!important}#hsj-drawer-wrap[style*="flex"] #box-form-mov>.form-grid{display:grid!important;visibility:visible!important;opacity:1!important}#hsj-drawer-wrap[style*="flex"] #box-form-mov>h3{display:block!important;visibility:visible!important}#hsj-drawer-wrap[style*="flex"] #box-form-mov .form-grid>.form-group{display:block!important;visibility:visible!important;opacity:1!important}#hsj-drawer-wrap[style*="flex"] #box-form-mov .form-group label,#hsj-drawer-wrap[style*="flex"] #box-form-mov .form-group input:not([type="hidden"]),#hsj-drawer-wrap[style*="flex"] #box-form-mov .form-group select{visibility:visible!important;opacity:1!important}';
 d.head.appendChild(cssFix);
 function checarJanela(){
   if(wrap.style.display!=='flex')return;
   const body=d.getElementById('hsj-drawer-body'),f=d.getElementById('box-form-mov');
   if(!body||!f)return;
   if(f.parentElement!==body)body.appendChild(f);
   const setor=d.getElementById('mov-setor'),leito=d.getElementById('mov-leito');
   const campos=[setor,leito,d.getElementById('mov-acao')].filter(Boolean);
   const visiveis=campos.filter(e=>e.getClientRects().length&&e.getBoundingClientRect().height>8&&w.getComputedStyle(e).visibility!=='hidden');
   let aviso=d.getElementById('hsj-drawer-erro-visual');
   if(visiveis.length===campos.length&&campos.length===3){if(aviso)aviso.remove();return;}
   if(!aviso){
     aviso=d.createElement('div');aviso.id='hsj-drawer-erro-visual';
     aviso.style.cssText='display:block!important;background:#fff7ed;color:#9a3412;padding:14px;border:1px solid #fdba74;border-radius:8px;margin:12px 0;position:relative;z-index:10';
     aviso.textContent='O formulário de movimentação não carregou corretamente. Nenhuma alteração foi feita no leito. Feche e atualize o aplicativo.';
     body.prepend(aviso);
   }
   f.style.setProperty('display','block','important');
   f.style.setProperty('content-visibility','visible','important');
   f.style.setProperty('visibility','visible','important');
   const grid=f.querySelector('.form-grid');if(grid)grid.style.setProperty('display','grid','important');
 }
 setInterval(checarJanela,700);
 // Repara também quando outro script altera o conteúdo sem modificar o estilo da janela.
 const observerConteudo=new MutationObserver(()=>{if(wrap.style.display==='flex')garantirConteudoVisivel();});
 observerConteudo.observe(d.body,{childList:true,subtree:false});
 const observerForm=new MutationObserver(()=>{
   if(wrap.style.display==='flex'){
     const el=d.getElementById('box-form-mov');
     if(el&&el.parentElement!==d.getElementById('hsj-drawer-body'))restaurarFormulario();
     else if(el&&getComputedStyle(el).display==='none')restaurarFormulario();
   }
 });
 observerForm.observe(wrap,{attributes:true,attributeFilter:['style']});

 const fechar=()=>wrap.style.display='none';d.getElementById('hsj-bed-close').onclick=fechar;
 wrap.addEventListener('click',e=>{if(e.target===wrap)fechar()});
 d.addEventListener('keydown',e=>{if(e.key==='Escape')fechar()});

 const encaminhar=d.createElement('button');encaminhar.type='button';encaminhar.className='btn';encaminhar.id='hsj-forward-transfer';encaminhar.textContent='↗ Encaminhar para Transferências';encaminhar.style.cssText='margin:0 0 14px 10px;background:#0e7490;color:#fff';
 d.getElementById('hsj-drawer-body').prepend(encaminhar);
 encaminhar.onclick=()=>{
  const val=id=>d.getElementById(id)?.value?.trim()||'';
  const pr=val('mov-atendimento'),nome=val('mov-paciente'),nascimento=val('mov-nascimento');
  if(!pr||!nome){w.alert('Informe o prontuário e o nome do paciente antes de encaminhar para Transferências.');return}
  const exists=(Array.isArray(w.transferenciasAtivas)?w.transferenciasAtivas:[]).some(t=>String(t.atendimento||'')===pr);
  if(exists&&!w.confirm('Já existe solicitação ativa para este prontuário. Deseja abrir Transferências para acompanhar ou consultar antes de criar outra?'))return;
  const map={'transf-atendimento':pr,'transf-paciente':nome,'transf-nascimento':nascimento,'transf-sexo':val('mov-sexo'),'transf-perfil':val('mov-perfil-vaga')};
  Object.entries(map).forEach(([id,value])=>{const element=d.getElementById(id);if(element&&value)element.value=value});
  fechar();
  const el=[...d.querySelectorAll('.subnav .nav-item')].find(x=>(x.getAttribute('onclick')||'').includes("'transferencias'"));
  if(typeof w.switchTab==='function')w.switchTab('transferencias',el);
  const trans=d.getElementById('transferencias');
  const formTrans=trans?.querySelector('.notes-box');
  if(formTrans){formTrans.style.display='block';const btn=d.getElementById('hsj-new-trans');if(btn)btn.textContent='Fechar cadastro'}
  const hint=d.getElementById('hsj-transfer-forward-hint')||d.createElement('div');
  hint.id='hsj-transfer-forward-hint';hint.style.cssText='padding:10px 14px;margin-bottom:12px;border:1px solid #bae6fd;border-radius:9px;background:#f0f9ff;color:#075985;font-size:13px';
  hint.textContent='Dados de '+nome+' preenchidos a partir do Painel de Leitos. Confira destino, status e pendências e clique em Salvar e Registrar Solicitação para confirmar. Nenhuma transferência foi criada automaticamente.';
  formTrans?.prepend(hint);formTrans?.scrollIntoView({block:'start',behavior:'smooth'});
 };
 const oldOpen=w.abrirHistoricoPacienteLeito;
 const btnHist=d.createElement('button');btnHist.className='btn';btnHist.type='button';btnHist.textContent='Ver histórico do leito';btnHist.style.marginBottom='14px';
 d.getElementById('hsj-drawer-body').prepend(btnHist);
 btnHist.onclick=()=>{const a=d.getElementById('mov-setor').value,b=d.getElementById('mov-leito').value;fechar();if(typeof oldOpen==='function')oldOpen.call(w,a,b)};
 w.abrirHistoricoPacienteLeito=function(setor,numero){
   const s=w.setoresData.find(x=>x.nome===setor),l=s?.leitos.find(x=>String(x.n)===String(numero));
   if(!l){w.alert('Leito indisponível; atualize o painel.');return}
   if(w.usuarioAtual?.perfil==='Visitante'){if(typeof oldOpen==='function')oldOpen.call(w,setor,numero);return}
   const set=(id,v)=>{const e=d.getElementById(id);if(e)e.value=v??''};
   ['mov-atendimento','mov-paciente','mov-nascimento','mov-sexo','mov-convenio','mov-origem','mov-perfil-vaga','mov-precaucao','mov-previsao-alta-paciente'].forEach(id=>set(id,''));
   set('mov-setor',setor);if(typeof w.atualizarSelectLeitosMov==='function')w.atualizarSelectLeitosMov();set('mov-leito',numero);
   if(typeof w.ajustarPerfilPorSetor==='function')w.ajustarPerfilPorSetor(setor);
   const b=w.basePacientesCadastrados?.[l.prontuario]||{};
   set('mov-atendimento',l.prontuario||'');set('mov-paciente',l.paciente||b.nome||'');
   set('mov-nascimento',b.nascimento);set('mov-sexo',b.sexo);set('mov-convenio',b.convenio);set('mov-origem',b.origem);
   set('mov-perfil-vaga',b.perfil);set('mov-precaucao',b.precaucao);set('mov-previsao-alta-paciente',b.previsaoAlta);
   set('mov-acao',l.status==='disponivel'?'Admissão':'');
   d.getElementById('mov-acao')?.dispatchEvent(new w.Event('change',{bubbles:true}));
   d.getElementById('hsj-bed-title').textContent='Leito '+numero+' · '+setor;
   d.getElementById('hsj-bed-desc').textContent='Status atual: '+l.status+(l.paciente?' | Paciente: '+l.paciente:'')+'. Salve somente após conferir os dados.';
   restaurarFormulario();
   wrap.style.display='flex';
   garantirConteudoVisivel();
   setTimeout(garantirConteudoVisivel,80);
   setTimeout(garantirConteudoVisivel,350);
 };

 // Ações de gerenciamento: contexto por status e remoção de duplicidades de interface.
 function organizarAcoes(){
   const body=d.getElementById('hsj-drawer-body'),form=d.getElementById('box-form-mov');
   if(!body||!form)return;
   const setor=d.getElementById('mov-setor')?.value;
   const numero=d.getElementById('mov-leito')?.value;
   const leito=w.setoresData?.find(s=>s.nome===setor)?.leitos?.find(l=>String(l.n)===String(numero));
   const status=leito?.status||'';
   const salvar=d.getElementById('hsj-save-patient-drawer');
   const reserva=d.getElementById('hsj-confirmar-reserva-admissao');
   if(salvar){
      const autorizado=['ocupado','reservado'].includes(status);
      salvar.style.setProperty('display',autorizado?'inline-block':'none','important');
      salvar.title=autorizado?'Atualiza somente cadastro já vinculado ao leito':'Disponível apenas para leitos ocupados ou reservados';
   }
   if(reserva){
      const pode=status==='reservado'&&/^RESERVA-SEM-PR-/i.test(String(leito?.prontuario||''));
      reserva.style.setProperty('display',pode?'inline-block':'none','important');
   }
   const existentes=new Set();
   [...body.querySelectorAll('button')].forEach(b=>{
      const label=(b.textContent||'').trim().replace(/^[↗\\s]+/,'').toLowerCase();
      if(label==='ver histórico do leito'||label==='encaminhar para transferências'){
        if(existentes.has(label))b.style.setProperty('display','none','important');
        else{existentes.add(label);b.style.removeProperty('display');}
      }
   });
   let info=d.getElementById('hsj-salvamento-orientacao');
   if(!info){info=d.createElement('p');info.id='hsj-salvamento-orientacao';info.style.cssText='font-size:13px;color:#075985;background:#eff6ff;border:1px solid #bfdbfe;border-radius:7px;padding:10px;margin:0 0 12px';form.prepend(info);}
   const ac=d.getElementById('mov-acao')?.value||'';
   info.textContent=status==='disponivel'&&ac==='Admissão'
     ? 'Leito disponível: para cadastrar e ocupar este leito, utilize Salvar / Executar. O botão Salvar alterações do paciente serve apenas para cadastros de leitos já ocupados ou reservados.'
     : status==='reservado'?'Leito reservado: confirme os dados e use a rotina correspondente à sua reserva.':'Selecione a ação operacional e utilize Salvar / Executar para registrar a movimentação.';
 }
 const oldOrganizarOpen=w.abrirHistoricoPacienteLeito;
 w.abrirHistoricoPacienteLeito=function(){const ret=oldOrganizarOpen.apply(this,arguments);organizarAcoes();return ret};
 d.getElementById('mov-acao')?.addEventListener('change',organizarAcoes);
 setInterval(()=>{if(wrap.style.display==='flex')organizarAcoes()},1500);
 // Bloqueio/alta/transferência usam as funções nativas e protegidas já instaladas.
 const transfer=d.getElementById('transferencias'),tbody=d.getElementById('tabela-transf-ativas');
 if(transfer&&tbody){
  const formTrans=transfer.querySelector('.notes-box');
  const tools=d.createElement('div');tools.id='hsj-trans-tools';
  tools.innerHTML='<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap"><strong style="font-size:18px;color:#0f2747">Transferências em andamento</strong><button class="btn btn-success" type="button" id="hsj-new-trans">+ Nova solicitação</button></div><div id="hsj-trans-kpis" style="display:flex;gap:10px;flex-wrap:wrap;margin:14px 0"></div><div style="display:flex;gap:8px;flex-wrap:wrap"><input id="hsj-trans-query" placeholder="Paciente, prontuário ou destino" style="flex:2;min-width:175px"><select id="hsj-trans-filter" style="flex:1;min-width:155px"><option value="">Todos os status</option><option>Solicitação Pendente</option><option>Vaga Solicitada</option><option>Vaga Liberada</option></select><button type="button" class="btn" id="hsj-trans-reset">Limpar</button></div><small id="hsj-trans-result" style="color:#64748b"></small>';
  transfer.querySelector('.page-header')?.after(tools);
  if(formTrans){formTrans.style.display='none';d.getElementById('hsj-new-trans').onclick=()=>{const show=formTrans.style.display==='none';formTrans.style.display=show?'block':'none';d.getElementById('hsj-new-trans').textContent=show?'Fechar cadastro':'+ Nova solicitação';if(show)formTrans.scrollIntoView({block:'nearest',behavior:'smooth'})}}
  const finished=d.getElementById('tabela-transf-finalizadas')?.closest('.table-container');
  if(finished){const b=d.createElement('button');b.className='btn';b.type='button';b.textContent='Ver / ocultar transferências finalizadas';b.style.margin='12px 0';finished.before(b);finished.style.display='none';b.onclick=()=>finished.style.display=finished.style.display==='none'?'block':'none'}
  const atualizar=()=>{
   const list=Array.isArray(w.transferenciasAtivas)?w.transferenciasAtivas:[];
   const query=(d.getElementById('hsj-trans-query').value||'').toLowerCase().trim(),status=d.getElementById('hsj-trans-filter').value;
   let count=0;
   [...tbody.querySelectorAll('tr')].forEach((tr,i)=>{
      const t=list[i];if(!t)return;
      const hay=[t.paciente,t.atendimento,t.destino,t.perfil,t.pendencias].join(' ').toLowerCase();
      const visible=(!query||hay.includes(query))&&(!status||t.status===status);
      tr.style.display=visible?'':'none';if(visible)count++;
      if(!tr.querySelector('.hsj-elapsed')&&t.dataIso){const dt=new Date(t.dataIso);if(!isNaN(dt)){const days=Math.max(0,Math.floor((Date.now()-dt)/86400000));const x=d.createElement('small');x.className='hsj-elapsed';x.style.cssText='display:block;color:#64748b';x.textContent=days?'Há '+days+' dia(s)':'Hoje';tr.cells[0]?.appendChild(x)}}
   });
   const num=st=>list.filter(x=>x.status===st).length;
   d.getElementById('hsj-trans-kpis').innerHTML=[['Ativas',list.length],['Pendentes',num('Solicitação Pendente')],['Vaga solicitada',num('Vaga Solicitada')],['Vaga liberada',num('Vaga Liberada')]].map(([x,n])=>'<div class="hsj-kpi"><strong>'+n+'</strong><small>'+x+'</small></div>').join('');
   d.getElementById('hsj-trans-result').textContent='Exibindo '+count+' de '+list.length+' solicitações ativas';
  };
  d.getElementById('hsj-trans-query').oninput=atualizar;d.getElementById('hsj-trans-filter').onchange=atualizar;
  d.getElementById('hsj-trans-reset').onclick=()=>{d.getElementById('hsj-trans-query').value='';d.getElementById('hsj-trans-filter').value='';atualizar()};
  const oldRender=w.atualizarTabelasTransferencias;
  if(typeof oldRender==='function')w.atualizarTabelasTransferencias=function(){const r=oldRender.apply(this,arguments);atualizar();return r};
  const oldSwitch=w.switchTab;
  if(typeof oldSwitch==='function')w.switchTab=function(tab,element){if(tab==='movimentacao')return oldSwitch.call(this,'painel',d.querySelector('.subnav .nav-item'));const r=oldSwitch.apply(this,arguments);if(tab==='transferencias')atualizar();return r};
  atualizar();
 }
}catch(e){console.error('Interface HSJ (sem alteração de dados):',e)}
}
frame.addEventListener('load',()=>{didInit=false;init()});
init();let tries=0;const interval=setInterval(()=>{init();if(didInit||++tries>=80)clearInterval(interval)},250);
})();
/* Recuperação isolada do painel: mantém formulário original e suas funções de gravação. */
(()=>{
 const frame=document.getElementById('appFrame');if(!frame)return;
 function recuperar(){
  let w,d;try{w=frame.contentWindow;d=frame.contentDocument}catch(_){return false}
  if(!w||!d||!Array.isArray(w.setoresData)||typeof w.abrirHistoricoPacienteLeito!=='function')return false;
  if(w.__hsjDrawerRescueReady)return true;
  const wrap=d.getElementById('hsj-drawer-wrap'),body=d.getElementById('hsj-drawer-body');
  const form=d.getElementById('box-form-mov');
  if(!wrap||!body||!form)return false;
  w.__hsjDrawerRescueReady=true;
  const abrirAnterior=w.abrirHistoricoPacienteLeito;
  const ajustar=()=>{
   if(form.parentElement!==body)body.appendChild(form);
   for(const e of [body,form]){
     e.style.setProperty('display','block','important');
     e.style.setProperty('visibility','visible','important');
     e.style.setProperty('opacity','1','important');
     e.style.setProperty('height','auto','important');
   }
   const grade=form.querySelector('.form-grid');
   if(grade)grade.style.setProperty('display','grid','important');
  };
  const abrir=(setor,leito)=>{
   const s=w.setoresData.find(x=>x.nome===setor);
   const l=s?.leitos?.find(x=>String(x.n)===String(leito));
   if(!l){w.alert('Leito não encontrado. Atualize o painel.');return}
   if(w.usuarioAtual?.perfil==='Visitante'){abrirAnterior.call(w,setor,leito);return}
   ajustar();
   const set=(id,val)=>{const el=d.getElementById(id);if(el)el.value=val??''};
   set('mov-setor',setor);
   if(typeof w.atualizarSelectLeitosMov==='function')w.atualizarSelectLeitosMov();
   set('mov-leito',leito);
   const base=w.basePacientesCadastrados?.[l.prontuario]||{};
   ['mov-atendimento','mov-paciente','mov-nascimento','mov-sexo','mov-perfil-vaga','mov-convenio','mov-origem','mov-precaucao','mov-previsao-alta-paciente'].forEach(id=>set(id,''));
   set('mov-atendimento',l.prontuario||'');
   set('mov-paciente',l.paciente||base.nome||'');
   for(const [id,key] of [['mov-nascimento','nascimento'],['mov-sexo','sexo'],['mov-perfil-vaga','perfil'],['mov-convenio','convenio'],['mov-origem','origem'],['mov-precaucao','precaucao'],['mov-previsao-alta-paciente','previsaoAlta']])set(id,base[key]||'');
   set('mov-acao','');
   const title=d.getElementById('hsj-bed-title');
   if(title)title.textContent='Leito '+leito+' · '+setor;
   const desc=d.getElementById('hsj-bed-desc');
   if(desc)desc.textContent='Status: '+l.status+(l.paciente?' | Paciente: '+l.paciente:'');
   let btn=d.getElementById('hsj-rescue-history');
   if(!btn){
     btn=d.createElement('button');btn.type='button';btn.id='hsj-rescue-history';btn.className='btn';
     btn.textContent='Ver histórico do leito';btn.style.cssText='display:inline-block;margin:0 0 12px;background:#0284c7;color:white;padding:10px;border-radius:7px';
     body.prepend(btn);
   }
   btn.onclick=()=>{wrap.style.display='none';abrirAnterior.call(w,setor,leito)};
   wrap.style.display='flex';
   ajustar();
  };
  w.abrirHistoricoPacienteLeito=abrir;
  // O botão de fechar funciona mesmo quando a inicialização anterior falhou.
  const fechar=d.getElementById('hsj-bed-close');if(fechar)fechar.onclick=()=>wrap.style.display='none';
  const timer=setInterval(()=>{if(wrap.style.display==='flex')ajustar()},600);
  frame.addEventListener('load',()=>clearInterval(timer),{once:true});
  return true;
 }
 function iniciar(){
  let n=0;const t=setInterval(()=>{if(recuperar()||++n>100)clearInterval(t)},200);
  recuperar();
 }
 frame.addEventListener('load',iniciar);iniciar();
})();

;
;/* FILE: patch-plantao-pacientes-20261013.js */
(()=>{
const frame=document.getElementById('appFrame');if(!frame)return;
let initialized=false;
function start(){
if(initialized)return;
let w,d;try{w=frame.contentWindow;d=frame.contentDocument;}catch(_){return}
if(!w||!d||!d.getElementById('plantao')||!Array.isArray(w.setoresData)||typeof w.atualizarTabelaPacientesInternos!=='function')return;
initialized=true;
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const nav=[...d.querySelectorAll('.subnav .nav-item')].find(x=>(x.getAttribute('onclick')||'').includes("'movimentacao'"));if(nav)nav.remove();
const css=d.createElement('style');css.textContent='#movimentacao{display:none!important}#hsj-pendentes-plantao{margin:16px 0;padding:16px;background:#fff;border:1px solid #dbe4f0;border-left:4px solid #0e7490;border-radius:10px}#hsj-pendentes-plantao table{width:100%;border-collapse:collapse;font-size:13px}#hsj-pendentes-plantao td,#hsj-pendentes-plantao th{padding:10px;border-bottom:1px solid #e2e8f0;text-align:left}#hsj-internal-move{position:fixed;inset:0;background:#10203899;z-index:100005;display:none;align-items:center;justify-content:center;padding:15px}#hsj-internal-move>section{width:min(520px,100%);background:#fff;border-radius:12px;padding:20px;max-height:85vh;overflow:auto}#hsj-internal-move label{display:block;font-weight:600;margin:12px 0 5px}#hsj-internal-move select{width:100%;padding:10px;border:1px solid #cbd5e1;border-radius:8px}#tabela-pacientes-internos .hsj-bed-action{font-size:12px;padding:6px 9px;margin-top:6px;background:#0e7490;color:white}';d.head.appendChild(css);
const p=d.getElementById('plantao');const block=d.createElement('section');block.id='hsj-pendentes-plantao';p.querySelector('.page-header')?.after(block);
function pending(){
const items=Array.isArray(w.transferenciasAtivas)?w.transferenciasAtivas:[];
const rows=items.map(t=>'<tr><td><strong>'+esc(t.paciente)+'</strong><div style="font-size:12px;color:#64748b">Pront. '+esc(t.atendimento)+'</div></td><td>'+esc(t.destino)+'</td><td>'+esc(t.status)+'</td><td>'+esc(t.pendencias||'Sem pendências registradas')+'</td><td>'+esc(t.dusv||'-')+'</td></tr>').join('');
block.innerHTML='<h3 style="font-size:17px;margin:0 0 6px;color:#0f2747">Transferências pendentes / em andamento ('+items.length+')</h3><p style="font-size:12px;color:#64748b;margin:0 0 12px">Atualizado automaticamente a partir das solicitações ativas da aba Transferências.</p>'+(items.length?'<div style="overflow:auto"><table><thead><tr><th>Paciente</th><th>Destino</th><th>Situação</th><th>Pendências</th><th>DUSV</th></tr></thead><tbody>'+rows+'</tbody></table></div>':'<p>Nenhuma transferência pendente no momento.</p>');
}
const modal=d.createElement('div');modal.id='hsj-internal-move';modal.innerHTML='<section role="dialog" aria-modal="true"><h3 id="hsj-moving-title" style="margin:0">Mudar leito</h3><p id="hsj-moving-current" style="color:#64748b"></p><label for="hsj-dest-sector">Setor de destino</label><select id="hsj-dest-sector"></select><label for="hsj-dest-bed">Leito disponível</label><select id="hsj-dest-bed"></select><div style="display:flex;gap:10px;margin-top:20px"><button type="button" class="btn btn-success" id="hsj-confirm-move">Confirmar transferência</button><button type="button" class="btn" id="hsj-cancel-move">Cancelar</button></div><p id="hsj-move-info" style="font-size:12px;color:#64748b;margin-top:10px">A alteração será confirmada no banco central antes de ser considerada concluída.</p></section>';d.body.appendChild(modal);
const sector=d.getElementById('hsj-dest-sector'), bed=d.getElementById('hsj-dest-bed');let current=null;
const close=()=>{modal.style.display='none';current=null};d.getElementById('hsj-cancel-move').onclick=close;modal.addEventListener('click',e=>{if(e.target===modal)close()});
const available=()=>{const s=w.setoresData.find(x=>x.nome===sector.value);bed.innerHTML='';(s?.leitos||[]).filter(l=>l.status==='disponivel').forEach(l=>{const opt=d.createElement('option');opt.value=l.n;opt.textContent='Leito '+l.n;bed.appendChild(opt)});if(!bed.options.length)bed.add(new Option('Nenhum leito disponível',''))};
sector.onchange=available;
function changeBed(setor,numero){
const s=w.setoresData.find(x=>x.nome===setor),l=s?.leitos.find(x=>String(x.n)===String(numero));
if(!l||l.status!=='ocupado'||!l.prontuario){w.alert('Mudança disponível somente para paciente com leito ocupado e prontuário identificado.');return}
if(w.usuarioAtual?.perfil==='Visitante'){w.alert('Perfil sem permissão para movimentação.');return}
current={pr:l.prontuario,setor,numero,paciente:l.paciente};
d.getElementById('hsj-moving-title').textContent='Mudar leito · '+l.paciente;
d.getElementById('hsj-moving-current').textContent='Origem: '+setor+' · Leito '+numero+' · Prontuário '+l.prontuario;
sector.innerHTML='';w.setoresData.filter(x=>x.leitos.some(b=>b.status==='disponivel')).forEach(x=>sector.add(new Option(x.nome,x.nome)));available();modal.style.display='flex';
}
d.getElementById('hsj-confirm-move').onclick=async()=>{
if(!current||!sector.value||!bed.value){w.alert('Escolha um destino disponível.');return}
if(!w.confirm('Confirmar transferência de '+current.paciente+' para '+sector.value+' / Leito '+bed.value+'?'))return;
const btn=d.getElementById('hsj-confirm-move');btn.disabled=true;
try{
if(typeof w.executarTransferenciaSeguraV20261009!=='function')throw Error('Rotina transacional indisponível.');
const contabilizarIndicadores=w.confirm('Computar esta transferência interna nos indicadores hospitalares?\nOK = Sim | Cancelar = Não (a transferência prossegue).');
await w.executarTransferenciaSeguraV20261009({pr:current.pr,setorDestino:sector.value,leitoDestino:bed.value,contabilizarIndicadores,usuario:w.usuarioAtual?.nome||'usuario'});
close();if(typeof w.carregarDadosDoFirebase==='function')await w.carregarDadosDoFirebase();
if(typeof w.renderizarPainelLeitos==='function')w.renderizarPainelLeitos();
if(typeof w.atualizarTabelaPacientesInternos==='function')w.atualizarTabelaPacientesInternos();
w.alert('Transferência confirmada no banco central.');
}catch(e){w.alert('Transferência não confirmada: '+(e?.message||e)+'\nVerifique o estado do leito antes de tentar novamente.')}finally{btn.disabled=false}
};
function actions(){
const body=d.getElementById('tabela-pacientes-internos');if(!body)return;
const occupied=[];
w.setoresData.forEach(s=>s.leitos.forEach(l=>{if(l.status==='ocupado'||l.status==='reservado')occupied.push({setor:s.nome,leito:l.n,status:l.status})}));
const th=body.closest('table')?.querySelector('thead tr');if(th&&!th.querySelector('.hsj-actions-th')){const col=d.createElement('th');col.className='hsj-actions-th';col.textContent='Mudança de leito';th.appendChild(col)}
[...body.querySelectorAll('tr')].forEach((tr,i)=>{
if(tr.querySelector('.hsj-move-cell'))return;
const x=occupied[i];if(!x)return;const td=d.createElement('td');td.className='hsj-move-cell';
if(x.status==='ocupado'){const btn=d.createElement('button');btn.type='button';btn.className='btn hsj-bed-action';btn.textContent='Alterar leito';btn.onclick=()=>changeBed(x.setor,x.leito);td.appendChild(btn)}else td.textContent='Reservado';
tr.appendChild(td);
});
}
const oldList=w.atualizarTabelaPacientesInternos;
w.atualizarTabelaPacientesInternos=function(){const r=oldList.apply(this,arguments);actions();return r};
const oldShift=w.atualizarResumoPlantao;
if(typeof oldShift==='function')w.atualizarResumoPlantao=function(){const r=oldShift.apply(this,arguments);pending();return r};
const oldTrans=w.atualizarTabelasTransferencias;
if(typeof oldTrans==='function')w.atualizarTabelasTransferencias=function(){const r=oldTrans.apply(this,arguments);pending();return r};
const oldSwitch=w.switchTab;
if(typeof oldSwitch==='function')w.switchTab=function(tab,element){
if(tab==='movimentacao'){tab='painel';element=[...d.querySelectorAll('.subnav .nav-item')].find(x=>(x.getAttribute('onclick')||'').includes("'painel'"))}
const res=oldSwitch.call(this,tab,element);if(tab==='plantao')pending();if(tab==='pacientes-internos')actions();return res;
};
if(d.getElementById('movimentacao')?.classList.contains('active'))w.switchTab('painel',d.querySelector('.subnav .nav-item'));
pending();w.atualizarTabelaPacientesInternos();
}
frame.addEventListener('load',()=>{initialized=false;start()});start();let n=0;const timer=setInterval(()=>{start();if(initialized||++n>80)clearInterval(timer)},250);
})();
;
;/* FILE: patch-persistencia-pacientes-transferencias-20261013.js */
(()=>{
const frame=document.getElementById('appFrame');if(!frame)return;
let timer;
function init(){
 let w,d;try{w=frame.contentWindow;d=frame.contentDocument}catch(_){return false}
 if(!w||!d||typeof w.hsjSalvarEdicaoPacienteSegura!=='function'||typeof w.hsjCriarTransferenciaPendenteSegura!=='function')return false;
 const btn=d.getElementById('hsj-encaminhamento-real-v6'),edit=d.getElementById('edit-sexo-v3');
 if(!btn||!edit)return false;
 if(btn.dataset.hsjPersistence==='on')return true;btn.dataset.hsjPersistence='on';
 const val=id=>String(d.getElementById(id)?.value||'').trim();
 const locate=pr=>{for(const s of w.setoresData||[])for(const l of s.leitos||[])if(String(l.prontuario||'')===pr)return {s,l};return null};
 let saving=false;
 w.salvarEdicaoPaciente=async function(){
  if(saving)return;saving=true;
  try{
   const oldPr=val('edit-prontuario'),pr=val('edit-prontuario-vis-v3')||oldPr;
   if(pr!==oldPr)throw Error('Alteração do número de prontuário exige rotina específica. Nenhuma mudança foi realizada.');
   const loc=locate(pr);if(!loc)throw Error('Paciente não localizado em um único leito ativo.');
   const nome=val('edit-nome');if(!nome)throw Error('Informe o nome do paciente.');
   const result=await w.hsjSalvarEdicaoPacienteSegura({
    pr,nome,nascimento:val('edit-nasc'),sexo:val('edit-sexo-v3'),perfil:val('edit-perfil'),
    convenio:val('edit-convenio-v3'),precaucao:val('edit-precaucao-v3'),origem:val('edit-origem-v3'),
    previsaoAlta:val('edit-previsao-alta-v14'),expectedSetor:loc.s.nome,expectedLeito:loc.l.n,
    expectedNome:loc.l.paciente,usuario:w.usuarioAtual?.nome||'usuario'
   });
   if(!result?.ok)throw Error('O banco não confirmou a alteração.');
   d.getElementById('modal-editar-paciente').style.display='none';
   w.alert('Alteração gravada no banco central. Ela permanecerá após atualizar a página.');
  }catch(e){w.alert('Alteração NÃO confirmada: '+(e?.message||e)+'\nConfira a conexão e atualize o painel antes de tentar novamente.')}
  finally{saving=false}
 };
 btn.onclick=async()=>{
  if(w.usuarioAtual?.perfil==='Visitante'){w.alert('Perfil sem permissão.');return}
  const pr=val('edit-prontuario-vis-v3')||val('edit-prontuario'),nome=val('edit-nome');
  if(!pr||!nome){w.alert('Informe prontuário e nome do paciente.');return}
  if(!w.confirm('Criar solicitação PENDENTE para '+nome+' e encaminhar à aba Transferências?\nO destino ficará A definir até ser preenchido.'))return;
  btn.disabled=true;
  try{
   const result=await w.hsjCriarTransferenciaPendenteSegura({pr,nome,usuario:w.usuarioAtual?.nome||'usuario'});
   if(!result?.ok)throw Error('Banco não confirmou a solicitação.');
   // Somente navegar depois que a transação do servidor confirmar.
   d.getElementById('modal-editar-paciente').style.display='none';
   const tab=[...d.querySelectorAll('.subnav .nav-item')].find(e=>(e.getAttribute('onclick')||'').includes("'transferencias'"));
   if(typeof w.switchTab==='function')w.switchTab('transferencias',tab);
   w.alert(result.jaExistia?'Solicitação já existente no banco central.':'Solicitação pendente gravada no banco central. Ela permanecerá após F5. Complete o destino e as pendências na aba Transferências.');
  }catch(e){w.alert('Encaminhamento NÃO gravado: '+(e?.message||e))}
  finally{btn.disabled=false}
 };
 return true;
}
function schedule(){if(timer)clearInterval(timer);let n=0;timer=setInterval(()=>{if(init()||++n>120)clearInterval(timer)},250);init()}
frame.addEventListener('load',schedule);schedule();
})();
;
;/* FILE: patch-mudar-leito-reservado-20261013.js */
(()=>{
 const frame=document.getElementById('appFrame');if(!frame)return;
 let timer;
 function init(){
  let w,d;try{w=frame.contentWindow;d=frame.contentDocument}catch(_){return false}
  if(!w||!d||typeof w.hsjMudarReservaLeitoAtomica!=='function')return false;
  const modal=d.getElementById('modal-editar-paciente');
  if(!modal||!d.getElementById('edit-prontuario'))return false;
  if(d.getElementById('hsj-change-reservation'))return true;
  const button=d.createElement('button');button.id='hsj-change-reservation';button.type='button';button.className='btn';button.textContent='↗ Mudar leito reservado';button.style.cssText='display:none;width:100%;margin:12px 0;padding:12px;background:#0e7490;color:white;border-radius:8px;font-weight:700';
  const action=d.getElementById('atalho-acao-operacional-v4');(action||modal.firstElementChild).appendChild(button);
  const box=d.createElement('div');box.id='hsj-reservation-dialog';box.style.cssText='display:none;position:fixed;inset:0;z-index:100030;background:#0f172a99;align-items:center;justify-content:center;padding:12px';
  box.innerHTML='<section style="background:white;border-radius:12px;width:min(530px,100%);padding:22px;max-height:90vh;overflow:auto"><h3 style="margin-top:0">Mudar leito reservado</h3><p id="hsj-res-origin"></p><label for="hsj-res-sector">Setor de destino</label><select id="hsj-res-sector" style="width:100%;padding:10px;margin:6px 0 12px"></select><label for="hsj-res-bed">Leito disponível</label><select id="hsj-res-bed" style="width:100%;padding:10px;margin:6px 0 18px"></select><div style="display:flex;gap:10px;flex-wrap:wrap"><button id="hsj-res-confirm" class="btn btn-success" type="button">Confirmar mudança</button><button id="hsj-res-cancel" class="btn" type="button">Cancelar</button></div><small>O leito anterior só será liberado quando a nova reserva for confirmada no banco.</small></section>';d.body.appendChild(box);
  const sector=d.getElementById('hsj-res-sector'),bed=d.getElementById('hsj-res-bed');let origin=null;
  const cancel=()=>box.style.display='none';d.getElementById('hsj-res-cancel').onclick=cancel;
  box.addEventListener('click',e=>{if(e.target===box)cancel()});
  function findReservation(){
    const pr=d.getElementById('edit-prontuario')?.value||'';
    for(const s of w.setoresData||[])for(const l of s.leitos||[])if(l.status==='reservado'&&pr&&String(l.prontuario||'')===pr)return {s,l};
    return null;
  }
  function updateButton(){button.style.display=findReservation()&&w.usuarioAtual?.perfil!=='Visitante'?'block':'none'}
  const oldOpen=w.abrirEdicaoPaciente;
  if(typeof oldOpen==='function')w.abrirEdicaoPaciente=function(){const res=oldOpen.apply(this,arguments);setTimeout(updateButton,0);return res};
  button.onclick=()=>{
    origin=findReservation();
    if(!origin){w.alert('A reserva não foi localizada. Atualize o painel.');return}
    d.getElementById('hsj-res-origin').textContent='Paciente: '+(origin.l.paciente||'Não informado')+' | Atual: '+origin.s.nome+' / Leito '+origin.l.n;
    sector.innerHTML='';
    (w.setoresData||[]).filter(s=>s.leitos.some(l=>l.status==='disponivel')).forEach(s=>sector.add(new Option(s.nome,s.nome)));
    const updateBeds=()=>{
      bed.innerHTML='';
      const s=w.setoresData.find(x=>x.nome===sector.value);
      (s?.leitos||[]).filter(l=>l.status==='disponivel').forEach(l=>bed.add(new Option('Leito '+l.n,l.n)));
    };
    sector.onchange=updateBeds;updateBeds();
    box.style.display='flex';
  };
  d.getElementById('hsj-res-confirm').onclick=async()=>{
    if(!origin||!sector.value||!bed.value){w.alert('Escolha um leito disponível.');return}
    if(!w.confirm('Confirmar mudança da reserva de '+origin.s.nome+' / '+origin.l.n+' para '+sector.value+' / '+bed.value+'?'))return;
    const confirm=d.getElementById('hsj-res-confirm');confirm.disabled=true;
    try{
      const result=await w.hsjMudarReservaLeitoAtomica({setorOrigem:origin.s.nome,leitoOrigem:origin.l.n,setorDestino:sector.value,leitoDestino:bed.value,prontuario:origin.l.prontuario||'',paciente:origin.l.paciente||'',usuario:w.usuarioAtual?.nome||'usuario'});
      if(!result?.ok)throw Error('O banco não confirmou a alteração.');
      cancel();modal.style.display='none';w.alert('Reserva alterada e confirmada no banco central.');
    }catch(e){w.alert('Mudança NÃO realizada: '+(e?.message||e)+'\nConfira o painel antes de tentar novamente.')}
    finally{confirm.disabled=false}
  };
  return true;
 }
 function start(){if(timer)clearInterval(timer);let attempts=0;timer=setInterval(()=>{if(init()||++attempts>120)clearInterval(timer)},250);init()}
 frame.addEventListener('load',start);start();
})();
;
;/* FILE: patch-salvar-cadastro-no-leito-20261013.js */
(()=>{
const frame=document.getElementById('appFrame');if(!frame)return;
let timer;
function init(){
let w,d;try{w=frame.contentWindow;d=frame.contentDocument}catch(_){return false}
if(!w||!d||typeof w.hsjSalvarEdicaoPacienteSegura!=='function')return false;
const drawer=d.getElementById('hsj-drawer-body'),form=d.getElementById('box-form-mov');
if(!drawer||!form)return false;
if(d.getElementById('hsj-save-patient-drawer'))return true;
const btn=d.createElement('button');btn.type='button';btn.id='hsj-save-patient-drawer';btn.className='btn btn-success';btn.textContent='Salvar alterações do paciente';btn.style.cssText='background:#0f766e;color:#fff;padding:11px 17px;margin:12px 9px 12px 0;font-weight:700';
const notice=d.createElement('p');notice.style.cssText='font-size:12px;color:#64748b;margin:0 0 10px';notice.textContent='Salva apenas os dados cadastrais no banco central. Não movimenta nem libera o leito.';
const actions=form.querySelector('.btn-success')?.parentElement||form;
actions.appendChild(btn);actions.after(notice);
btn.onclick=async()=>{
 const val=id=>String(d.getElementById(id)?.value||'').trim();
 const sector=val('mov-setor'),number=val('mov-leito'),pr=val('mov-atendimento'),name=val('mov-paciente');
 if(!sector||!number||!pr||!name){w.alert('Para salvar, informe setor, leito, prontuário e nome.');return}
 const s=w.setoresData.find(x=>x.nome===sector),l=s?.leitos.find(x=>String(x.n)===String(number));
 if(!l||!['ocupado','reservado'].includes(l.status)||String(l.prontuario||'')!==pr){
 w.alert('Cadastro não corresponde ao paciente atual desse leito. Não é possível salvar. Atualize o painel.');return}
 if(w.usuarioAtual?.perfil==='Visitante'){w.alert('Sem permissão para editar pacientes.');return}
 btn.disabled=true;btn.textContent='Salvando no banco...';
 try{
  const response=await w.hsjSalvarEdicaoPacienteSegura({pr,nome:name,nascimento:val('mov-nascimento'),
    sexo:val('mov-sexo'),perfil:val('mov-perfil-vaga'),convenio:val('mov-convenio'),
    precaucao:val('mov-precaucao'),origem:val('mov-origem'),
    previsaoAlta:val('mov-previsao-alta-paciente-v14')||val('mov-previsao-alta-paciente'),
    expectedSetor:sector,expectedLeito:number,expectedNome:l.paciente,
    usuario:w.usuarioAtual?.nome||'usuario'});
  if(!response?.ok)throw Error('Gravação não confirmada.');
  w.alert('Dados cadastrais salvos no banco central. Nenhuma movimentação de leito foi executada.');
 }catch(e){w.alert('Não foi possível salvar: '+(e?.message||e)+'\nNenhuma alteração foi confirmada. Confira os dados antes de tentar novamente.')}
 finally{btn.disabled=false;btn.textContent='Salvar alterações do paciente'}
};
return true;
}
function start(){if(timer)clearInterval(timer);let tries=0;timer=setInterval(()=>{if(init()||++tries>=120)clearInterval(timer)},250);init()}
frame.addEventListener('load',start);start();
})();
;
;/* FILE: patch-transferencias-salvamento-confirmado-20261013.js */
(()=>{
const frame=document.getElementById('appFrame');if(!frame)return;
let interval;
function init(){
 let w,d;try{w=frame.contentWindow;d=frame.contentDocument}catch(_){return false}
 if(!w||!d||typeof w.hsjSalvarSolicitacaoTransferenciaAtomica!=='function'||!d.getElementById('transf-atendimento'))return false;
 if(w.__hsjTransferSaveFixed)return true;
 w.__hsjTransferSaveFixed=true;
 let saving=false;
 w.salvarNovaTransferencia=async function(){
  if(saving)return;
  const val=id=>String(d.getElementById(id)?.value||'').trim();
  const data={
   atendimento:val('transf-atendimento'),paciente:val('transf-paciente'),nascimento:val('transf-nascimento'),
   perfil:val('transf-perfil'),sexo:val('transf-sexo'),destino:val('transf-destino')==='__OUTRA_UNIDADE__'?val('hsj-outra-unidade-destino'):val('transf-destino'),
   status:val('transf-status'),dusv:val('transf-dusv'),plataforma:val('transf-plataforma'),
   pendencias:val('transf-pendencias'),judicial:val('transf-judicial'),compulsoria:val('transf-compulsoria'),
   usuario:w.usuarioAtual?.nome||'usuario'
  };
  if(val('transf-destino')==='__OUTRA_UNIDADE__'&&!data.destino){w.alert('Digite o nome da unidade de destino.');return}
  if(!data.atendimento||!data.paciente||!data.destino){w.alert('Informe o prontuário, nome e destino antes de salvar.');return}
  if(w.usuarioAtual?.perfil==='Visitante'){w.alert('Perfil sem permissão de alteração.');return}
  saving=true;
  const btn=[...d.querySelectorAll('#transferencias button')].find(b=>(b.getAttribute('onclick')||'').includes('salvarNovaTransferencia'));
  if(btn){btn.disabled=true;btn.textContent='Salvando no banco...'}
  try{
   const response=await w.hsjSalvarSolicitacaoTransferenciaAtomica(data);
   if(!response?.ok)throw Error('Banco não confirmou a solicitação.');
   const {doc,getDoc}=w.firebaseModules;
   const snap=await getDoc(doc(w.db,'hospital','dados'));
   if(!snap.exists()||snap.metadata?.fromCache)throw Error('Gravação executada, mas não foi possível validar leitura atualizada. Verifique antes de repetir.');
   const records=snap.data().transferenciasAtivas||[];
   if(!records.some(t=>String(t.atendimento)===data.atendimento&&String(t.destino)===data.destino))
    throw Error('Registro ainda não confirmado na leitura. Confira a lista antes de repetir.');
   w.transferenciasAtivas=records;
   if(typeof w.atualizarTabelasTransferencias==='function')w.atualizarTabelasTransferencias();
   if(typeof w.atualizarResumoPlantao==='function')w.atualizarResumoPlantao();
   w.alert('Transferência '+(response.atualizada?'atualizada':'registrada')+' e confirmada no banco central. Os dados permanecerão após F5.');
  }catch(e){w.alert('Não foi possível confirmar a transferência: '+(e?.message||e)+'\nNão considere a solicitação salva antes da confirmação.')}
  finally{saving=false;if(btn){btn.disabled=false;btn.textContent='Salvar e Registrar Solicitação'}}
 };
 return true;
}
function start(){if(interval)clearInterval(interval);let n=0;interval=setInterval(()=>{if(init()||++n>120)clearInterval(interval)},250);init()}
frame.addEventListener('load',start);start();
})();
;
;/* FILE: patch-baixa-transferencia-libera-leito-20261013.js */
(()=>{
const frame=document.getElementById('appFrame');if(!frame)return;
let t;
function init(){
 let w,d;try{w=frame.contentWindow;d=frame.contentDocument}catch(_){return false}
 if(!w||!d||typeof w.hsjBaixarTransferenciaLiberandoLeito!=='function')return false;
 if(w.__hsjBaixaSeguraV2)return true;
 w.__hsjBaixaSeguraV2=true;
 let busy=false;
 w.baixarTransferencia=async function(index){
  if(busy)return;
  if(w.usuarioAtual?.perfil==='Visitante'){w.alert('Sem permissão.');return}
  const row=w.transferenciasAtivas?.[index];if(!row){w.alert('Transferência não encontrada. Atualize o painel.');return}
  const pr=String(row.atendimento||''),id=String(row.dataIso||row.data||'');
  const ocupados=[];
  (w.setoresData||[]).forEach(s=>(s.leitos||[]).forEach(l=>{if(l.status==='ocupado'&&String(l.prontuario||'')===pr)ocupados.push({setor:s.nome,leito:String(l.n)})}));
  if(ocupados.length>1){w.alert('Foram identificados vários leitos ocupados. Baixa bloqueada por segurança.');return}
  const loc=ocupados[0]||null;
  if(!loc){
    const norm=x=>String(x||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim();
    const nome=norm(row.paciente),candidatos=[];
    (w.setoresData||[]).forEach(s=>(s.leitos||[]).forEach(l=>{
      if(l.status==='ocupado'&&nome&&norm(l.paciente)===nome)
        candidatos.push({setor:s.nome,leito:String(l.n),prontuario:String(l.prontuario||'')});
    }));
    if(candidatos.length){
      w.alert('BAIXA NAO REALIZADA POR SEGURANCA.\nA transferencia de '+row.paciente+' tem prontuario '+(pr||'(vazio)')+', mas ha leito ocupado com mesmo nome e identificacao diferente:\n'+candidatos.map(c=>c.setor+' / Leito '+c.leito+' / Prontuario '+(c.prontuario||'(vazio)')).join('\n')+'\nConfira a identificacao antes de repetir. Nenhum leito foi alterado.');
      return;
    }
  }
  if(!w.confirm(loc?'Confirmar BAIXA da transferência de '+row.paciente+'?\n\nO leito '+loc.leito+' de '+loc.setor+' será liberado automaticamente.':'Paciente sem leito ocupado. Confirmar BAIXA ADMINISTRATIVA da solicitação de '+row.paciente+'?\n\nNenhum leito ou cadastro de internação será alterado.'))return;
  const escolhaIndicador=await w.hsjEscolherIndicadorMovimentacao(loc?'Baixa de transferência externa':'Baixa administrativa de transferência');
  if(!escolhaIndicador)return;
  const contabilizarIndicadores=loc?escolhaIndicador.contabilizarIndicadores:false;
  const tipoIndicador=loc?escolhaIndicador.tipoIndicador:null;
  busy=true;
  try{
    const result=await w.hsjBaixarTransferenciaLiberandoLeito({atendimento:pr,dataIso:id,setor:loc?.setor||'',leito:loc?.leito||'',semLeito:!loc,contabilizarIndicadores,tipoIndicador,usuario:w.usuarioAtual?.nome||'usuario'});
    if(!result?.ok)throw Error('Gravação não confirmada.');
    const {doc,getDoc}=w.firebaseModules;
    const snap=await getDoc(doc(w.db,'hospital','dados'));
    if(!snap.exists()||snap.metadata?.fromCache)throw Error('Transação concluída, mas validação do servidor indisponível. Confira o estado antes de repetir.');
    const data=snap.data();
    const bed=loc?data.setoresData?.find(x=>x.nome===loc.setor)?.leitos?.find(x=>String(x.n)===loc.leito):null;
    if(!Array.isArray(data.transferenciasFinalizadas)||!data.transferenciasFinalizadas.some(t=>String(t.atendimento)===pr&&String(t.dataIso||t.data)===id))throw Error('Transferência não encontrada no histórico de finalizadas após a transação.');
    // O leito pode ter sido novamente ocupado por outra operação simultânea. A baixa é validada pelo histórico, sem sobrescrever o estado atual do leito.
    if(data.transferenciasAtivas?.some(t=>String(t.atendimento)===pr&&String(t.dataIso||t.data)===id))throw Error('Baixa ainda não confirmada na releitura.');
    w.setoresData=data.setoresData;w.transferenciasAtivas=data.transferenciasAtivas||[];w.transferenciasFinalizadas=data.transferenciasFinalizadas||[];w.movimentacoesHistorico=data.movimentacoesHistorico||[];
    if(typeof w.renderizarPainelLeitos==='function')w.renderizarPainelLeitos();
    if(typeof w.atualizarTabelasTransferencias==='function')w.atualizarTabelasTransferencias();
    if(typeof w.atualizarTabelaPacientesInternos==='function')w.atualizarTabelaPacientesInternos();
    if(typeof w.atualizarResumoPlantao==='function')w.atualizarResumoPlantao();
    if(typeof w.renderizarIndicadores==='function'&&d.getElementById('indicadores')?.classList.contains('active'))w.renderizarIndicadores();
    
    const finalizadas=d.getElementById('tabela-transf-finalizadas');
    if(finalizadas){
      const titulo=[...d.querySelectorAll('#transferencias h3')].find(e=>e.textContent.includes('Transferências Finalizadas'));
      (titulo||finalizadas).scrollIntoView({behavior:'smooth',block:'start'});
    }
    w.alert(loc?'Transferência baixada e registrada em Finalizadas. Confira o estado atual do leito '+loc.leito+' no painel.':'Solicitação baixada administrativamente e registrada em Finalizadas. Nenhum leito foi alterado.');
  }catch(e){w.alert('Baixa não confirmada: '+(e?.message||e)+'\nConfira o Painel de Leitos antes de repetir.')}
  finally{busy=false}
 };
 return true;
}
function start(){if(t)clearInterval(t);let n=0;t=setInterval(()=>{if(init()||++n>120)clearInterval(t)},250);init()}
frame.addEventListener('load',start);start();
})();
;
;/* FILE: patch-destinos-transferencia-20261013.js */
(()=>{
 const frame=document.getElementById('appFrame');if(!frame)return;
 let timer;
 function setup(){
  let w,d;try{w=frame.contentWindow;d=frame.contentDocument}catch(_){return false}
  if(!w||!d||!d.getElementById('transf-destino'))return false;
  if(d.getElementById('hsj-outra-unidade-destino'))return true;
  const select=d.getElementById('transf-destino');
  const field=d.createElement('div');field.className='form-group';field.id='hsj-outro-destino-wrap';field.style.display='none';
  field.innerHTML='<label for="hsj-outra-unidade-destino">Nome da unidade de destino *</label><input type="text" id="hsj-outra-unidade-destino" maxlength="160" placeholder="Digite o nome completo da unidade" autocomplete="off">';
  select.closest('.form-group')?.after(field);
  const base=w.alternarTipoDestinoTransferencia;
  const customize=()=>{
   const tipo=d.getElementById('transf-tipo-destino')?.value;
   if(tipo==='externa'){
    if(![...select.options].some(o=>o.value==='HOSPITAL DO CORAÇÃO'))select.add(new Option('HOSPITAL DO CORAÇÃO','HOSPITAL DO CORAÇÃO'));
    // SAD é um destino externo; manter o registro de solicitação, baixa e histórico originais.
    if(![...select.options].some(o=>o.value==='SAD'))select.add(new Option('SAD — Serviço de Atenção Domiciliar','SAD'));
    if(![...select.options].some(o=>o.value==='__OUTRA_UNIDADE__'))select.add(new Option('Outra unidade (digitar nome)','__OUTRA_UNIDADE__'));
   }
   field.style.display=tipo==='externa'&&select.value==='__OUTRA_UNIDADE__'?'block':'none';
  };
  if(typeof base==='function')w.alternarTipoDestinoTransferencia=function(){const result=base.apply(this,arguments);customize();return result};
  select.addEventListener('change',customize);
  d.getElementById('transf-tipo-destino')?.addEventListener('change',()=>setTimeout(customize,0));
  customize();return true;
 }
 function start(){if(timer)clearInterval(timer);let i=0;timer=setInterval(()=>{if(setup()||++i>100)clearInterval(timer)},250);setup()}
 frame.addEventListener('load',start);start();
})();
;
;/* FILE: patch-regularizar-reserva-duplicada.js */
(()=>{
const frame=document.getElementById('appFrame');if(!frame)return;
let interval;
function init(){
let w,d;try{w=frame.contentWindow;d=frame.contentDocument}catch(_){return false}
if(!w||!d||typeof w.hsjRegularizarReservaDuplicada!=='function'||!Array.isArray(w.setoresData))return false;
if(d.getElementById('hsj-duplicate-reservation-tool'))return true;
const box=d.createElement('section');box.id='hsj-duplicate-reservation-tool';box.style.cssText='border:1px solid #f59e0b;padding:12px;margin:12px 0;border-radius:9px;background:#fffbeb;display:none';
box.innerHTML='<strong>Reservas duplicadas detectadas</strong><p style="font-size:12px">Confira os dois leitos e libere SOMENTE a reserva antiga, mantendo a reserva correta.</p><div id="hsj-duplicates-list"></div>';
d.getElementById('hsj-drawer-body')?.prepend(box);
let selected=null;
function refresh(){
const pr=d.getElementById('mov-atendimento')?.value||'';
const same=[];
if(pr)w.setoresData.forEach(s=>s.leitos.forEach(l=>{if(l.status==='reservado'&&String(l.prontuario||'')===String(pr))same.push({s,l})}));
box.style.display=same.length>1?'block':'none';box.querySelector('#hsj-duplicates-list').replaceChildren();
if(same.length!==2)return;
const area=box.querySelector('#hsj-duplicates-list');
const summary=d.createElement('p');summary.textContent=same.map(x=>x.s.nome+' / '+x.l.n).join(' E ');area.appendChild(summary);
const select=d.createElement('select');select.style.cssText='width:100%;padding:8px;margin:8px 0';
same.forEach((x,i)=>select.add(new Option('MANTER '+x.s.nome+' / '+x.l.n,i)));
area.appendChild(select);
const button=d.createElement('button');button.className='btn';button.textContent='Regularizar: liberar somente a reserva antiga';button.style.cssText='background:#b45309;color:white;padding:10px';
area.appendChild(button);
button.onclick=async()=>{
 const keep=same[Number(select.value)],old=same[1-Number(select.value)];
 if(!w.confirm('CONFIRMAR:\nMANTER RESERVADO: '+keep.s.nome+' / '+keep.l.n+'\nLIBERAR: '+old.s.nome+' / '+old.l.n+'\nPaciente: '+keep.l.paciente+'\n\nConfira se esta é a situação REAL do paciente antes de confirmar.'))return;
 button.disabled=true;
 try{
 const resp=await w.hsjRegularizarReservaDuplicada({pr,setorManter:keep.s.nome,leitoManter:keep.l.n,setorLiberar:old.s.nome,leitoLiberar:old.l.n,usuario:w.usuarioAtual?.nome||'usuario'});
 if(!resp?.ok)throw Error('Operação não confirmada.');
 w.alert('Regularização confirmada no banco. Atualize o painel para conferir o status dos dois leitos.');
 box.style.display='none';
 }catch(e){w.alert('Regularização bloqueada: '+(e?.message||e))}
 finally{button.disabled=false}
};
}
const opener=w.abrirHistoricoPacienteLeito;
if(typeof opener==='function')w.abrirHistoricoPacienteLeito=function(){const r=opener.apply(this,arguments);setTimeout(refresh,70);return r};
return true;
}
function start(){if(interval)clearInterval(interval);let i=0;interval=setInterval(()=>{if(init()||++i>120)clearInterval(interval)},250);init()}
frame.addEventListener('load',start);start();
})();
;