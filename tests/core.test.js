import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { catalogo, categorias } from '../public/js/data/catalogo.js';
import { filterCatalog } from '../public/js/filters.js';

test('Busca ignora acentos, combina categoria e pesquisa bairro', () => {
 assert.equal(filterCatalog(catalogo,'BARRO','Oficinas')[0].id,'barro-vivo');
 assert.equal(filterCatalog(catalogo,'mauricio','Alimentação')[0].id,'mesa-sertao');
 assert.equal(filterCatalog(catalogo,'barro','Cultura').length,0);
 assert.equal(filterCatalog(catalogo,'').length,7);
 assert.equal(filterCatalog(catalogo,'inexistente').length,0);
});
test('Catálogo possui IDs únicos, categorias completas e imagens locais', () => {
 assert.equal(new Set(catalogo.map(i=>i.id)).size,catalogo.length);
 for (const c of categorias.slice(1)) assert.ok(catalogo.some(i=>i.category===c));
 for (const item of catalogo) {
  assert.ok(readFileSync(new URL('../public'+item.image,import.meta.url)).length);
  assert.equal(item.contactUrl,null);
  for (const id of item.relatedGuides) assert.ok(catalogo.some(i=>i.id===id && i.type==='guia'));
 }
});
function worker(fetchImpl) {
 const listeners = {}; const deleted = []; const precache = [];
 const cache = { addAll: async a=>precache.push(...a), match: async path=> path === '/offline.html' ? 'OFFLINE' : 'STATIC' };
 const context = { URL, fetch: fetchImpl, caches: { open: async()=>cache, keys: async()=>['other-app-v1','rota-criativa-public-v0','rota-criativa-public-v1'], delete: async key=>deleted.push(key) }, self: { location:{origin:'https://example.com'}, clients:{claim:async()=>{}}, addEventListener:(name,fn)=>listeners[name]=fn } };
 vm.runInNewContext(readFileSync(new URL('../public/sw.js',import.meta.url),'utf8'), context);
 return { listeners, deleted, precache };
}
test('Service worker só prepara estáticos e remove caches próprios', async () => {
 const w = worker(async()=>({status:200})); let done;
 w.listeners.install({waitUntil:p=>done=p}); await done;
 assert.ok(w.precache.includes('/offline.html'));
 assert.ok(!w.precache.some(p=>['/','/explorar','/meu-espaco'].includes(p) || p.startsWith('/api')));
 for (const path of w.precache) assert.ok(readFileSync(new URL('../public'+path,import.meta.url)).length);
 w.listeners.activate({waitUntil:p=>done=p}); await done;
 assert.deepEqual(w.deleted,['rota-criativa-public-v0']);
});
test('Service worker preserva erros HTTP, ignora APIs/POST/externos e usa fallback de rede', async () => {
 let intercepted;
 const request = { url:'https://example.com/explorar',method:'GET',mode:'navigate' };
 const w = worker(async()=>({status:500}));
 w.listeners.fetch({request,respondWith:p=>intercepted=p}); assert.equal((await intercepted).status,500);
 for(const extra of [{url:'https://example.com/api/catalogo'}, {url:'https://outside.com/css/style.css'}, {method:'POST'}]) {
  intercepted = undefined; w.listeners.fetch({request:{...request,...extra},respondWith:p=>intercepted=p}); assert.equal(intercepted,undefined);
 }
 const off = worker(async()=>{throw new TypeError('offline');}); off.listeners.fetch({request,respondWith:p=>intercepted=p}); assert.equal(await intercepted,'OFFLINE');
});
test('Manifesto e PNGs válidos com dimensões declaradas', () => {
 const manifest = JSON.parse(readFileSync(new URL('../public/manifest.webmanifest',import.meta.url)));
 assert.equal(manifest.start_url,'/'); assert.equal(manifest.scope,'/'); assert.equal(manifest.display,'standalone');
 for(const icon of manifest.icons) {
  const png=readFileSync(new URL('../public'+icon.src,import.meta.url)); assert.equal(png.subarray(1,4).toString(),'PNG');
  assert.equal(`${png.readUInt32BE(16)}x${png.readUInt32BE(20)}`,icon.sizes);
 }
});
