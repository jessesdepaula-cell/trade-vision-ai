import pg from "pg";

const c = new pg.Client({
  connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

await c.connect();

const size = async (label) => {
  const r = await c.query(`
    SELECT pg_size_pretty(pg_total_relation_size('"Signal"')) AS size,
           COUNT(*)::int AS rows FROM "Signal"
  `);
  console.log(`${label.padEnd(8)} ${r.rows[0].rows.toString().padStart(7)} rows · ${r.rows[0].size}`);
};

await size("ANTES");

// Mantém: TODOS os sinais com hasSetup=true (valor histórico)
//         + 1 sinal NO_SETUP mais recente por (userId, symbol, timeframe, mode)
// Apaga:  NO_SETUP duplicados (antigos do mesmo par/modo)

const r = await c.query(`
  WITH ranked AS (
    SELECT id,
           ROW_NUMBER() OVER (
             PARTITION BY "userId", "symbol", "timeframe", "mode"
             ORDER BY "scannedAt" DESC
           ) AS rn
      FROM "Signal"
     WHERE "hasSetup" = false
  )
  DELETE FROM "Signal"
   WHERE id IN (SELECT id FROM ranked WHERE rn > 1)
`);

console.log(`\n✓ ${r.rowCount} sinais NO_SETUP duplicados removidos`);

// Compacta espaço em disco (Postgres não devolve auto)
console.log("▶ Vacuum…");
await c.query(`VACUUM FULL "Signal"`);
console.log("✓ Vacuum concluído");

await size("DEPOIS");

await c.end();
