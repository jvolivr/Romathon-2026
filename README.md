# Rota Criativa Caruaru

O Rota Criativa Caruaru ajuda as pessoas a encontrar serviços e experiências locais, como guias, artesãos, espaços culturais e restaurantes.

Este é um protótipo com Node.js, Express, EJS, JavaScript, CSS e PostgreSQL.

## Como rodar no Windows

Precisa ter Node.js 22.5 ou superior e PostgreSQL funcionando.

1. Se o banco `rota_criativa` já existe com as quatro tabelas, não precisa recriar nada.
2. Para um integrante que ainda não tem o banco: execute `CREATE DATABASE rota_criativa;` separadamente no pgAdmin. Depois abra o Query Tool **desse banco** e execute `data/rota_criativa.sql`.
3. No VS Code, copie `.env.example` para `.env` e preencha a senha do PostgreSQL local. No PowerShell:

```powershell
Copy-Item .env.example .env
```

As variáveis são `PORT`, `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER` e `PGPASSWORD`. Não envie o `.env` para o GitHub.

4. No terminal da pasta do projeto:

```powershell
npm install
npm start
```

Abra http://localhost:3000. Não use Go Live para abrir EJS. Para parar, pressione Ctrl + C. Para desenvolvimento, use `npm run dev`.

## O que está conectado

- Cadastro, login, logout e edição de nome/e-mail.
- Alteração de senha, conferindo a senha atual.
- Um serviço por conta, com os campos de cada tipo.
- Catálogo, busca, filtros e detalhes dos serviços cadastrados.
- Interesses separados por conta, preservados depois de sair e entrar.
- Contato exibido exatamente como texto cadastrado, sem abrir links automaticamente.

O servidor usa a conta da sessão. IDs de usuário enviados pelo navegador não escolhem a conta alterada. As senhas usam scrypt e salt; o banco guarda apenas o hash do token de sessão. As consultas são parametrizadas.

O SQL não foi alterado. O sistema não cria nem apaga o banco ao iniciar. Contas antigas do SQLite **não foram migradas**, e seus arquivos não são apagados.

Cada integrante usa um banco independente: o cadastro feito em um computador não aparece nos outros.

## Pastas e arquivos

- `services/db.js`: conexão compartilhada com pg e dotenv.
- `services/auth.js`: contas, senhas e sessões.
- `services/catalog.js`: serviços e interesses.
- `services/validation.js`: validações do servidor.
- `routes/web.js`: páginas e APIs.
- `public/js`: formulários, catálogo, cartões e interesses.
- `views`: páginas EJS com o layout existente.
- `data/rota_criativa.sql`: tabelas para instalação manual.
- `tests`: verificações automatizadas.

## Testar

```powershell
npm test
```

Os testes básicos não precisam do banco. O teste de integração fica marcado como ignorado por padrão. Para executá-lo, use **um banco separado de testes**, já criado no PostgreSQL:

```powershell
$env:PGDATABASE = "rota_criativa_testes"
$env:RUN_DATABASE_TESTS = "1"
npm test
Remove-Item Env:RUN_DATABASE_TESTS
Remove-Item Env:PGDATABASE
```

O teste de integração cria um schema exclusivo, executa o SQL nele e remove apenas esse schema ao terminar. O usuário PostgreSQL precisa poder criar schemas. Não aponte esse teste para seu banco de apresentação.

Fluxo manual: criar conta A → cadastrar serviço → sair → criar conta B → buscar serviço → salvar interesse → sair e entrar novamente → conferir Meu espaço. Teste também remoção de interesse, edição de perfil, alteração de senha e tentativa de cadastrar um segundo serviço.

Se aparecer “Não foi possível acessar os dados”, confira se o PostgreSQL está ligado, se o `.env` está correto e se as tabelas foram criadas no banco indicado. Reinicie o Express após mudar o `.env`.

## Limites do protótipo

Não há recuperação de senha por e-mail, reservas, pagamento, chat, upload ou aprovação de parceiros. Não há edição de anúncio nesta versão.

O catálogo antigo fictício permanece no repositório apenas como arquivo legado; a aplicação não o carrega nem o usa quando o banco falha. O mapa com posições fictícias foi retirado da tela, e as imagens são ilustrações fixas por tipo. Não são apresentados preços ou condições de acesso inventados.

A PWA guarda apenas arquivos estáticos. Páginas e APIs não são armazenadas pelo service worker. É necessário estar conectado ao servidor para consultar os dados.

Esta integração foi produzida com auxílio de IA para prototipagem. Isso não comprova elegibilidade para submissão ao Romathon 2026; observe a restrição de código e SQL gerados por IA informada no regulamento.
