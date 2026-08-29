import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import CashierView from "./components/CashierView";
import CustomerView from "./components/CustomerView";
import { AdminView } from "./components/AdminView";
import { IconBell, IconCheck, IconLogo, IconSparkle, IconX, IconUser } from "./components/Icons";
import { onBus } from "./lib/bus";
import { rupiah, STATUS_META, timeShort } from "./lib/format";
import { authenticate, hasRole, type AdminUser, type UserRole } from "./lib/auth";

type Role = "pelanggan" | "kasir" | "admin";
type Tone = "saffron" | "moss" | "ink";

interface Notif {
  id: number;
  title: string;
  body: string;
  tone: Tone;
  at: number;
}

const TONE_BAR: Record<Tone, string> = {
  saffron: "border-l-saffron-500",
  moss: "border-l-moss-500",
  ink: "border-l-teal-500",
};
const TONE_ICON: Record<Tone, string> = {
  saffron: "bg-saffron-500 text-moss-950",
  moss: "bg-moss-600 text-paper",
  ink: "bg-teal-600 text-paper",
};

export default function App() {
  const [role, setRole] = useState<Role>(() => {
    try {
      const saved = sessionStorage.getItem("warung-laras-role");
      if (saved === "kasir") return "kasir";
      if (saved === "admin") return "admin";
      return "pelanggan";
    } catch {
      return "pelanggan";
    }
  });
  
  // State untuk autentikasi admin
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [loginError, setLoginError] = useState("");

  const [toasts, setToasts] = useState<Notif[]>([]);
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [unread, setUnread] = useState(0);
  const [bellOpen, setBellOpen] = useState(false);
  const [syncAt, setSyncAt] = useState(0);
  const idRef = useRef(1);

  useEffect(() => {
    try {
      sessionStorage.setItem("warung-laras-role", role);
    } catch {
      /* abaikan */
    }
    setBellOpen(false);
  }, [role]);

  // Handle logout admin
  const handleLogout = () => {
    setCurrentUser(null);
    setRole("pelanggan");
    setShowLoginModal(false);
  };

  // Handle close admin panel - kembali ke home
  const handleCloseAdminPanel = () => {
    setRole("pelanggan");
    setShowLoginModal(false);
  };

  // Handle login
  const handleLogin = () => {
    const result = authenticate(loginForm);
    if (result.success && result.user) {
      setCurrentUser(result.user);
      setRole(result.user.role === "kasir" ? "kasir" : "admin");
      setShowLoginModal(false);
      setLoginForm({ username: "", password: "" });
      setLoginError("");
    } else {
      setLoginError(result.error || "Login gagal");
    }
  };

  const notify = useCallback((n: Omit<Notif, "id" | "at">) => {
    const id = idRef.current++;
    const item: Notif = { ...n, id, at: Date.now() };
    setToasts((p) => [...p.slice(-3), item]);
    setNotifs((p) => [item, ...p].slice(0, 14));
    setUnread((u) => u + 1);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 4600);
  }, []);

  /* semua event realtime (dari tab ini maupun tab lain) → notifikasi */
  useEffect(
    () =>
      onBus((e) => {
        setSyncAt(Date.now());
        if (e.type === "order:created")
          notify({
            tone: "saffron",
            title: `Pesanan baru #${String(e.order.number).padStart(2, "0")} masuk!`,
            body: `${e.order.customer} • ${e.order.table} • ${rupiah(e.order.total)}`,
          });
        if (e.type === "order:updated")
          notify({
            tone: "ink",
            title: `#${String(e.order.number).padStart(2, "0")} → ${STATUS_META[e.order.status].label}`,
            body: `${e.order.customer} • ${e.order.table}`,
          });
        if (e.type === "order:paid")
          notify({
            tone: "moss",
            title: `Pembayaran #${String(e.order.number).padStart(2, "0")} diterima`,
            body: `${rupiah(e.order.total)} masuk kas`,
          });
      }),
    [notify]
  );

  const dark = role === "kasir";

  return (
    <div className="min-h-screen">
      {/* ===== header ===== */}
      <header
        className={`sticky top-0 z-40 border-b transition-colors duration-300 ${
          dark ? "border-paper/10 bg-moss-950/92 text-paper" : "border-ink/10 bg-paper/90 text-ink"
        } backdrop-blur`}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
          <a href="#" className="flex items-center gap-2.5" onClick={(e) => e.preventDefault()}>
            <span
              className={`grid h-9 w-9 place-items-center rounded-lg ${
                dark ? "bg-saffron-500 text-moss-950" : "bg-moss-900 text-saffron-300"
              }`}
            >
              <IconLogo className="h-5 w-5" />
            </span>
            <span className="leading-tight">
              <span className="block font-display text-lg font-extrabold leading-none">Warung Laras</span>
              <span className={`block text-[10px] font-bold uppercase tracking-[0.2em] ${dark ? "text-paper/50" : "text-ink-soft"}`}>
                {dark ? "Dashboard Kasir" : "Menu Digital"}
              </span>
            </span>
          </a>

          {/* indikator realtime */}
          <span
            className={`ml-2 hidden items-center gap-2 rounded-full border px-3 py-1.5 sm:flex ${
              dark ? "border-paper/15 bg-moss-900/70" : "border-ink/12 bg-white/70"
            }`}
            title="Tersambung ke kanal realtime (WebSocket)"
          >
            <span key={syncAt} className="relative flex h-2 w-2">
              <span
                className={`absolute h-full w-full animate-ping rounded-full opacity-70 ${
                  syncAt && Date.now() - syncAt < 2500 ? "bg-saffron-500" : "bg-moss-500"
                }`}
              />
              <span className={`relative h-2 w-2 rounded-full ${syncAt && Date.now() - syncAt < 2500 ? "bg-saffron-500" : "bg-moss-500"}`} />
            </span>
            <span className="text-[10px] font-extrabold uppercase tracking-[0.2em]">Live</span>
          </span>

          <div className="ml-auto flex items-center gap-2">
            {/* tombol admin/login */}
            {role === "admin" && currentUser ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowLoginModal(true)}
                  className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold transition ${
                    dark
                      ? "border-paper/15 bg-moss-900/70 hover:bg-moss-800 text-paper"
                      : "border-ink/12 bg-white/80 hover:bg-white text-ink"
                  }`}
                >
                  <IconUser className="w-4 h-4" />
                  <span className="hidden sm:inline">{currentUser.name}</span>
                  <span className="text-[10px] opacity-60 capitalize">({currentUser.role})</span>
                </button>
                <button
                  onClick={handleLogout}
                  className={`grid h-10 w-10 place-items-center rounded-full border transition active:scale-90 ${
                    dark
                      ? "border-paper/15 bg-moss-900/70 hover:bg-red-900/50"
                      : "border-ink/12 bg-white/80 hover:bg-red-50"
                  }`}
                  aria-label="Logout"
                  title="Logout"
                >
                  <IconX className="h-4 w-4 text-red-500" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowLoginModal(true)}
                className={`grid h-10 w-10 place-items-center rounded-full border transition active:scale-90 ${
                  dark
                    ? "border-paper/15 bg-moss-900/70 hover:bg-saffron-900/50"
                    : "border-ink/12 bg-white/80 hover:bg-saffron-50"
                }`}
                aria-label="Login Admin"
                title="Login Admin/Staff"
              >
                <IconUser className={`h-4 w-4 ${dark ? "text-saffron-300" : "text-saffron-600"}`} />
              </button>
            )}

            {/* lonceng notifikasi */}
            <div className="relative">
              <button
                onClick={() => setBellOpen((v) => !v)}
                className={`relative grid h-10 w-10 place-items-center rounded-full border transition active:scale-90 ${
                  dark
                    ? "border-paper/15 bg-moss-900/70 hover:bg-moss-800"
                    : "border-ink/12 bg-white/80 hover:bg-white"
                }`}
                aria-label="Notifikasi"
              >
                <IconBell className="h-4.5 w-4.5" />
                <AnimatePresence>
                  {unread > 0 && (
                    <motion.span
                      key={unread}
                      initial={{ scale: 0.4 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-chili-500 px-1 text-[10px] font-extrabold text-paper"
                    >
                      {unread}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
              <AnimatePresence>
                {bellOpen && (
                  <>
                    <button className="fixed inset-0 z-40 cursor-default" onClick={() => setBellOpen(false)} aria-label="Tutup" />
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.97 }}
                      transition={{ duration: 0.16 }}
                      className={`absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border shadow-lift ${
                        dark ? "border-paper/12 bg-moss-900 text-paper" : "border-ink/10 bg-white"
                      }`}
                    >
                      <div className={`flex items-center justify-between border-b px-4 py-2.5 ${dark ? "border-paper/10" : "border-ink/10"}`}>
                        <p className="font-display text-sm font-extrabold">Notifikasi</p>
                        <button
                          onClick={() => setUnread(0)}
                          className={`text-[11px] font-bold ${dark ? "text-saffron-300 hover:text-saffron-200" : "text-moss-600 hover:text-moss-500"}`}
                        >
                          Tandai dibaca
                        </button>
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {notifs.length === 0 ? (
                          <p className={`px-4 py-8 text-center text-sm ${dark ? "text-paper/40" : "text-ink-soft"}`}>
                            Belum ada notifikasi. Pesan sesuatu di mode Pelanggan!
                          </p>
                        ) : (
                          notifs.map((n) => (
                            <div key={n.id} className={`flex gap-2.5 border-b border-dashed px-4 py-2.5 last:border-0 ${dark ? "border-paper/8" : "border-ink/8"}`}>
                              <span className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full ${TONE_ICON[n.tone]}`}>
                                {n.tone === "saffron" ? <IconBell className="h-3 w-3" /> : n.tone === "moss" ? <IconCheck className="h-3 w-3" /> : <IconSparkle className="h-3 w-3" />}
                              </span>
                              <div className="min-w-0">
                                <p className="truncate text-[13px] font-bold leading-tight">{n.title}</p>
                                <p className={`truncate text-xs ${dark ? "text-paper/55" : "text-ink-soft"}`}>{n.body}</p>
                                <p className={`text-[10px] tabular-nums ${dark ? "text-paper/35" : "text-ink/40"}`}>{timeShort(n.at)}</p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* pemilih peran */}
            <div
              className={`relative flex rounded-full border p-1 ${dark ? "border-paper/15 bg-moss-900/70" : "border-ink/12 bg-white/70"}`}
            >
              {(["pelanggan", "kasir"] as Role[]).map((r) => (
                <button
                  key={r}
                  onClick={() => setRole(r)}
                  className={`relative rounded-full px-3.5 py-1.5 text-[13px] font-bold capitalize transition-colors sm:px-4 ${
                    role === r ? (dark ? "text-moss-950" : "text-paper") : dark ? "text-paper/60 hover:text-paper" : "text-ink-soft hover:text-ink"
                  }`}
                >
                  {role === r && (
                    <motion.span
                      layoutId="role-pill"
                      transition={{ type: "spring", stiffness: 400, damping: 32 }}
                      className={`absolute inset-0 rounded-full ${dark ? "bg-saffron-500" : "bg-moss-900"}`}
                    />
                  )}
                  <span className="relative z-10">{r}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* ===== konten ===== */}
      <AnimatePresence mode="wait">
        <motion.main
          key={role}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.22 }}
        >
          {role === "pelanggan" ? (
            <CustomerView />
          ) : role === "kasir" ? (
            <CashierView />
          ) : currentUser ? (
            <AdminView currentUser={currentUser} onClose={handleCloseAdminPanel} />
          ) : null}
        </motion.main>
      </AnimatePresence>

      {/* ===== footer ===== */}
      <footer className={`border-t ${dark ? "border-paper/10 bg-moss-950 text-paper/60" : "border-ink/10 bg-paper-deep/60 text-ink-soft"}`}>
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-5 text-xs sm:px-6 lg:px-8">
          <p>
            <span className="font-display font-bold">Warung Laras</span> — demo full-flow realtime: menu → pesan →
            notifikasi → status → total di kasir.
          </p>
          <div className="flex flex-wrap items-center gap-1.5">
            {["Node.js + ws", "Prisma", "PostgreSQL", "REST + WebSocket"].map((t) => (
              <span
                key={t}
                className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                  dark ? "border-paper/15 bg-moss-900/60 text-paper/70" : "border-ink/12 bg-white/70"
                }`}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        <p className={`border-t px-4 py-2.5 text-center text-[11px] ${dark ? "border-paper/8 text-paper/35" : "border-ink/8 text-ink/45"}`}>
          Demo ini menjalankan lapisan backend di browser (BroadcastChannel ≈ WebSocket, localStorage ≈ PostgreSQL).
          Server asli Node + ws + Prisma tersedia di folder <code className="font-bold">/server</code> dan{" "}
          <code className="font-bold">/prisma</code> — API & event-nya identik.
        </p>
      </footer>

      {/* ===== modal login admin ===== */}
      {showLoginModal && !currentUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[80] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">Login Admin / Staff</h3>
              <p className="text-sm text-gray-500 mt-1">Masuk untuk mengelola menu dan pesanan</p>
            </div>
            
            <div className="p-6 space-y-4">
              {/* Username */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  value={loginForm.username}
                  onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="admin / staff / kasir"
                  autoComplete="username"
                />
              </div>
              
              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                {loginError && (
                  <p className="mt-2 text-sm text-red-600 font-medium">{loginError}</p>
                )}
              </div>
              
              {/* Demo credentials info */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-xs text-amber-800 font-medium mb-2">Demo Credentials:</p>
                <div className="space-y-1 text-xs text-amber-700">
                  <div className="flex justify-between">
                    <span>Admin:</span>
                    <code className="font-mono bg-amber-100 px-1.5 py-0.5 rounded">admin / admin123</code>
                  </div>
                  <div className="flex justify-between">
                    <span>Staff:</span>
                    <code className="font-mono bg-amber-100 px-1.5 py-0.5 rounded">staff / staff123</code>
                  </div>
                  <div className="flex justify-between">
                    <span>Kasir:</span>
                    <code className="font-mono bg-amber-100 px-1.5 py-0.5 rounded">kasir / kasir123</code>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowLoginModal(false);
                  setLoginError("");
                  setLoginForm({ username: "", password: "" });
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors text-sm font-medium"
              >
                Batal
              </button>
              <button
                onClick={handleLogin}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
              >
                Login
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== tumpukan toast ===== */}
      <div className="pointer-events-none fixed right-4 top-20 z-[80] flex w-[calc(100%-2rem)] max-w-xs flex-col gap-2">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, x: 60, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 60, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
              className={`pointer-events-auto flex items-start gap-2.5 rounded-lg border-l-4 bg-white p-3 shadow-lift ring-1 ring-ink/10 ${TONE_BAR[t.tone]}`}
            >
              <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full ${TONE_ICON[t.tone]}`}>
                {t.tone === "saffron" ? <IconBell className="h-3.5 w-3.5" /> : t.tone === "moss" ? <IconCheck className="h-3.5 w-3.5" /> : <IconSparkle className="h-3.5 w-3.5" />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-bold leading-tight text-ink">{t.title}</p>
                <p className="truncate text-xs text-ink-soft">{t.body}</p>
              </div>
              <button
                onClick={() => setToasts((p) => p.filter((x) => x.id !== t.id))}
                className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-ink/40 transition hover:bg-ink/5 hover:text-ink"
                aria-label="Tutup notifikasi"
              >
                <IconX className="h-3 w-3" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
