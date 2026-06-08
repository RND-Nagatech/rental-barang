import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { CartProvider } from "@/store/CartContext";
import { AuthProvider } from "@/store/AuthContext";
import { CustomerPrefsProvider } from "@/store/CustomerPrefsContext";
import { colors } from "@/theme";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <CustomerPrefsProvider>
            <CartProvider>
              <StatusBar style="dark" />
              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: colors.background },
                  animation: "slide_from_right",
                }}
              >
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="barang/[id]" />
                <Stack.Screen name="checkout" options={{ presentation: "card" }} />
                <Stack.Screen name="login" options={{ presentation: "card" }} />
                <Stack.Screen name="register" options={{ presentation: "card" }} />
                <Stack.Screen name="edit-profil" options={{ presentation: "card" }} />
                <Stack.Screen name="alamat-saya" options={{ presentation: "card" }} />
                <Stack.Screen name="metode-pembayaran" options={{ presentation: "card" }} />
                <Stack.Screen name="favorit" options={{ presentation: "card" }} />
                <Stack.Screen name="notifikasi" options={{ presentation: "card" }} />
                <Stack.Screen name="bantuan" options={{ presentation: "card" }} />
                <Stack.Screen name="tentang-rentory" options={{ presentation: "card" }} />
                <Stack.Screen name="pembayaran/[id]" options={{ presentation: "card" }} />
              </Stack>
            </CartProvider>
          </CustomerPrefsProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
