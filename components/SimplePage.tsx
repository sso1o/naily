import { PropsWithChildren } from "react";
import { ScrollView, Text, TextInput, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ScreenHeader from "./ScreenHeader";
export default function SimplePage({
  title,
  children,
}: PropsWithChildren<{ title: string }>) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <ScreenHeader title={title} />
      <ScrollView
        contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 100 }}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}
export function Field({
  label,
  value,
  onChangeText,
  multiline = false,
}: {
  label: string;
  value: string;
  onChangeText: (s: string) => void;
  multiline?: boolean;
}) {
  return (
    <>
      <Text>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        style={{
          borderWidth: 1,
          borderColor: "#aaa",
          borderRadius: 8,
          padding: 12,
          minHeight: 48,
        }}
      />
    </>
  );
}
export function Action({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={{ padding: 14, backgroundColor: "#fce9ef", borderRadius: 8 }}
    >
      <Text>{label}</Text>
    </Pressable>
  );
}
