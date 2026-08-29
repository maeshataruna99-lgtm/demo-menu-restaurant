/**
 * Warung Laras — backend asli (Node.js + Express + ws + Prisma/PostgreSQL)
 *
 * Jalankan:
 *   cd server && npm install
 *   npx prisma migrate dev --name init   (prisma/schema.prisma ada di root)
 *   npm run dev
 *
 * Endpoint REST:
 *   GET   /api/menu                  → daftar menu
 *   GET   /api/orders                → semua pesanan (urut terbaru)
 *   POST  /api/orders                → buat pesanan { customer, table, note, items:[{menuItemId,qty}] }
 *   PATCH /api/orders/:id/status     → naikkan status (BARU→DIPROSES→SIAP→SELESAI)
 *   POST  /api/orders/:id/pay        → tandai dibayar (kasir menerima pembayaran)
 *   GET   /api/stats                 → pendapatan hari ini, dsb.
 *
 * WebSocket:
 *   ws://localhost:4000/ws           → event: order:created | order:updated | order:paid
 */
import http from "node:http";
import express from "express";
import cors from "cors";
import { WebSocketServer } from "ws";
import { PrismaClient, OrderStatus } from "@prisma/client";

const prisma = new PrismaClient();
const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: "/ws" });

wss.on("connection", (socket) => {
  socket.send(JSON.stringify({ type: "hello", message: "Tersambung ke Warung Laras realtime" }));
});

const broadcast = (event) => {
  const msg = JSON.stringify(event);
  wss.clients.forEach((client) => {
    if (client.readyState === 1) client.send(msg);
  });
};

const NEXT = { BARU: "DIPROSES", DIPROSES: "SIAP", SIAP: "SELESAI" };

/* ---------- REST ---------- */

app.get("/api/menu", async (_req, res) => {
  const items = await prisma.menuItem.findMany({ where: { available: true }, orderBy: { createdAt: "asc" } });
  res.json(items);
});

app.get("/api/orders", async (_req, res) => {
  const orders = await prisma.order.findMany({
    include: { items: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  res.json(orders);
});

app.post("/api/orders", async (req, res) => {
  const { customer, table, note, items } = req.body ?? {};
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "items wajib diisi" });
  }

  const menuIds = items.map((i) => i.menuItemId);
  const menuRows = await prisma.menuItem.findMany({ where: { id: { in: menuIds } } });
  const byId = new Map(menuRows.map((m) => [m.id, m]));

  const orderItems = items.flatMap(({ menuItemId, qty }) => {
    const m = byId.get(menuItemId);
    if (!m || !Number.isFinite(qty) || qty < 1) return [];
    return [{ menuItemId, name: m.name, price: m.price, qty }];
  });
  if (orderItems.length === 0) return res.status(400).json({ error: "items tidak valid" });

  const total = orderItems.reduce((s, i) => s + i.price * i.qty, 0);
  const last = await prisma.order.findFirst({ orderBy: { number: "desc" } });

  const order = await prisma.order.create({
    data: {
      number: (last?.number ?? 0) + 1,
      customer: (customer ?? "Tamu").toString().slice(0, 60),
      table: (table ?? "Meja 1").toString().slice(0, 30),
      note: note ? note.toString().slice(0, 200) : null,
      total,
      items: { create: orderItems },
    },
    include: { items: true },
  });

  broadcast({ type: "order:created", order }); // ← notifikasi ke kasir & pelanggan
  res.status(201).json(order);
});

app.patch("/api/orders/:id/status", async (req, res) => {
  const order = await prisma.order.findUnique({ where: { id: req.params.id }, include: { items: true } });
  if (!order) return res.status(404).json({ error: "pesanan tidak ditemukan" });

  const next = NEXT[order.status];
  if (!next) return res.status(400).json({ error: `status ${order.status} sudah final` });

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: { status: next },
    include: { items: true },
  });
  broadcast({ type: "order:updated", order: updated }); // ← status berubah live
  res.json(updated);
});

app.post("/api/orders/:id/pay", async (req, res) => {
  const order = await prisma.order.findUnique({ where: { id: req.params.id }, include: { items: true } });
  if (!order) return res.status(404).json({ error: "pesanan tidak ditemukan" });
  if (order.status !== OrderStatus.SELESAI) {
    return res.status(400).json({ error: "hanya pesanan SELESAI yang bisa dibayar" });
  }

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: { status: OrderStatus.DIBAYAR },
    include: { items: true },
  });
  broadcast({ type: "order:paid", order: updated }); // ← total masuk kas
  res.json(updated);
});

app.get("/api/stats", async (_req, res) => {
  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);
  const paid = await prisma.order.findMany({ where: { status: OrderStatus.DIBAYAR, updatedAt: { gte: dayStart } } });
  const active = await prisma.order.count({ where: { status: { not: OrderStatus.DIBAYAR } } });
  const revenue = paid.reduce((s, o) => s + o.total, 0);
  res.json({
    revenue,
    paidCount: paid.length,
    avgTicket: paid.length ? Math.round(revenue / paid.length) : 0,
    activeCount: active,
  });
});

const PORT = process.env.PORT ?? 4000;
server.listen(PORT, () => {
  console.log(`🍜  Warung Laras API + WebSocket jalan di http://localhost:${PORT} (ws di /ws)`);
});
