import { useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import PrimaryButton from './PrimaryButton';
import WritingSheet from './WritingSheet';
import { COLORS } from '@/constants/colors';
import { TYPOGRAPHY } from '@/constants/typography';
import type { PostBlock } from '@/types/models';

export default function PostBlockForm({ type, block, onSave, onClose }: { type: 'place' | 'poll'; block?: PostBlock; onSave: (patch: Partial<PostBlock>) => void; onClose: () => void }) {
  const [visible, setVisible] = useState(true);
  const pending = useRef<(() => void) | null>(null);
  const close = (action: () => void) => { if (Platform.OS === 'ios') { pending.current = action; setVisible(false); } else action(); };
  const [name, setName] = useState(block?.place?.name ?? block?.poll?.question ?? '');
  const [address, setAddress] = useState(block?.place?.address ?? '');
  const [options, setOptions] = useState(block?.poll?.options ?? [{ id: 'option-1', text: '' }, { id: 'option-2', text: '' }]);
  const valid = Boolean(name.trim()) && (type === 'place' || options.length >= 2 && options.every(option => option.text.trim()));
  return <WritingSheet visible={visible} title={type === 'place' ? '장소 입력' : '투표 만들기'} onClose={() => close(onClose)} onDismiss={() => { const action = pending.current; pending.current = null; action?.(); }}>
    <TextInput accessibilityLabel={type === 'place' ? '장소 이름' : '투표 질문'} placeholder={type === 'place' ? '장소 이름' : '투표 질문'} placeholderTextColor={COLORS.subText} value={name} onChangeText={setName} style={styles.input} />
    {type === 'place' ? <TextInput accessibilityLabel="장소 주소" placeholder="주소 (선택)" placeholderTextColor={COLORS.subText} value={address} onChangeText={setAddress} style={styles.input} /> : <>
      {options.map((option, index) => <View key={option.id} style={styles.row}><TextInput accessibilityLabel={`투표 선택지 ${index + 1}`} placeholder={`선택지 ${index + 1}`} value={option.text} onChangeText={text => setOptions(current => current.map(item => item.id === option.id ? { ...item, text } : item))} style={[styles.input, styles.fill]} /><Pressable accessibilityLabel={`선택지 ${index + 1} 삭제`} disabled={options.length <= 2} onPress={() => setOptions(current => current.filter(item => item.id !== option.id))} style={styles.button}><Text style={styles.label}>삭제</Text></Pressable></View>)}
      <Pressable onPress={() => setOptions(current => [...current, { id: `option-${Date.now()}`, text: '' }])} style={styles.button}><Text style={styles.label}>선택지 추가</Text></Pressable>
    </>}
    {type === 'poll' && block?.poll?.votedOptionId && <Text style={styles.hint}>투표 내용을 수정하면 기존 응답이 초기화됩니다.</Text>}
    <PrimaryButton label="완료" accessibilityLabel="블록 저장" disabled={!valid} size="small" onPress={() => close(() => onSave(type === 'place' ? { place: { name: name.trim(), address: address.trim() } } : { poll: { question: name.trim(), options: options.map(option => ({ id: option.id, text: option.text.trim() })) } }))} />
  </WritingSheet>;
}
const styles = StyleSheet.create({ input: { ...TYPOGRAPHY.bodyMedium, color: COLORS.text, minHeight: 48, borderBottomWidth: 1, borderBottomColor: COLORS.border, marginBottom: 8 }, row: { flexDirection: 'row', alignItems: 'center', gap: 8 }, fill: { flex: 1 }, button: { minWidth: 44, minHeight: 44, justifyContent: 'center', alignItems: 'center' }, label: { ...TYPOGRAPHY.labelLarge, color: COLORS.text }, hint: { ...TYPOGRAPHY.caption, color: COLORS.subText }, save: { minHeight: 44, backgroundColor: COLORS.primary, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginTop: 12 }, saveText: { ...TYPOGRAPHY.labelLarge, color: '#FFFFFF' } });
