# Rota Criativa Caruaru

O Rota Criativa Caruaru é um projeto de site para ajudar as pessoas a conhecer lugares, atividades culturais e experiências na cidade de Caruaru, e, que os colaboradores tenham algo em um so lugar para conseguir clientes. A ideia é reunir essas informações em um só lugar, facilitando a busca e valorizando a cultura e os negócios locais.
#

Rota Criativa Caruaru
Projeto de um site para mostrar lugares e experiências em Caruaru. Por enquanto é só uma demonstração, com informações fictícias.
O que foi usado
- Node.js
- Express
- EJS
- CSS
- JavaScript
Como rodar
Precisa ter o Node.js 20 ou superior instalado.

Abra a pasta do projeto no VS Code e rode no terminal:
npm install
npm start
Depois abra no navegador:

http://localhost:3000

O projeto roda pelo Node.js. Não precisa usar o Go Live nem abrir os arquivos EJS diretamente.

Para rodar no modo de desenvolvimento:
npm run dev
Para parar o servidor, aperte Ctrl + C no terminal.
Telas
- Entrada: apresentação do site e telas de login, cadastro e recuperação de senha.
- Explorar: lista de experiências, busca, filtros e detalhes.
- Meu espaço: perfil, interesses e formulário de parceria.
Pastas principais
- views: páginas do site.
- public: CSS, JavaScript e imagens.
- routes: rotas das páginas.
- controllers: código que abre as páginas.
- services: espaço para usar depois.
- server.js: arquivo que inicia o servidor.
O que falta
Ainda não tem banco de dados nem login funcionando de verdade. Os formulários são só para demonstração e não enviam e-mail.

As alterações no perfil somem ao sair da página ou recarregar. Os interesses ficam guardados temporariamente no navegador.

O mapa é ilustrativo e os contatos não fazem envio real. Os preços, horários e endereços também são exemplos.

O projeto tem configuração de PWA, mas a instalação no celular ainda precisa ser testada. Sem internet, ele mostra um aviso para conectar novamente.

A ideia é conectar com PostgreSQL depois e fazer o cadastro, login e os outros recursos funcionarem de verdade.