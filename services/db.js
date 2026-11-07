import 'dotenv/config';
import pg from 'pg';

// pg lê PGHOST, PGPORT, PGDATABASE, PGUSER e PGPASSWORD do .env.
export const pool = new pg.Pool({ connectionTimeoutMillis: 5000 });
pool.on('error', () => console.error('Conexão PostgreSQL interrompida.'));
