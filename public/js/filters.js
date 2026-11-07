export const normalize = text => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
export function filterCatalog(items, query = '', category = 'Todos') {
    const term = normalize(query.trim());
    return items.filter(item => (category === 'Todos' || item.category === category) && normalize([item.name, item.description, item.category, item.neighborhood].join(' ')).includes(term));
}
