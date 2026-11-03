# Entrega Livre
1. Supabase: crie o projeto > SQL Editor > cole `supabase/schema.sql`. (Authentication > Providers > Email: desligue "Confirm email" para testar.)
2. Edite `js/config.js` com a URL e a anon key (Settings > API).
3. Admin: Authentication > Users > Add user; depois rode o `insert into profiles ... 'admin'` do final do schema.sql.
4. Vercel: suba a pasta (GitHub ou `vercel --prod`). Sem build. Rotas: /cliente /restaurante /entregador /admin
