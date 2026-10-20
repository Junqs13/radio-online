import { PrismaClient } from '@prisma/client';

// Uma única instância do Prisma para o processo inteiro
export const prisma = new PrismaClient();
