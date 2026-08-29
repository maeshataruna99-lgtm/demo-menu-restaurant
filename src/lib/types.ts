/** Tipe data yang mirrors model Prisma di /prisma/schema.prisma */

export type Category = "makanan" | "minuman" | "camilan" | "dessert" | "lainnya";

export type OrderStatus = "BARU" | "DIPROSES" | "SIAP" | "SELESAI" | "DIBAYAR" | "DIBATALKAN";

export type UserRole = "admin" | "staff" | "kasir";

export interface MenuItem {
  id: string;
  name: string;
  category: Category;
  price: number;
  desc: string;
  img: string;
  popular?: boolean;
  spicy?: boolean;
  available: boolean;
}

export interface MenuCategory {
  id: string;
  name: string;
  category: Category;
  icon?: string;
  order: number;
}

export interface OrderItem {
  menuItemId: string;
  name: string;
  price: number;
  qty: number;
}

export interface TimelineEntry {
  status: OrderStatus;
  at: number;
}

export interface Order {
  id: string;
  number: number;
  customer: string;
  table: string;
  note?: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  createdAt: number;
  updatedAt: number;
  timeline: TimelineEntry[];
  cancelReason?: string;
  cancelRequested?: boolean;
  tableMoveRequested?: {
    fromTable: string;
    toTable: string;
    requestedAt: number;
  };
}

export interface CashierStats {
  revenue: number;
  paidCount: number;
  activeCount: number;
  waitingPayment: number;
  avgTicket: number;
}

export interface AdminUser {
  id: string;
  username: string;
  role: UserRole;
  name: string;
}
