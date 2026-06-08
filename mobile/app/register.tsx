import React, { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button, IconButton } from "@/components/Button";
import { colors, radius } from "@/theme";
import { useAuth } from "@/store/AuthContext";

export default function RegisterCustomer() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ redirect?: string }>();
  const { register } = useAuth();
  const [nama, setNama] = useState("");
  const [noHp, setNoHp] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [alamat, setAlamat] = useState("");
  const [loading, setLoading] = useState(false);
  const redirectTo =
    params.redirect === "/checkout" || params.redirect === "/transaksi" || params.redirect === "/profil"
      ? params.redirect
      : "/";

  async function handleRegister() {
    if (!nama.trim() || !noHp.trim() || !email.trim() || !password) {
      Alert.alert("Data belum lengkap", "Nama, no HP, email, dan password wajib diisi.");
      return;
    }

    setLoading(true);
    try {
      await register({
        nama_customer: nama,
        no_hp: noHp,
        email,
        password,
        alamat,
      });
      router.replace(redirectTo);
    } catch (error) {
      Alert.alert("Register gagal", error instanceof Error ? error.message : "Coba lagi beberapa saat.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 8, paddingHorizontal: 20, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        <IconButton onPress={() => router.back()} bg={colors.card}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </IconButton>

        <View style={{ marginTop: 24, marginBottom: 24 }}>
          <Text style={{ color: colors.primary, fontWeight: "900", fontSize: 14 }}>Rentory</Text>
          <Text style={{ color: colors.text, fontWeight: "900", fontSize: 28, marginTop: 8 }}>Daftar Customer</Text>
          <Text style={{ color: colors.textMuted, marginTop: 6, lineHeight: 20 }}>
            Akun ini akan otomatis dibuat sebagai master customer.
          </Text>
        </View>

        <View style={{ gap: 12 }}>
          <Field label="Nama Customer" value={nama} onChangeText={setNama} placeholder="Nama lengkap" />
          <Field label="No HP" value={noHp} onChangeText={setNoHp} placeholder="08xx" keyboardType="phone-pad" />
          <Field label="Email" value={email} onChangeText={setEmail} placeholder="email@domain.com" keyboardType="email-address" />
          <Field label="Password" value={password} onChangeText={setPassword} placeholder="Password" secureTextEntry />
          <Field label="Alamat (opsional)" value={alamat} onChangeText={setAlamat} placeholder="Alamat default" multiline />
        </View>

        <Button label="Daftar" onPress={handleRegister} loading={loading} style={{ marginTop: 20 }} />
        <Button
          label="Sudah punya akun"
          variant="ghost"
          onPress={() => router.replace({ pathname: "/login", params: { redirect: redirectTo } })}
          style={{ marginTop: 8 }}
        />
      </ScrollView>
    </KeyboardAvoidingView>
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
  placeholder?: string;
  secureTextEntry?: boolean;
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
          height: multiline ? 74 : 52,
          textAlignVertical: multiline ? "top" : "center",
        }}
      />
    </View>
  );
}
