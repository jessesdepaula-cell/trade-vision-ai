import pg from "pg";

const c = new pg.Client({
  connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

await c.connect();

const q = async (label, sql) => {
  const r = await c.query(sql);
  console.log(`\n--- ${label} ---`);
  for (const row of r.rows) {
    console.log("  " + Object.entries(row).map(([k, v]) => `${k}=${v}`).join("  "));
  }
};

await q("Total e tamanho", `
  SELECT pg_size_pretty(pg_total_relation_size('"Signal"')) AS size,
         COUNT(*)::text AS rows
    FROM "Signal"
`);

await q("Por status", `
  SELECT status, COUNT(*)::int AS n
    FROM "Signal" GROUP BY status ORDER BY n DESC
`);

await q("Por idade (dias)", `
  SELECT
    CASE
      WHEN "scannedAt" > NOW() - INTERVAL '7 days'  THEN '0-7d'
      WHEN "scannedAt" > NOW() - INTERVAL '30 days' THEN '7-30d'
      WHEN "scannedAt" > NOW() - INTERVAL '90 days' THEN '30-90d'
      ELSE '90d+'
    END AS faixa,
    COUNT(*)::int AS n
  FROM "Signal"
  GROUP BY 1 ORDER BY 1
`);

await q("hasSetup", `
  SELECT "hasSetup", COUNT(*)::int AS n
    FROM "Signal" GROUP BY 1
`);

await c.end();
