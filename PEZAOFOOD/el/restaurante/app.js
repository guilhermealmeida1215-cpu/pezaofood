import {sb,$,M,E,boot,beep} from "../js/shared.js";
boot("restaurante",async(u,p,root)=>{
 let r=(await sb.from("restaurantes").select("*").eq("owner",u.id).maybeSingle()).data;
 if(!r){root.innerHTML=`<div class="card"><h3>Cadastre seu estabelecimento</h3><input id="n" placeholder="Nome"><input id="c" placeholder="Categoria (Pizzas, Lanches...)"><input id="e" placeholder="Endereço"><input id="t" type="number" step="0.5" placeholder="Taxa de entrega (R$)" value="6"><button class="bt w" id="s">Salvar (30 dias grátis)</button></div>`;
  $("#s").onclick=async()=>{const {error}=await sb.from("restaurantes").insert({owner:u.id,nome:$("#n").value,categoria:$("#c").value,endereco:$("#e").value,taxa_entrega:+$("#t").value});error?alert(error.message):location.reload()};return}
 let O=[],P=[];
 async function load(){O=(await sb.from("pedidos").select("*").eq("restaurante_id",r.id).order("id",{ascending:false})).data||[];P=(await sb.from("produtos").select("*").eq("restaurante_id",r.id).order("id")).data||[];draw()}
 const act=(o)=>o.status=="novo"?`<button class="bt g" data-a="preparo" data-i="${o.id}">Aceitar</button><button class="bt" data-a="recusado" data-i="${o.id}">Recusar</button>`:o.status=="preparo"?`<button class="bt g w" data-a="pronto" data-i="${o.id}">Marcar como pronto</button>`:"";
 function draw(){root.innerHTML=`<div class="card row"><b style="flex:1">${E(r.nome)}</b><button class="bt ${r.aberto?"g":""}" data-a="tog">${r.aberto?"Aberto":"Pausado"}</button></div><h3>Pedidos</h3>`+(O.map(o=>`<div class="card"><b>#${o.id}</b> · ${M(o.total)} <span class="tg">${o.status}</span>${o.entregador_id?' <span class="tg">entregador ok</span>':""}<br>${o.itens.map(i=>i.qtd+"x "+E(i.nome)).join(", ")}<br><span class="m">${E(o.obs)}</span><br>${act(o)}</div>`).join("")||'<p class="m">Sem pedidos.</p>')+`<h3>Cardápio</h3>`+P.map(x=>`<div class="card row"><span style="flex:1">${E(x.nome)} · ${M(x.preco)}</span><button class="bt l" data-a="del" data-i="${x.id}">Excluir</button></div>`).join("")+`<div class="card"><input id="pn" placeholder="Nome do produto"><input id="pp" type="number" step="0.01" placeholder="Preço"><button class="bt w" data-a="add">Adicionar produto</button></div>`}
 root.onclick=async e=>{const b=e.target.closest("[data-a]");if(!b)return;const a=b.dataset.a,i=+b.dataset.i;
  if(a=="tog"){r.aberto=!r.aberto;await sb.from("restaurantes").update({aberto:r.aberto}).eq("id",r.id)}
  else if(a=="add"){await sb.from("produtos").insert({restaurante_id:r.id,nome:$("#pn").value,preco:+$("#pp").value})}
  else if(a=="del"){await sb.from("produtos").delete().eq("id",i)}
  else await sb.from("pedidos").update({status:a}).eq("id",i);
  load()};
 sb.channel("r").on("postgres_changes",{event:"*",schema:"public",table:"pedidos",filter:"restaurante_id=eq."+r.id},x=>{if(x.eventType=="INSERT")beep();load()}).subscribe();load();
});
