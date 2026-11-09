-- Matérias no banco do site: ajustes sobre as do geek-news e matérias escritas no painel
CREATE TABLE "materias" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "origem" TEXT NOT NULL DEFAULT 'site',
    "titulo" TEXT,
    "linha_fina" TEXT,
    "corpo_md" TEXT,
    "categoria" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "tags_definidas" BOOLEAN NOT NULL DEFAULT false,
    "imagem_url" TEXT,
    "sem_foto" BOOLEAN NOT NULL DEFAULT false,
    "oculta" BOOLEAN NOT NULL DEFAULT false,
    "fixada" BOOLEAN NOT NULL DEFAULT false,
    "rascunho" BOOLEAN NOT NULL DEFAULT false,
    "publicada_em" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "materias_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "materias_slug_key" ON "materias"("slug");
CREATE INDEX "materias_origem_idx" ON "materias"("origem");
