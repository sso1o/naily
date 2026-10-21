import { TYPOGRAPHY, FONT_WEIGHT } from '@/constants/typography';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Animated, FlatList, Image, ListRenderItemInfo, NativeScrollEvent, NativeSyntheticEvent, Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BlogPostCard from '@/components/BlogPostCard';
import EmptyState from '@/components/EmptyState';
import CommunityRefreshFeedback from '@/components/CommunityRefreshFeedback';
import { COLORS, RADIUS, SPACING } from '@/constants/colors';
import { BOTTOM_NAV_CONTENT_INSET, CONTENT_MAX_WIDTH } from '@/constants/layout';
import { preferences, commitData, currentUser, users } from '@/data/mockData';

import { useCommunityFeed } from '@/hooks/useCommunityFeed';
import { usePostInteractions } from '@/hooks/usePostInteractions';
import { CommunityPost } from '@/types/models';

const postKey = (post: CommunityPost) => post.id;
const suggestedUsers = users.filter((user) => user.id !== currentUser.id && user.role !== 'admin');
const emptyFeed = <View style={{ margin: SPACING.md }}><EmptyState title="아직 글이 없어요" message="첫 번째 이야기를 남겨보세요." /></View>;
function PostSeparator() { return <View style={styles.postSeparator} />; }

export default function CommunityScreen() {
  const router = useRouter();
  const [feed, setFeed] = useState<'popular' | 'following'>('popular');
  const { width } = useWindowDimensions();
  const pagerRef = useRef<ScrollView>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const { posts, refreshing, error, refresh, refreshCompletion } = useCommunityFeed();
  const [followingIds, setFollowingIds] = useState<Set<string>>(() => new Set(preferences?.followingIds ?? []));
  // Store interactions above virtualized rows so recycling does not reset them.
  const { likedIds, savedIds, toggleLike, toggleSave } = usePostInteractions();
  const followingPosts = useMemo(() => posts.filter((post) => followingIds.has(post.authorId)), [posts, followingIds]);
  const openPost = useCallback((id: string) => router.push(`/post/${id}`), [router]);
  const renderPost = useCallback(({ item }: ListRenderItemInfo<CommunityPost>) => (
    <BlogPostCard featured post={item} onOpen={openPost}
      liked={likedIds.has(item.id)} saved={savedIds.has(item.id)}
      onToggleLike={toggleLike} onToggleSave={toggleSave} />
  ), [openPost, likedIds, savedIds, toggleLike, toggleSave]);

  const changeFeed = (next: 'popular' | 'following') => {
    pagerRef.current?.scrollTo({ x: next === 'popular' ? 0 : width, animated: true });
    setFeed(next);
  };

  const finishSwipe = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    setFeed(event.nativeEvent.contentOffset.x >= width / 2 ? 'following' : 'popular');
  };

  const toggleFollow = (userId: string) => {
    setFollowingIds((current) => {
      const next = new Set(current);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      if (preferences) { preferences.followingIds = [...next]; commitData?.(); }
      return next;
    });
  };

  const shopEntry = currentUser.role === 'shop_owner' ? (
    <View style={styles.shopEntryRow}>
      <Pressable onPress={() => router.push('/shop-community')} style={styles.shopLink}>
        <Text style={styles.shopLinkText}>샵 전용 커뮤니티</Text>
        <Ionicons name="arrow-forward" size={14} color="#724555" />
      </Pressable>
    </View>
  ) : null;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.screen}>
        <View style={styles.tabShell}>
          {(['popular', 'following'] as const).map((item) => {
            const active = feed === item;
            return (
              <Pressable key={item} disabled={refreshing} onPress={() => changeFeed(item)} style={[styles.feedTab, active && styles.feedActive]}>
                <Text style={[styles.feedText, active && styles.feedTextActive]}>{item === 'popular' ? '추천' : '팔로잉'}</Text>
              </Pressable>
            );
          })}
          <Animated.View
            style={[
              styles.tabIndicator,
              {
                width: width / 2,
                transform: [{
                  translateX: scrollX.interpolate({
                    inputRange: [0, width],
                    outputRange: [0, width / 2],
                    extrapolate: 'clamp',
                  }),
                }],
              },
            ]}
          />
        </View>

        <Animated.ScrollView
          ref={pagerRef}
          horizontal
          scrollEnabled={!refreshing}
          pagingEnabled
          bounces={false}
          directionalLockEnabled
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: true })}
          onMomentumScrollEnd={finishSwipe}
          style={styles.feedViewport}
        >
          <View style={[styles.page, { width }]}>
            <FlatList
              scrollEnabled={!refreshing}
              data={posts}
              keyExtractor={postKey}
              renderItem={renderPost}
              ItemSeparatorComponent={PostSeparator}
              ListHeaderComponent={shopEntry}
              ListEmptyComponent={emptyFeed}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              alwaysBounceVertical
              directionalLockEnabled
              contentInsetAdjustmentBehavior="never"
              progressViewOffset={0}
              nestedScrollEnabled
              overScrollMode="always"
              refreshing={refreshing && feed === 'popular'}
              onRefresh={refresh}
            />
          </View>
          <View style={[styles.page, { width }]}>
            <FlatList
              scrollEnabled={!refreshing}
              data={followingPosts}
              keyExtractor={postKey}
              renderItem={renderPost}
              ItemSeparatorComponent={PostSeparator}
              ListEmptyComponent={emptyFeed}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              alwaysBounceVertical
              directionalLockEnabled
              contentInsetAdjustmentBehavior="never"
              progressViewOffset={0}
              nestedScrollEnabled
              overScrollMode="always"
              refreshing={refreshing && feed === 'following'}
              onRefresh={refresh}
              ListHeaderComponent={<>
                {shopEntry}
                <View style={styles.followGuide}>
                  <View style={styles.followGuideHeader}>
                    <View style={styles.followGuideIcon}><Ionicons name="people-outline" size={22} color="#A45F74" /></View>
                    <Text style={styles.followGuideTitle}>취향이 맞는 사용자를 찾아보세요</Text>
                    <Text style={styles.followGuideText}>팔로우하면 새로운 글이 이 피드에 모여요.</Text>
                  </View>
                  <View style={styles.suggestionList}>
                    {suggestedUsers.map((user) => {
                      const isFollowing = followingIds.has(user.id);
                      return (
                        <View key={user.id} style={styles.suggestionRow}>
                          {user.avatarUrl ? (
                            <Image source={{ uri: user.avatarUrl }} style={styles.suggestionAvatar} />
                          ) : (
                            <View style={[styles.suggestionAvatar, styles.suggestionAvatarFallback]}><Text style={styles.suggestionInitial}>{user.nickname[0]}</Text></View>
                          )}
                          <View style={styles.suggestionCopy}>
                            <View style={styles.suggestionNameRow}>
                              <Text style={styles.suggestionName}>{user.nickname}</Text>
                              {user.role === 'shop_owner' ? <Ionicons name="storefront" size={12} color="#B66F84" /> : null}
                            </View>
                            <Text style={styles.suggestionDescription}>{user.role === 'shop_owner' ? '새로운 아트와 네일 이야기를 공유해요' : '취향과 네일 기록을 공유해요'}</Text>
                          </View>
                          <Pressable onPress={() => toggleFollow(user.id)} style={[styles.followButton, isFollowing && styles.followButtonActive]}>
                            <Text style={[styles.followButtonText, isFollowing && styles.followButtonTextActive]}>{isFollowing ? '팔로잉' : '팔로우'}</Text>
                          </Pressable>
                        </View>
                      );
                    })}
                  </View>
                </View>
              </>}
            />
          </View>
        </Animated.ScrollView>

        <CommunityRefreshFeedback completion={refreshCompletion} refreshing={refreshing} />
        {error ? <View style={styles.errorBanner}><Text accessibilityRole="alert" style={styles.errorText}>{error}</Text></View> : null}

        <Pressable accessibilityLabel="새 글 작성" onPress={() => router.push({ pathname: '/write', params: { mode: 'public' } })} style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}>
          <Ionicons name="add" size={25} color="#FFFFFF" />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  screen: { flex: 1, backgroundColor: '#FFFFFF' },
  shopEntryRow: { paddingHorizontal: SPACING.md, paddingTop: 14, alignItems: 'flex-end' },
  shopLink: { height: 38, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, backgroundColor: COLORS.lightPink, borderRadius: RADIUS.pill, paddingHorizontal: 13 },
  shopLinkText: { ...TYPOGRAPHY.labelLarge, color: '#724555' },
  tabShell: { height: 54, flexDirection: 'row', alignItems: 'stretch', backgroundColor: '#FFFCFD', borderBottomWidth: 1, borderBottomColor: '#EDE6E8' },
  feedTab: { flex: 1, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  feedActive: {},
  feedText: { ...TYPOGRAPHY.labelLarge, color: '#A49A9D' },
  feedTextActive: { fontWeight: FONT_WEIGHT.bold, color: COLORS.text },
  tabIndicator: { position: 'absolute', left: 0, bottom: -1, height: 4, backgroundColor: COLORS.primary },
  feedViewport: { flex: 1 },
  page: { flex: 1, backgroundColor: '#FFFFFF' },
  listContent: { flexGrow: 1, width: '100%', maxWidth: CONTENT_MAX_WIDTH, alignSelf: 'center', paddingBottom: BOTTOM_NAV_CONTENT_INSET + 22, backgroundColor: '#FFFFFF' },
  postSeparator: { height: StyleSheet.hairlineWidth, backgroundColor: '#E8E2E4' },
  errorBanner: { position: 'absolute', top: 54, left: 16, right: 16, padding: 12, borderRadius: RADIUS.md, backgroundColor: COLORS.lightPink },
  errorText: { ...TYPOGRAPHY.bodySmall, color: COLORS.text, textAlign: 'center' },
  followGuide: { margin: SPACING.md, borderRadius: RADIUS.lg, backgroundColor: '#FFFFFF', overflow: 'hidden' },
  followGuideHeader: { alignItems: 'center', paddingHorizontal: 22, paddingTop: 28, paddingBottom: 24 },
  followGuideIcon: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8E9EE' },
  followGuideTitle: { ...TYPOGRAPHY.titleSmall, color: COLORS.text, marginTop: 13 },
  followGuideText: { ...TYPOGRAPHY.bodySmall, color: COLORS.subText, marginTop: 5, textAlign: 'center' },
  suggestionList: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#ECE6E8' },
  suggestionRow: { minHeight: 72, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#EEE8EA', paddingVertical: 10 },
  suggestionAvatar: { width: 42, height: 42, borderRadius: 21, marginRight: 11 },
  suggestionAvatarFallback: { alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.lightPink },
  suggestionInitial: { ...TYPOGRAPHY.labelLarge, color: '#A45F74' },
  suggestionCopy: { flex: 1, minWidth: 0, paddingRight: 8 },
  suggestionNameRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  suggestionName: { ...TYPOGRAPHY.labelMedium, color: COLORS.text, flexShrink: 1 },
  suggestionDescription: { ...TYPOGRAPHY.bodySmall, color: COLORS.subText, marginTop: 3 },
  followButton: { minWidth: 64, minHeight: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: '#222021', paddingVertical: 6, paddingHorizontal: 10 },
  followButtonActive: { backgroundColor: '#F4EEF0', borderWidth: 1, borderColor: '#E4D8DC' },
  followButtonText: { ...TYPOGRAPHY.labelMedium, color: '#FFFFFF' },
  followButtonTextActive: { color: '#766A6E' },
  fab: { position: 'absolute', right: 18, bottom: BOTTOM_NAV_CONTENT_INSET - 2, width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: '#C87590', ...Platform.select({ web: { boxShadow: '0 8px 24px rgba(122, 68, 85, 0.24)' }, default: { shadowColor: '#7A4455', shadowOpacity: 0.24, shadowRadius: 12, shadowOffset: { width: 0, height: 7 }, elevation: 7 } }) },
  fabPressed: { opacity: 0.86, transform: [{ scale: 0.97 }] },
});
