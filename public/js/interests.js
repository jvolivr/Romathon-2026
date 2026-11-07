let ids = new Set();
const pending = new Set();
export const hasInterest = id => ids.has(Number(id));
export const getInterests = () => [...ids];
export async function loadInterests() {
    const response = await fetch('/api/interests', { cache: 'no-store' });
    if (response.status === 401) { ids.clear(); return; }
    const result = await response.json();
    if (!response.ok) throw new Error(result.error);
    ids = new Set(result.ids);
}
export async function toggleInterest(value) {
    const id = Number(value);
    if (pending.has(id)) return;
    pending.add(id);
    try {
        const saved = ids.has(id);
        const response = await fetch(`/api/interests/${id}`, { method: saved ? 'DELETE' : 'PUT' });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error);
        saved ? ids.delete(id) : ids.add(id);
        document.dispatchEvent(new CustomEvent('interestschange'));
    } finally { pending.delete(id); }
}
