if ('serviceWorker' in navigator && window.isSecureContext) {
    window.addEventListener('load', () => { navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => console.info('PWA indisponível neste contexto. A interface continua disponível.')); });
}
let installEvent;
const buttons = document.querySelectorAll('.install');
const standalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault(); if (standalone()) return;
    installEvent = event; buttons.forEach(button => { button.hidden = false; });
});
buttons.forEach(button => button.addEventListener('click', async () => {
    if (!installEvent) return;
    const prompt = installEvent; installEvent = null; buttons.forEach(b => { b.hidden = true; });
    try { await prompt.prompt(); await prompt.userChoice; } catch { /* Instalação é opcional. */ }
}));
window.addEventListener('appinstalled', () => { installEvent = null; buttons.forEach(b => { b.hidden = true; }); });
