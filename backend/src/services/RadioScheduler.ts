import cron from 'node-cron';
import { syncMediaDir } from './MediaLibrary.js';

export class RadioScheduler {
  private static running = false;

  private static async runTask() {
    if (this.running) return; // evita duas sincronizações ao mesmo tempo num acervo grande
    this.running = true;
    try {
      const r = await syncMediaDir();
      if (r.added > 0 || r.removed > 0) {
        console.log(`[Auto-DJ] +${r.added} / -${r.removed} arquivo(s). Total na pasta: ${r.total}.`);
      }
    } catch (error) {
      console.error('[Auto-DJ] Erro ao sincronizar a pasta de mídia:', error);
    } finally {
      this.running = false;
    }
  }

  public static init() {
    this.runTask();
    cron.schedule('*/5 * * * *', () => this.runTask());
    console.log('[Auto-DJ] Sincronização da pasta de mídia ativa (a cada 5 minutos).');
  }
}
