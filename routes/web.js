import { Router } from 'express';
import { entrada, explorar, meuEspaco } from '../controllers/PaginasController.js';

const router = Router();

router.use((req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
router.get('/', entrada);
router.get('/explorar', explorar);
router.get('/meu-espaco', meuEspaco);
export default router;
