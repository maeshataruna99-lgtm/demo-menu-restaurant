import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { createOrder, getMenu, getMyOrderIds, getOrders, requestCancelOrder } from "../lib/api";
import { rupiah, STATUS_FLOW, STATUS_META, TONE, timeShort } from "../lib/format";
import { CATEGORY_LABEL, IMG_FALLBACK } from "../lib/menu";
import type { Category, MenuItem, Order } from "../lib/types";
import { useLockBodyScroll, useMobileDetect } from "../lib/useMobileDetect";
import {
  IconArrow,
  IconBag,
  IconBell,
  IconCheck,
  IconClock,
  IconFlame,
  IconMinus,
  IconNote,
  IconPlus,
  IconPot,
  IconReceipt,
  IconSearch,
  IconSend,
  IconSparkle,
  IconTable,
  IconX,
} from "./Icons";

/* ---------- scroll reveal ---------- */
function Reveal({ children, delay = 0, className = "" }: { children: ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -36px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={`reveal ${inView ? "is-in" : ""} ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

/* ---------- timeline status pesanan ---------- */
const STEP_ICON = [IconBell, IconPot, IconCheck, IconReceipt];

function StepTimeline({ order }: { order: Order }) {
  const paid = order.status === "DIBAYAR";
  const idx = STATUS_FLOW.indexOf(paid ? "SELESAI" : order.status);
  return (
    <div>
      <div className="flex items-center">
        {STATUS_FLOW.map((s, i) => {
          const Icon = STEP_ICON[i];
          const done = paid || i < idx;
          const active = !paid && i === idx;
          const at = order.timeline.find((t) => t.status === s)?.at;
          return (
            <div key={s} className={`flex items-center ${i > 0 ? "flex-1" : ""}`}>
              {i > 0 && <div className={`mx-1.5 h-0.5 flex-1 rounded ${done || active ? "bg-moss-500" : "bg-ink/15"}`} />}
              <div className="flex flex-col items-center gap-1">
                <span
                  className={`relative grid h-9 w-9 place-items-center rounded-full border-2 transition-colors ${
                    done
                      ? "border-moss-600 bg-moss-600 text-paper"
                      : active
                        ? "border-saffron-500 bg-saffron-500 text-moss-950"
                        : "border-ink/20 bg-white text-ink/40"
                  }`}
                >
                  {active && <span className="absolute inset-0 animate-ping rounded-full bg-saffron-500/50" />}
                  <Icon className="relative h-4 w-4" />
                </span>
                <span className={`text-[10px] font-semibold uppercase tracking-wide ${active ? "text-saffron-700" : done ? "text-moss-600" : "text-ink/45"}`}>
                  {STATUS_META[s].step}
                </span>
                <span className="text-[10px] tabular-nums text-ink/40">{at ? timeShort(at) : "—"}</span>
              </div>
            </div>
          );
        })}
      </div>
      {paid && (
        <p className="mt-2 flex items-center gap-1.5 text-xs font-bold text-moss-600">
          <IconCheck className="h-3.5 w-3.5" /> Sudah dibayar — terima kasih!
        </p>
      )}
    </div>
  );
}

function OrderTrackCard({ order, onRequestCancel }: { order: Order; onRequestCancel?: (order: Order) => void }) {
  const meta = STATUS_META[order.status];
  const tone = TONE[meta.tone];
  const paid = order.status === "DIBAYAR";
  const cancelled = order.status === "DIBATALKAN";
  const canRequestCancel = !paid && !cancelled && !order.cancelRequested;

  return (
    <Reveal className="h-full">
      <article className={`relative flex h-full flex-col gap-4 rounded-xl border p-5 shadow-card ${cancelled ? "border-red-300 bg-red-50" : "border-ink/10 bg-white"}`}>
        {paid && (
          <span className="absolute -right-2 top-4 rotate-6 rounded border-2 border-moss-500 px-2 py-0.5 font-display text-xs font-extrabold uppercase tracking-widest text-moss-600">
            Lunas
          </span>
        )}
        {cancelled && (
          <span className="absolute -right-2 top-4 rotate-6 rounded border-2 border-red-500 px-2 py-0.5 font-display text-xs font-extrabold uppercase tracking-widest text-red-600">
            Dibatalkan
          </span>
        )}
        {order.cancelRequested && (
          <span className="absolute -right-2 top-4 rotate-6 rounded border-2 border-amber-500 px-2 py-0.5 font-display text-[10px] font-extrabold uppercase tracking-widest text-amber-600">
            Menunggu Konfirmasi
          </span>
        )}
        <header className="flex items-start justify-between gap-3">
          <div>
            <p className="font-display text-2xl font-extrabold leading-none">
              #{String(order.number).padStart(2, "0")}
            </p>
            <p className="mt-1 text-xs text-ink-soft">
              {order.customer} • {order.table} • {timeShort(order.createdAt)}
            </p>
          </div>
          <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${tone.chipLight}`}>
            {meta.label}
          </span>
        </header>
        <StepTimeline order={order} />
        <ul className="space-y-1 border-t border-dashed border-ink/15 pt-3 text-sm">
          {order.items.map((i) => (
            <li key={i.menuItemId} className="flex justify-between gap-2">
              <span className="text-ink-soft">
                {i.qty}× {i.name}
              </span>
              <span className="tabular-nums">{rupiah(i.price * i.qty)}</span>
            </li>
          ))}
        </ul>
        {order.cancelReason && (
          <div className="rounded-lg bg-red-100 p-3 text-xs text-red-800">
            <strong>Alasan pembatalan:</strong> {order.cancelReason}
          </div>
        )}
        {!cancelled && !paid && canRequestCancel && onRequestCancel && (
          <button
            onClick={() => onRequestCancel(order)}
            className="mt-2 w-full rounded-lg border border-red-300 bg-red-50 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100"
          >
            Minta Batalkan Pesanan
          </button>
        )}
        <footer className="mt-auto flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-widest text-ink-soft">Total</span>
          <span className={`font-display text-xl font-extrabold ${cancelled ? "text-red-600 line-through" : ""}`}>{rupiah(order.total)}</span>
        </footer>
      </article>
    </Reveal>
  );
}

/* ---------- kartu menu ---------- */
function MenuCard({
  item,
  qty,
  onAdd,
  onSet,
  delay,
}: {
  item: MenuItem;
  qty: number;
  onAdd: () => void;
  onSet: (q: number) => void;
  delay: number;
}) {
  return (
    <Reveal delay={delay} className="h-full">
      <article className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-ink/10 bg-white shadow-card transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lift">
        <div className="relative aspect-[4/3] overflow-hidden bg-moss-800">
          <img
            src={item.img}
            alt={item.name}
            loading="lazy"
            onError={(e) => {
              e.currentTarget.src = IMG_FALLBACK;
            }}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.06]"
          />
          <span className="absolute left-3 top-3 rounded-full bg-moss-950/85 px-2.5 py-1 font-display text-sm font-bold text-saffron-300">
            {rupiah(item.price)}
          </span>
          <span className="absolute right-3 top-3 flex gap-1.5">
            {item.popular && (
              <span className="flex items-center gap-1 rounded-full bg-saffron-500 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-moss-950">
                <IconFlame className="h-3 w-3" /> Terlaris
              </span>
            )}
            {item.spicy && (
              <span className="grid h-6 w-6 place-items-center rounded-full bg-chili-500 text-paper" title="Pedas">
                <IconFlame className="h-3.5 w-3.5" />
              </span>
            )}
          </span>
        </div>
        <div className="flex flex-1 flex-col gap-1.5 p-4">
          <h3 className="font-display text-lg font-bold leading-tight">{item.name}</h3>
          <p className="line-clamp-2 text-sm leading-relaxed text-ink-soft">{item.desc}</p>
          <div className="mt-auto flex items-center justify-between pt-2.5">
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-ink/45">
              {CATEGORY_LABEL[item.category]}
            </span>
            {qty === 0 ? (
              <button
                onClick={onAdd}
                className="flex h-9 items-center gap-1.5 rounded-full bg-moss-900 px-3.5 text-sm font-semibold text-paper transition-all hover:bg-moss-700 active:scale-95"
              >
                <IconPlus className="h-4 w-4" /> Tambah
              </button>
            ) : (
              <div className="flex items-center gap-1 rounded-full border border-moss-600/40 bg-moss-50 p-1">
                <button
                  onClick={() => onSet(qty - 1)}
                  className="grid h-7 w-7 place-items-center rounded-full bg-white shadow-sm transition hover:bg-chili-100 active:scale-90"
                  aria-label="Kurangi"
                >
                  <IconMinus className="h-3.5 w-3.5" />
                </button>
                <motion.span key={qty} initial={{ scale: 1.45 }} animate={{ scale: 1 }} className="w-6 text-center font-display text-sm font-bold">
                  {qty}
                </motion.span>
                <button
                  onClick={() => onSet(qty + 1)}
                  className="grid h-7 w-7 place-items-center rounded-full bg-moss-900 text-paper transition active:scale-90"
                  aria-label="Tambah"
                >
                  <IconPlus className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </article>
    </Reveal>
  );
}

/* ---------- view utama pelanggan ---------- */
const TABLES = ["Meja 1", "Meja 2", "Meja 3", "Meja 4", "Meja 5", "Meja 6", "Meja 7", "Meja 8", "Bungkus"];

export default function CustomerView() {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [myIds, setMyIds] = useState<string[]>(getMyOrderIds);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [cat, setCat] = useState<"semua" | Category>("semua");
  const [q, setQ] = useState("");
  const [drawer, setDrawer] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [placed, setPlaced] = useState<Order | null>(null);
  const [form, setForm] = useState({ customer: "", table: "Meja 1", note: "" });
  const trackRef = useRef<HTMLDivElement>(null);
  
  // Deteksi mobile untuk optimasi tampilan
  const { isMobile } = useMobileDetect();
  
  // Lock body scroll saat drawer terbuka
  useLockBodyScroll(drawer);

  const refresh = useCallback(async () => setOrders(await getOrders()), []);

  useEffect(() => {
    void getMenu().then(setMenu);
    void refresh();
  }, [refresh]);

  // Short polling - refresh data setiap 3 detik untuk update status pesanan
  useEffect(() => {
    const interval = setInterval(() => {
      void refresh();
    }, 3000);
    return () => clearInterval(interval);
  }, [refresh]);

  const filtered = useMemo(
    () =>
      menu.filter(
        (m) =>
          (cat === "semua" || m.category === cat) &&
          m.name.toLowerCase().includes(q.trim().toLowerCase())
      ),
    [menu, cat, q]
  );

  const cartLines = useMemo(
    () =>
      Object.entries(cart).flatMap(([id, qty]) => {
        const item = menu.find((m) => m.id === id);
        return item ? [{ item, qty }] : [];
      }),
    [cart, menu]
  );
  const cartCount = cartLines.reduce((s, l) => s + l.qty, 0);
  const cartTotal = cartLines.reduce((s, l) => s + l.item.price * l.qty, 0);

  const myOrders = useMemo(() => orders.filter((o) => myIds.includes(o.id)).slice(0, 3), [orders, myIds]);

  const setQty = (id: string, qty: number) =>
    setCart((c) => {
      const next = { ...c };
      if (qty <= 0) delete next[id];
      else next[id] = qty;
      return next;
    });

  const place = async () => {
    if (cartCount === 0 || placing) return;
    setPlacing(true);
    try {
      const o = await createOrder({
        customer: form.customer,
        table: form.table,
        note: form.note,
        items: Object.entries(cart).map(([menuItemId, qty]) => ({ menuItemId, qty })),
      });
      setPlaced(o);
      setCart({});
      setForm({ customer: "", table: form.table, note: "" });
      setMyIds(getMyOrderIds());
    } finally {
      setPlacing(false);
    }
  };

  const handleRequestCancel = async (order: Order) => {
    const reason = prompt("Mohon berikan alasan pembatalan pesanan:\n(alasan akan diteruskan ke kasir untuk konfirmasi)");
    if (!reason || reason.trim() === "") return;
    
    try {
      const updated = await requestCancelOrder(order.id, reason.trim());
      if (updated) {
        alert("Permintaan pembatalan terkirim! Mohon tunggu konfirmasi dari kasir.");
        await refresh();
      } else {
        alert("Gagal memproses pembatalan. Pesanan mungkin sudah dibayar atau dibatalkan.");
      }
    } catch (err) {
      alert("Terjadi kesalahan saat memproses pembatalan.");
    }
  };

  const trackOrder = () => {
    setDrawer(false);
    setPlaced(null);
    setTimeout(() => trackRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
  };

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-dots [mask-image:linear-gradient(#000,transparent)]" />

      {/* ===== masthead papan menu ===== */}
      <header className="relative mx-auto max-w-7xl px-4 pb-8 pt-10 sm:px-6 lg:px-8">
        <div className="grid items-end gap-10 lg:grid-cols-[1.55fr_1fr]">
          <div>
            <p className="flex items-center gap-3 text-[11px] font-extrabold uppercase tracking-[0.28em] text-moss-600">
              <span className="h-px w-10 bg-moss-600" /> Warung • Kopi • Nusantara — sejak 1998
            </p>
            <h1 className="mt-4 font-display text-[clamp(2.9rem,7.5vw,5.4rem)] font-extrabold leading-[0.93] tracking-tight">
              Warung{" "}
              <span className="relative inline-block text-saffron-600">
                Laras
                <svg viewBox="0 0 120 12" className="absolute -bottom-2 left-0 w-full" fill="none" aria-hidden="true">
                  <path d="M3 9C30 3 75 3 117 8" stroke="var(--color-saffron-500)" strokeWidth="4" strokeLinecap="round" />
                </svg>
              </span>
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-ink-soft">
              Pesan langsung dari mejamu — pesanan meluncur ke dapur secara{" "}
              <strong className="font-semibold text-ink">otomatis</strong>, dan statusnya bisa kamu pantau sampai siap.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="flex items-center gap-1.5 rounded-full border border-ink/15 bg-white/70 px-3 py-1.5 text-xs font-semibold">
                <IconClock className="h-3.5 w-3.5 text-moss-600" /> Buka 08.00–22.00
              </span>
              <span className="flex items-center gap-1.5 rounded-full border border-ink/15 bg-white/70 px-3 py-1.5 text-xs font-semibold">
                <IconTable className="h-3.5 w-3.5 text-moss-600" /> Jl. Kenanga No. 12
              </span>
              <span className="flex items-center gap-1.5 rounded-full border border-ink/15 bg-white/70 px-3 py-1.5 text-xs font-semibold">
                <IconSparkle className="h-3.5 w-3.5 text-saffron-600" /> Siap ± 15 menit
              </span>
            </div>
          </div>

          {/* karcis cara pesan */}
          <motion.div
            initial={{ opacity: 0, y: 24, rotate: 3 }}
            animate={{ opacity: 1, y: 0, rotate: 1.6 }}
            transition={{ delay: 0.15, type: "spring", stiffness: 90 }}
            className="relative"
          >
            <div className="animate-bob rounded-lg border-2 border-dashed border-saffron-700/50 bg-saffron-200 p-5 shadow-lift">
              <p className="flex items-center justify-between font-display text-xs font-extrabold uppercase tracking-[0.22em] text-saffron-700">
                Karcis Pesanan <IconReceipt className="h-4 w-4" />
              </p>
              <ol className="mt-4 space-y-3.5">
                {[
                  ["01", "Pilih menu favoritmu", "Tambahkan ke keranjang, atur porsi sesukanya."],
                  ["02", "Kirim ke dapur", "Kasir & dapur menerima notifikasi seketika."],
                  ["03", "Pantau sampai siap", "Status berubah otomatis: dimasak → siap → selesai."],
                ].map(([n, t, d]) => (
                  <li key={n} className="flex gap-3">
                    <span className="font-display text-2xl font-extrabold leading-none text-moss-800">{n}</span>
                    <span>
                      <span className="block font-display text-sm font-bold leading-tight text-moss-950">{t}</span>
                      <span className="text-xs leading-snug text-moss-800/80">{d}</span>
                    </span>
                  </li>
                ))}
              </ol>
              <p className="mt-4 border-t border-dashed border-saffron-700/40 pt-3 text-[11px] leading-relaxed text-moss-800/90">
                <strong>Tips demo:</strong> buka 2 tab — satu jadi <em>Pelanggan</em>, satu lagi <em>Kasir</em>. Pesanan
                tersinkron otomatis antar-tab.
              </p>
            </div>
          </motion.div>
        </div>
      </header>

      {/* ===== strip running text ===== */}
      <div className="relative -mx-2 -rotate-[0.6deg] border-y-2 border-moss-950 bg-moss-900 py-2.5 shadow-card">
        <div className="flex w-max animate-marquee gap-8">
          {[0, 1].map((dup) => (
            <div key={dup} className="flex items-center gap-8" aria-hidden={dup === 1}>
              {menu.map((m) => (
                <span key={`${dup}-${m.id}`} className="flex items-center gap-8 whitespace-nowrap font-display text-sm font-bold uppercase tracking-[0.14em] text-saffron-200">
                  <span className="flex items-center gap-2">
                    <IconFlame className="h-4 w-4 text-saffron-500" /> {m.name} — {rupiah(m.price)}
                  </span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ===== pesanan saya ===== */}
      {myOrders.length > 0 && (
        <section ref={trackRef} className="mx-auto max-w-7xl scroll-mt-24 px-4 pt-12 sm:px-6 lg:px-8">
          <Reveal>
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 className="font-display text-3xl font-extrabold">Pesanan Saya</h2>
                <p className="mt-1 flex items-center gap-2 text-sm text-ink-soft">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute h-full w-full animate-ping rounded-full bg-moss-500 opacity-60" />
                    <span className="relative h-2 w-2 rounded-full bg-moss-500" />
                  </span>
                  Diperbarui langsung dari dapur
                </p>
              </div>
            </div>
          </Reveal>
          <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {myOrders.map((o) => (
              <OrderTrackCard key={o.id} order={o} onRequestCancel={handleRequestCancel} />
            ))}
          </div>
        </section>
      )}

      {/* ===== tab kategori + pencarian (sticky) ===== */}
      <div className="sticky top-16 z-30 mt-10 border-y border-ink/10 bg-paper/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex flex-wrap gap-1.5">
            {(["semua", "makanan", "minuman", "camilan"] as const).map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition-all active:scale-95 ${
                  cat === c
                    ? "bg-moss-900 text-paper shadow-card"
                    : "bg-white/70 text-ink-soft hover:bg-white hover:text-ink"
                }`}
              >
                {CATEGORY_LABEL[c]}
                <span className={`ml-1.5 text-xs ${cat === c ? "text-saffron-300" : "text-ink/40"}`}>
                  {c === "semua" ? menu.length : menu.filter((m) => m.category === c).length}
                </span>
              </button>
            ))}
          </div>
          <label className="relative">
            <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cari menu…"
              className="w-44 rounded-full border border-ink/15 bg-white/80 py-2 pl-9 pr-3 text-sm outline-none transition focus:w-56 focus:border-moss-500 focus:ring-2 focus:ring-moss-500/25 sm:w-52"
            />
          </label>
        </div>
      </div>

      {/* ===== grid menu ===== */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-ink/20 bg-white/50 py-20 text-center">
            <IconSearch className="mx-auto h-8 w-8 text-ink/30" />
            <p className="mt-3 font-display text-lg font-bold">Tidak ada yang cocok</p>
            <p className="text-sm text-ink-soft">Coba kata kunci lain atau ganti kategori.</p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((m, i) => (
              <MenuCard
                key={m.id}
                item={m}
                qty={cart[m.id] ?? 0}
                delay={Math.min(i, 7) * 55}
                onAdd={() => setQty(m.id, (cart[m.id] ?? 0) + 1)}
                onSet={(qty) => setQty(m.id, qty)}
              />
            ))}
          </div>
        )}

        <Reveal className="mt-12">
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-moss-600/25 bg-moss-50 px-6 py-5">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-moss-900 text-saffron-300">
                <IconBell className="h-5 w-5" />
              </span>
              <div>
                <p className="font-display text-lg font-bold leading-tight">Butuh pesanan rombongan atau acara?</p>
                <p className="text-sm text-ink-soft">Hubungi kami di 0812-3456-7890 — nasi kotak mulai Rp25.000.</p>
              </div>
            </div>
            <span className="rounded-full bg-saffron-500 px-4 py-2 font-display text-sm font-bold text-moss-950">
              Katering tersedia
            </span>
          </div>
        </Reveal>
      </section>

      {/* ===== keranjang mengambang - mobile friendly ===== */}
      <AnimatePresence>
        {cartCount > 0 && !drawer && (
          <motion.button
            key="cartbar"
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            onClick={() => setDrawer(true)}
            className={`fixed left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-full bg-moss-900 text-paper shadow-lift transition-colors hover:bg-moss-800 ${
              isMobile 
                ? 'bottom-4 left-4 right-4 w-auto translate-x-0 justify-between px-4 py-3 rounded-2xl' 
                : 'bottom-5 py-2.5 pl-3 pr-4 sm:bottom-6 sm:py-3 sm:pl-4 sm:pr-5'
            }`}
          >
            <div className="flex items-center gap-2">
              <motion.span
                key={cartCount}
                initial={{ scale: 1.5 }}
                animate={{ scale: 1 }}
                className={`grid place-items-center rounded-full bg-saffron-500 font-display font-extrabold text-moss-950 ${
                  isMobile ? 'h-8 w-8 text-sm' : 'h-7 w-7 text-xs sm:h-8 sm:w-8 sm:text-sm'
                }`}
              >
                {cartCount}
              </motion.span>
              <span className={`font-display font-bold ${isMobile ? 'text-base' : 'text-sm sm:inline'}`}>
                Lihat Keranjang
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`tabular-nums font-display font-bold ${isMobile ? 'text-lg text-saffron-300' : 'text-paper/70 hidden lg:inline'}`}>
                {rupiah(cartTotal)}
              </span>
              <IconArrow className={`text-saffron-300 ${isMobile ? 'h-5 w-5' : 'h-4 w-4'}`} />
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* ===== laci keranjang ===== */}
      <AnimatePresence>
        {drawer && (
          <>
            <motion.button
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawer(false)}
              className="fixed inset-0 z-50 bg-moss-950/55 backdrop-blur-[2px]"
              aria-label="Tutup keranjang"
            />
            <motion.aside
              key="drawer"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className={`fixed inset-y-0 right-0 z-50 flex w-full flex-col bg-paper shadow-lift ${
                isMobile ? 'max-w-full' : 'max-w-sm sm:max-w-md'
              }`}
            >
              <header className={`flex items-center justify-between border-b border-ink/10 ${
                isMobile ? 'px-3 py-2.5' : 'px-4 py-3 sm:px-5 sm:py-4'
              }`}>
                <h3 className={`flex items-center gap-2 font-display font-extrabold ${
                  isMobile ? 'text-base' : 'text-lg sm:text-xl'
                }`}>
                  <IconBag className={`text-moss-600 ${isMobile ? 'h-4 w-4' : 'h-5 w-5'}`} />
                  {placed ? "Pesanan Terkirim" : "Keranjang"}
                </h3>
                <button
                  onClick={() => setDrawer(false)}
                  className={`grid place-items-center rounded-full border border-ink/15 bg-white transition hover:bg-chili-100 active:scale-90 ${
                    isMobile ? 'h-8 w-8' : 'h-9 w-9'
                  }`}
                  aria-label="Tutup"
                >
                  <IconX className={isMobile ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
                </button>
              </header>

              {placed ? (
                /* ---------- sukses ---------- */
                <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center sm:px-8">
                  <motion.span
                    initial={{ scale: 0.4, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 220, damping: 14 }}
                    className="grid h-16 w-16 place-items-center rounded-full bg-moss-600 text-paper sm:h-20 sm:w-20"
                  >
                    <IconCheck className="h-7 w-7 sm:h-9 sm:w-9" />
                  </motion.span>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink-soft">Nomor pesananmu</p>
                    <p className="font-display text-5xl font-extrabold text-moss-800 sm:text-6xl">
                      #{String(placed.number).padStart(2, "0")}
                    </p>
                  </div>
                  <p className="text-xs leading-relaxed text-ink-soft sm:text-sm">
                    Notifikasi sudah masuk ke kasir. Pantau statusnya — berubah otomatis begitu dapur
                    mulai memasak.
                  </p>
                  <button
                    onClick={trackOrder}
                    className="mt-2 flex items-center gap-2 rounded-full bg-moss-900 px-5 py-2.5 font-display text-sm font-bold text-paper transition hover:bg-moss-700 active:scale-95 sm:px-6 sm:py-3"
                  >
                    Pantau Pesanan <IconArrow className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <>
                  {/* ---------- isi keranjang ---------- */}
                  <div className="flex-1 overflow-y-auto px-4 py-3 sm:px-5 sm:py-4">
                    {cartLines.length === 0 ? (
                      <p className="py-12 text-center text-xs text-ink-soft sm:text-sm">Keranjang masih kosong — pilih menu dulu.</p>
                    ) : (
                      <ul className="space-y-2.5">
                        <AnimatePresence initial={false}>
                          {cartLines.map(({ item, qty }) => (
                            <motion.li
                              key={item.id}
                              layout
                              initial={{ opacity: 0, x: 24 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: 24, height: 0 }}
                              className="flex items-center gap-2.5 rounded-lg border border-ink/10 bg-white p-2"
                            >
                              <img
                                src={item.img}
                                alt=""
                                onError={(e) => {
                                  e.currentTarget.src = IMG_FALLBACK;
                                }}
                                className="h-12 w-12 rounded-md object-cover sm:h-14 sm:w-14"
                              />
                              <div className="min-w-0 flex-1">
                                <p className="truncate font-display text-sm font-bold">{item.name}</p>
                                <p className="text-xs tabular-nums text-ink-soft">
                                  {rupiah(item.price)} × {qty}
                                </p>
                              </div>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => setQty(item.id, qty - 1)}
                                  className="grid h-6 w-6 place-items-center rounded-full bg-moss-50 transition hover:bg-chili-100 active:scale-90 sm:h-7 sm:w-7"
                                >
                                  <IconMinus className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                </button>
                                <span className="w-5 text-center font-display text-sm font-bold sm:w-6">{qty}</span>
                                <button
                                  onClick={() => setQty(item.id, qty + 1)}
                                  className="grid h-6 w-6 place-items-center rounded-full bg-moss-900 text-paper transition active:scale-90 sm:h-7 sm:w-7"
                                >
                                  <IconPlus className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                </button>
                              </div>
                            </motion.li>
                          ))}
                        </AnimatePresence>
                      </ul>
                    )}

                    <div className="mt-4 space-y-3">
                      <label className="block">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-ink-soft">Nama</span>
                        <input
                          value={form.customer}
                          onChange={(e) => setForm((f) => ({ ...f, customer: e.target.value }))}
                          placeholder="cth: Rina"
                          className="mt-1 w-full rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm outline-none transition focus:border-moss-500 focus:ring-2 focus:ring-moss-500/25"
                        />
                      </label>
                      <label className="block">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-ink-soft">Meja / Bungkus</span>
                        <select
                          value={form.table}
                          onChange={(e) => setForm((f) => ({ ...f, table: e.target.value }))}
                          className="mt-1 w-full rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm outline-none transition focus:border-moss-500 focus:ring-2 focus:ring-moss-500/25"
                        >
                          {TABLES.map((t) => (
                            <option key={t}>{t}</option>
                          ))}
                        </select>
                      </label>
                      <label className="block">
                        <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-ink-soft">
                          <IconNote className="h-3 w-3" /> Catatan dapur
                        </span>
                        <textarea
                          value={form.note}
                          onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                          placeholder="cth: tidak pakai bawang goreng"
                          rows={2}
                          className="mt-1 w-full resize-none rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm outline-none transition focus:border-moss-500 focus:ring-2 focus:ring-moss-500/25"
                        />
                      </label>
                    </div>
                  </div>

                  <footer className="border-t border-ink/10 bg-white/60 px-4 py-3 sm:px-5 sm:py-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-ink-soft">Total</span>
                      <span className="font-display text-xl font-extrabold tabular-nums sm:text-2xl">{rupiah(cartTotal)}</span>
                    </div>
                    <button
                      onClick={place}
                      disabled={cartCount === 0 || placing}
                      className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-full bg-saffron-500 py-3 font-display text-sm font-extrabold text-moss-950 transition-all hover:bg-saffron-400 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {placing ? (
                        <span className="animate-blink">Mengirim ke dapur…</span>
                      ) : (
                        <>
                          <IconSend className="h-4 w-4" /> Kirim Pesanan
                        </>
                      )}
                    </button>
                    <p className="mt-2 text-center text-[10px] text-ink-soft">
                      Kasir menerima notifikasi begitu pesanan terkirim.
                    </p>
                  </footer>
                </>
              )}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
