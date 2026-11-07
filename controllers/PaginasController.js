export const entrada = (req, res) => req.user ? res.redirect('/meu-espaco') : res.render('entrada', { page: 'entrada', title: 'Bem-vindo' });
export const explorar = (req, res) => res.render('explorar', { page: 'explorar', title: 'Explore Caruaru' });
export const meuEspaco = (req, res) => req.user ? res.render('meu-espaco', { page: 'meu-espaco', title: 'Meu espaço' }) : res.redirect('/');
