import React from "react";
import { Text, View, type ViewStyle } from "react-native";
import { colors, radius, shadow } from "@/theme";

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return (
    <View
      style={[
        {
          backgroundColor: colors.card,
          borderRadius: radius.lg,
          padding: 16,
          ...shadow.soft,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function SectionTitle({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
      <Text style={{ fontSize: 18, fontWeight: "900", color: colors.text }}>{title}</Text>
      {action}
    </View>
  );
}

export function Row({
  label,
  value,
  bold,
  valueColor,
}: {
  label: string;
  value: string;
  bold?: boolean;
  valueColor?: string;
}) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 5 }}>
      <Text style={{ color: colors.textMuted, fontSize: 14, fontWeight: bold ? "700" : "500" }}>{label}</Text>
      <Text style={{ color: valueColor ?? colors.text, fontSize: 14, fontWeight: bold ? "900" : "700" }}>{value}</Text>
    </View>
  );
}
