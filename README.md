# 🍜 Warung Laras — Modern POS System

Sistem Point of Sale (POS) modern berbasis web untuk warung/restoran dengan fitur **real-time order management**, **admin panel**, dan dukungan **mobile-first**. Siap deploy ke Vercel!

## ✨ Fitur Utama

### 🍽️ Untuk Pelanggan (Customer View)
- **Digital Menu**: Browse menu dengan kategori, gambar, dan deskripsi lengkap
- **Smart Cart**: Keranjang belanja dengan update otomatis
- **Order Management**: 
  - Input nomor meja dan nama pelanggan
  - Catatan khusus per item (pedas level, dll)
  - Request pembatalan pesanan (perlu persetujuan kasir)
  - Request pindah meja (perlu persetujuan staff)
- **Mobile Optimized**: Tampilan responsif untuk semua ukuran layar
- **Auto-refresh**: Update status pesanan setiap 3 detik (serverless compatible)

### 💼 Untuk Kasir (Cashier View)
- **Real-time Dashboard**: Statistik pesanan masuk, diproses, dan selesai
- **Order Management**: 
  - Terima/tolak pesanan baru
  - Update status pesanan (Preparing → Ready → Completed)
  - Kelola permintaan pembatalan dari pelanggan
  - Kelola permintaan pindah meja
- **Payment History**: Riwayat transaksi dengan detail lengkap
- **Role-based Access**: Hanya kasir yang bisa approve/cancel orders

### 🔐 Untuk Admin & Staff (Admin Panel)
- **Autentikasi Aman**: Login dengan role-based access control
  - **Admin**: Full access ke semua fitur
  - **Staff**: Manage menu dan approve table moves
  - **Kasir**: Akses terbatas ke cashier view saja
- **Menu Management**:
  - CRUD operasi untuk semua menu items
  - Kategorisasi menu (Makanan, Minuman, Dessert, Camilan, Lainnya)
  - Toggle status: Available, Populer, Pedas
  - Upload gambar via URL
  - Search dan filter berdasarkan kategori
- **Data Customization**: Tambah/edit/hapus kategori dan item menu sesuai kebutuhan

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm atau yarn

### Installation

```bash
# Clone repository
git clone <repository-url>
cd warung-laras

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env dengan konfigurasi database Anda

# Run development server
npm run dev
```

### Demo Credentials

| Role   | Username | Password    | Akses                          |
|--------|----------|-------------|--------------------------------|
| Admin  | admin    | admin123    | Full access (Manage Menu + Approvals) |
| Staff  | staff    | staff123    | Manage Menu + Table Moves      |
| Kasir  | kasir    | kasir123    | Cashier operations only        |

> ⚠️ **Security Note**: Autentikasi ini menggunakan client-side hashing untuk keperluan demo/prototyping. Untuk production, implementasikan backend authentication dengan JWT/sessions.

## 📱 Deployment

### Deploy ke Vercel (Recommended)

Proyek ini sudah dikonfigurasi untuk deployment serverless di Vercel:

```bash
# Build untuk production
npm run build

# Deploy ke Vercel
vercel
```

**Catatan Penting**:
- Aplikasi menggunakan **short polling** (3 detik interval) menggantikan WebSocket untuk kompatibilitas serverless
- Database eksternal (Supabase/Neon) diperlukan untuk persistence
- Frontend dan API routes berjalan di Vercel Serverless Functions

### Environment Variables

```env
# Database (Supabase/Neon PostgreSQL)
DATABASE_URL=postgresql://user:password@host:5432/dbname

# Supabase (Optional, untuk realtime features)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# App Configuration
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

## 🏗️ Arsitektur

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Vercel    │────▶│ Serverless   │────▶│  Supabase   │
│  Frontend   │     │   API Routes │     │  Database   │
└─────────────┘     └──────────────┘     └─────────────┘
       │
       │ Short Polling (3s)
       ▼
┌─────────────┐
│   Client    │
│  (Browser)  │
└─────────────┘
```

**Kenapa tidak pakai WebSocket?**
Vercel Serverless Functions memiliki batasan timeout dan tidak mendukung koneksi persisten. Solusi:
- ✅ **Short Polling**: Fetch data setiap 3 detik (simple, reliable)
- ✅ **Supabase Realtime**: Alternative untuk real-time updates (jika diperlukan)

## 🎨 Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: TailwindCSS (mobile-first responsive design)
- **State Management**: React Hooks (useState, useEffect, useContext)
- **Database**: PostgreSQL (via Supabase/Neon)
- **Deployment**: Vercel (Serverless Architecture)
- **Icons**: Custom SVG Icons

## 📂 Project Structure

```
warung-laras/
├── src/
│   ├── components/
│   │   ├── CustomerView.tsx    # Tampilan pelanggan
│   │   ├── CashierView.tsx     # Tampilan kasir
│   │   ├── AdminView.tsx       # Admin panel (menu management)
│   │   ├── LoginModal.tsx      # Autentikasi
│   │   └── Icons.tsx           # Icon components
│   ├── lib/
│   │   ├── auth.ts             # Authentication logic
│   │   ├── types.ts            # TypeScript definitions
│   │   ├── menu.ts             # Menu data & categories
│   │   └── utils.ts            # Helper functions
│   ├── App.tsx                 # Main application
│   └── main.tsx                # Entry point
├── public/
├── vercel.json                 # Vercel configuration
├── package.json
└── README.md
```

## 🔧 Development Commands

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview

# Lint code
npm run lint
```

## 📋 Features Checklist

- [x] Responsive design (mobile-first)
- [x] Customer ordering system
- [x] Cashier dashboard with order management
- [x] Admin panel for menu customization
- [x] Role-based authentication (Admin/Staff/Kasir)
- [x] Order cancellation requests (customer → cashier approval)
- [x] Table move requests (customer → staff approval)
- [x] Menu categorization (Food, Drinks, Dessert, Snacks, Others)
- [x] Menu item customization (price, description, image, tags)
- [x] Serverless compatible (no WebSocket dependency)
- [x] Auto-refresh mechanism (3s interval)
- [x] Production-ready build configuration

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

## 👥 Credits

Developed as a portfolio project demonstrating modern web development practices with React, TypeScript, and serverless architecture.

---

**Warung Laras** - Solusi POS modern untuk UMKM Indonesia 🇮🇩
