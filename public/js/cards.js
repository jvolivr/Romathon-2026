import { hasInterest } from './interests.js';
export const escapeHTML = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
export function interestButton(item, full = false) {
    const saved = hasInterest(item.id);
    return `<button class="${full ? 'secondary' : 'save-button'}" data-save="${item.id}" aria-pressed="${saved}" aria-label="${saved ? 'Remover dos interesses' : 'Salvar interesse'}: ${escapeHTML(item.name)}">${saved ? '♥' : '♡'}${full ? (saved ? ' Remover dos interesses' : ' Salvar interesse') : ''}</button>`;
}
export function card(item) {
    return `<article class="card"><div class="card-image"><img src="${item.image}" alt="${escapeHTML(item.imageAlt)}" loading="lazy" width="800" height="500">${interestButton(item)}<span class="card-tag">${item.category}</span></div><div class="card-content"><p class="location">⌖ ${item.neighborhood}</p><h3>${item.name}</h3><p>${item.description}</p><div class="card-bottom"><div><strong>${item.price}</strong><small>Valor ilustrativo</small></div><button class="text-button" data-detail="${item.id}">Ver detalhes <span aria-hidden="true">↗</span></button></div></div></article>`;
}
