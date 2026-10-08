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
              const resultado=await w.executarSaidaLeitoAtomica({
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
              if(pr&&w.basePacientesCadastrados?.[pr]){
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
          // Remove qualquer handler legado e intercepta o clique na fase de captura.
          // Isso garante que somente o fluxo atômico V13 seja executado.
          btnConfirmarV13.onclick=null;
          btnConfirmarV13.addEventListener('click',function(ev){
            ev.preventDefault();
            ev.stopPropagation();
            if(typeof ev.stopImmediatePropagation==='function')ev.stopImmediatePropagation();
            confirmarAcaoPainelV13();
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
          const previsao=d.getElementById('mov-previsao-alta-paciente-v14')?.value||'';
          const r=execAntesPrevAltaPacienteV14.apply(w,arguments);
          if(r&&typeof r.then==='function')await r;
          if(pr&&w.basePacientesCadastrados?.[pr]){
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