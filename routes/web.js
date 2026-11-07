import { Router } from 'express';
import { entrada, explorar, meuEspaco } from '../controllers/PaginasController.js';
import { register, login, logout, setSession, clearSession, updateProfile } from '../services/auth.js';

const router = Router();

router.use((req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
router.get('/', entrada);
router.get('/explorar', explorar);
router.get('/meu-espaco', meuEspaco);
router.post('/api/register', async (req, res) => {
  try {
    const user = await register(req.body);
    const session = await login({ email: user.email, password: req.body.password });
    setSession(res, session.token); res.status(201).json({ user: session.user });
  } catch (error) { res.status(400).json({ error: error.message }); }
});
router.post('/api/login', async (req, res) => {
  try { const session = await login(req.body); setSession(res, session.token); res.json({ user: session.user }); }
  catch (error) { res.status(401).json({ error: error.message }); }
});
router.post('/api/logout', async (req, res) => {
  const token = req.headers.cookie?.split(';').map(v => v.trim()).find(v => v.startsWith('rota_session='))?.slice('rota_session='.length);
  await logout(token); clearSession(res); res.json({ ok: true });
});
router.put('/api/profile', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Entre na sua conta para continuar.' });
  try { res.json({ user: await updateProfile(req.user.id, req.body) }); }
  catch (error) { res.status(400).json({ error: error.message }); }
});
export default router;
