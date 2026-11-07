import { getItem } from './data/repository.js';
import { interestButton, escapeHTML as e } from './cards.js';
const dialog = document.querySelector('#modal');
const body = document.querySelector('#modal-body');
let opener;
let openerSelector;
let cleanup;
let currentItem;
export function notify(message) {
    const toast = document.querySelector('#toast');
    toast.textContent = message; toast.hidden = false;
    clearTimeout(notify.timer); notify.timer = setTimeout(() => { toast.hidden = true; }, 6500);
}
export function openModal(content, onClose) {
    if (!dialog.open) {
        opener = document.activeElement;
        const region = opener.closest('#markers, #cards, #interests');
        openerSelector = region && opener.dataset.detail ? `#${region.id} [data-detail="${opener.dataset.detail}"]` : null;
    }
    if (cleanup) cleanup();
    body.innerHTML = content; cleanup = onClose; currentItem = null;
    if (!dialog.open) dialog.showModal();
    document.body.classList.add('modal-open');
    (body.querySelector('input, select, textarea, button') || document.querySelector('#close-modal')).focus();
}
export function closeModal() { dialog.close(); }
document.querySelector('#close-modal').addEventListener('click', closeModal);
dialog.addEventListener('close', () => {
    if (cleanup) cleanup(); cleanup = null; currentItem = null;
    body.querySelectorAll('input[type="password"]').forEach(input => { input.value = ''; });
    body.replaceChildren(); document.body.classList.remove('modal-open');
    if (opener?.isConnected) opener.focus();
    else {
        const replacement = openerSelector && document.querySelector(openerSelector);
        const fallback = [...document.querySelectorAll('#conteudo a, #conteudo button, #conteudo input')].find(el => el.getClientRects().length);
        (replacement || fallback)?.focus();
    }
});
dialog.addEventListener('keydown', event => {
    if (event.key !== 'Tab') return;
    const nodes = [...dialog.querySelectorAll('button,a[href],input,select,textarea,[tabindex="0"]')].filter(n => !n.disabled && n.getClientRects().length);
    const first = nodes[0], last = nodes.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
});
export function showDetails(id) {
    const item = getItem(id); if (!item) return;
    const facts = { ...item.details, ...(item.address ? { 'Endereço': item.address } : {}) };
    openModal(`<img class="detail-image" src="${e(item.image)}" alt="${e(item.imageAlt)}"><span class="eyebrow">${e(item.category)} · ${e(item.neighborhood)}</span><h2 id="modal-title">${e(item.name)}</h2><p>${e(item.description)}</p><dl class="detail-facts">${Object.entries(facts).map(([key,value]) => `<div><dt>${e(key)}</dt><dd>${e(value)}</dd></div>`).join('')}</dl><div class="modal-actions"><span id="detail-save">${interestButton(item,true)}</span><button class="primary" data-contact>Contatar ↗</button></div><p id="contact-notice" role="status"></p>`);
    currentItem = item;
}
document.addEventListener('interestschange', () => {
    if (!currentItem || !dialog.open) return;
    const focused = document.activeElement.closest('[data-save]');
    document.querySelector('#detail-save').innerHTML = interestButton(currentItem, true);
    if (focused) document.querySelector('#detail-save button').focus();
});
document.addEventListener('click', event => {
    const detail = event.target.closest('[data-detail]'); if (detail) showDetails(detail.dataset.detail);
    if (event.target.closest('[data-contact]')) document.querySelector('#contact-notice').textContent = currentItem?.contact || 'Contato não informado.';
});
