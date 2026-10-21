import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { COLORS } from '@/constants/colors';
import { useFonts } from 'expo-font';
import { editorFonts } from '@/services/editorFonts';

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(editorFonts);
  if (!fontsLoaded && !fontError) return null;
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: COLORS.background },
          animation: Platform.OS === 'ios' ? 'default' : 'none',
          gestureEnabled: true,
          // Reserve the screen interior for carousels and other horizontal gestures.
          fullScreenGestureEnabled: false,
        }}
      >
        <Stack.Screen name="(tabs)" />
      </Stack>
    </SafeAreaProvider>
  );
}
