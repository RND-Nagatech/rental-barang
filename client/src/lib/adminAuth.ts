const ADMIN_TOKEN_KEY = "rentory_admin_token";
const ADMIN_USER_KEY = "rentory_admin_user";

export type AdminUser = {
  kode_user: string;
  nama_user: string;
  email: string;
  role: "admin" | "staff";
};

export const adminAuth = {
  getToken() {
    if (typeof window === "undefined") return "";
    return window.localStorage.getItem(ADMIN_TOKEN_KEY) || "";
  },
  getUser(): AdminUser | null {
    if (typeof window === "undefined") return null;
    const raw = window.localStorage.getItem(ADMIN_USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AdminUser;
    } catch {
      return null;
    }
  },
  save(token: string, user: AdminUser) {
    window.localStorage.setItem(ADMIN_TOKEN_KEY, token);
    window.localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(user));
  },
  clear() {
    window.localStorage.removeItem(ADMIN_TOKEN_KEY);
    window.localStorage.removeItem(ADMIN_USER_KEY);
  },
};
