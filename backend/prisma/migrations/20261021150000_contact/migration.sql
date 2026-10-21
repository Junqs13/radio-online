-- Mensagens do formulário "Fale conosco"
CREATE TABLE IF NOT EXISTS "contact_messages" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "subject" TEXT,
    "message" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "contact_messages_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "contact_messages_read_created_at_idx" ON "contact_messages"("read", "created_at");
