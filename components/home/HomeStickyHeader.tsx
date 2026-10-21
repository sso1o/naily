import { TYPOGRAPHY } from '@/constants/typography';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS, RADIUS } from '@/constants/colors';
import {
  CONTENT_HORIZONTAL_PADDING,
  CONTENT_MAX_WIDTH,
  SEARCH_DIVIDER_SPACING,
  TOP_CONTENT_DIVIDER_OFFSET,
} from '@/constants/layout';

type Props = {
  onPressSearch: () => void;
  onPressNotification?: () => void;
};

export default function HomeStickyHeader({
  onPressSearch,
  onPressNotification,
}: Props) {
  return (
    <View style={styles.shell}>
      <View style={styles.inner}>
        <View style={styles.brandRow}>
          <View>
            <View style={styles.wordmarkRow}>
              <Text style={styles.wordmark}>Naily</Text>
              <View style={styles.brandDot} />
            </View>
            <Text style={styles.greeting}>오늘, 어떤 무드로 채워볼까요?</Text>
          </View>
          <Pressable
            accessibilityLabel="알림"
            accessibilityRole="button"
            hitSlop={8}
            onPress={onPressNotification}
            style={({ pressed }) => [styles.notification, pressed && styles.pressed]}
          >
            <Text style={styles.notificationIcon}>♡</Text>
            <View style={styles.unreadDot} />
          </Pressable>
        </View>
        <Pressable
          accessibilityLabel="통합 검색으로 이동"
          accessibilityRole="search"
          onPress={onPressSearch}
          style={({ pressed }) => [styles.search, pressed && styles.searchPressed]}
        >
          <View style={styles.searchIcon}>
            <View style={styles.searchCircle} />
            <View style={styles.searchHandle} />
          </View>
          <Text style={styles.searchPlaceholder}>샵, 디자인, 아트를 검색해보세요</Text>
          <View style={styles.searchHint}>
            <Text style={styles.searchHintText}>검색</Text>
          </View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { minHeight: TOP_CONTENT_DIVIDER_OFFSET, zIndex: 20, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#EEE7E9' },
  inner: { flexGrow: 1, width: '100%', maxWidth: CONTENT_MAX_WIDTH, alignSelf: 'center', paddingHorizontal: CONTENT_HORIZONTAL_PADDING, paddingTop: 11, paddingBottom: SEARCH_DIVIDER_SPACING },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  wordmarkRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  wordmark: {
    color: COLORS.text,
    fontSize: 25,
    lineHeight: 29,
    fontWeight: '900',
    letterSpacing: -1,
  },
  brandDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginLeft: 3,
    marginTop: 9,
    backgroundColor: COLORS.primary,
  },
  greeting: { ...TYPOGRAPHY.bodySmall, color: '#8A737A', marginTop: 1 },
  notification: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.lightPink,
  },
  notificationIcon: {
    color: '#9D6273',
    fontSize: 20,
    fontWeight: '800',
  },
  unreadDot: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 6,
    height: 6,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: COLORS.homeHeader,
    backgroundColor: COLORS.danger,
  },
  pressed: {
    opacity: 0.68,
  },
  search: { minHeight: 46, borderRadius: RADIUS.md, borderWidth: 1, borderColor: '#E7DFE2', backgroundColor: '#F8F5F6', paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center' },
  searchPressed: {
    backgroundColor: '#F3ECEE',
  },
  searchIcon: {
    width: 20,
    height: 20,
    marginRight: 9,
  },
  searchCircle: {
    position: 'absolute',
    left: 1,
    top: 1,
    width: 12,
    height: 12,
    borderWidth: 1.8,
    borderColor: '#6F6266',
    borderRadius: 6,
  },
  searchHandle: {
    position: 'absolute',
    left: 12,
    top: 12,
    width: 7,
    height: 1.8,
    borderRadius: 1,
    backgroundColor: '#6F6266',
    transform: [{ rotate: '45deg' }],
  },
  searchPlaceholder: { ...TYPOGRAPHY.bodyMedium, flex: 1, color: '#81777A' },
  searchHint: {
    borderRadius: RADIUS.pill,
    backgroundColor: '#EBD0D8',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  searchHintText: { ...TYPOGRAPHY.labelMedium, color: '#794F5B' },
});
