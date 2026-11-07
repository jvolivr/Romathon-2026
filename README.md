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
Precisa ter o Node.js 22.5 ou superior instalado (o projeto usa SQLite embutido no Node.js).

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
Login e armazenamento
O cadastro, login, sessão e edição de nome/e-mail funcionam com SQLite. O banco é criado automaticamente em `data/rota.sqlite` na primeira execução. Senhas são armazenadas com hash `scrypt`; sessões usam tokens aleatórios guardados como hash e cookie `HttpOnly`.

Use uma senha com pelo menos 8 caracteres. Para limpar os dados locais, pare o servidor e remova o arquivo `data/rota.sqlite`.

A recuperação de senha por e-mail ainda depende da configuração de um serviço de envio.

Os interesses salvos continuam apenas no armazenamento temporário do navegador e não são sincronizados com a conta.

O mapa é ilustrativo e os contatos não fazem envio real. Os preços, horários e endereços também são exemplos.

O projeto tem configuração de PWA, mas a instalação no celular ainda precisa ser testada. Sem internet, ele mostra um aviso para conectar novamente.

