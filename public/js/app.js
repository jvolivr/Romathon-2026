import { getCatalog, getItem } from './data/repository.js';
import { categorias } from './data/catalogo.js';
import { filterCatalog } from './filters.js';
import { card } from './cards.js';
import { getInterests, toggleInterest, clearInterests, canStore } from './interests.js';
import { notify } from './modals.js';
import './forms.js?v=2';
import './pwa.js';
const items = getCatalog();
let category = 'Todos';
let query = '';
let mode = 'list';
const search = document.querySelector('#search');
function renderExplore() {
    if (!search) return;
    const filtered = filterCatalog(items, query, category);
    document.querySelector('#result-count').textContent = `${filtered.length} ${filtered.length === 1 ? 'experiência para descobrir' : 'experiências para descobrir'}`;
    document.querySelector('#cards').innerHTML = filtered.map(card).join('');
    document.querySelector('#cards').hidden = mode !== 'list' || !filtered.length;
    document.querySelector('#map').hidden = mode !== 'map' || !filtered.length;
    document.querySelector('#empty').hidden = Boolean(filtered.length);
    document.querySelector('#markers').innerHTML = filtered.map(item => `<button class="marker" style="--x:${item.position.x}%;--y:${item.position.y}%" data-detail="${item.id}" aria-label="Ver detalhes de ${item.name}"><span aria-hidden="true">⌖</span><small>${item.name}</small></button>`).join('');
}
function renderInterests() {
    document.querySelectorAll('.saved-count').forEach(node => { node.textContent = getInterests().length; });
    const container = document.querySelector('#interests'); if (!container) return;
    container.innerHTML = getInterests().map(getItem).filter(Boolean).map(card).join('');
    document.querySelector('#interest-empty').hidden = Boolean(getInterests().length);
    document.querySelector('#interest-count').textContent = getInterests().length;
}
function reset() { query = ''; category = 'Todos'; search.value = ''; syncCategories(); renderExplore(); }
function syncCategories() { document.querySelectorAll('[data-category]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.category === category))); }
if (search) {
    document.querySelector('#categories').innerHTML = categorias.map((name, i) => `<button data-category="${name}" aria-pressed="${i === 0}">${name}</button>`).join('');
    search.addEventListener('input', () => { query = search.value; renderExplore(); });
    document.querySelector('#categories').addEventListener('click', event => { const button = event.target.closest('[data-category]'); if (!button) return; category = button.dataset.category; syncCategories(); renderExplore(); });
    document.querySelector('#clear-filters').addEventListener('click', reset);
    document.querySelector('[data-clear]').addEventListener('click', () => { reset(); search.focus(); });
    for (const view of ['list', 'map']) document.querySelector(`#${view}-view`).addEventListener('click', () => { mode = view; for (const v of ['list', 'map']) document.querySelector(`#${v}-view`).setAttribute('aria-pressed', String(v === view)); renderExplore(); });
    renderExplore();
}
renderInterests();
document.addEventListener('click', event => {
    const save = event.target.closest('[data-save]');
    if (save) { toggleInterest(save.dataset.save); if (!canStore()) notify('Armazenamento indisponível. Interesses mantidos apenas nesta página.'); }
});
document.addEventListener('interestschange', () => {
    const focused = document.activeElement;
    const id = focused?.dataset.save;
    const inCards = focused?.closest('#cards, #interests');
    renderExplore(); renderInterests();
    if (id && inCards) {
        const replacement = [...document.querySelectorAll('#cards [data-save], #interests [data-save]')].find(b => b.dataset.save === id);
        (replacement || document.querySelector('#interests button, #interest-empty a'))?.focus();
    }
});
document.querySelector('#exit-demo')?.addEventListener('click', async () => { clearInterests(); await fetch('/api/logout', { method: 'POST' }); location.replace('/'); });
if (!canStore()) notify('Armazenamento indisponível. Os interesses durarão apenas nesta página.');
