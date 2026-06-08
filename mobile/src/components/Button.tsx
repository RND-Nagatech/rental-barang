import React from "react";
import { ActivityIndicator, Pressable, Text, View, type ViewStyle } from "react-native";
import { colors, radius } from "@/theme";

interface Props {
  label: string;
  onPress?: () => void;
  variant?: "primary" | "outline" | "soft" | "ghost";
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  full?: boolean;
}

export function Button({ label, onPress, variant = "primary", disabled, loading, icon, style, full }: Props) {
  const base: ViewStyle = {
    height: 52,
    borderRadius: radius.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 20,
    opacity: disabled ? 0.5 : 1,
    width: full ? "100%" : undefined,
  };
  const variants: Record<string, ViewStyle> = {
    primary: { backgroundColor: colors.primary },
    outline: { backgroundColor: "transparent", borderWidth: 1.5, borderColor: colors.primary },
    soft: { backgroundColor: colors.primarySoft },
    ghost: { backgroundColor: "transparent" },
  };
  const textColor =
    variant === "primary" ? colors.white : variant === "soft" ? colors.primaryDark : colors.primary;

  return (
    <Pressable
      onPress={disabled || loading ? undefined : onPress}
      style={({ pressed }) => [base, variants[variant], pressed && { opacity: 0.85 }, style]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <>
          {icon}
          <Text style={{ color: textColor, fontWeight: "800", fontSize: 15 }}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

export function IconButton({
  children,
  onPress,
  bg = colors.surface,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  bg?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        {
          width: 42,
          height: 42,
          borderRadius: radius.full,
          backgroundColor: bg,
          alignItems: "center",
          justifyContent: "center",
        },
        pressed && { opacity: 0.7 },
      ]}
    >
      {children}
    </Pressable>
  );
}

export function Stepper({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.surface,
        borderRadius: radius.full,
        padding: 4,
        gap: 4,
      }}
    >
      <Pressable
        onPress={() => onChange(Math.max(0, value - 1))}
        style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: colors.card, alignItems: "center", justifyContent: "center" }}
      >
        <Text style={{ fontSize: 20, color: colors.primary, fontWeight: "800", lineHeight: 22 }}>−</Text>
      </Pressable>
      <Text style={{ minWidth: 28, textAlign: "center", fontWeight: "800", color: colors.text }}>{value}</Text>
      <Pressable
        onPress={() => onChange(value + 1)}
        style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" }}
      >
        <Text style={{ fontSize: 18, color: colors.white, fontWeight: "800", lineHeight: 20 }}>+</Text>
      </Pressable>
    </View>
  );
}
