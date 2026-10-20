-- CreateTable
CREATE TABLE "Program" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "host" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT NOT NULL DEFAULT '#dc2626',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Program_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgramSlot" (
    "id" SERIAL NOT NULL,
    "programId" INTEGER NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "transitionType" TEXT NOT NULL DEFAULT 'crossfade',
    "jingleEnabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ProgramSlot_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ProgramSlot" ADD CONSTRAINT "ProgramSlot_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;
