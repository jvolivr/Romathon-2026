import { getItem, loadCatalog, categorias } from './data/repository.js';
import { filterCatalog } from './filters.js';
import { card } from './cards.js';
import { getInterests, toggleInterest, loadInterests } from './interests.js';
import { notify } from './modals.js';
import './forms.js';
import './pwa.js';
let items = [];
let catalogError = '';
let category = 'Todos';
let query = '';
const search = document.querySelector('#search');
function renderExplore() {
    if (!search) return;
    if (catalogError) {
        document.querySelector('#result-count').textContent = catalogError;
        document.querySelector('#cards').hidden = true;
        document.querySelector('#empty').hidden = true;
        return;
    }
    const filtered = filterCatalog(items, query, category);
    document.querySelector('#result-count').textContent = `${filtered.length} ${filtered.length === 1 ? 'experiência para descobrir' : 'experiências para descobrir'}`;
    document.querySelector('#cards').innerHTML = filtered.map(card).join('');
    document.querySelector('#cards').hidden = !filtered.length;
    document.querySelector('#empty').hidden = Boolean(filtered.length);
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
    renderExplore();
}
renderInterests();
document.addEventListener('click', async event => {
    const save = event.target.closest('[data-save]');
    if (save) { try { await toggleInterest(save.dataset.save); } catch (error) { notify(error.message || 'Não foi possível salvar. Tente novamente.'); } }
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
document.querySelector('#exit-demo')?.addEventListener('click', async () => {
    try {
        const response = await fetch('/api/logout', { method: 'POST' });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error);
        location.replace('/');
    } catch (error) { notify(error.message || 'Não foi possível sair. Tente novamente.'); }
});
async function refresh() {
    if (!search && !document.querySelector('#interests')) return;
    try {
        items = await loadCatalog();
        catalogError = '';
        renderExplore();
    } catch (error) {
        catalogError = error.message || 'Não foi possível carregar os serviços.';
        renderExplore();
        const empty = document.querySelector('#interest-empty');
        if (empty) { empty.hidden = false; empty.textContent = error.message || 'Não foi possível carregar os serviços.'; }
        notify(error.message || 'Não foi possível carregar os serviços.');
        return;
    }
    try { await loadInterests(); renderExplore(); renderInterests(); }
    catch (error) {
        const empty = document.querySelector('#interest-empty');
        if (empty) { empty.hidden = false; empty.textContent = error.message || 'Não foi possível carregar os interesses.'; }
        notify(error.message || 'Não foi possível carregar os interesses.');
    }
}
document.addEventListener('catalogchange', refresh);
refresh();
// Evita restaurar dados de uma conta anterior pelo histórico do navegador.
window.addEventListener('pageshow', event => { if (event.persisted) location.reload(); });
