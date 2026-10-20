-- Motor do Auto-DJ: rotação, fila de pedidos, histórico do que tocou e pasta do acervo por programa.

-- Program
ALTER TABLE "Program" ADD COLUMN IF NOT EXISTS "mediaFolder" TEXT;

-- MediaItem
ALTER TABLE "MediaItem" ADD COLUMN IF NOT EXISTS "category" TEXT;
ALTER TABLE "MediaItem" ADD COLUMN IF NOT EXISTS "enabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "MediaItem" ADD COLUMN IF NOT EXISTS "playCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "MediaItem" ADD COLUMN IF NOT EXISTS "lastPlayedAt" TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS "MediaItem_type_enabled_idx" ON "MediaItem"("type", "enabled");
-- Preenche a categoria das faixas que já estão em subpastas ("Categoria/Arquivo.mp3")
UPDATE "MediaItem" SET "category" = split_part("filename", '/', 1)
 WHERE "category" IS NULL AND position('/' in "filename") > 0;

-- song_requests
ALTER TABLE "song_requests" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE "song_requests" ADD COLUMN IF NOT EXISTS "media_item_id" INTEGER;
ALTER TABLE "song_requests" ADD COLUMN IF NOT EXISTS "queued_at" TIMESTAMP(3);
ALTER TABLE "song_requests" ADD COLUMN IF NOT EXISTS "played_at" TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS "song_requests_status_queued_at_idx" ON "song_requests"("status", "queued_at");
ALTER TABLE "song_requests" DROP CONSTRAINT IF EXISTS "song_requests_media_item_id_fkey";
ALTER TABLE "song_requests" ADD CONSTRAINT "song_requests_media_item_id_fkey"
    FOREIGN KEY ("media_item_id") REFERENCES "MediaItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- play_history
CREATE TABLE IF NOT EXISTS "play_history" (
    "id" SERIAL NOT NULL,
    "media_item_id" INTEGER,
    "title" TEXT NOT NULL,
    "artist" TEXT,
    "source" TEXT NOT NULL,
    "program_id" INTEGER,
    "played_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "play_history_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "play_history_played_at_idx" ON "play_history"("played_at");
ALTER TABLE "play_history" DROP CONSTRAINT IF EXISTS "play_history_media_item_id_fkey";
ALTER TABLE "play_history" ADD CONSTRAINT "play_history_media_item_id_fkey"
    FOREIGN KEY ("media_item_id") REFERENCES "MediaItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "play_history" DROP CONSTRAINT IF EXISTS "play_history_program_id_fkey";
ALTER TABLE "play_history" ADD CONSTRAINT "play_history_program_id_fkey"
    FOREIGN KEY ("program_id") REFERENCES "Program"("id") ON DELETE SET NULL ON UPDATE CASCADE;
