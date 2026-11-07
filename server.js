import 'dotenv/config';
import express from 'express';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import web from './routes/web.js';
import { loadAuth } from './services/auth.js';

const root = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.disable('x-powered-by');
app.set('view engine', 'ejs');
app.set('views', path.join(root, 'views'));
app.use(express.urlencoded({ extended: false, limit: '10kb' }));
app.use(express.json({ limit: '10kb' }));
app.use(loadAuth);
app.use(express.static(path.join(root, 'public'), {
  setHeaders(res, file) {
    if (file.endsWith('sw.js')) res.setHeader('Cache-Control', 'no-cache');
  }
}));

app.use(web);

app.use((req, res) => res.status(404).type('text').send('Página não encontrada.'));

const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
