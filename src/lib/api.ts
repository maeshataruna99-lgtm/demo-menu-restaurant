/**
 * Lapisan API demo — meniru endpoint REST yang sama dengan server asli:
 *   GET  /api/menu           → getMenu()
 *   GET  /api/orders         → getOrders()
 *   POST /api/orders         → createOrder()
 *   PATCH /api/orders/:id/status → advanceOrder()
 *   POST /api/orders/:id/pay → payOrder()
 * "PostgreSQL"-nya adalah localStorage (dibagikan antar-tab), dan setiap
 * mutasi memancarkan event lewat bus realtime (lihat bus.ts).
 */
import { emit } from "./bus";
import { MENU } from "./menu";
import type { MenuItem, Order, OrderItem, OrderStatus } from "./types";

const DB_KEY = "warung-laras-db-v1";
const MY_KEY = "warung-laras-my-orders-v1";

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms + Math.random() * 110));

interface DbShape {
  seq: number;
  orders: Order[];
}

function seed(): DbShape {
  const now = Date.now();
  const m = 60_000;
  const orders: Order[] = [
    {
      id: "seed-3",
      number: 3,
      customer: "Andi",
      table: "Bungkus",
      note: "Kuah rendangnya dipisah ya",
      items: [
        { menuItemId: "rendang", name: "Rendang Sapi", price: 38000, qty: 1 },
        { menuItemId: "kopi", name: "Kopi Tubruk", price: 12000, qty: 1 },
      ],
      total: 50000,
      status: "BARU",
      createdAt: now - 25_000,
      updatedAt: now - 25_000,
      timeline: [{ status: "BARU", at: now - 25_000 }],
    },
    {
      id: "seed-2",
      number: 2,
      customer: "Sari",
      table: "Meja 7",
      items: [
        { menuItemId: "sate-ayam", name: "Sate Ayam Madura", price: 25000, qty: 2 },
        { menuItemId: "es-cendol", name: "Es Cendol Gula Aren", price: 15000, qty: 2 },
      ],
      total: 80000,
      status: "DIPROSES",
      createdAt: now - 4 * m - 12_000,
      updatedAt: now - 3 * m,
      timeline: [
        { status: "BARU", at: now - 4 * m - 12_000 },
        { status: "DIPROSES", at: now - 3 * m },
      ],
    },
    {
      id: "seed-1",
      number: 1,
      customer: "Budi",
      table: "Meja 3",
      items: [
        { menuItemId: "nasi-goreng", name: "Nasi Goreng Kampung", price: 28000, qty: 1 },
        { menuItemId: "es-jeruk", name: "Es Jeruk Peras", price: 13000, qty: 2 },
      ],
      total: 54000,
      status: "DIBAYAR",
      createdAt: now - 118 * m,
      updatedAt: now - 101 * m,
      timeline: [
        { status: "BARU", at: now - 118 * m },
        { status: "DIPROSES", at: now - 113 * m },
        { status: "SIAP", at: now - 106 * m },
        { status: "SELESAI", at: now - 103 * m },
        { status: "DIBAYAR", at: now - 101 * m },
      ],
    },
  ];
  return { seq: 3, orders };
}

function save(db: DbShape) {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
  } catch {
    /* storage penuh — abaikan */
  }
}

function load(): DbShape {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) {
      const db = JSON.parse(raw) as DbShape;
      if (db && Array.isArray(db.orders) && typeof db.seq === "number") return db;
    }
  } catch {
    /* data korup — seed ulang */
  }
  const db = seed();
  save(db);
  return db;
}

/* ---------- "endpoint" ---------- */

export async function getMenu(): Promise<MenuItem[]> {
  await wait(120);
  return MENU;
}

export async function getOrders(): Promise<Order[]> {
  await wait(90);
  return load().orders.slice().sort((a, b) => b.createdAt - a.createdAt);
}

export async function createOrder(input: {
  customer: string;
  table: string;
  note?: string;
  items: { menuItemId: string; qty: number }[];
}): Promise<Order> {
  await wait(320);
  const db = load();
  const items: OrderItem[] = input.items.flatMap(({ menuItemId, qty }) => {
    const found = MENU.find((m) => m.id === menuItemId);
    return found ? [{ menuItemId, name: found.name, price: found.price, qty }] : [];
  });
  if (items.length === 0) throw new Error("Keranjang kosong");
  const now = Date.now();
  const order: Order = {
    id: crypto.randomUUID ? crypto.randomUUID() : `o-${now}-${Math.random().toString(36).slice(2)}`,
    number: ++db.seq,
    customer: input.customer.trim() || "Tamu",
    table: input.table,
    note: input.note?.trim() || undefined,
    items,
    total: items.reduce((s, i) => s + i.price * i.qty, 0),
    status: "BARU",
    createdAt: now,
    updatedAt: now,
    timeline: [{ status: "BARU", at: now }],
  };
  db.orders.unshift(order);
  save(db);
  rememberMyOrder(order.id);
  emit({ type: "order:created", order: { ...order } });
  return order;
}

const NEXT: Partial<Record<OrderStatus, OrderStatus>> = {
  BARU: "DIPROSES",
  DIPROSES: "SIAP",
  SIAP: "SELESAI",
};

export async function advanceOrder(id: string): Promise<Order | null> {
  await wait(180);
  const db = load();
  const o = db.orders.find((x) => x.id === id);
  if (!o) return null;
  const next = NEXT[o.status];
  if (!next) return o;
  o.status = next;
  o.updatedAt = Date.now();
  o.timeline.push({ status: next, at: o.updatedAt });
  save(db);
  emit({ type: "order:updated", order: { ...o } });
  return { ...o };
}

export async function payOrder(id: string): Promise<Order | null> {
  await wait(220);
  const db = load();
  const o = db.orders.find((x) => x.id === id);
  if (!o || o.status !== "SELESAI") return o ? { ...o } : null;
  o.status = "DIBAYAR";
  o.updatedAt = Date.now();
  o.timeline.push({ status: "DIBAYAR", at: o.updatedAt });
  save(db);
  emit({ type: "order:paid", order: { ...o } });
  return { ...o };
}

export async function requestCancelOrder(id: string, reason: string): Promise<Order | null> {
  await wait(180);
  const db = load();
  const o = db.orders.find((x) => x.id === id);
  if (!o || o.status === "DIBAYAR" || o.status === "DIBATALKAN") return o ? { ...o } : null;
  o.cancelRequested = true;
  o.cancelReason = reason;
  o.updatedAt = Date.now();
  save(db);
  emit({ type: "order:cancelRequested", order: { ...o } });
  return { ...o };
}

export async function cancelOrder(id: string): Promise<Order | null> {
  await wait(180);
  const db = load();
  const o = db.orders.find((x) => x.id === id);
  if (!o || o.status === "DIBAYAR" || o.status === "DIBATALKAN") return o ? { ...o } : null;
  o.status = "DIBATALKAN";
  o.cancelRequested = false;
  o.updatedAt = Date.now();
  o.timeline.push({ status: "DIBATALKAN", at: o.updatedAt });
  save(db);
  emit({ type: "order:cancelled", order: { ...o } });
  return { ...o };
}

export async function updateOrderTable(id: string, newTable: string): Promise<Order | null> {
  await wait(180);
  const db = load();
  const o = db.orders.find((x) => x.id === id);
  if (!o || o.status === "DIBAYAR" || o.status === "DIBATALKAN") return o ? { ...o } : null;
  o.table = newTable;
  o.updatedAt = Date.now();
  save(db);
  emit({ type: "order:tableUpdated", order: { ...o } });
  return { ...o };
}

export async function updateOrderStatus(id: string, newStatus: OrderStatus): Promise<Order | null> {
  await wait(180);
  const db = load();
  const o = db.orders.find((x) => x.id === id);
  if (!o || o.status === "DIBAYAR" || o.status === "DIBATALKAN") return o ? { ...o } : null;
  o.status = newStatus;
  o.updatedAt = Date.now();
  o.timeline.push({ status: newStatus, at: o.updatedAt });
  save(db);
  emit({ type: "order:statusUpdated", order: { ...o } });
  return { ...o };
}

/* ---------- identitas "perangkat" pelanggan (untuk tab Pesanan Saya) ---------- */

export function getMyOrderIds(): string[] {
  try {
    return JSON.parse(localStorage.getItem(MY_KEY) ?? "[]") as string[];
  } catch {
    return [];
  }
}

function rememberMyOrder(id: string) {
  const ids = getMyOrderIds();
  if (!ids.includes(id)) {
    ids.unshift(id);
    try {
      localStorage.setItem(MY_KEY, JSON.stringify(ids.slice(0, 10)));
    } catch {
      /* abaikan */
    }
  }
}
