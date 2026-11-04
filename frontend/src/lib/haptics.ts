'use client';

/**
 * Vibração curta no Android, no mesmo instante da mudança na tela.
 * Só para dois momentos: a rádio começou a tocar e o pedido foi aceito.
 * iPhone e computador ignoram, sem erro.
 */
export function haptic(pattern: number | number[] = 10) {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(pattern);
  } catch {
    /* navegador sem vibração */
  }
}
