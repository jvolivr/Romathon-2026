let items = [];
export const categorias = ['Todos', 'Guia turístico', 'Artesão ou oficina', 'Feira ou espaço cultural', 'Restaurante'];
export const getCatalog = () => items;
export const getItem = id => items.find(item => item.id === Number(id));
export async function loadCatalog() {
    const response = await fetch('/api/services', { cache: 'no-store' });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error);
    items = result.items;
    return items;
}
