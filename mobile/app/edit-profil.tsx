import React, { useEffect, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button, IconButton } from "@/components/Button";
import { colors, radius } from "@/theme";
import { mobileApi } from "@/lib/api";
import { useAuth } from "@/store/AuthContext";

export default function EditProfil() {
  const insets = useSafeAreaInsets();
  const { token, customer, refreshProfile } = useAuth();
  const [nama, setNama] = useState(customer?.nama_customer || "");
  const [noHp, setNoHp] = useState(customer?.no_hp || "");
  const [email, setEmail] = useState(customer?.email || "");
  const [alamat, setAlamat] = useState(customer?.alamat_default || "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!token) router.replace({ pathname: "/login", params: { redirect: "/profil" } });
  }, [token]);

  async function handleSave() {
    if (!token) return;
    if (!nama.trim() || !noHp.trim()) {
      Alert.alert("Data belum lengkap", "Nama dan no HP wajib diisi.");
      return;
    }

    setSaving(true);
    try {
      await mobileApi.updateCustomerProfile(
        {
          nama_customer: nama,
          no_hp: noHp,
          email,
          alamat_default: alamat,
        },
        token,
      );
      await refreshProfile();
      Alert.alert("Berhasil", "Profil berhasil diperbarui.");
      router.back();
    } catch (error) {
      Alert.alert("Gagal menyimpan", error instanceof Error ? error.message : "Coba lagi beberapa saat.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 8, paddingHorizontal: 20, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        <Header title="Edit Profil" />
        <View style={{ gap: 12, marginTop: 24 }}>
          <Field label="Nama Customer" value={nama} onChangeText={setNama} />
          <Field label="No HP" value={noHp} onChangeText={setNoHp} keyboardType="phone-pad" />
          <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" />
          <Field label="Alamat Default" value={alamat} onChangeText={setAlamat} multiline />
        </View>
        <Button label="Simpan Profil" loading={saving} onPress={handleSave} style={{ marginTop: 20 }} />
      </ScrollView>
    </KeyboardAvoidingView>
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

function Field({
  label,
  multiline,
  ...rest
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  keyboardType?: "default" | "email-address" | "phone-pad";
  multiline?: boolean;
}) {
  return (
    <View>
      <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: "800", marginBottom: 6 }}>{label}</Text>
      <TextInput
        {...rest}
        autoCapitalize="none"
        multiline={multiline}
        placeholderTextColor={colors.textFaint}
        style={{
          backgroundColor: colors.card,
          borderRadius: radius.md,
          color: colors.text,
          fontSize: 15,
          paddingHorizontal: 14,
          paddingVertical: multiline ? 12 : 0,
          height: multiline ? 82 : 52,
          textAlignVertical: multiline ? "top" : "center",
        }}
      />
    </View>
  );
}
