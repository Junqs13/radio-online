-- Pontos de entrada e saída de cada faixa, para cortar o silêncio das pontas
ALTER TABLE "MediaItem" ADD COLUMN IF NOT EXISTS "cue_in" DOUBLE PRECISION;
ALTER TABLE "MediaItem" ADD COLUMN IF NOT EXISTS "cue_out" DOUBLE PRECISION;
ALTER TABLE "MediaItem" ADD COLUMN IF NOT EXISTS "cue_checked_at" TIMESTAMP(3);
