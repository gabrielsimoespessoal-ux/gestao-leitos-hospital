(()=>{const frame=document.getElementById('appFrame');if(!frame)return;
const types=['Admissão','Alta para casa (melhorada)','Óbito','Alta para o internamento','Alta a pedido','Alta por transferência','Alta com assistência domiciliar','Evasão','Cirurgias suspensas'];
const norm=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
function install(){let w,d;try{w=frame.contentWindow;d=frame.contentDocument}catch{return}if(!w||!d||typeof w.renderizarIndicadores!=='function'||!d.getElementById('indicadores'))return;if(w.__hsjCategoriasIndicadores20261027)return;w.__hsjCategoriasIndicadores20261027=true;
function draw(){
const host=d.getElementById('indicadores');if(!host)return;
let root=d.getElementById('hsj-categorias-confirmadas');
if(!root){root=d.createElement('section');root.id='hsj-categorias-confirmadas';root.style.cssText='margin:16px 0;background:#fff;border:1px solid #cbd5e1;border-radius:12px;padding:15px';const t=d.getElementById('hsj-indicadores-auditaveis');if(t)t.after(root);else host.prepend(root)}
const from=d.getElementById('filtro-data-inicio')?.value||'',to=d.getElementById('filtro-data-fim')?.value||'';
const selected=[...d.querySelectorAll('#checkboxes-setores-container input:checked')].map(x=>x.value);
const general=!selected.length||selected.includes('GERAL');
const counts=new Map(types.map(t=>[t,0]));let no=0,old=0;
for(const m of w.movimentacoesHistorico||[]){
const when=String(m.dataIso||m.dataDesfechoObj||'').slice(0,10);
if(!/^\d{4}-\d{2}-\d{2}$/.test(when)||from&&when<from||to&&when>to)continue;
if(!general&&!selected.some(s=>[m.origem,m.destino,m.setor].some(v=>norm(v).includes(norm(s)))))continue;
if(m.contabilizarIndicadores===false){no++;continue}
if(m.contabilizarIndicadores!==true){old++;continue}
const t=types.find(x=>norm(x)===norm(m.tipoIndicador));
if(t)counts.set(t,counts.get(t)+1);else old++;
}
const heading=d.createElement('h3');heading.textContent='Indicadores por classificação confirmada';heading.style.cssText='font-size:17px;margin:0 0 9px;color:#123f69';
const note=d.createElement('p');note.textContent='Contagem por eventos confirmados, sem estimar categorias em registros antigos. Transferência interna não equivale automaticamente a alta hospitalar.';note.style.cssText='font-size:12px;color:#475569;margin:0 0 12px';
const grid=d.createElement('div');grid.style.cssText='display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:9px';
for(const [name,count] of counts){const cell=d.createElement('div');cell.style.cssText='padding:12px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px';const label=d.createElement('div');label.textContent=name;label.style.cssText='font-size:12px;color:#475569';const val=d.createElement('b');val.textContent=String(count);val.style.cssText='display:block;font-size:23px;color:#16446e;margin-top:4px';cell.append(label,val);grid.appendChild(cell)}
const foot=d.createElement('p');foot.style.cssText='font-size:11px;color:#64748b;margin:12px 0 0';foot.textContent='Movimentações marcadas NÃO: '+no+'. Eventos sem categoria confirmada (histórico legado ou incompleto): '+old+'. Não redistribuídos automaticamente.';
root.replaceChildren(heading,note,grid,foot);
}
const prior=w.renderizarIndicadores;w.renderizarIndicadores=function(){const res=prior.apply(this,arguments);draw();return res};draw();
}
frame.addEventListener('load',()=>setTimeout(install,500));let count=0;const t=setInterval(()=>{install();if(frame.contentWindow?.__hsjCategoriasIndicadores20261027||++count>100)clearInterval(t)},250);
})();