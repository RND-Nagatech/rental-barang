import React from "react";
import { Pressable, ScrollView, Switch, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IconButton } from "@/components/Button";
import { colors, radius, shadow } from "@/theme";
import { useCustomerPrefs } from "@/store/CustomerPrefsContext";

export default function Notifikasi() {
  const insets = useSafeAreaInsets();
  const { notifications, setNotification } = useCustomerPrefs();

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ paddingTop: insets.top + 8, paddingHorizontal: 20, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 22 }}>
        <IconButton onPress={() => router.back()} bg={colors.card}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </IconButton>
        <Text style={{ fontSize: 22, fontWeight: "900", color: colors.text }}>Notifikasi</Text>
      </View>

      <View style={{ gap: 10 }}>
        <ToggleRow
          title="Update Pesanan"
          subtitle="Status booking, disiapkan, dan sedang disewa"
          value={notifications.pesanan}
          onValueChange={(value) => setNotification("pesanan", value)}
        />
        <ToggleRow
          title="Pembayaran"
          subtitle="Pengingat DP, pelunasan, dan tagihan"
          value={notifications.pembayaran}
          onValueChange={(value) => setNotification("pembayaran", value)}
        />
        <ToggleRow
          title="Promo"
          subtitle="Info promo dan barang baru"
          value={notifications.promo}
          onValueChange={(value) => setNotification("promo", value)}
        />
      </View>
    </ScrollView>
  );
}

function ToggleRow({
  title,
  subtitle,
  value,
  onValueChange,
}: {
  title: string;
  subtitle: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  return (
    <Pressable
      onPress={() => onValueChange(!value)}
      style={{ flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: colors.card, borderRadius: radius.md, padding: 14, ...shadow.soft }}
    >
      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.text, fontWeight: "900" }}>{title}</Text>
        <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 2 }}>{subtitle}</Text>
      </View>
      <Switch value={value} onValueChange={onValueChange} trackColor={{ true: colors.primarySoft, false: colors.border }} thumbColor={value ? colors.primary : colors.textFaint} />
    </Pressable>
  );
}
