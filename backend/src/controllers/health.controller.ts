import { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { getIcecastSource } from '../lib/icecast.js';
import { getLastSync } from '../services/MediaLibrary.js';

export const HealthController = {
  async checkSystem(req: Request, res: Response) {
    let database = 'connected';
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch {
      database = 'offline';
    }

    // online = Icecast responde e o Liquidsoap está transmitindo no mount
    let streaming_antenna = 'online';
    try {
      const source = await getIcecastSource();
      if (!source) streaming_antenna = 'no-source';
    } catch {
      streaming_antenna = 'offline';
    }

    const sync = getLastSync();
    const healthy = database === 'connected' && streaming_antenna === 'online';

    res.status(healthy ? 200 : 503).json({
      status: healthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      services: {
        database,
        streaming_antenna,
        scheduler_engine: sync ? `última sincronização ${sync.at.toISOString()}` : 'aguardando',
      },
    });
  },
};
