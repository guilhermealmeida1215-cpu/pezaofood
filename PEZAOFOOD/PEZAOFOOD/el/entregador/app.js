import {sb,$,M,E,boot,beep} from "../js/shared.js";
boot("entregador",(u,p,root)=>{
 let on=false,A=[],mine=[],ganhos=0,ids=new Set();
 async function load(){
  const all=(await sb.from("pedidos").select("*,restaurantes(nome,endereco)").order("id",{ascending:false})).data||[];
  mine=all.filter(o=>o.entregador_id==u.id&&o.status!="entregue");
  A=all.filter(o=>!o.entregador_id&&["preparo","pronto"].includes(o.status));
  ganhos=all.filter(o=>o.entregador_id==u.id&&o.status=="entregue").reduce((s,o)=>s+ +o.taxa_entrega,0);
  if(on&&A.some(o=>!ids.has(o.id)))beep();ids=new Set(A.map(o=>o.id));draw()}
 function draw(){
  root.innerHTML=`<div class="card row"><span class="tg" style="background:${on?"#16a34a":"#e10600"}">${on?"Disponível":"Offline"}</span><span style="flex:1"></span><button class="bt ${on?"":"g"}" data-a="on">${on?"Ficar offline":"Ficar online"}</button></div><div class="card">Ganhos (100% das taxas): <b>${M(ganhos)}</b></div>`
  +mine.map(o=>`<div class="card"><b>Em andamento #${o.id}</b><br>📍 Retirar: ${E(o.restaurantes?.nome)} — ${E(o.restaurantes?.endereco)}<br>📍 Entregar: ${E(o.endereco_entrega)}<br>Você recebe: <b>${M(o.taxa_entrega)}</b><br>${o.status=="pronto"?`<button class="bt g w" data-a="rota" data-i="${o.id}">Retirei o pedido</button>`:o.status=="rota"?`<button class="bt g w" data-a="entregue" data-i="${o.id}">Confirmar entrega</button>`:'<span class="m">Aguardando o restaurante marcar como pronto…</span>'}</div>`).join("")
  +(on?(A.map(o=>`<div class="card"><h3>⚡ Nova corrida #${o.id}</h3>📍 Retirar: ${E(o.restaurantes?.nome)} — ${E(o.restaurantes?.endereco)}<br>📍 Entregar: ${E(o.endereco_entrega)}<br>Você recebe: <b style="color:#16a34a">${M(o.taxa_entrega)}</b><br><button class="bt g w" data-a="aceitar" data-i="${o.id}">✓ Aceitar corrida</button></div>`).join("")||'<p class="m">Procurando corridas…</p>'):'<p class="m">Fique online para ver corridas.</p>')}
 root.onclick=async e=>{const b=e.target.closest("[data-a]");if(!b)return;const a=b.dataset.a,i=+b.dataset.i;
  if(a=="on"){on=!on;draw();return}
  if(a=="aceitar"){const {data}=await sb.rpc("aceitar_corrida",{p_id:i});if(!data)alert("Outro entregador já aceitou essa corrida.")}
  else await sb.from("pedidos").update({status:a}).eq("id",i);
  load()};
 sb.channel("e").on("postgres_changes",{event:"*",schema:"public",table:"pedidos"},load).subscribe();setInterval(load,15000);load();
});
