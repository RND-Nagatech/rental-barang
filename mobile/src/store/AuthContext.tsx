import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { CustomerProfile } from "@/data/types";
import { mobileApi } from "@/lib/api";

const TOKEN_KEY = "rentory_customer_token";
const CUSTOMER_KEY = "rentory_customer";
const memoryStorage: Record<string, string | null> = {};

const sessionStorage = {
  async getItem(key: string) {
    try {
      const value = await AsyncStorage.getItem(key);
      memoryStorage[key] = value;
      return value;
    } catch {
      return memoryStorage[key] || null;
    }
  },
  async setItem(key: string, value: string) {
    memoryStorage[key] = value;
    try {
      await AsyncStorage.setItem(key, value);
    } catch {
      // Expo Go can run without this native module. Keep the session in memory.
    }
  },
  async removeItem(key: string) {
    memoryStorage[key] = null;
    try {
      await AsyncStorage.removeItem(key);
    } catch {
      // Memory fallback is already cleared.
    }
  },
};

type CustomerSession = CustomerProfile["customer"];

type AuthContextShape = {
  token: string | null;
  customer: CustomerSession | null;
  loading: boolean;
  isLoggedIn: boolean;
  login: (input: { identifier: string; password: string }) => Promise<void>;
  register: (input: {
    nama_customer: string;
    no_hp: string;
    email: string;
    password: string;
    alamat?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<CustomerProfile | null>;
};

const AuthContext = createContext<AuthContextShape | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [customer, setCustomer] = useState<CustomerSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      try {
        const [savedToken, savedCustomer] = await Promise.all([
          sessionStorage.getItem(TOKEN_KEY),
          sessionStorage.getItem(CUSTOMER_KEY),
        ]);
        if (!mounted) return;
        setToken(savedToken);
        setCustomer(savedCustomer ? (JSON.parse(savedCustomer) as CustomerSession) : null);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadSession();
    return () => {
      mounted = false;
    };
  }, []);

  const saveSession = useCallback(async (nextToken: string, nextCustomer: CustomerSession) => {
    setToken(nextToken);
    setCustomer(nextCustomer);
    await Promise.all([
      sessionStorage.setItem(TOKEN_KEY, nextToken),
      sessionStorage.setItem(CUSTOMER_KEY, JSON.stringify(nextCustomer)),
    ]);
  }, []);

  const login = useCallback(
    async (input: { identifier: string; password: string }) => {
      const response = await mobileApi.loginCustomer(input);
      await saveSession(response.token, response.customer);
    },
    [saveSession],
  );

  const register = useCallback(
    async (input: {
      nama_customer: string;
      no_hp: string;
      email: string;
      password: string;
      alamat?: string;
    }) => {
      const response = await mobileApi.registerCustomer(input);
      await saveSession(response.token, response.customer);
    },
    [saveSession],
  );

  const logout = useCallback(async () => {
    setToken(null);
    setCustomer(null);
    await Promise.all([sessionStorage.removeItem(TOKEN_KEY), sessionStorage.removeItem(CUSTOMER_KEY)]);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!token) return null;
    const profile = await mobileApi.getCustomerProfile(token);
    await saveSession(token, profile.customer);
    return profile;
  }, [saveSession, token]);

  const value = useMemo(
    () => ({
      token,
      customer,
      loading,
      isLoggedIn: Boolean(token),
      login,
      register,
      logout,
      refreshProfile,
    }),
    [customer, loading, login, logout, refreshProfile, register, token],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
