import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { app } from '../server.js';
import { pool } from '../services/db.js';

// Use apenas em um banco de TESTES: cria e remove um schema exclusivo.
test('Fluxo HTTP com duas contas e persistência SQL', { skip: process.env.RUN_DATABASE_TESTS !== '1' }, async () => {
  const client = await pool.connect();
  const schema = `teste_rota_${Date.now()}`;
  const originalQuery = pool.query;
  let server;
  try {
    await client.query(`CREATE SCHEMA ${schema}`);
    await client.query(`SET search_path TO ${schema}`);
    await client.query(await readFile(new URL('../data/rota_criativa.sql',import.meta.url),'utf8'));
    pool.query = client.query.bind(client);
    server = app.listen(0,'127.0.0.1');
    await new Promise(resolve => server.once('listening',resolve));
    const base = `http://127.0.0.1:${server.address().port}`;
    async function request(path, method = 'GET', body, cookie = '') {
      const response = await fetch(base+path,{method,headers:{'Content-Type':'application/json',Cookie:cookie},body:body ? JSON.stringify(body) : undefined});
      return { status:response.status, data:response.headers.get('content-type')?.includes('application/json') ? await response.json() : await response.text(), cookie:response.headers.get('set-cookie')?.split(';')[0], cache:response.headers.get('cache-control') };
    }
    const a = await request('/api/register','POST',{name:'Conta A',email:'a@example.com',password:'senha1234'});
    assert.equal(a.status,201); assert.equal(typeof a.data.user.id,'number');
    assert.deepEqual(Object.keys(a.data.user).sort(),['email','id','name']);
    assert.equal((await request('/api/register','POST',{name:'Duplicada',email:' A@EXAMPLE.COM ',password:'senha1234'})).status,409);
    assert.equal((await request('/api/login','POST',{email:'a@example.com',password:'errada'})).status,401);
    assert.equal((await request('/api/services')).data.items.length,0);
    const service = {type:'oficina',name:'<b>Barro</b>',description:'Oficina de cerâmica',neighborhood:'Centro',contact:'javascript:alert(1)',activity:'Modelagem',duration:'2 horas'};
    assert.equal((await request('/api/services','POST',service)).status,401);
    assert.equal((await request('/api/services','POST',{...service,type:'feira'},a.cookie)).status,400);
    const created = await request('/api/services','POST',{...service,id_usuario:999},a.cookie);
    assert.equal(created.status,201);
    const id = created.data.item.id;
    assert.equal((await request(`/api/services/${id}`,'PUT',{name:'Invadido'},a.cookie)).status,404);
    assert.equal((await client.query('SELECT id_usuario FROM servico WHERE id_servico=$1',[id])).rows[0].id_usuario,a.data.user.id);
    assert.equal((await request('/api/services','POST',service,a.cookie)).status,409);
    assert.equal((await request('/api/services')).data.items[0].details.Atividade,'Modelagem');
    await request('/api/logout','POST',undefined,a.cookie);
    assert.equal((await request('/api/profile','PUT',{name:'Falha',email:'x@example.com'},a.cookie)).status,401);
    const b = await request('/api/register','POST',{name:'Conta B',email:'b@example.com',password:'senha1234'});
    assert.equal((await request('/api/profile','PUT',{name:'Conta B',email:'A@EXAMPLE.COM'},b.cookie)).status,409);
    const edit = await request('/api/profile','PUT',{id_usuario:a.data.user.id,name:'B editada',email:'b2@example.com'},b.cookie);
    assert.equal(edit.data.user.id,b.data.user.id);
    assert.equal((await client.query('SELECT nome FROM usuario WHERE id_usuario=$1',[a.data.user.id])).rows[0].nome,'Conta A');
    assert.equal((await request(`/api/interests/${id}`,'PUT',undefined,b.cookie)).status,200);
    await request(`/api/interests/${id}`,'PUT',undefined,b.cookie);
    assert.deepEqual((await request('/api/interests','GET',undefined,b.cookie)).data.ids,[id]);
    assert.equal((await request('/api/interests/99999','PUT',undefined,b.cookie)).status,404);
    assert.equal((await request('/api/interests/barro-vivo','PUT',undefined,b.cookie)).status,400);
    const aLogin = await request('/api/login','POST',{email:'A@example.com',password:'senha1234'});
    assert.deepEqual((await request('/api/interests','GET',undefined,aLogin.cookie)).data.ids,[]);
    await request(`/api/interests/${id}`,'DELETE',{id_usuario:b.data.user.id},aLogin.cookie);
    assert.deepEqual((await request('/api/interests','GET',undefined,b.cookie)).data.ids,[id]);
    assert.equal((await request('/api/password','PUT',{current:'errada',password:'nova1234'},b.cookie)).status,400);
    assert.equal((await request('/api/password','PUT',{current:'senha1234',password:'curta'},b.cookie)).status,400);
    const before = (await client.query('SELECT salt,senha_hash FROM usuario WHERE id_usuario=$1',[b.data.user.id])).rows[0];
    assert.equal((await request('/api/password','PUT',{id_usuario:a.data.user.id,current:'senha1234',password:'nova1234'},b.cookie)).status,200);
    const after = (await client.query('SELECT salt,senha_hash FROM usuario WHERE id_usuario=$1',[b.data.user.id])).rows[0];
    assert.notEqual(after.salt,before.salt); assert.notEqual(after.senha_hash,before.senha_hash); assert.notEqual(after.senha_hash,'nova1234');
    await request('/api/logout','POST',undefined,b.cookie);
    assert.equal((await request('/api/login','POST',{email:'b2@example.com',password:'senha1234'})).status,401);
    const again = await request('/api/login','POST',{email:'b2@example.com',password:'nova1234'});
    assert.equal(again.status,200);
    for (const path of ['/', '/explorar', '/meu-espaco']) {
      const page = await fetch(base+path,{headers:{Cookie:again.cookie}});
      assert.equal(page.status,200);
      assert.equal(page.headers.get('cache-control'),'no-store');
      assert.ok((await page.text()).includes('Rota Criativa'));
    }
    assert.deepEqual((await request('/api/interests','GET',undefined,again.cookie)).data.ids,[id]);
    assert.equal((await request(`/api/interests/${id}`,'DELETE',undefined,again.cookie)).status,200);
    assert.deepEqual((await request('/api/interests','GET',undefined,again.cookie)).data.ids,[]);
    await client.query('UPDATE sessao SET expira_em=CURRENT_TIMESTAMP - INTERVAL \'1 day\' WHERE id_usuario=$1',[b.data.user.id]);
    assert.equal((await request('/api/interests','GET',undefined,again.cookie)).status,401);
    pool.query = async () => { throw new Error('segredo que não deve aparecer'); };
    const unavailable = await request('/api/services');
    assert.equal(unavailable.status,503); assert.equal(unavailable.cache,'no-store');
    assert.ok(!JSON.stringify(unavailable.data).includes('segredo'));
  } finally {
    pool.query = originalQuery;
    if (server) await new Promise(resolve => server.close(resolve));
    await client.query('SET search_path TO public');
    await client.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
    client.release(); await pool.end();
  }
});
