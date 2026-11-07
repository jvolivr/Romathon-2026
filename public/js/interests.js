import { getItem } from './data/repository.js';
export const STORAGE_KEY = 'rota-criativa:demo:interesses:v1';
let ids = new Set();
let storageAvailable = true;
try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    const saved = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(saved) || saved.some(id => typeof id !== 'string')) throw new Error('Dados inválidos');
    ids = new Set(saved.filter(id => getItem(id)));
} catch { try { sessionStorage.removeItem(STORAGE_KEY); } catch { storageAvailable = false; } }
export const hasInterest = id => ids.has(id);
export const getInterests = () => [...ids];
export const canStore = () => storageAvailable;
export function toggleInterest(id) {
    if (!getItem(id)) return;
    ids.has(id) ? ids.delete(id) : ids.add(id);
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify([...ids])); } catch { storageAvailable = false; }
    document.dispatchEvent(new CustomEvent('interestschange'));
}
export function clearInterests() {
    ids.clear();
    try { sessionStorage.removeItem(STORAGE_KEY); } catch { /* A memória já foi limpa. */ }
}
