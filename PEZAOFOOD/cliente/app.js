import {sb,$,M,E,boot} from "../js/shared.js";
const ST=o=>({novo:"Aguardando restaurante",preparo:o.entregador_id?"Em preparo · entregador definido":"Em preparo",pronto:o.entregador_id?"Pronto · entregador a caminho":"Pronto · buscando entregador",rota:"Pedido em rota!",entregue:"Entregue ✅",recusado:"Recusado"}[o.status]);
boot("cliente",(u,p,root)=>{
 let R=[],O=[],cur=null,cart={};
 const sub=()=>cur.produtos.reduce((a,x)=>a+x.preco*(cart[x.id]||0),0);
 async function load(){R=(await sb.from("restaurantes").select("*,produtos(*)").eq("aberto",true)).data||[];O=(await sb.from("pedidos").select("*,restaurantes(nome)").eq("cliente_id",u.id).order("id",{ascending:false})).data||[];draw()}
 function draw(){
  if(cur){const n=Object.values(cart).reduce((a,b)=>a+b,0);
   root.innerHTML=`<button class="bt l" data-a="back">← Voltar</button><h3>${E(cur.nome)}</h3>`+cur.produtos.filter(x=>x.ativo).map(x=>`<div class="card row"><div style="flex:1"><b>${E(x.nome)}</b><br>${M(x.preco)}</div><button class="q" data-a="m" data-i="${x.id}">−</button>${cart[x.id]||0}<button class="q" data-a="p" data-i="${x.id}">+</button></div>`).join("")+(n?`<div class="card"><input id="ad" placeholder="Endereço de entrega (rua, nº, bairro)" value="${E(localStorage.ad||"")}"><input id="ob" placeholder="Observações"><select id="pg"><option>Pix</option><option>Cartão</option><option>Dinheiro</option></select><p>Produtos ${M(sub())} + entrega ${M(cur.taxa_entrega)} = <b>${M(sub()+ +cur.taxa_entrega)}</b></p><button class="bt g w" data-a="buy">Finalizar pedido</button></div>`:"");return}
  root.innerHTML="<h3>Restaurantes</h3>"+(R.map(r=>`<div class="card" data-a="open" data-i="${r.id}"><b>${E(r.nome)}</b><br><span class="m">${E(r.categoria)} · entrega ${M(r.taxa_entrega)}</span></div>`).join("")||'<p class="m">Nenhum restaurante aberto.</p>')+"<h3>Meus pedidos</h3>"+(O.map(o=>`<div class="card"><b>#${o.id} ${E(o.restaurantes?.nome)}</b> · ${M(o.total)}<br><span class="tg">${ST(o)}</span></div>`).join("")||'<p class="m">Nenhum pedido.</p>')}
 root.onclick=async e=>{const b=e.target.closest("[data-a]");if(!b)return;const a=b.dataset.a,i=+b.dataset.i;
  if(a=="open"){cur=R.find(r=>r.id==i);cart={};draw()}
  if(a=="back"){cur=null;draw()}
  if(a=="p"||a=="m"){cart[i]=Math.max(0,(cart[i]||0)+(a=="p"?1:-1));draw()}
  if(a=="buy"){const ad=$("#ad").value.trim();if(!ad)return alert("Informe o endereço.");localStorage.ad=ad;
   const itens=cur.produtos.filter(x=>cart[x.id]).map(x=>({nome:x.nome,qtd:cart[x.id],preco:x.preco})),s=sub();
   const {error}=await sb.from("pedidos").insert({cliente_id:u.id,restaurante_id:cur.id,itens,subtotal:s,taxa_entrega:cur.taxa_entrega,total:s+ +cur.taxa_entrega,endereco_entrega:ad,pagamento:$("#pg").value,obs:$("#ob").value});
   if(error)return alert(error.message);cur=null;cart={};load()}};
 sb.channel("c").on("postgres_changes",{event:"*",schema:"public",table:"pedidos"},load).subscribe();load();
});
