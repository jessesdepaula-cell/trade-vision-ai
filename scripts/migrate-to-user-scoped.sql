-- =============================================================
-- Migração: MT5Account-scoped → User-scoped
-- =============================================================
-- Move userId direto para Signal, Watchlist e MarketTick (que
-- antes apontavam para MT5Account) e dropa MT5Account/MT5Order.
--
-- IMPORTANTE: rode tudo numa transação. Se algo falhar, dá ROLLBACK.
-- Faça um snapshot do banco no Supabase ANTES (Database → Backups).
-- =============================================================

BEGIN;

-- 1. Adiciona userId nullable nas 3 tabelas
ALTER TABLE "Signal"     ADD COLUMN IF NOT EXISTS "userId" TEXT;
ALTER TABLE "Watchlist"  ADD COLUMN IF NOT EXISTS "userId" TEXT;
ALTER TABLE "MarketTick" ADD COLUMN IF NOT EXISTS "userId" TEXT;

-- 2. Backfill via JOIN com MT5Account
UPDATE "Signal" s
   SET "userId" = a."userId"
  FROM "MT5Account" a
 WHERE s."accountId" = a.id
   AND s."userId" IS NULL;

UPDATE "Watchlist" w
   SET "userId" = a."userId"
  FROM "MT5Account" a
 WHERE w."accountId" = a.id
   AND w."userId" IS NULL;

UPDATE "MarketTick" t
   SET "userId" = a."userId"
  FROM "MT5Account" a
 WHERE t."accountId" = a.id
   AND t."userId" IS NULL;

-- 3. Remove órfãos (sinais sem conta vinculada — devem ser raros)
DELETE FROM "Signal"     WHERE "userId" IS NULL;
DELETE FROM "Watchlist"  WHERE "userId" IS NULL;
DELETE FROM "MarketTick" WHERE "userId" IS NULL;

-- 4. Dedupe Watchlist: se 2 contas MT5 do mesmo user tinham o
--    mesmo (symbol, timeframe, mode), mantém só a mais recente.
DELETE FROM "Watchlist" w
 USING "Watchlist" w2
 WHERE w."userId"    = w2."userId"
   AND w."symbol"    = w2."symbol"
   AND w."timeframe" = w2."timeframe"
   AND w."mode"      = w2."mode"
   AND w."createdAt" < w2."createdAt";

-- 5. Dedupe MarketTick: PK era (accountId, symbol). Se 2 contas tinham
--    o mesmo símbolo, mantém o mais recente.
DELETE FROM "MarketTick" t
 USING "MarketTick" t2
 WHERE t."userId"    = t2."userId"
   AND t."symbol"    = t2."symbol"
   AND t."updatedAt" < t2."updatedAt";

-- 6. Drop FKs para MT5Account
ALTER TABLE "Signal"     DROP CONSTRAINT IF EXISTS "Signal_accountId_fkey";
ALTER TABLE "Watchlist"  DROP CONSTRAINT IF EXISTS "Watchlist_accountId_fkey";
ALTER TABLE "MarketTick" DROP CONSTRAINT IF EXISTS "MarketTick_accountId_fkey";
ALTER TABLE "MT5Order"   DROP CONSTRAINT IF EXISTS "MT5Order_accountId_fkey";

-- 7. Drop índices antigos baseados em accountId
DROP INDEX IF EXISTS "Signal_accountId_scannedAt_idx";
DROP INDEX IF EXISTS "Signal_accountId_status_idx";
DROP INDEX IF EXISTS "Signal_accountId_symbol_timeframe_idx";
DROP INDEX IF EXISTS "Watchlist_accountId_active_idx";

-- 8. Drop constraints + colunas accountId em Signal/Watchlist
ALTER TABLE "Watchlist" DROP CONSTRAINT IF EXISTS "Watchlist_accountId_symbol_timeframe_mode_key";
ALTER TABLE "Signal"    DROP COLUMN IF EXISTS "accountId";
ALTER TABLE "Watchlist" DROP COLUMN IF EXISTS "accountId";

-- 9. MarketTick: PK era composta com accountId, recriar
ALTER TABLE "MarketTick" DROP CONSTRAINT IF EXISTS "MarketTick_pkey";
ALTER TABLE "MarketTick" DROP COLUMN IF EXISTS "accountId";

-- 10. Set NOT NULL
ALTER TABLE "Signal"     ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "Watchlist"  ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "MarketTick" ALTER COLUMN "userId" SET NOT NULL;

-- 11. FKs novas para User (cascade)
ALTER TABLE "Signal"
  ADD CONSTRAINT "Signal_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Watchlist"
  ADD CONSTRAINT "Watchlist_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MarketTick"
  ADD CONSTRAINT "MarketTick_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- 12. Índices novos
CREATE INDEX IF NOT EXISTS "Signal_userId_scannedAt_idx"
  ON "Signal" ("userId", "scannedAt");
CREATE INDEX IF NOT EXISTS "Signal_userId_status_idx"
  ON "Signal" ("userId", "status");
CREATE INDEX IF NOT EXISTS "Signal_userId_symbol_timeframe_idx"
  ON "Signal" ("userId", "symbol", "timeframe");

CREATE INDEX IF NOT EXISTS "Watchlist_userId_active_idx"
  ON "Watchlist" ("userId", "active");
CREATE UNIQUE INDEX IF NOT EXISTS "Watchlist_userId_symbol_timeframe_mode_key"
  ON "Watchlist" ("userId", "symbol", "timeframe", "mode");

-- 13. MarketTick PK novo (userId, symbol)
ALTER TABLE "MarketTick"
  ADD CONSTRAINT "MarketTick_pkey" PRIMARY KEY ("userId", "symbol");

-- 14. Drop tabelas MT5
DROP TABLE IF EXISTS "MT5Order";
DROP TABLE IF EXISTS "MT5Account";

COMMIT;

-- =============================================================
-- Verificação pós-migração — rode separadamente:
--
--   SELECT COUNT(*) FROM "Signal";
--   SELECT COUNT(*) FROM "Watchlist";
--   SELECT COUNT(*) FROM "MarketTick";
--   SELECT COUNT(*) FROM "Trade";
--   SELECT COUNT(*) FROM "User";
--
-- Depois rode no terminal:
--   npx prisma db push --skip-generate
-- Deve dizer "The database is already in sync with the Prisma schema."
-- =============================================================
