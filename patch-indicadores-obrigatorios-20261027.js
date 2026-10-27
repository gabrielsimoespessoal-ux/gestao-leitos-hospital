(()=>{const frame=document.getElementById('appFrame');if(!frame)return;
const TYPES=['Admissão','Alta para casa (melhorada)','Óbito','Alta para o internamento','Alta a pedido','Alta por transferência','Alta com assistência domiciliar','Evasão','Cirurgias suspensas','Alta administrativa por cirurgia suspensa'];
function install(){let w,d;try{w=frame.contentWindow;d=frame.contentDocument}catch{return}if(!w||!d||!w.executarEntradaLeitoAtomica||!w.hsjConfirmarReservaComoAdmissao||!w.executarTransferenciaSeguraV20261009||!w.executarSaidaLeitoAtomica)return;if(w.__hsjIndicadoresObrigatorios20261027)return;w.__hsjIndicadoresObrigatorios20261027=true;
w.hsjEscolherIndicadorMovimentacao=function(contexto){
 return new Promise(resolve=>{
  const overlay=d.createElement('div');overlay.style.cssText='position:fixed;inset:0;z-index:2147483647;background:#0f172ab3;display:flex;align-items:center;justify-content:center;padding:16px';
  const card=d.createElement('section');card.setAttribute('role','dialog');card.setAttribute('aria-modal','true');card.style.cssText='width:min(510px,100%);max-height:90vh;overflow:auto;background:white;color:#182638;border-radius:14px;padding:22px;box-shadow:0 20px 50px #0005;font:15px Arial,sans-serif';
  const h=d.createElement('h2');h.style.cssText='margin:0 0 12px;font-size:20px';h.textContent='Indicadores hospitalares';
  const p=d.createElement('p');p.textContent='Deseja computar esta movimentação nos indicadores?';p.style.margin='8px 0';
  const detail=d.createElement('p');detail.style.cssText='color:#64748b;font-size:12px';detail.textContent=contexto||'Movimentação hospitalar';
  const controls=d.createElement('div');controls.style.cssText='display:flex;gap:12px;margin-top:16px;flex-wrap:wrap';
  const field=d.createElement('div');field.style.cssText='display:none;margin-top:18px;padding:12px;background:#f1f5f9;border-radius:8px';
  const label=d.createElement('label');label.textContent='Selecione o indicador obrigatório';label.style.cssText='display:block;font-weight:700;margin-bottom:8px';
  const select=d.createElement('select');select.style.cssText='width:100%;padding:11px;border:1px solid #94a3b8;border-radius:6px;background:white';select.appendChild(new Option('Selecione uma opção',''));
  TYPES.forEach(t=>select.appendChild(new Option(t,t)));
  const recommended=/admiss|reserva/i.test(contexto||'')?'Admissão':/transfer/i.test(contexto||'')?'Alta por transferência':/óbito|obito/i.test(contexto||'')?'Óbito':/evasão|evasao/i.test(contexto||'')?'Evasão':/pedido/i.test(contexto||'')?'Alta a pedido':/uti.*intern|internamento/i.test(contexto||'')?'Alta para o internamento':'';
  if(recommended)select.value=recommended;
  const confirm=d.createElement('button');confirm.textContent='Confirmar indicador';confirm.style.cssText='background:#1458a3;color:#fff;border:0;padding:11px 15px;border-radius:7px;margin-top:12px;font-weight:700';confirm.onclick=()=>{if(!select.value){select.focus();return}end({contabilizarIndicadores:true,tipoIndicador:select.value})};
  field.append(label,select,confirm);
  function btn(label,color,fn){const b=d.createElement('button');b.textContent=label;b.style.cssText='padding:11px 20px;border-radius:8px;font-weight:700;border:1px solid #cbd5e1;cursor:pointer;background:'+color;b.onclick=fn;controls.appendChild(b)}
  let finished=false;function end(value){if(finished)return;finished=true;overlay.remove();resolve(value)}
  btn('NÃO','#f8fafc',()=>end({contabilizarIndicadores:false,tipoIndicador:null}));
  btn('SIM','#dbeafe',()=>{controls.style.display='none';field.style.display='block';select.focus()});
  btn('Cancelar movimentação','#fff',()=>end(null));
  card.append(h,p,detail,controls,field);overlay.appendChild(card);d.body.appendChild(overlay);
  controls.querySelector('button')?.focus();
 });
};
function wrap(name,condition,context){
 const prior=w[name];if(typeof prior!=='function')return;
 w[name]=async function(args){const a={...(args||{})};if(condition(a)&&!(typeof a.contabilizarIndicadores==='boolean'&&(a.contabilizarIndicadores===false||a.tipoIndicador))){const selection=await w.hsjEscolherIndicadorMovimentacao(context(a));if(!selection)throw new Error('Movimentação cancelada na confirmação de indicadores. Nenhum registro foi solicitado.');Object.assign(a,selection)}return prior.call(this,a)};
}
wrap('executarEntradaLeitoAtomica',a=>a.acao==='Admissão',()=> 'Admissão no setor');
wrap('executarAdmissaoReservaAtomica',()=>true,()=> 'Admissão de reserva');
wrap('hsjConfirmarReservaComoAdmissao',()=>true,()=> 'Conversão de reserva para admissão');
wrap('executarTransferenciaSeguraV20261009',()=>true,()=> 'Transferência interna entre setores');
}
frame.addEventListener('load',()=>setTimeout(install,200));let n=0;const t=setInterval(()=>{install();if(frame.contentWindow?.__hsjIndicadoresObrigatorios20261027||++n>100)clearInterval(t)},250);
})();