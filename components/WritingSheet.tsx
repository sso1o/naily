import { Modal, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ReactNode } from 'react';
import { COLORS } from '@/constants/colors';
import { TYPOGRAPHY } from '@/constants/typography';

/** Small, keyboard-aware menu shared only by the writing experience. */
export default function WritingSheet({ visible, title, onClose, onDismiss, children }: {
  visible: boolean; title: string; onClose: () => void; onDismiss?: () => void; children: ReactNode;
}) {
  return <Modal transparent visible={visible} animationType={Platform.OS === 'web' ? 'none' : 'fade'} onRequestClose={onClose} onDismiss={onDismiss}>
    <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <Pressable accessibilityLabel="메뉴 닫기" style={styles.backdrop} onPress={onClose} />
      <SafeAreaView edges={['bottom']} style={styles.sheet}>
        <View style={styles.header}>
          <Text accessibilityRole="header" style={styles.title}>{title}</Text>
          <Pressable accessibilityLabel="메뉴 완료" onPress={onClose} style={styles.close}><Ionicons name="close" size={22} color={COLORS.text} /></Pressable>
        </View>
        <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>{children}</ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  </Modal>;
}
const styles = StyleSheet.create({
  fill: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(25,18,20,0.28)' },
  sheet: { maxHeight: '80%', backgroundColor: COLORS.card, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  header: { flexDirection: 'row', alignItems: 'center', paddingLeft: 20, paddingRight: 8, paddingTop: 8 },
  title: { ...TYPOGRAPHY.titleSmall, color: COLORS.text, flex: 1 },
  close: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  scroll: { flexGrow: 0, flexShrink: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 20 },
});
