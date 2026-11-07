import { Router } from 'express';
import { entrada, explorar, meuEspaco } from '../controllers/PaginasController.js';
import { register, login, logout, setSession, clearSession, updateProfile, changePassword, sessionToken, loadAuth } from '../services/auth.js';
import { listServices, createService, listInterests, saveInterest, removeInterest } from '../services/catalog.js';
const router = Router();
router.use((req, res, next) => { res.set('Cache-Control','no-store'); next(); });
router.use(loadAuth);
router.get('/', entrada);
router.get('/explorar', explorar);
router.get('/meu-espaco', meuEspaco);
router.post('/api/register', async (req,res) => {
  const user = await register(req.body || {});
  const session = await login({ email:user.email, password:req.body.password });
  setSession(res,session.token); res.status(201).json({user:session.user});
});
router.post('/api/login', async (req,res) => {
  const session = await login(req.body || {}); setSession(res,session.token); res.json({user:session.user});
});
router.post('/api/logout', async (req,res) => {
  await logout(sessionToken(req)); clearSession(res); res.json({ok:true});
});
router.get('/api/services', async (req,res) => res.json({items:await listServices()}));
// A partir daqui, todas as operações usam exclusivamente a conta da sessão.
router.use('/api', (req,res,next) => req.user ? next() : res.status(401).json({error:'Entre na sua conta para continuar.'}));
router.put('/api/profile', async (req,res) => res.json({user:await updateProfile(req.user.id,req.body || {})}));
router.put('/api/password', async (req,res) => { await changePassword(req.user.id,req.body || {}); res.json({ok:true}); });
router.post('/api/services', async (req,res) => res.status(201).json({item:await createService(req.user.id,req.body || {})}));
router.get('/api/interests', async (req,res) => res.json({ids:await listInterests(req.user.id)}));
router.put('/api/interests/:id', async (req,res) => { await saveInterest(req.user.id,req.params.id); res.json({ok:true}); });
router.delete('/api/interests/:id', async (req,res) => { await removeInterest(req.user.id,req.params.id); res.json({ok:true}); });
export default router;
