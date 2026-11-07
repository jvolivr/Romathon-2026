import { catalogo } from './catalogo.js';
// Ponto de substituição pelo acesso ao catálogo do monolito futuro.
export const getCatalog = () => catalogo;
export const getItem = id => catalogo.find(item => item.id === id);
