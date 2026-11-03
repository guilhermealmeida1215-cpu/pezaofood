import {createClient} from "https://esm.sh/@supabase/supabase-js@2.45.4";
import {URL,KEY} from "./config.js";
export const sb=createClient(URL,KEY);
export const $=s=>document.querySelector(s);
export const M=v=>"R$ "+Number(v||0).toFixed(2).replace(".",",");
export const E=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
export function beep(){try{const a=new AudioContext(),o=a.createOscillator();o.connect(a.destination);o.frequency.value=880;o.start();o.stop(a.currentTime+.4)}catch(e){}}
export async function boot(role,start){
 const root=$("#app");$("#sair").onclick=async()=>{await sb.auth.signOut();location.reload()};
 const {data:{session}}=await sb.auth.getSession();
 if(!session)return auth(role,root);
 const {data:p}=await sb.from("profiles").select("*").eq("id",session.user.id).maybeSingle();
 if(!p||p.role!==role)return root.innerHTML=`<div class="card">Esta conta não é de ${role}. Saia e entre com a conta certa.</div>`;
 if(p.rejeitado)return root.innerHTML=`<div class="card">Seu cadastro foi rejeitado.</div>`;
 if(!p.aprovado)return root.innerHTML=`<div class="card">Cadastro enviado! Aguarde a aprovação do administrador.</div>`;
 start(session.user,p,root);
}
function auth(role,root){
 root.innerHTML=`<div class="card"><h3>Entrar</h3><input id="em" type="email" placeholder="E-mail"><input id="pw" type="password" placeholder="Senha (mín. 6)"><input id="nm" placeholder="Nome (só para criar conta)"><button class="bt" id="in">Entrar</button> ${role=="admin"?"":'<button class="bt l" id="up">Criar conta</button>'}<p class="m" id="ms"></p></div>`;
 const v=()=>({email:$("#em").value,password:$("#pw").value});
 $("#in").onclick=async()=>{const {error}=await sb.auth.signInWithPassword(v());error?$("#ms").textContent=error.message:location.reload()};
 if($("#up"))$("#up").onclick=async()=>{const {error}=await sb.auth.signUp({...v(),options:{data:{role,nome:$("#nm").value}}});$("#ms").textContent=error?error.message:"Conta criada! Se pedir confirmação, confira o e-mail e depois clique em Entrar."};
}
