import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { filterCatalog } from '../public/js/filters.js';
import { categorias } from '../public/js/data/repository.js';
import { card } from '../public/js/cards.js';
import { profile, password, serviceId } from '../services/validation.js';

test('Busca ignora acentos e combina categoria e bairro', () => {
 const items = [{id:1,name:'Barro',description:'Oficina',neighborhood:'Centro',category:'Artesão ou oficina'}, {id:2,name:'Mesa',description:'Almoço',neighborhood:'Maurício',category:'Restaurante'}];
 assert.equal(filterCatalog(items,'MAURICIO','Restaurante')[0].id,2);
 assert.equal(filterCatalog(items,'barro','Restaurante').length,0);
 assert.equal(filterCatalog(items,'').length,2);
 assert.equal(filterCatalog([], '').length,0);
 assert.equal(categorias.length,5);
});
test('Cartões escapam conteúdo cadastrado e não inventam preços', () => {
 const html = card({id:1,name:'<script>alert(1)</script>',description:'<img onerror="alert(1)">',neighborhood:'<b>Centro</b>',category:'Restaurante',image:'/images/sabores.svg',imageAlt:'Ilustração'});
 assert.ok(!html.includes('<script>'));
 assert.ok(!html.includes('<img onerror'));
 assert.ok(html.includes('&lt;b&gt;Centro'));
 assert.ok(!html.includes('Valor ilustrativo'));
});
test('Validação de perfil, senha e IDs', () => {
 assert.equal(profile({name:' JV ',email:' JV@EXAMPLE.COM '}).email,'jv@example.com');
 for (const value of ['curta','a'.repeat(129),{},null]) assert.throws(()=>password(value));
 assert.equal(password('a'.repeat(128)).length,128);
 for (const value of ['1 OR 1=1','barro-vivo',0,-1,'2147483648']) assert.throws(()=>serviceId(value));
 assert.equal(serviceId('12'),12);
 assert.throws(()=>profile({name:'J',email:'invalido'}));
});
function worker(fetchImpl) {
 const listeners = {}; const deleted = []; const precache = [];
 const cache = { addAll: async a=>precache.push(...a), match: async path=> path === '/offline.html' ? 'OFFLINE' : 'STATIC' };
 const context = { URL, fetch: fetchImpl, caches: { open: async()=>cache, keys: async()=>['other-app-v1','rota-criativa-public-v0','rota-criativa-public-v1'], delete: async key=>deleted.push(key) }, self: { skipWaiting:async()=>{}, location:{origin:'https://example.com'}, clients:{claim:async()=>{}}, addEventListener:(name,fn)=>listeners[name]=fn } };
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
 assert.deepEqual(w.deleted,['rota-criativa-public-v0','rota-criativa-public-v1']);
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
