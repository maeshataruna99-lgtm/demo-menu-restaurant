import type { AdminUser, UserRole } from "./types";

/** 
 * Demo users untuk autentikasi admin/staff
 * Password di-hash sederhana untuk demo purposes
 * NOTE: Di production, gunakan backend authentication yang proper!
 */

// Simple hash function untuk obfuscation (bukan cryptographic security!)
const simpleHash = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
};

// Pre-hashed passwords
const PASSWORDS = {
  admin: simpleHash("admin123"),
  staff: simpleHash("staff123"),
  kasir: simpleHash("kasir123"),
} as const;

export const DEMO_USERS: AdminUser[] = [
  {
    id: "user-1",
    username: "admin",
    name: "Administrator",
    role: "admin",
  },
  {
    id: "user-2",
    username: "staff",
    name: "Staff Manager",
    role: "staff",
  },
  {
    id: "user-3",
    username: "kasir",
    name: "Kasir Warung",
    role: "kasir",
  },
];

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResult {
  success: boolean;
  user?: AdminUser;
  error?: string;
}

/**
 * Validasi login untuk demo
 * NOTE: Ini hanya untuk demo/prototyping. 
 * Di production, gunakan backend API dengan proper authentication!
 */
export function authenticate(credentials: LoginCredentials): AuthResult {
  const { username, password } = credentials;
  
  // Cari user berdasarkan username
  const user = DEMO_USERS.find(u => u.username === username);
  
  if (!user) {
    return {
      success: false,
      error: "Username tidak ditemukan",
    };
  }
  
  // Verifikasi password
  const hashedPassword = simpleHash(password);
  const expectedHash = PASSWORDS[username as keyof typeof PASSWORDS];
  
  if (hashedPassword !== expectedHash) {
    return {
      success: false,
      error: "Password salah",
    };
  }
  
  return {
    success: true,
    user,
  };
}

/**
 * Cek apakah user memiliki role yang diperlukan
 */
export function hasRole(user: AdminUser | null, requiredRole: UserRole): boolean {
  if (!user) return false;
  
  const roleHierarchy: Record<UserRole, number> = {
    kasir: 1,
    staff: 2,
    admin: 3,
  };
  
  return roleHierarchy[user.role] >= roleHierarchy[requiredRole];
}

/**
 * Get display name untuk role
 */
export function getRoleDisplayName(role: UserRole): string {
  const displayNames: Record<UserRole, string> = {
    kasir: "Kasir",
    staff: "Staff",
    admin: "Administrator",
  };
  return displayNames[role];
}
