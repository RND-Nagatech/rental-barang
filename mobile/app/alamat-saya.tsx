import React, { useState } from "react";
import { Alert, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button, IconButton } from "@/components/Button";
import { colors, radius, shadow } from "@/theme";
import { useAuth } from "@/store/AuthContext";
import { useCustomerPrefs } from "@/store/CustomerPrefsContext";

export default function AlamatSaya() {
  const insets = useSafeAreaInsets();
  const { customer } = useAuth();
  const { addresses, saveAddress, removeAddress } = useCustomerPrefs();
  const [label, setLabel] = useState("Rumah");
  const [alamat, setAlamat] = useState(customer?.alamat_default || "");

  function handleSave() {
    if (!alamat.trim()) {
      Alert.alert("Alamat kosong", "Isi alamat terlebih dahulu.");
      return;
    }
    saveAddress({ label: label || "Alamat", alamat, is_default: addresses.length === 0 });
    setLabel("Rumah");
    setAlamat("");
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ paddingTop: insets.top + 8, paddingHorizontal: 20, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
      <Header title="Alamat Saya" />
      <View style={{ marginTop: 22, gap: 10 }}>
        <Field label="Label" value={label} onChangeText={setLabel} />
        <Field label="Alamat" value={alamat} onChangeText={setAlamat} multiline />
        <Button label="Tambah Alamat" onPress={handleSave} />
      </View>

      <View style={{ marginTop: 22, gap: 10 }}>
        {addresses.length === 0 ? (
          <Empty text="Belum ada alamat tersimpan." />
        ) : (
          addresses.map((item) => (
            <View key={item.id} style={{ backgroundColor: colors.card, borderRadius: radius.md, padding: 14, ...shadow.soft }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: "900", color: colors.text }}>{item.label}</Text>
                  <Text style={{ color: colors.textMuted, marginTop: 4, lineHeight: 20 }}>{item.alamat}</Text>
                  {item.is_default && <Text style={{ color: colors.primary, fontWeight: "800", fontSize: 12, marginTop: 6 }}>Alamat utama</Text>}
                </View>
                <Pressable onPress={() => removeAddress(item.id)} hitSlop={8}>
                  <Ionicons name="trash-outline" size={20} color={colors.danger} />
                </Pressable>
              </View>
            </View>
          ))
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

function Field({ label, multiline, ...rest }: { label: string; value: string; onChangeText: (text: string) => void; multiline?: boolean }) {
  return (
    <View>
      <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: "800", marginBottom: 6 }}>{label}</Text>
      <TextInput
        {...rest}
        multiline={multiline}
        placeholderTextColor={colors.textFaint}
        style={{ backgroundColor: colors.card, borderRadius: radius.md, color: colors.text, fontSize: 15, paddingHorizontal: 14, paddingVertical: multiline ? 12 : 0, height: multiline ? 82 : 52, textAlignVertical: multiline ? "top" : "center" }}
      />
    </View>
  );
}

function Empty({ text }: { text: string }) {
  return <Text style={{ color: colors.textMuted, textAlign: "center", paddingVertical: 28 }}>{text}</Text>;
}
