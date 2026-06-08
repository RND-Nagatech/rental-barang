import React, { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button, IconButton } from "@/components/Button";
import { colors, radius } from "@/theme";
import { useAuth } from "@/store/AuthContext";

export default function LoginCustomer() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ redirect?: string }>();
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const redirectTo =
    params.redirect === "/checkout" || params.redirect === "/transaksi" || params.redirect === "/profil"
      ? params.redirect
      : "/";

  async function handleLogin() {
    if (!identifier.trim() || !password) {
      Alert.alert("Data belum lengkap", "Isi email/no HP dan password.");
      return;
    }

    setLoading(true);
    try {
      await login({ identifier, password });
      router.replace(redirectTo);
    } catch (error) {
      Alert.alert("Login gagal", error instanceof Error ? error.message : "Coba lagi beberapa saat.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 20, gap: 24 }}>
        <IconButton onPress={() => router.back()} bg={colors.card}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </IconButton>

        <View>
          <Text style={{ color: colors.primary, fontWeight: "900", fontSize: 14 }}>Rentory</Text>
          <Text style={{ color: colors.text, fontWeight: "900", fontSize: 28, marginTop: 8 }}>Masuk Customer</Text>
          <Text style={{ color: colors.textMuted, marginTop: 6, lineHeight: 20 }}>
            Login untuk checkout, melihat pesanan, dan mengelola profil.
          </Text>
        </View>

        <View style={{ gap: 12 }}>
          <Field label="Email atau No HP" value={identifier} onChangeText={setIdentifier} placeholder="email@domain.com / 08xx" />
          <Field label="Password" value={password} onChangeText={setPassword} placeholder="Password" secureTextEntry />
        </View>

        <Button label="Masuk" onPress={handleLogin} loading={loading} />
        <Button
          label="Daftar Akun Baru"
          variant="soft"
          onPress={() => router.push({ pathname: "/register", params: { redirect: redirectTo } })}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

function Field({
  label,
  ...rest
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
}) {
  return (
    <View>
      <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: "800", marginBottom: 6 }}>{label}</Text>
      <TextInput
        {...rest}
        autoCapitalize="none"
        placeholderTextColor={colors.textFaint}
        style={{
          backgroundColor: colors.card,
          borderRadius: radius.md,
          color: colors.text,
          fontSize: 15,
          paddingHorizontal: 14,
          height: 52,
        }}
      />
    </View>
  );
}
