import React, { useCallback, useEffect, useState } from "react";
import { Linking, Pressable, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IconButton } from "@/components/Button";
import { colors, radius, shadow } from "@/theme";
import { mobileApi } from "@/lib/api";

type HelpData = {
  title: string;
  whatsapp: string;
  faq: { pertanyaan: string; jawaban: string }[];
};

export default function Bantuan() {
  const insets = useSafeAreaInsets();
  const [data, setData] = useState<HelpData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const response = await mobileApi.getCustomerHelp();
      setData(response.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Backend belum tersambung");
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const whatsapp = data?.whatsapp || "";

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingTop: insets.top + 8, paddingHorizontal: 20, paddingBottom: 32 }}
      showsVerticalScrollIndicator={false}
    >
      <Header title={data?.title || "Bantuan"} />

      {error && (
        <Pressable onPress={loadData} style={{ marginTop: 16, borderRadius: radius.md, backgroundColor: colors.dangerSoft, padding: 12 }}>
          <Text style={{ color: colors.danger, fontWeight: "800", fontSize: 12 }}>Backend belum tersambung. Tap untuk muat ulang.</Text>
        </Pressable>
      )}

      <View style={{ marginTop: 22, gap: 12 }}>
        {!!whatsapp && (
          <Pressable
            onPress={() => Linking.openURL(`https://wa.me/${whatsapp.replace(/\D/g, "").replace(/^0/, "62")}`)}
            style={{ flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: colors.card, borderRadius: radius.md, padding: 14, ...shadow.soft }}
          >
            <View style={{ width: 42, height: 42, borderRadius: radius.sm, backgroundColor: colors.primarySoft, alignItems: "center", justifyContent: "center" }}>
              <Ionicons name="logo-whatsapp" size={22} color={colors.primaryDark} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontWeight: "900" }}>Customer Service</Text>
              <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 2 }}>{whatsapp}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textFaint} />
          </Pressable>
        )}

        {(data?.faq || []).map((item, index) => (
          <View key={`${item.pertanyaan}-${index}`} style={{ backgroundColor: colors.card, borderRadius: radius.md, padding: 14, ...shadow.soft }}>
            <Text style={{ color: colors.text, fontWeight: "900", lineHeight: 20 }}>{item.pertanyaan}</Text>
            <Text style={{ color: colors.textMuted, marginTop: 8, lineHeight: 21 }}>{item.jawaban}</Text>
          </View>
        ))}

        {!error && data && data.faq.length === 0 && (
          <Text style={{ color: colors.textMuted, textAlign: "center", paddingVertical: 36 }}>Belum ada FAQ bantuan.</Text>
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
