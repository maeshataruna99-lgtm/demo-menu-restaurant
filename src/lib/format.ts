import type { OrderStatus } from "./types";

export const rupiah = (n: number) => "Rp" + n.toLocaleString("id-ID");

export const clock = (d: Date) =>
  d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

export const timeShort = (ts: number) =>
  new Date(ts).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

export const elapsed = (from: number, now: number) => {
  const s = Math.max(0, Math.floor((now - from) / 1000));
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, "0")}`;
};

export const STATUS_FLOW: OrderStatus[] = ["BARU", "DIPROSES", "SIAP", "SELESAI"];

export type Tone = "saffron" | "teal" | "moss" | "chili";

interface ToneStyle {
  dot: string;
  chipLight: string;
  chipDark: string;
  solid: string;
  textDark: string;
  textLight: string;
  border: string;
}

export const TONE: Record<Tone, ToneStyle> = {
  saffron: {
    dot: "bg-saffron-500",
    chipLight: "bg-saffron-500/15 text-saffron-700 ring-1 ring-inset ring-saffron-500/40",
    chipDark: "bg-saffron-500/15 text-saffron-300 ring-1 ring-inset ring-saffron-400/40",
    solid: "bg-saffron-500 text-moss-950 hover:bg-saffron-400 active:scale-[0.98]",
    textDark: "text-saffron-300",
    textLight: "text-saffron-600",
    border: "border-saffron-500",
  },
  teal: {
    dot: "bg-teal-500",
    chipLight: "bg-teal-500/12 text-teal-700 ring-1 ring-inset ring-teal-600/35",
    chipDark: "bg-teal-500/15 text-teal-300 ring-1 ring-inset ring-teal-400/40",
    solid: "bg-teal-600 text-paper hover:bg-teal-500 active:scale-[0.98]",
    textDark: "text-teal-300",
    textLight: "text-teal-700",
    border: "border-teal-500",
  },
  moss: {
    dot: "bg-moss-500",
    chipLight: "bg-moss-500/12 text-moss-700 ring-1 ring-inset ring-moss-600/35",
    chipDark: "bg-moss-500/18 text-moss-300 ring-1 ring-inset ring-moss-400/40",
    solid: "bg-moss-600 text-paper hover:bg-moss-500 active:scale-[0.98]",
    textDark: "text-moss-300",
    textLight: "text-moss-700",
    border: "border-moss-600",
  },
  chili: {
    dot: "bg-chili-500",
    chipLight: "bg-chili-500/12 text-chili-600 ring-1 ring-inset ring-chili-500/35",
    chipDark: "bg-chili-500/18 text-chili-400 ring-1 ring-inset ring-chili-400/40",
    solid: "bg-chili-500 text-paper hover:bg-chili-400 active:scale-[0.98]",
    textDark: "text-chili-400",
    textLight: "text-chili-600",
    border: "border-chili-500",
  },
};

export const STATUS_META: Record<OrderStatus, { label: string; step: string; tone: Tone }> = {
  BARU: { label: "Baru Masuk", step: "Diterima", tone: "saffron" },
  DIPROSES: { label: "Diproses", step: "Dimasak", tone: "teal" },
  SIAP: { label: "Siap", step: "Siap", tone: "moss" },
  SELESAI: { label: "Siap Bayar", step: "Selesai", tone: "chili" },
  DIBAYAR: { label: "Lunas", step: "Lunas", tone: "moss" },
};
