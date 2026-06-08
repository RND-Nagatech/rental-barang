import React, { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IconButton } from "@/components/Button";
import { colors, radius } from "@/theme";
import { mobileApi, type CustomerPaymentMethod } from "@/lib/api";
import { PaymentMethodCard } from "@/components/PaymentMethodCard";

export default function MetodePembayaran() {
  const insets = useSafeAreaInsets();
  const [methods, setMethods] = useState<CustomerPaymentMethod[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const response = await mobileApi.getCustomerPaymentMethods();
      setMethods(response.data.items);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Backend belum tersambung");
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingTop: insets.top + 8, paddingHorizontal: 20, paddingBottom: 32 }}
      showsVerticalScrollIndicator={false}
    >
      <Header title="Metode Pembayaran" />

      {error && (
        <Pressable onPress={loadData} style={{ marginTop: 16, borderRadius: radius.md, backgroundColor: colors.dangerSoft, padding: 12 }}>
          <Text style={{ color: colors.danger, fontWeight: "800", fontSize: 12 }}>Backend belum tersambung. Tap untuk muat ulang.</Text>
        </Pressable>
      )}

      <View style={{ marginTop: 22, gap: 10 }}>
        {methods.length === 0 && !error ? (
          <Text style={{ color: colors.textMuted, textAlign: "center", paddingVertical: 28 }}>Belum ada metode pembayaran toko.</Text>
        ) : (
          methods.map((method) => <PaymentMethodCard key={method.id} method={method} />)
        )}
      </View>
    </ScrollView>
  );
}

function Header({ title }: { title: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
      <IconButton onPress={() => router.back()} bg={colors.card}>
        <Ionicons name="chevron-back" size={22} color={colors.text} />
      </IconButton>
      <Text style={{ fontSize: 22, fontWeight: "900", color: colors.text }}>{title}</Text>
    </View>
  );
}
