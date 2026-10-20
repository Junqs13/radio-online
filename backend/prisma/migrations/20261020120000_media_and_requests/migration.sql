-- Corrige o banco para bater com o schema.prisma.
-- Escrita de forma idempotente: funciona tanto num banco novo quanto num banco
-- onde as tabelas "MediaItem" e "song_requests" já tenham sido criadas à mão.

-- Tabela antiga da primeira versão do schema (id UUID + filePath), não usada por nenhuma rota.
DROP TABLE IF EXISTS "media_items";

-- MediaItem
CREATE TABLE IF NOT EXISTS "MediaItem" (
    "id" SERIAL NOT NULL,
    CONSTRAINT "MediaItem_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "MediaItem" ADD COLUMN IF NOT EXISTS "title"     TEXT NOT NULL DEFAULT '';
ALTER TABLE "MediaItem" ADD COLUMN IF NOT EXISTS "artist"    TEXT;
ALTER TABLE "MediaItem" ADD COLUMN IF NOT EXISTS "filename"  TEXT NOT NULL DEFAULT '';
ALTER TABLE "MediaItem" ADD COLUMN IF NOT EXISTS "type"      TEXT NOT NULL DEFAULT 'music';
ALTER TABLE "MediaItem" ADD COLUMN IF NOT EXISTS "duration"  INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "MediaItem" ADD COLUMN IF NOT EXISTS "programId" INTEGER;
ALTER TABLE "MediaItem" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Garante tipos, NOT NULL e defaults mesmo se a tabela já existia com outra definição
UPDATE "MediaItem" SET "title" = COALESCE("title", "filename", '') WHERE "title" IS NULL;
UPDATE "MediaItem" SET "filename" = '' WHERE "filename" IS NULL;
UPDATE "MediaItem" SET "type" = 'music' WHERE "type" IS NULL;
UPDATE "MediaItem" SET "duration" = 0 WHERE "duration" IS NULL;
UPDATE "MediaItem" SET "createdAt" = CURRENT_TIMESTAMP WHERE "createdAt" IS NULL;
ALTER TABLE "MediaItem"
    ALTER COLUMN "title" TYPE TEXT,      ALTER COLUMN "title" SET NOT NULL,     ALTER COLUMN "title" DROP DEFAULT,
    ALTER COLUMN "filename" TYPE TEXT,   ALTER COLUMN "filename" SET NOT NULL,  ALTER COLUMN "filename" DROP DEFAULT,
    ALTER COLUMN "type" TYPE TEXT,       ALTER COLUMN "type" SET NOT NULL,      ALTER COLUMN "type" SET DEFAULT 'music',
    ALTER COLUMN "duration" TYPE INTEGER, ALTER COLUMN "duration" SET NOT NULL, ALTER COLUMN "duration" SET DEFAULT 0,
    ALTER COLUMN "createdAt" TYPE TIMESTAMP(3), ALTER COLUMN "createdAt" SET NOT NULL, ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP;

-- Remove linhas duplicadas pelo nome do arquivo antes de criar o índice único
DELETE FROM "MediaItem" a USING "MediaItem" b
 WHERE a."filename" = b."filename" AND a."id" > b."id";
CREATE UNIQUE INDEX IF NOT EXISTS "MediaItem_filename_key" ON "MediaItem"("filename");

ALTER TABLE "MediaItem" DROP CONSTRAINT IF EXISTS "MediaItem_programId_fkey";
ALTER TABLE "MediaItem" ADD CONSTRAINT "MediaItem_programId_fkey"
    FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- song_requests
CREATE TABLE IF NOT EXISTS "song_requests" (
    "id" SERIAL NOT NULL,
    CONSTRAINT "song_requests_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "song_requests" ADD COLUMN IF NOT EXISTS "track_title"   TEXT NOT NULL DEFAULT '';
ALTER TABLE "song_requests" ADD COLUMN IF NOT EXISTS "listener_name" TEXT NOT NULL DEFAULT '';
ALTER TABLE "song_requests" ADD COLUMN IF NOT EXISTS "created_at"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "song_requests" SET "track_title" = '' WHERE "track_title" IS NULL;
UPDATE "song_requests" SET "listener_name" = '' WHERE "listener_name" IS NULL;
UPDATE "song_requests" SET "created_at" = CURRENT_TIMESTAMP WHERE "created_at" IS NULL;
ALTER TABLE "song_requests"
    ALTER COLUMN "track_title" TYPE TEXT,   ALTER COLUMN "track_title" SET NOT NULL,   ALTER COLUMN "track_title" DROP DEFAULT,
    ALTER COLUMN "listener_name" TYPE TEXT, ALTER COLUMN "listener_name" SET NOT NULL, ALTER COLUMN "listener_name" DROP DEFAULT,
    ALTER COLUMN "created_at" TYPE TIMESTAMP(3), ALTER COLUMN "created_at" SET NOT NULL, ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;
