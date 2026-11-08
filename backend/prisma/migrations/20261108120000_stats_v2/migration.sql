-- Métricas v2: impressão diária do IP (embaralhada, muda todo dia) e ponto aproximado da cidade para o mapa
ALTER TABLE "stat_sessions" ADD COLUMN "ip_hash" TEXT;
ALTER TABLE "stat_sessions" ADD COLUMN "lat" DOUBLE PRECISION;
ALTER TABLE "stat_sessions" ADD COLUMN "lon" DOUBLE PRECISION;
CREATE INDEX "stat_sessions_last_seen_at_idx" ON "stat_sessions"("last_seen_at");
CREATE INDEX "stat_events_type_path_idx" ON "stat_events"("type", "path");
