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
          if(ac==='Reservado'){
            pr.required=false; pr.placeholder='Opcional na Reserva Externa — incluir quando disponível';
            if(sp)sp.textContent='(opcional na Reserva Externa)';
          }else{
            pr.required=true; pr.placeholder='Digite o nº — se já existir, o cadastro será preenchido';
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
        w.executarMovimentacaoLeito=function(){
          const ac=d.getElementById('mov-acao')?.value;
          if(!ac){w.alert('Selecione primeiro a Ação Operacional.');return;}
          const setor=d.getElementById('mov-setor')?.value;
          const perfil=d.getElementById('mov-perfil-vaga')?.value;
          if(!perfilCompativel(setor,perfil)){w.alert(msgConflito(setor,perfil));return;}
          const pr=d.getElementById('mov-atendimento');
          let gerado=false;
          if(ac==='Reservado'&&!pr.value.trim()){pr.value='EXT-'+Date.now();gerado=true;}
          if(ac!=='Reservado'&&!pr.value.trim()){w.alert('Informe o número do prontuário. Para Reserva Externa esse campo pode ficar vazio.');return;}
          const chave=pr.value.trim();
          const pac=d.getElementById('mov-paciente')?.value.trim();
          const nasc=d.getElementById('mov-nascimento')?.value;
          const sexo=d.getElementById('mov-sexo')?.value;
          const conv=d.getElementById('mov-convenio')?.value;
          const prec=d.getElementById('mov-precaucao')?.value;
          const origem=d.getElementById('mov-origem')?.value;
          const r=oldExec.apply(w,arguments);
          setTimeout(()=>{
            if(w.basePacientesCadastrados[chave]){
              Object.assign(w.basePacientesCadastrados[chave],{nome:pac,nascimento:nasc,sexo,perfil,convenio:conv,precaucao:prec,origem,reservaExterna:ac==='Reservado',prontuarioPendente:gerado});
              if(typeof w.salvarDadosNoFirebase==='function')w.salvarDadosNoFirebase();
            }
          },0);
          return r;
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
        };

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
          if(newPr!==oldPr&&w.basePacientesCadastrados[newPr]&&!isTemp(oldPr)){w.alert('Já existe outro paciente cadastrado com este prontuário.');return;}
          const antigo=getBase(oldPr);
          const dados={...antigo,nome,nascimento:nasc,perfil,sexo,convenio,precaucao,origem,prontuarioPendente:isTemp(newPr)};
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
        w.abrirHistoricoPacienteLeito=function(setor,leito){
          oldBedOpen.call(w,setor,leito);
          const s=w.setoresData.find(x=>x.nome===setor),l=s?.leitos.find(x=>x.n===leito);
          if(!l||!l.prontuario||!(l.status==='ocupado'||l.status==='reservado'))return;
          const cont=d.getElementById('paciente-modal-conteudo'); if(!cont)return;
          if(cont.querySelector('#editar-paciente-leito-v3'))return;
          const b=getBase(l.prontuario);
          const btn=d.createElement('button');btn.id='editar-paciente-leito-v3';btn.className='btn';btn.style.margin='12px 8px 0 0';btn.textContent='✏️ Editar cadastro do paciente';
          btn.onclick=()=>{d.getElementById('modal-historico-paciente').style.display='none';w.abrirEdicaoPaciente(l.prontuario,l.paciente,b.nascimento||'',b.perfil||'Enfermaria Clínica');};
          cont.appendChild(btn);
        };

        // manter extras/filtros após renderizações
        const currentRender=w.renderizarPainelLeitos;
        w.renderizarPainelLeitos=function(){const r=currentRender.apply(w,arguments);setTimeout(()=>{aplicarFiltroPainel();},20);return r;};

        // contraste visual do perfil incompatível em mudança manual de setor
        const perfilEl=d.getElementById('mov-perfil-vaga'),setorEl=d.getElementById('mov-setor');
        function pintarConflito(){if(!perfilEl||!setorEl)return;const bad=!perfilCompativel(setorEl.value,perfilEl.value);perfilEl.style.borderColor=bad?'#ef4444':'';perfilEl.style.background=bad?'#fff1f2':'';}
        perfilEl?.addEventListener('change',pintarConflito); setorEl?.addEventListener('change',()=>setTimeout(pintarConflito,0));

      }catch(e){console.error('Erro patch simplificação cadastro:',e);}
    },350);
  });
})();