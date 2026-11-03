import {sb,$,M,E,boot} from "../js/shared.js";
boot("admin",(u,p,root)=>{
 async function load(){
  const pend=(await sb.from("profiles").select("*").eq("aprovado",false).eq("rejeitado",false)).data||[];
  const rest=(await sb.from("restaurantes").select("nome,plano_ate")).data||[];
  const ped=(await sb.from("pedidos").select("id,status,total")).data||[];
  const cfg=Object.fromEntries(((await sb.from("configuracoes").select("*")).data||[]).map(c=>[c.chave,c.valor]));
  root.innerHTML=`<div class="card">Pedidos: <b>${ped.length}</b> · Entregues: <b>${ped.filter(o=>o.status=="entregue").length}</b> · Restaurantes: <b>${rest.length}</b></div><h3>Cadastros pendentes</h3>`+(pend.map(x=>`<div class="card"><b>${E(x.nome)||"(sem nome)"}</b> · ${x.role}<br><button class="bt g" data-a="ok" data-i="${x.id}">Aprovar</button><button class="bt" data-a="no" data-i="${x.id}">Rejeitar</button></div>`).join("")||'<p class="m">Nenhum pendente.</p>')+`<h3>Planos</h3><div class="card">Mensalidade (R$)<input id="mn" type="number" step="0.01" value="${E(cfg.mensalidade)}">Dias grátis<input id="td" type="number" value="${E(cfg.teste_dias)}"><button class="bt w" data-a="cfg">Salvar planos</button></div><h3>Restaurantes</h3>`+rest.map(r=>`<div class="card">${E(r.nome)} <span class="m">grátis até ${r.plano_ate}</span></div>`).join("")}
 root.onclick=async e=>{const b=e.target.closest("[data-a]");if(!b)return;const a=b.dataset.a,i=b.dataset.i;
  if(a=="ok")await sb.from("profiles").update({aprovado:true}).eq("id",i);
  if(a=="no")await sb.from("profiles").update({rejeitado:true}).eq("id",i);
  if(a=="cfg"){await sb.from("configuracoes").update({valor:$("#mn").value}).eq("chave","mensalidade");await sb.from("configuracoes").update({valor:$("#td").value}).eq("chave","teste_dias")}
  load()};load();
});
