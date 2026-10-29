# LOS HERMANOS — Painel de operação

## Visão geral

O LOS HERMANOS é um painel web para apoiar a operação de pequenas lanchonetes. A proposta é reunir em um único sistema o acompanhamento de pedidos, o cardápio, as vendas e o controle de estoque. Em etapas futuras, o projeto poderá integrar canais de atendimento, como o WhatsApp, para registrar pedidos e enviar atualizações aos clientes e entregadores.

O repositório contém a primeira versão da interface operacional e a base de integração com o Supabase. O acesso ao painel é protegido pelo Supabase Auth. No momento, a leitura dos produtos ativos do cardápio está conectada ao banco; pedidos, métricas e estoque ainda são demonstrações e não devem ser usados como registros reais.

## Tecnologias

- **HTML5** estrutura as páginas e componentes da interface.
- **CSS3** define o layout, a identidade visual e os comportamentos responsivos.
- **JavaScript com módulos ES** implementa interações, navegação, autenticação e leitura do cardápio.
- **Vite** fornece o servidor de desenvolvimento e gera os arquivos estáticos de produção.
- **Supabase** oferece autenticação e banco de dados PostgreSQL com Row Level Security (RLS).
- **`@supabase/supabase-js`** conecta o frontend ao Supabase usando a chave pública do projeto.
- **Render** hospeda a versão estática gerada pelo Vite.

## Funcionalidades presentes

- Tela de login com e-mail e senha via Supabase Auth.
- Restauração da sessão existente e encerramento de sessão.
- Leitura dos produtos ativos na tabela `public.products`, ordenados pelo nome.
- Exibição de preços armazenados em centavos.
- Navegação visual entre pedidos, cardápio e estoque.
- Interface demonstrativa de pedidos e indicadores, sem persistência no banco.

## Estrutura do repositório

```text
.
├── app.js                 # Interações da interface e fluxo de autenticação
├── data.js                # Cliente Supabase e consulta de produtos
├── index.html             # Estrutura do painel e tela de login
├── styles.css             # Estilos e responsividade
├── vite.config.js         # Configuração do servidor e preview do Vite
├── render.yaml            # Configuração de build e publicação no Render
├── supabase/
│   └── schema.sql         # Tabelas, políticas RLS e dados iniciais do cardápio
└── assets/
    └── logo.png           # Marca utilizada no painel
```

## Requisitos

- Node.js compatível com a versão do Vite declarada em `package.json`.
- npm.
- Um projeto Supabase com o esquema deste repositório aplicado.
- Uma conta administrativa cadastrada no Supabase Auth.

## Configuração local

1. Instale as dependências:

   ```bash
   npm install
   ```

2. Copie `.env.example` para `.env` e informe os dados do projeto Supabase:

   ```env
   VITE_SUPABASE_URL=https://seu-projeto.supabase.co
   VITE_SUPABASE_ANON_KEY=sua-chave-publica
   ```

   Use a chave pública (`anon` ou publishable) do projeto. Nunca coloque uma chave `service_role` no frontend. O arquivo `.env` está ignorado pelo Git; não o versione.

3. Inicie o servidor local:

   ```bash
   npm start
   ```

4. Abra o endereço local informado pelo Vite. Entre com o e-mail e a senha forte da conta administrativa criada no Supabase Auth.

## Supabase e segurança

O arquivo [`supabase/schema.sql`](supabase/schema.sql) define as tabelas `products`, `orders`, `order_items` e `ingredients`. Ele habilita RLS, remove as políticas anônimas legadas conhecidas e cria políticas para o papel `authenticated`. Também insere produtos iniciais no cardápio sem duplicar nomes existentes.

O frontend usa somente a URL do projeto e a chave pública. A chave pública não substitui as políticas do banco: a proteção dos dados depende de RLS e das permissões configuradas no Supabase. O projeto não implementa cadastro de usuários na interface; crie ou convide a conta administrativa pelo painel do Supabase e mantenha o registro de usuários restrito a pessoas autorizadas.

## Build e publicação no Render

Para gerar os arquivos estáticos de produção:

```bash
npm run build
```

O resultado é gravado em `dist/`. A configuração em `render.yaml` publica essa pasta e define `npm install && npm run build` como comando de build. As duas variáveis abaixo também estão declaradas no Blueprint do Render como valores que precisam ser fornecidos pelo responsável pelo serviço:

- `VITE_SUPABASE_URL`: URL do projeto Supabase.
- `VITE_SUPABASE_ANON_KEY`: chave pública (`anon` ou publishable) do projeto.

No serviço do Render, cadastre esses valores em **Environment** e execute um novo deploy após salvá-los. Como a hospedagem é estática, o Vite incorpora as variáveis durante o build; apenas defini-las depois de um deploy não altera os arquivos que já foram publicados. Se o deploy ainda exibir “Supabase não configurado”, confirme os nomes exatos das variáveis, confira se o build foi executado depois da configuração e verifique os logs de build. Não defina nem publique uma chave `service_role`.

O domínio `loshermanosprojeto.onrender.com` está permitido no servidor de desenvolvimento e no preview do Vite. A publicação estática do Render serve os arquivos compilados; ela não executa o servidor Vite em produção.

## Escopo atual e próximos passos

As telas de pedidos, vendas e estoque ainda usam conteúdo demonstrativo. As ações exibidas nessas áreas não criam nem atualizam dados no banco. A integração seguinte deve conectar essas operações às tabelas correspondentes, com validação, estados de carregamento e tratamento de falhas. A integração com WhatsApp também permanece como objetivo futuro e depende da definição de um provedor e do fluxo de comunicação.
