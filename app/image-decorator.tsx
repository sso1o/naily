import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AppState, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DecoratedImage from '@/components/DecoratedImage';
import ColorPicker from '@/components/ColorPicker';
import PrimaryButton from '@/components/PrimaryButton';
import WritingSheet from '@/components/WritingSheet';
import WritingTextInput from '@/components/WritingTextInput';
import { COLORS } from '@/constants/colors';
import { TYPOGRAPHY } from '@/constants/typography';
import { getImageDecorationDraft, setImageDecorationDraft } from '@/data/imageDecorationDrafts';
import { DecoratedPostImage, ImageDecoration } from '@/types/models';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { bringToFront, clamp, cloneImage, commitDecoration, orderedDecorations, patchDecoration, redoDecoration, undoDecoration, type DecorationHistory } from '@/services/decorationEditing';

const FONT_SIZES = [18, 24, 30, 38];
const STICKERS = ['✨', '💖', '🌸', '🍑', '🎀', '💅', '⭐', '🦋'];
type Panel = 'brushColor' | 'size' | 'color' | 'background' | 'align' | 'transform' | 'layers' | 'stickers' | null;
function Tool({ label, display, caption, icon, active, disabled, onPress }: { label: string; display?: string; caption?: boolean; icon?: React.ComponentProps<typeof Ionicons>['name']; active?: boolean; disabled?: boolean; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ selected: active, disabled }} disabled={disabled} onPress={onPress} style={[styles.tool, active && styles.active, disabled && styles.disabled]}>
    {icon ? <Ionicons name={icon} size={22} color={COLORS.text} /> : <Text style={styles.toolText}>{display ?? label}</Text>}
    {icon && caption && <Text style={styles.caption}>{display ?? label}</Text>}
  </Pressable>;
}
export default function ImageDecoratorScreen() {
  const { draftKey } = useLocalSearchParams<{ draftKey: string }>();
  const router = useRouter();
  const initial = useMemo(() => draftKey ? getImageDecorationDraft(draftKey) : undefined, [draftKey]);
  const [image, setImage] = useState<DecoratedPostImage | undefined>(() => initial ? cloneImage(initial) : undefined);
  const imageRef = useRef(image);
  const [history, setHistory] = useState<DecorationHistory | undefined>(() => image ? { past: [], present: image, future: [] } : undefined);
  const historyRef = useRef(history);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [panel, setPanel] = useState<Panel>(null);
  const [canvasMode, setCanvasMode] = useState<'elements' | 'photo' | 'draw'>('elements');
  const [brushColor, setBrushColor] = useState('#FFFFFF');
  const [brushWidth, setBrushWidth] = useState(4);
  const [editing, setEditing] = useState<{ id: string; text: string } | null>(null);
  const [area, setArea] = useState({ width: 0, height: 0 });
  const [gesturing, setGesturing] = useState(false);
  const gesture = useRef(false);
  const completed = useRef(false);
  const sequence = useRef(0);
  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active' || !gesture.current) return;
      gesture.current = false; setGesturing(false);
      if (historyRef.current) { imageRef.current = historyRef.current.present; setImage(historyRef.current.present); }
    });
    return () => subscription.remove();
  }, []);
  const allowSavedExit = useUnsavedChanges(JSON.stringify(image) !== JSON.stringify(initial));
  const selected = image?.decorations.find(item => item.id === selectedId);
  const publish = (next: DecoratedPostImage) => { imageRef.current = next; setImage(next); };
  const installHistory = (next: DecorationHistory) => { historyRef.current = next; setHistory(next); publish(next.present); };
  const commit = (next: DecoratedPostImage) => { if (historyRef.current) installHistory(commitDecoration(historyRef.current, next)); };
  const change = (patch: Partial<ImageDecoration>) => { if (imageRef.current && selected) commit(patchDecoration(imageRef.current, selected.id, patch)); };
  const newId = () => `decoration-${Date.now()}-${++sequence.current}`;
  const newLayer = () => Math.max(-1, ...(imageRef.current?.decorations.map((item, index) => item.layer ?? index) ?? [])) + 1;
  const add = (type: 'text' | 'shape' | 'emoji' | 'gradient', emoji = '✨') => {
    if (!imageRef.current || gesture.current) return;
    const id = newId();
    const decoration: ImageDecoration = { id, type: type === 'emoji' ? 'text' : type, x: 0.12, y: 0.25, width: type === 'emoji' ? 0.25 : 0.72, height: 0.12, coordinateVersion: 2, rotation: 0, scale: 1, layer: newLayer(),
      ...(type === 'text' || type === 'emoji' ? { text: type === 'emoji' ? emoji : '텍스트', fontSize: type === 'emoji' ? 38 : 30, fontWeight: '700', color: '#FFFFFF', textAlign: 'center' } : {}),
      ...(type === 'shape' ? { width: 0.3, height: 0.18, backgroundColor: '#FFDDE7', backgroundOpacity: 0.8, borderRadius: 24 } : {}),
      ...(type === 'gradient' ? { x: 0, y: 0.48, width: 1, height: 0.52, gradientColors: ['rgba(16, 10, 12, 0)', 'rgba(16, 10, 12, 0.82)'] as const } : {}),
    };
    commit({ ...imageRef.current, decorations: [...imageRef.current.decorations, decoration] }); setSelectedId(id); setPanel(null); setCanvasMode('elements');
    if (type === 'text') setEditing({ id, text: decoration.text ?? '' });
  };
  const duplicate = () => {
    if (!selected || !imageRef.current) return;
    const id = newId();
    commit({ ...imageRef.current, decorations: [...imageRef.current.decorations, { ...selected, ...(selected.points ? { points: selected.points.map(point => ({ ...point })) } : {}), id, x: clamp(selected.x + 0.03, 0, 0.7), y: clamp(selected.y + 0.03, 0, 0.8), layer: newLayer() }] }); setSelectedId(id);
  };
  const remove = () => { if (imageRef.current && selected) { commit({ ...imageRef.current, decorations: imageRef.current.decorations.filter(item => item.id !== selected.id) }); setSelectedId(null); setPanel(null); } };
  const toggle = (next: Panel) => setPanel(current => current === next ? null : next);
  const editText = (id: string) => { const item = imageRef.current?.decorations.find(item => item.id === id); if (item?.type === 'text') setEditing({ id, text: item.text ?? '' }); };
  const photoChange = (patch: Partial<NonNullable<DecoratedPostImage['photoTransform']>>) => {
    if (imageRef.current) commit({ ...imageRef.current, photoTransform: { x: 0, y: 0, scale: 1, rotation: 0, ...imageRef.current.photoTransform, ...patch } });
  };
  const complete = () => {
    if (completed.current || gesture.current || !draftKey || !imageRef.current) return;
    completed.current = true;
    setImageDecorationDraft(draftKey, cloneImage(imageRef.current)); allowSavedExit(); router.back();
  };
  if (!image) return <SafeAreaView style={styles.safe}><View style={styles.empty}><Text style={styles.emptyTitle}>편집할 사진을 찾을 수 없어요</Text><Tool label="돌아가기" onPress={() => router.back()} /></View></SafeAreaView>;
  const aspectRatio = image.aspectRatio && image.aspectRatio > 0 ? image.aspectRatio : 4 / 5;
  const canvasWidth = Math.max(0, Math.min(area.width - 32, (area.height - 16) * aspectRatio));
  return <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
    <StatusBar style="dark" />
    <View style={styles.header}>
      <Tool label="꾸미기 취소" icon="close" onPress={() => router.back()} />
      <Text style={styles.headerTitle}>사진 꾸미기</Text>
      <PrimaryButton label="완료" accessibilityLabel="꾸미기 완료" size="small" disabled={gesturing} onPress={complete} />
    </View>
    <View style={styles.topTools}>
      <Tool label="실행 취소" icon="arrow-undo-outline" disabled={gesturing || !history?.past.length} onPress={() => { if (historyRef.current) installHistory(undoDecoration(historyRef.current)); }} />
      <Tool label="다시 실행" icon="arrow-redo-outline" disabled={gesturing || !history?.future.length} onPress={() => { if (historyRef.current) installHistory(redoDecoration(historyRef.current)); }} />
      <Tool label="레이어" icon="layers-outline" disabled={gesturing} active={panel === 'layers'} onPress={() => toggle('layers')} />
    </View>
    <View style={styles.canvasArea} onLayout={({ nativeEvent }) => setArea(nativeEvent.layout)}>
      {canvasWidth > 0 && <DecoratedImage image={image} editable selectedId={selectedId} style={{ width: canvasWidth, height: canvasWidth / aspectRatio, aspectRatio }}
        drawing={canvasMode === 'draw'} photoMode={canvasMode === 'photo'} brushColor={brushColor} brushWidth={brushWidth}
        onSelect={id => { setSelectedId(id); }} onEditText={editText}
        onChangePhoto={photoTransform => { if (gesture.current && imageRef.current) publish({ ...imageRef.current, photoTransform }); }}
        onStroke={points => { if (imageRef.current && !completed.current) commit({ ...imageRef.current, decorations: [...imageRef.current.decorations, { id: newId(), type: 'drawing', x: 0, y: 0, width: 1, height: 1, points, strokeWidth: brushWidth, color: brushColor, coordinateVersion: 2, layer: newLayer() }] }); }}
        onGestureStart={() => { gesture.current = true; setGesturing(true); }}
        onChangeDecoration={(id, patch) => { if (gesture.current && imageRef.current) publish(patchDecoration(imageRef.current, id, patch)); }}
        onGestureEnd={cancelled => { if (!gesture.current) return; gesture.current = false; setGesturing(false); if (historyRef.current && imageRef.current) { if (cancelled) publish(historyRef.current.present); else commit(imageRef.current); } }}
      />}
    </View>
    <WritingSheet visible={panel === 'color' || panel === 'background' || panel === 'brushColor'} title={panel === 'background' ? '배경색' : '색상'} onClose={() => setPanel(null)}>
      {(panel === 'color' || panel === 'background' || panel === 'brushColor') && <ColorPicker images={[image.uri]} value={panel === 'brushColor' ? brushColor : panel === 'background' ? selected?.backgroundColor ?? 'transparent' : selected?.color} allowTransparent={panel === 'background'} onChange={color => { if (panel === 'brushColor') setBrushColor(color); else if (panel === 'background') change({ backgroundColor: color === 'transparent' ? undefined : color }); else change({ color }); setPanel(null); }} />}
    </WritingSheet>
    <View style={styles.panel} pointerEvents={gesturing ? 'none' : 'auto'}>
      {canvasMode === 'draw' && <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.toolRow}>
        <Tool label="펜 색상" active={panel === 'brushColor'} onPress={() => toggle('brushColor')} />
        {[2, 4, 8, 14].map(width => <Tool key={width} label={`펜 굵기 ${width}`} display={`${width}`} active={brushWidth === width} onPress={() => setBrushWidth(width)} />)}
      </ScrollView>}
      {canvasMode === 'photo' && <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.toolRow}>
        <Tool label="사진 축소" icon="remove" onPress={() => photoChange({ scale: clamp((image.photoTransform?.scale ?? 1) - 0.1, 0.5, 4) })} />
        <Tool label="사진 확대" icon="add" onPress={() => photoChange({ scale: clamp((image.photoTransform?.scale ?? 1) + 0.1, 0.5, 4) })} />
        <Tool label="사진 왼쪽 회전" icon="arrow-undo" onPress={() => photoChange({ rotation: (image.photoTransform?.rotation ?? 0) - 15 })} />
        <Tool label="사진 오른쪽 회전" icon="arrow-redo" onPress={() => photoChange({ rotation: (image.photoTransform?.rotation ?? 0) + 15 })} />
        <Tool label="사진 왼쪽 이동" icon="arrow-back" onPress={() => photoChange({ x: clamp((image.photoTransform?.x ?? 0) - 0.05, -1, 1) })} />
        <Tool label="사진 오른쪽 이동" icon="arrow-forward" onPress={() => photoChange({ x: clamp((image.photoTransform?.x ?? 0) + 0.05, -1, 1) })} />
        <Tool label="사진 위로 이동" icon="arrow-up" onPress={() => photoChange({ y: clamp((image.photoTransform?.y ?? 0) - 0.05, -1, 1) })} />
        <Tool label="사진 아래로 이동" icon="arrow-down" onPress={() => photoChange({ y: clamp((image.photoTransform?.y ?? 0) + 0.05, -1, 1) })} />
        <Tool label="사진 원래대로" display="초기화" onPress={() => photoChange({ x: 0, y: 0, scale: 1, rotation: 0 })} />
      </ScrollView>}
      {panel && <ScrollView horizontal keyboardShouldPersistTaps="handled" showsHorizontalScrollIndicator={false} contentContainerStyle={styles.toolRow}>
        {panel === 'layers' && <><Tool label="도형" icon="shapes-outline" onPress={() => add('shape')} /><Tool label="그라데이션" icon="contrast-outline" onPress={() => add('gradient')} /></>}
        {panel === 'layers' && orderedDecorations(image.decorations).map((item, index) => <Tool key={item.id} label={`${index + 1} ${item.type === 'text' ? (item.text || '텍스트').slice(0, 12) : item.type === 'shape' ? '도형' : item.type === 'drawing' ? '그리기' : '그라데이션'}`} active={selectedId === item.id} onPress={() => { setCanvasMode('elements'); setSelectedId(item.id); }} />)}
        {panel === 'stickers' && STICKERS.map(emoji => <Tool key={emoji} label={`스티커 ${emoji}`} display={emoji} onPress={() => add('emoji', emoji)} />)}
        {panel === 'size' && selected?.type === 'text' && FONT_SIZES.map(fontSize => <Tool key={fontSize} label={`${fontSize}`} active={(selected.fontSize ?? 24) === fontSize} onPress={() => change({ fontSize })} />)}
                {panel === 'background' && <>
                    {[0.35, 0.65, 0.9].map(backgroundOpacity => <Tool key={backgroundOpacity} label={`${Math.round(backgroundOpacity * 100)}%`} active={selected?.backgroundOpacity === backgroundOpacity} onPress={() => change({ backgroundOpacity })} />)}
        </>}
        {panel === 'align' && (['left', 'center', 'right'] as const).map((textAlign, index) => <Tool key={textAlign} label={['왼쪽', '가운데', '오른쪽'][index]} active={(selected?.textAlign ?? 'left') === textAlign} onPress={() => change({ textAlign })} />)}
        {panel === 'transform' && selected && <>
          <Tool label="왼쪽 이동" icon="arrow-back" onPress={() => change({ x: clamp(selected.x - 0.03, 0, 0.7) })} />
          <Tool label="오른쪽 이동" icon="arrow-forward" onPress={() => change({ x: clamp(selected.x + 0.03, 0, 1 - (selected.width ?? 0.76) / 2 - 0.03) })} />
          <Tool label="위로 이동" icon="arrow-up" onPress={() => change({ y: clamp(selected.y - 0.03, 0, 0.85) })} />
          <Tool label="아래로 이동" icon="arrow-down" onPress={() => change({ y: clamp(selected.y + 0.03, 0, 1 - (selected.height ?? 0.14) / 2 - 0.03) })} />
          <Tool label="회전 −15°" onPress={() => change({ rotation: (selected.rotation ?? 0) - 15 })} />
          <Tool label="회전 +15°" onPress={() => change({ rotation: (selected.rotation ?? 0) + 15 })} />
          <Tool label="축소" onPress={() => change({ scale: clamp((selected.scale ?? 1) - 0.1, 0.35, 3) })} />
          <Tool label="확대" onPress={() => change({ scale: clamp((selected.scale ?? 1) + 0.1, 0.35, 3) })} />
        </>}
      </ScrollView>}
      {selected && canvasMode === 'elements' && <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.toolRow}>
        <>
          {selected.type === 'text' && <>
            <Tool label="내용 수정" onPress={() => editText(selected.id)} />
            <Tool label={`크기 ${selected.fontSize ?? 24}`} active={panel === 'size'} onPress={() => toggle('size')} />
            <Tool label="굵게" active={Number(selected.fontWeight ?? '700') >= 600} onPress={() => change({ fontWeight: Number(selected.fontWeight ?? '700') >= 600 ? '400' : '700' })} />
            <Tool label="색상" active={panel === 'color'} onPress={() => toggle('color')} />
            <Tool label="정렬" active={panel === 'align'} onPress={() => toggle('align')} />
          </>}
          {selected.type !== 'gradient' && selected.type !== 'drawing' && <Tool label="배경" active={panel === 'background'} onPress={() => toggle('background')} />}
          <Tool label="이동·회전" active={panel === 'transform'} onPress={() => toggle('transform')} />
          <Tool label="맨 앞으로" onPress={() => { if (imageRef.current) commit(bringToFront(imageRef.current, selected.id)); }} />
          <Tool label="복제" onPress={duplicate} /><Tool label="삭제" onPress={remove} />
        </>
      </ScrollView>}
      <View style={styles.primaryTools}>
        <Tool label="사진 조정" display="사진" icon="image-outline" caption active={canvasMode === 'photo'} disabled={gesturing} onPress={() => { setSelectedId(null); setPanel(null); setCanvasMode(current => current === 'photo' ? 'elements' : 'photo'); }} />
        <Tool label="텍스트 추가" display="텍스트" icon="text-outline" caption disabled={gesturing} onPress={() => add('text')} />
        <Tool label="스티커" icon="happy-outline" caption active={panel === 'stickers'} disabled={gesturing} onPress={() => { setSelectedId(null); setCanvasMode('elements'); toggle('stickers'); }} />
        <Tool label="그리기" icon="brush-outline" caption active={canvasMode === 'draw'} disabled={gesturing} onPress={() => { setSelectedId(null); setPanel(null); setCanvasMode(current => current === 'draw' ? 'elements' : 'draw'); }} />
      </View>
    </View>
    <WritingSheet visible={Boolean(editing)} title="사진 위 텍스트" onClose={() => setEditing(null)}>
      <WritingTextInput accessibilityLabel="장식 텍스트" autoFocus value={editing?.text ?? ''} onChangeText={text => setEditing(current => current ? { ...current, text } : null)} maxLength={200} style={styles.textInput} />
      <PrimaryButton label="완료" accessibilityLabel="텍스트 적용" size="small" onPress={() => { if (editing && imageRef.current) commit(patchDecoration(imageRef.current, editing.id, { text: editing.text })); setEditing(null); }} />
    </WritingSheet>
  </SafeAreaView>;
}
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.card },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, minHeight: 52 },
  headerTitle: { ...TYPOGRAPHY.titleSmall, flex: 1, textAlign: 'center', color: COLORS.text },
  topTools: { flexDirection: 'row', justifyContent: 'center', gap: 12, paddingBottom: 4 },
  canvasArea: { flex: 1, minHeight: 80, backgroundColor: '#242023', alignItems: 'center', justifyContent: 'center' },
  panel: { paddingVertical: 8, backgroundColor: COLORS.card },
  hint: { ...TYPOGRAPHY.caption, color: COLORS.subText, textAlign: 'center', paddingHorizontal: 12, paddingBottom: 6 },
  toolRow: { paddingHorizontal: 8, gap: 4, alignItems: 'center' },
  tool: { minWidth: 44, minHeight: 44, paddingHorizontal: 12, paddingVertical: 8, alignItems: 'center', justifyContent: 'center', borderRadius: 8 },
  toolText: { ...TYPOGRAPHY.labelMedium, color: COLORS.subText },
  caption: { ...TYPOGRAPHY.caption, color: COLORS.subText, marginTop: 3 },
  primaryTools: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 8, paddingTop: 4 },
  active: { backgroundColor: COLORS.lightPink },
  disabled: { opacity: 0.3 },
  textInput: { ...TYPOGRAPHY.bodyMedium, color: COLORS.text, paddingVertical: 12 },
  swatchTouch: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  swatch: { width: 28, height: 28, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border },
  swatchActive: { borderWidth: 3, borderColor: COLORS.primary },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  emptyTitle: { ...TYPOGRAPHY.titleSmall, color: COLORS.text },
});
