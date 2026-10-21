import { TYPOGRAPHY } from '@/constants/typography';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Design } from '@/types/models';
import { COLORS, RADIUS } from '@/constants/colors';
import TagChip from './TagChip';
import ThumbnailHeartButton from './ThumbnailHeartButton';

type Props = { design: Design; onPress?: () => void; compact?: boolean; separated?: boolean };

export default function DesignResultCard({ design, onPress, compact, separated }: Props) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, compact && styles.compactCard, separated && styles.separatedCard, pressed && styles.pressed]}>
      <View>
        <Image source={{ uri: design.imageUrl }} style={[styles.image, compact && styles.compactImage, separated && styles.separatedImage]} />
        <ThumbnailHeartButton designId={design.id} />
      </View>
      <View style={[styles.body, separated && styles.separatedBody]}>
        <Text style={styles.title} numberOfLines={1}>{design.title}</Text>
        <Text style={styles.price}>{design.estimatedPrice}</Text>
        {!compact && separated ? (
          <View style={styles.metaRow}>
            <View style={styles.smallTags}>
              {design.tags.slice(0, 2).map((tag) => <Text key={tag} numberOfLines={1} style={styles.smallTag}>#{tag.replace(/^#/, '')}</Text>)}
            </View>
            <Text style={styles.likeCount}>♡ {design.likeCount.toLocaleString('ko-KR')}</Text>
          </View>
        ) : !compact ? (
          <View style={styles.tags}>
            {design.tags.slice(0, 2).map((tag) => <TagChip key={tag} label={tag} />)}
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, minWidth: 0, backgroundColor: COLORS.card, borderRadius: RADIUS.md, overflow: 'hidden' },
  separatedCard: { backgroundColor: 'transparent', borderRadius: 0, overflow: 'visible' },
  compactCard: { width: 154, flex: 0 },
  pressed: { opacity: 0.85 },
  image: { width: '100%', aspectRatio: 1, backgroundColor: COLORS.lightPink },
  separatedImage: { borderRadius: 18 },
  compactImage: { height: 150 },
  body: { padding: 11 },
  separatedBody: { paddingHorizontal: 0, paddingBottom: 0 },
  title: { ...TYPOGRAPHY.labelLarge, color: COLORS.text },
  price: { ...TYPOGRAPHY.labelLarge, color: COLORS.subText, marginTop: 5 },
  metaRow: { minWidth: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6, marginTop: 8, flexWrap: 'wrap' },
  smallTags: { minWidth: 0, flex: 1, flexDirection: 'row', gap: 5 },
  smallTag: { ...TYPOGRAPHY.labelMedium, flexShrink: 1, color: '#9A6474' },
  likeCount: { ...TYPOGRAPHY.caption, color: '#9D9295' },
  tags: { flexDirection: 'row', gap: 5, marginTop: 8 },
});
