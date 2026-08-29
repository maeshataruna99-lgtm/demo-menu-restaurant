import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { advanceOrder, cancelOrder, getOrders, payOrder, updateOrderStatus, updateOrderTable } from "../lib/api";
import { elapsed, rupiah, STATUS_META, timeShort } from "../lib/format";
import type { Order, OrderStatus } from "../lib/types";
import { IconClock, IconCoin, IconNote, IconPot, IconReceipt, IconSparkle, IconTable } from "./Icons";

/* angka naik-turun halus */
function useCountUp(target: number, dur = 650) {
  const [val, setVal] = useState(target);
  const prev = useRef(target);
  useEffect(() => {
    const from = prev.current;
    const to = target;
    prev.current = target;
    if (from === to) return;
    let raf = 0;
    const t0 = performance.now();
    const step = (t: number) => {
      const p = Math.min(1, (t - t0) / dur);
      const e = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(from + (to - from) * e));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, dur]);
  return val;
}

const COLS: { status: OrderStatus; title: string; hint: string; dot: string; action: string; btn: string }[] = [
  {
    status: "BARU",
    title: "Pesanan Masuk",
    hint: "Konfirmasi, kirim ke dapur",
    dot: "bg-saffron-500",
    action: "Terima & Proses",
    btn: "bg-saffron-500 text-moss-950 hover:bg-saffron-400",
  },
  {
    status: "DIPROSES",
    title: "Diproses Dapur",
    hint: "Sedang dimasak",
    dot: "bg-teal-400",
    action: "Tandai Siap",
    btn: "bg-teal-500 text-moss-950 hover:bg-teal-400",
  },
  {
    status: "SIAP",
    title: "Siap Disajikan",
    hint: "Antar ke meja pelanggan",
    dot: "bg-moss-400",
    action: "Selesaikan",
    btn: "bg-moss-500 text-moss-950 hover:bg-moss-400",
  },
  {
    status: "SELESAI",
    title: "Siap Bayar",
    hint: "Kasir menerima pembayaran",
    dot: "bg-chili-400",
    action: "Terima Pembayaran",
    btn: "bg-chili-500 text-paper hover:bg-chili-400",
  },
];

const LEFT_BORDER: Record<string, string> = {
  BARU: "border-l-saffron-500",
  DIPROSES: "border-l-teal-400",
  SIAP: "border-l-moss-400",
  SELESAI: "border-l-chili-400",
};

function OrderCard({
  order,
  now,
  busy,
  onAct,
  onCancel,
  onMoveTable,
}: {
  order: Order;
  now: number;
  busy: boolean;
  onAct: () => void;
  onCancel?: () => void;
  onMoveTable?: () => void;
}) {
  const col = COLS.find((c) => c.status === order.status)!;
  const late = order.status !== "SIAP" && now - order.createdAt > 8 * 60_000;
  const isBill = order.status === "SELESAI";
  const canManage = !isBill && order.status !== "DIBATALKAN";

  return (
    <motion.article
      layout
      layoutId={order.id}
      initial={{ opacity: 0, y: -10, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.18 } }}
      transition={{ type: "spring", stiffness: 320, damping: 30 }}
      className={`rounded-lg border border-l-[3px] border-paper/10 bg-moss-800/80 p-3 shadow-card ${LEFT_BORDER[order.status]} ${order.status === "DIBATALKAN" ? "opacity-60" : ""}`}
    >
      <header className="flex items-center gap-2">
        <span className="font-display text-lg font-extrabold leading-none text-saffron-300">
          #{String(order.number).padStart(2, "0")}
        </span>
        <span className="flex items-center gap-1 rounded-full bg-paper/10 px-2 py-0.5 text-[11px] font-semibold text-paper/85">
          <IconTable className="h-3 w-3" /> {order.table}
        </span>
        {order.cancelRequested && (
          <span className="ml-1 flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300">
            Minta Batal
          </span>
        )}
        {order.status === "DIBATALKAN" && (
          <span className="ml-1 flex items-center gap-1 rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] font-bold text-red-300">
            Dibatalkan
          </span>
        )}
        <span
          className={`ml-auto flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums ${
            late ? "bg-chili-500/20 text-chili-400" : "bg-paper/10 text-paper/70"
          }`}
        >
          <IconClock className="h-3 w-3" /> {elapsed(order.createdAt, now)}
        </span>
      </header>

      <p className="mt-1.5 text-xs text-paper/60">
        a.n. <span className="font-semibold text-paper/90">{order.customer}</span> • masuk {timeShort(order.createdAt)}
      </p>

      <ul className="mt-2 space-y-0.5 border-t border-dashed border-paper/15 pt-2 text-[13px] text-paper/85">
        {order.items.map((i) => (
          <li key={i.menuItemId} className="flex justify-between gap-2">
            <span>
              <span className="font-bold text-saffron-200">{i.qty}×</span> {i.name}
            </span>
            <span className="tabular-nums text-paper/60">{rupiah(i.price * i.qty)}</span>
          </li>
        ))}
      </ul>

      {order.note && (
        <p className="mt-2 flex items-start gap-1.5 rounded-md border border-saffron-500/25 bg-saffron-500/10 px-2 py-1.5 text-[11px] leading-snug text-saffron-200">
          <IconNote className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {order.note}
        </p>
      )}

      {order.cancelReason && (
        <p className="mt-2 flex items-start gap-1.5 rounded-md border border-red-500/25 bg-red-500/10 px-2 py-1.5 text-[11px] leading-snug text-red-300">
          <IconNote className="mt-0.5 h-3.5 w-3.5 shrink-0" /> <strong>Alasan batal:</strong> {order.cancelReason}
        </p>
      )}

      <footer className="mt-3 flex items-center justify-between gap-2">
        {isBill || order.status === "DIBATALKAN" ? (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-paper/50">Total tagihan</p>
            <p className={`font-display text-2xl font-extrabold leading-none tabular-nums ${order.status === "DIBATALKAN" ? "text-red-400 line-through" : "text-saffron-300"}`}>
              {rupiah(order.total)}
            </p>
          </div>
        ) : (
          <p className="font-display text-base font-bold tabular-nums text-paper/90">{rupiah(order.total)}</p>
        )}
        <div className="flex items-center gap-1.5">
          {canManage && onMoveTable && (
            <button
              onClick={onMoveTable}
              disabled={busy}
              className="flex items-center gap-1.5 rounded-md border border-paper/20 bg-transparent px-2.5 py-2 text-xs font-bold text-paper/70 transition-all hover:bg-paper/10 active:scale-95 disabled:opacity-60"
              title="Pindah Meja"
            >
              <IconTable className="h-3.5 w-3.5" />
            </button>
          )}
          {canManage && onCancel && (
            <button
              onClick={onCancel}
              disabled={busy || order.cancelRequested}
              className="flex items-center gap-1.5 rounded-md border border-red-400/30 bg-red-500/10 px-2.5 py-2 text-xs font-bold text-red-300 transition-all hover:bg-red-500/20 active:scale-95 disabled:opacity-60"
              title="Batalkan Pesanan"
            >
              ✕
            </button>
          )}
          <button
            onClick={onAct}
            disabled={busy}
            className={`flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-bold transition-all active:scale-95 disabled:cursor-wait disabled:opacity-60 ${col.btn}`}
          >
            {busy ? (
              <span className="animate-blink">Memproses…</span>
            ) : (
              <>
                {isBill && <IconCoin className="h-3.5 w-3.5" />}
                {col.action}
              </>
            )}
          </button>
        </div>
      </footer>
    </motion.article>
  );
}

export default function CashierView() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [now, setNow] = useState(() => Date.now());
  const [busy, setBusy] = useState<string | null>(null);

  const refresh = useCallback(async () => setOrders(await getOrders()), []);

  // Short polling - refresh data setiap 3 detik
  useEffect(() => {
    void refresh();
    const interval = setInterval(() => {
      void refresh();
    }, 3000);
    return () => clearInterval(interval);
  }, [refresh]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const stats = useMemo(() => {
    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);
    const paid = orders.filter((o) => o.status === "DIBAYAR");
    const paidToday = paid.filter((o) => {
      const at = o.timeline.find((t) => t.status === "DIBAYAR")?.at ?? o.updatedAt;
      return at >= dayStart.getTime();
    });
    const revenue = paidToday.reduce((s, o) => s + o.total, 0);
    const waiting = orders.filter((o) => o.status === "SELESAI");
    return {
      revenue,
      paidCount: paidToday.length,
      avg: paidToday.length ? Math.round(revenue / paidToday.length) : 0,
      active: orders.filter((o) => o.status !== "DIBAYAR").length,
      waitingSum: waiting.reduce((s, o) => s + o.total, 0),
      paidToday: paidToday.slice(0, 8),
    };
  }, [orders]);

  const revAnim = useCountUp(stats.revenue);
  const countAnim = useCountUp(stats.paidCount);
  const avgAnim = useCountUp(stats.avg);
  const waitAnim = useCountUp(stats.waitingSum);

  const act = async (o: Order) => {
    if (busy) return;
    setBusy(o.id);
    try {
      if (o.status === "SELESAI") await payOrder(o.id);
      else await advanceOrder(o.id);
    } finally {
      setBusy(null);
    }
  };

  const handleCancel = async (o: Order) => {
    if (!confirm(`Batalkan pesanan #${String(o.number).padStart(2, "0")}?\n\nPastikan pelanggan sudah mengkonfirmasi pembatalan.`)) return;
    
    setBusy(o.id);
    try {
      await cancelOrder(o.id);
      await refresh();
    } catch (err) {
      alert("Gagal memproses pembatalan.");
    } finally {
      setBusy(null);
    }
  };

  const handleMoveTable = async (o: Order) => {
    const TABLES = ["Meja 1", "Meja 2", "Meja 3", "Meja 4", "Meja 5", "Meja 6", "Meja 7", "Meja 8", "Bungkus"];
    const newTable = prompt(`Pindah pesanan #${String(o.number).padStart(2, "0")} dari ${o.table} ke:\n\n(Masukkan nama meja baru, contoh: Meja 5 atau Bungkus)`, o.table);
    
    if (!newTable || newTable.trim() === "" || newTable === o.table) return;
    
    setBusy(o.id);
    try {
      await updateOrderTable(o.id, newTable.trim());
      await refresh();
    } catch (err) {
      alert("Gagal memindahkan meja.");
    } finally {
      setBusy(null);
    }
  };

  const handleChangeStatus = async (o: Order) => {
    const STATUSES: OrderStatus[] = ["BARU", "DIPROSES", "SIAP", "SELESAI"];
    const currentIdx = STATUSES.indexOf(o.status);
    const availableStatuses = STATUSES.filter((s) => s !== o.status && s !== "DIBAYAR" && s !== "DIBATALKAN");
    
    const statusMap: Record<string, string> = {
      "BARU": "Baru",
      "DIPROSES": "Diproses",
      "SIAP": "Siap",
      "SELESAI": "Selesai"
    };
    
    const options = availableStatuses.map((s, i) => `${i + 1}. ${statusMap[s]}`).join("\n");
    const choice = prompt(`Ubah status pesanan #${String(o.number).padStart(2, "0")} (${o.table}):\n\n${options}\n\nMasukkan nomor pilihan:`);
    if (!choice || !/^[1-4]$/.test(choice)) return;
    
    const selectedStatus = availableStatuses[parseInt(choice) - 1];
    if (!selectedStatus) return;
    
    setBusy(o.id);
    try {
      await updateOrderStatus(o.id, selectedStatus);
      await refresh();
    } catch (err) {
      alert("Gagal mengubah status.");
    } finally {
      setBusy(null);
    }
  };

  const today = new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" });

  return (
    <section className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-moss-950 text-paper">
      <div className="pointer-events-none absolute inset-0 bg-grid-dark" />
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-saffron-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 right-0 h-[28rem] w-[28rem] rounded-full bg-moss-500/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-3 pb-12 pt-6 sm:px-4 sm:pb-16 sm:pt-8 lg:px-8">
        {/* kepala papan */}
        <div className="flex flex-wrap items-end justify-between gap-3 sm:gap-4">
          <div>
            <p className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.28em] text-saffron-400">
              <IconPot className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Papan Kasir
            </p>
            <h2 className="mt-1.5 font-display text-3xl font-extrabold leading-none tracking-tight sm:text-4xl lg:text-5xl">
              Dapur & Kasir <span className="text-saffron-400">Live</span>
            </h2>
            <p className="mt-1.5 text-xs text-paper/55 sm:text-sm">{today} — setiap pesanan masuk muncul di sini seketika.</p>
          </div>
          <div className="flex items-center gap-2.5 rounded-xl border border-paper/12 bg-moss-900/70 px-3 py-2.5 sm:px-4 sm:py-3">
            <IconClock className="h-5 w-5 text-saffron-400 sm:h-6 sm:w-6" />
            <div>
              <p className="font-display text-lg font-extrabold leading-none tabular-nums sm:text-2xl">
                {new Date(now).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </p>
              <p className="mt-0.5 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-paper/50 sm:text-[10px]">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute h-full w-full animate-ping rounded-full bg-moss-400 opacity-70" />
                  <span className="relative h-1.5 w-1.5 rounded-full bg-moss-400" />
                </span>
                Auto-refresh 3 detik
              </p>
            </div>
          </div>
        </div>

        {/* strip statistik */}
        <div className="mt-6 grid grid-cols-2 overflow-hidden rounded-xl border border-paper/12 bg-moss-900/70 lg:grid-cols-4">
          {[
            {
              label: "Pendapatan Hari Ini",
              value: rupiah(revAnim),
              sub: `${stats.paidCount} transaksi lunas`,
              cls: "text-saffron-300",
              big: true,
              icon: <IconCoin className="h-5 w-5" />,
            },
            {
              label: "Transaksi",
              value: String(countAnim),
              sub: "pembayaran diterima",
              cls: "text-paper",
              icon: <IconReceipt className="h-5 w-5" />,
            },
            {
              label: "Rata-rata Bon",
              value: rupiah(avgAnim),
              sub: "per transaksi",
              cls: "text-paper",
              icon: <IconSparkle className="h-5 w-5" />,
            },
            {
              label: "Menunggu Dibayar",
              value: rupiah(waitAnim),
              sub: `${orders.filter((o) => o.status === "SELESAI").length} pesanan selesai`,
              cls: "text-chili-400",
              icon: <IconClock className="h-5 w-5" />,
            },
          ].map((s, i) => (
            <div
              key={s.label}
              className={`px-5 py-4 ${i > 0 ? "border-l border-paper/10" : ""} ${i >= 2 ? "max-lg:border-t max-lg:border-paper/10" : ""} ${i === 2 ? "max-lg:border-l-0" : ""}`}
            >
              <p className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.18em] text-paper/45">
                <span className="text-saffron-400">{s.icon}</span> {s.label}
              </p>
              <p className={`mt-1 font-display font-extrabold leading-none tabular-nums ${s.big ? "text-3xl" : "text-2xl"} ${s.cls}`}>
                {s.value}
              </p>
              <p className="mt-1 text-[11px] text-paper/45">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* papan kolom status */}
        <div className="mt-4 grid gap-3 sm:mt-6 sm:gap-4 md:grid-cols-2 xl:grid-cols-4">
          {COLS.map((col) => {
            const list = orders.filter((o) => o.status === col.status);
            return (
              <div key={col.status} className="flex flex-col rounded-xl border border-paper/10 bg-moss-900/60">
                <header className="border-b border-paper/10 px-3 py-2.5 sm:px-4 sm:py-3">
                  <p className="flex items-center gap-1.5 font-display text-xs font-extrabold uppercase tracking-wider sm:text-sm">
                    <span className={`h-2 w-2 rounded-full ${col.dot} ${list.length > 0 ? "animate-blink" : "opacity-40"}`} />
                    {col.title}
                    <span className="ml-auto rounded-full bg-paper/10 px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-paper/75 sm:text-xs">
                      {list.length}
                    </span>
                  </p>
                  <p className="mt-0.5 text-[9px] text-paper/40 sm:text-[11px]">{col.hint}</p>
                </header>
                <div className="flex-1 space-y-2 p-2 sm:space-y-3 sm:p-3" style={{ minHeight: 180 }}>
                  <AnimatePresence mode="popLayout">
                    {list.length === 0 ? (
                      <motion.p
                        key="empty"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="rounded-lg border border-dashed border-paper/15 py-6 text-center text-[10px] text-paper/35 sm:py-8 sm:text-xs"
                      >
                        Belum ada pesanan
                      </motion.p>
                    ) : (
                      list.map((o) => (
                        <OrderCard
                          key={o.id}
                          order={o}
                          now={now}
                          busy={busy === o.id}
                          onAct={() => void act(o)}
                          onCancel={() => handleCancel(o)}
                          onMoveTable={() => handleMoveTable(o)}
                        />
                      ))
                    )}
                  </AnimatePresence>
                </div>
              </div>
            );
          })}
        </div>

        {/* riwayat + total */}
        <div className="mt-4 grid gap-3 sm:mt-6 sm:gap-4 xl:grid-cols-[1fr_320px]">
          <div className="rounded-xl border border-paper/10 bg-moss-900/60">
            <header className="flex items-center gap-2 border-b border-paper/10 px-3 py-2.5 sm:px-4 sm:py-3">
              <IconReceipt className="h-3.5 w-3.5 text-saffron-400 sm:h-4 sm:w-4" />
              <h3 className="font-display text-xs font-extrabold uppercase tracking-wider sm:text-sm">Riwayat Pembayaran Hari Ini</h3>
              <span className="ml-auto text-[10px] text-paper/45 sm:text-xs">{STATUS_META.DIBAYAR.label} = masuk kas</span>
            </header>
            {stats.paidToday.length === 0 ? (
              <p className="px-3 py-8 text-center text-xs text-paper/40 sm:px-4 sm:py-10 sm:text-sm">
                Belum ada transaksi hari ini — selesaikan pesanan lalu terima pembayarannya.
              </p>
            ) : (
              <ul className="divide-y divide-paper/8">
                {stats.paidToday.map((o) => {
                  const at = o.timeline.find((t) => t.status === "DIBAYAR")?.at ?? o.updatedAt;
                  return (
                    <li key={o.id} className="flex items-center gap-2.5 px-3 py-2.5 text-xs sm:gap-3 sm:px-4 sm:py-3 sm:text-sm">
                      <span className="font-display text-base font-extrabold text-saffron-300">
                        #{String(o.number).padStart(2, "0")}
                      </span>
                      <span className="text-paper/80">
                        {o.customer} <span className="hidden text-paper/40 sm:inline">• {o.table}</span>
                      </span>
                      <span className="hidden text-[10px] text-paper/40 sm:inline">
                        {o.items.reduce((s, i) => s + i.qty, 0)} item
                      </span>
                      <span className="ml-auto text-[10px] tabular-nums text-paper/45 sm:text-xs">{timeShort(at)}</span>
                      <span className="w-20 text-right font-display text-sm font-bold tabular-nums text-paper sm:w-24 sm:text-base">
                        {rupiah(o.total)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="flex flex-col justify-between rounded-xl bg-saffron-500 p-4 text-moss-950 shadow-lift sm:p-5">
            <div>
              <p className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.2em] text-moss-900/70">
                <IconCoin className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Kas Hari Ini
              </p>
              <p className="mt-1.5 font-display text-[2rem] font-extrabold leading-none tabular-nums sm:text-[2.6rem]">
                {rupiah(revAnim)}
              </p>
              <p className="mt-1.5 text-xs font-semibold text-moss-900/75 sm:text-sm">
                {stats.paidCount} transaksi • rata-rata {rupiah(stats.avg)} per bon
              </p>
            </div>
            <p className="mt-3 border-t border-dashed border-moss-950/25 pt-2.5 text-[10px] leading-relaxed text-moss-900/70 sm:mt-4 sm:pt-3 sm:text-[11px]">
              Total muncul otomatis begitu pesanan berstatus <strong>Selesai</strong> dan pembayaran diterima kasir.
              Data tersimpan di PostgreSQL pada deployment asli.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
