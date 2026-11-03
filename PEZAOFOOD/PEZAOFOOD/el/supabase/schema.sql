-- Rode inteiro no Supabase > SQL Editor
create table profiles(id uuid primary key references auth.users on delete cascade,role text not null check(role in('cliente','restaurante','entregador','admin')),nome text default '',telefone text,aprovado boolean default false,rejeitado boolean default false,criado_em timestamptz default now());
create table restaurantes(id bigserial primary key,owner uuid not null references profiles(id),nome text not null,categoria text,endereco text not null,aberto boolean default true,taxa_entrega numeric(8,2) default 6,plano_ate date default (now()+interval '30 days')::date);
create table produtos(id bigserial primary key,restaurante_id bigint references restaurantes(id) on delete cascade,nome text not null,preco numeric(8,2) not null,ativo boolean default true);
create table pedidos(id bigserial primary key,cliente_id uuid references profiles(id),restaurante_id bigint references restaurantes(id),entregador_id uuid references profiles(id),itens jsonb not null,subtotal numeric(8,2),taxa_entrega numeric(8,2),total numeric(8,2),endereco_entrega text not null,pagamento text,obs text,status text default 'novo' check(status in('novo','preparo','pronto','rota','entregue','recusado')),criado_em timestamptz default now());
create table configuracoes(chave text primary key,valor text);
insert into configuracoes values('mensalidade','29.90'),('teste_dias','30');

create function is_admin() returns boolean language sql security definer stable set search_path=public as $$select exists(select 1 from profiles where id=auth.uid() and role='admin')$$;
create function handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$
declare r text:=coalesce(new.raw_user_meta_data->>'role','cliente');
begin if r not in('cliente','restaurante','entregador') then r:='cliente'; end if;
insert into profiles(id,role,nome,aprovado) values(new.id,r,coalesce(new.raw_user_meta_data->>'nome',''),r='cliente'); return new; end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function handle_new_user();

-- Aceitar corrida: atômico, só um entregador consegue
create function aceitar_corrida(p_id bigint) returns boolean language plpgsql security definer set search_path=public as $$
declare n int;
begin
 if not exists(select 1 from profiles where id=auth.uid() and role='entregador' and aprovado) then return false; end if;
 update pedidos set entregador_id=auth.uid() where id=p_id and entregador_id is null and status in('preparo','pronto');
 get diagnostics n=row_count; return n>0;
end $$;

alter table profiles enable row level security;alter table restaurantes enable row level security;alter table produtos enable row level security;alter table pedidos enable row level security;alter table configuracoes enable row level security;
create policy p_sel on profiles for select using(id=auth.uid() or is_admin());
create policy p_upd on profiles for update using(is_admin());
create policy r_sel on restaurantes for select using(true);
create policy r_ins on restaurantes for insert with check(owner=auth.uid() and exists(select 1 from profiles where id=auth.uid() and role='restaurante' and aprovado));
create policy r_upd on restaurantes for update using(owner=auth.uid() or is_admin());
create policy pr_sel on produtos for select using(true);
create policy pr_all on produtos for all using(exists(select 1 from restaurantes r where r.id=restaurante_id and r.owner=auth.uid())) with check(exists(select 1 from restaurantes r where r.id=restaurante_id and r.owner=auth.uid()));
create policy c_sel on configuracoes for select using(true);
create policy c_upd on configuracoes for update using(is_admin());
create policy o_sel on pedidos for select using(
 cliente_id=auth.uid() or is_admin() or entregador_id=auth.uid()
 or exists(select 1 from restaurantes r where r.id=restaurante_id and r.owner=auth.uid())
 or (entregador_id is null and status in('preparo','pronto') and exists(select 1 from profiles p where p.id=auth.uid() and p.role='entregador' and p.aprovado)));
create policy o_ins on pedidos for insert with check(cliente_id=auth.uid() and status='novo');
create policy o_upd on pedidos for update using(is_admin() or entregador_id=auth.uid() or exists(select 1 from restaurantes r where r.id=restaurante_id and r.owner=auth.uid()));
alter publication supabase_realtime add table pedidos;

-- Admin: crie o usuário em Authentication > Users e rode:
-- insert into profiles(id,role,nome,aprovado) values('UUID-DO-USUARIO','admin','Admin',true);
