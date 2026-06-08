import React from "react";
import { Image, Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, shadow } from "@/theme";
import type { CustomerPaymentMethod } from "@/lib/api";

const typeLabel: Record<CustomerPaymentMethod["tipe_metode"], string> = {
  bank_transfer: "Bank Transfer",
  qris: "QRIS",
  e_wallet: "E-Wallet",
  cash: "Cash",
};

export function PaymentMethodCard({
  method,
  selected,
  onPress,
}: {
  method: CustomerPaymentMethod;
  selected?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: colors.card,
        borderRadius: radius.md,
        padding: 14,
        borderWidth: selected ? 1.5 : 0,
        borderColor: selected ? colors.primary : colors.border,
        ...shadow.soft,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <View style={{ width: 44, height: 44, borderRadius: radius.sm, backgroundColor: colors.primarySoft, alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
          {method.qr_image_url && method.tipe_metode === "qris" ? (
            <Image source={{ uri: method.qr_image_url }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
          ) : (
            <Ionicons name={method.tipe_metode === "cash" ? "cash-outline" : method.tipe_metode === "qris" ? "qr-code-outline" : "card-outline"} size={23} color={colors.primaryDark} />
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.text, fontWeight: "900" }}>{method.nama_metode}</Text>
          <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 2 }}>
            {typeLabel[method.tipe_metode]}{method.nama_bank ? ` · ${method.nama_bank}` : ""}
          </Text>
        </View>
        {selected !== undefined && (
          <Ionicons name={selected ? "radio-button-on" : "radio-button-off"} size={22} color={selected ? colors.primary : colors.textFaint} />
        )}
      </View>

      {!!method.nomor_rekening && <Info label="Nomor" value={method.nomor_rekening} />}
      {!!method.nama_pemilik && <Info label="Atas Nama" value={method.nama_pemilik} />}
      {!!method.instruksi_pembayaran && (
        <Text style={{ color: colors.textMuted, marginTop: 10, lineHeight: 20 }}>{method.instruksi_pembayaran}</Text>
      )}
    </Pressable>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12, marginTop: 10 }}>
      <Text style={{ color: colors.textMuted, fontSize: 12 }}>{label}</Text>
      <Text style={{ color: colors.text, fontWeight: "800", fontSize: 12, flex: 1, textAlign: "right" }}>{value}</Text>
    </View>
  );
}
