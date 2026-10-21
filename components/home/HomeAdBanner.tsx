import { TYPOGRAPHY } from '@/constants/typography';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AdBannerData } from '@/types/models';
import { RADIUS } from '@/constants/colors';
import { CONTENT_HORIZONTAL_PADDING } from '@/constants/layout';
import HomeImage from './HomeImage';

type Props = {
  data: AdBannerData;
  onPress?: () => void;
};

export default function HomeAdBanner({ data, onPress }: Props) {
  return (
    <View style={styles.section}>
      <Pressable
        accessibilityLabel={`광고: ${data.title}`}
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [styles.banner, pressed && styles.pressed]}
      >
        <View style={styles.copy}>
          <View style={styles.adRow}>
            <View style={styles.adLabel}>
              <Text style={styles.adLabelText}>{data.label}</Text>
            </View>
            <Text style={styles.sponsored}>SPONSORED</Text>
          </View>
          <Text style={styles.title} numberOfLines={2}>
            {data.title}
          </Text>
          <Text style={styles.description} numberOfLines={2}>
            {data.description}
          </Text>
          <View style={styles.cta}>
            <Text style={styles.ctaText}>{data.ctaLabel}</Text>
            <Text style={styles.ctaArrow}>→</Text>
          </View>
        </View>
        <HomeImage uri={data.imageUrl} fallbackLabel="AD" style={styles.image} />
        <View style={styles.tint} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: CONTENT_HORIZONTAL_PADDING,
    marginTop: 32,
  },
  banner: {
    minHeight: 184,
    overflow: 'hidden',
    borderRadius: RADIUS.lg,
    backgroundColor: '#271F22',
  },
  pressed: {
    opacity: 0.9,
  },
  copy: {
    width: '66%',
    minHeight: 184,
    padding: 20,
    justifyContent: 'center',
    zIndex: 3,
  },
  adRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 4,
    alignItems: 'center',
  },
  adLabel: {
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.48)',
    paddingHorizontal: 5,
    paddingVertical: 3,
  },
  adLabelText: { ...TYPOGRAPHY.caption, color: '#FFFFFF' },
  sponsored: { ...TYPOGRAPHY.caption, color: '#C7B9BE', letterSpacing: 1, marginLeft: 7 },
  title: { ...TYPOGRAPHY.titleLarge, color: '#FFFFFF', letterSpacing: -0.5, marginTop: 12 },
  description: { ...TYPOGRAPHY.bodySmall, color: '#D3C8CB', marginTop: 5 },
  cta: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.pill,
    paddingHorizontal: 11,
    paddingVertical: 7,
    marginTop: 13,
    backgroundColor: '#F2CED8',
  },
  ctaText: { ...TYPOGRAPHY.labelLarge, color: '#653F4A' },
  ctaArrow: { ...TYPOGRAPHY.labelLarge, color: '#653F4A', marginLeft: 5 },
  image: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: '48%',
  },
  tint: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 2,
    pointerEvents: 'none',
    backgroundColor: 'rgba(39, 31, 34, 0.14)',
  },
});
