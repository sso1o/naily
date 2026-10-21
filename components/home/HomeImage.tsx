import { TYPOGRAPHY } from '@/constants/typography';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { COLORS } from '@/constants/colors';

type Props = {
  uri?: string;
  style?: StyleProp<ViewStyle>;
  fallbackLabel?: string;
};

export default function HomeImage({ uri, style, fallbackLabel = 'NAILY' }: Props) {
  const [loading, setLoading] = useState(Boolean(uri));
  const [failed, setFailed] = useState(!uri);

  useEffect(() => {
    setLoading(Boolean(uri));
    setFailed(!uri);
  }, [uri]);

  return (
    <View style={[styles.frame, style]}>
      {!failed && uri ? (
        <Image
          source={{ uri }}
          resizeMode="cover"
          style={StyleSheet.absoluteFill}
          onLoadEnd={() => setLoading(false)}
          onError={() => {
            setFailed(true);
            setLoading(false);
          }}
        />
      ) : (
        <View style={styles.fallback}>
          <View style={styles.orbLarge} />
          <View style={styles.orbSmall} />
          <Text style={styles.fallbackText}>{fallbackLabel}</Text>
        </View>
      )}
      {loading && !failed && (
        <View style={styles.loading}>
          <ActivityIndicator color={COLORS.primary} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    overflow: 'hidden',
    backgroundColor: COLORS.lightPink,
  },
  loading: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.lightPink,
  },
  fallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F2DFE5',
    overflow: 'hidden',
  },
  orbLarge: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    top: -60,
    right: -45,
    backgroundColor: '#E7B6C3',
    opacity: 0.7,
  },
  orbSmall: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    bottom: -38,
    left: -24,
    backgroundColor: '#FFF7F9',
  },
  fallbackText: { ...TYPOGRAPHY.labelMedium, color: '#9B6675', letterSpacing: 2 },
});
