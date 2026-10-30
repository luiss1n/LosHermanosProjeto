# LOS HERMANOS — Painel de operação

## Visão geral

O LOS HERMANOS é um painel web para apoiar a operação de pequenas lanchonetes. A proposta é reunir em um único sistema o acompanhamento de pedidos, o cardápio, as vendas e o controle de estoque. Em etapas futuras, o projeto poderá integrar canais de atendimento, como o WhatsApp, para registrar pedidos e enviar atualizações aos clientes e entregadores.

O repositório contém a primeira versão da interface operacional e a integração com o Supabase. O acesso ao painel é feito pelo Supabase Auth. Pedidos e cardápio são lidos do banco, e o estoque permite cadastrar ingredientes e atualizar seus saldos disponíveis.

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
- Leitura de pedidos reais da tabela `public.orders`; uma base sem pedidos aparece vazia.
- Leitura dos produtos ativos na tabela `public.products`, ordenados pelo nome.
- Cadastro de ingredientes e quantidades disponíveis na tabela `public.ingredients`.
- Atualização do saldo disponível de cada ingrediente.
- Exibição de preços armazenados em centavos.
- As métricas fictícias e os pedidos de exemplo foram removidos.
- As receitas ainda não estão relacionadas aos ingredientes; a baixa automática do estoque será implementada após o cadastro das quantidades por lanche.

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

O arquivo [`supabase/schema.sql`](supabase/schema.sql) define as tabelas `products`, `orders`, `order_items` e `ingredients`. Ele habilita RLS, remove as políticas anônimas legadas conhecidas e restringe leitura e escrita a usuários autenticados cuja claim `app_metadata.role` seja `admin`. Também insere os produtos iniciais do cardápio sem duplicar nomes existentes. A tabela de ingredientes não recebe registros iniciais, portanto o estoque começa vazio e deve ser preenchido com os itens e saldos reais. Depois de atualizar as políticas, execute o SQL no editor do Supabase e encerre/inicie a sessão do painel para renovar o token de acesso.

O frontend usa somente a URL do projeto e a chave pública. A chave pública não substitui as políticas do banco: a proteção dos dados depende de RLS e das permissões configuradas no Supabase. As políticas do esquema exigem que o usuário autenticado tenha a claim `app_metadata.role` definida como `admin`. Cadastre ou convide a conta no Supabase Auth e atribua essa claim administrativa pelo painel do Supabase; não use `user_metadata` para autorização, pois o próprio usuário pode alterar esse campo. O projeto não implementa cadastro de usuários na interface.

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

Pedidos são exibidos a partir do banco, mas a criação e a alteração de pedidos ainda não estão disponíveis no painel. As métricas de vendas ainda não foram implementadas. O estoque permite cadastrar ingredientes e atualizar suas quantidades disponíveis; ele ainda não desconta ingredientes ao registrar vendas. Essa automação depende do mapeamento das receitas de cada lanche. A integração com WhatsApp permanece como objetivo futuro e depende da definição de um provedor e do fluxo de comunicação.
