import { Tabs } from 'expo-router';
import BottomNav from '@/components/BottomNav';
import { PagerGestureProvider } from '@/components/navigation/PagerGestureContext';
import { COLORS } from '@/constants/colors';

function MainPager() {
  return (
    <Tabs
      backBehavior="history"
      screenOptions={{
        animation: 'shift',
        headerShown: false,
        lazy: false,
        sceneStyle: { backgroundColor: COLORS.background },
      }}
      tabBar={(props) => <BottomNav {...props} />}
    >
      <Tabs.Screen name="index" options={{ title: '홈' }} />
      <Tabs.Screen name="community" options={{ title: '커뮤니티' }} />
      <Tabs.Screen name="reservation" options={{ title: '예약' }} />
      <Tabs.Screen name="mypage" options={{ title: '마이' }} />
    </Tabs>
  );
}

export default function TabLayout() {
  return (
    <PagerGestureProvider>
      <MainPager />
    </PagerGestureProvider>
  );
}
