import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Alert, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import HomeAdBanner from '@/components/home/HomeAdBanner';
import HomeStickyHeader from '@/components/home/HomeStickyHeader';
import MagazineSection from '@/components/home/MagazineSection';
import MonthlyArtSection from '@/components/home/MonthlyArtSection';
import NearbyShopsSection from '@/components/home/NearbyShopsSection';
import PopularCommunitySection from '@/components/home/PopularCommunitySection';
import { COLORS } from '@/constants/colors';
import { BOTTOM_NAV_CONTENT_INSET, CONTENT_MAX_WIDTH } from '@/constants/layout';
import {
  homeAdBanner,
  magazineArticles,
  monthlyArts,
  nearbyShops,
  popularCommunityPosts,
} from '@/data/homeData';
import { resetSearchSession } from '@/services/searchSession';

export default function HomeScreen() {
  const router = useRouter();

  const startNewSearch = () => {
    resetSearchSession();
    router.push({ pathname: '/search', params: { reset: Date.now().toString() } });
  };

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    const root = document.getElementById('root');
    const previousBodyBackground = document.body.style.backgroundColor;
    const previousRootBackground = root?.style.backgroundColor ?? '';
    document.body.style.backgroundColor = '#FFFFFF';
    if (root) root.style.backgroundColor = '#FFFFFF';

    return () => {
      document.body.style.backgroundColor = previousBodyBackground;
      if (root) root.style.backgroundColor = previousRootBackground;
    };
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar style="dark" />
      <View style={styles.screen}>
        <HomeStickyHeader
          onPressSearch={startNewSearch}
          onPressNotification={() =>
            router.push('/notifications')
          }
        />
        <ScrollView
          style={styles.scroll}
          showsVerticalScrollIndicator
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.content}>
            <MagazineSection
              articles={magazineArticles}
              onPressArticle={(article) => router.push(`/post/${article.postId}`)}
              onPressAll={() => router.push('/search_result?query=매거진')}
            />
            <NearbyShopsSection
              shops={nearbyShops}
              onPressShop={(shop) => router.push(`/shop/${shop.shopId}`)}
              onPressAll={() => router.push('/search_result?query=네일숍')}
            />
            <MonthlyArtSection
              arts={monthlyArts}
              onPressArt={(art) => router.push(`/design/${art.designId}`)}
              onPressShop={(art) => router.push(`/shop/${art.shopId}`)}
              onPressAll={() => router.push('/search_result?query=이달의아트')}
            />
            <HomeAdBanner
              data={homeAdBanner}
              onPress={() => router.push('/reservation')}
            />
            <PopularCommunitySection
              posts={popularCommunityPosts}
              onPressPost={(post) => router.push(`/post/${post.postId}`)}
              onPressAll={() => router.push('/community')}
            />
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scroll: {
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: BOTTOM_NAV_CONTENT_INSET,
    backgroundColor: '#FFFFFF',
  },
  content: {
    width: '100%',
    maxWidth: CONTENT_MAX_WIDTH,
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
  },
});
