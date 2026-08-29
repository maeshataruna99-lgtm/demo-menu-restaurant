/**
 * Lapisan realtime — meniru WebSocket server (ws) di /server/index.js.
 * Di demo browser dipakai BroadcastChannel sehingga 2 tab (Pelanggan & Kasir)
 * tersinkron seketika, persis seperti client yang terhubung ke satu WS server.
 */
import type { Order } from "./types";

export type BusEvent =
  | { type: "order:created"; order: Order }
  | { type: "order:updated"; order: Order }
  | { type: "order:paid"; order: Order };

const listeners = new Set<(e: BusEvent) => void>();
let bc: BroadcastChannel | null = null;

try {
  bc = new BroadcastChannel("warung-laras-realtime");
  bc.onmessage = (m: MessageEvent<BusEvent>) => dispatch(m.data);
} catch {
  bc = null; // browser lama — tetap jalan untuk satu tab
}

function dispatch(e: BusEvent) {
  listeners.forEach((l) => l(e));
}

export function emit(e: BusEvent) {
  dispatch(e);
  try {
    bc?.postMessage(e);
  } catch {
    /* abaikan */
  }
}

export function onBus(cb: (e: BusEvent) => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

/* Bunyi "ping" kasir saat pesanan baru masuk (guard penuh, tidak akan crash). */
let audioCtx: AudioContext | null = null;

export function cashierBeep() {
  try {
    const AC =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    audioCtx = audioCtx ?? new AC();
    if (audioCtx.state === "suspended") void audioCtx.resume();
    const t = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(660, t);
    osc.frequency.exponentialRampToValueAtTime(990, t + 0.11);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.05, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(t);
    osc.stop(t + 0.32);
  } catch {
    /* audio diblokir browser — tidak masalah */
  }
}
