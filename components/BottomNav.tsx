import { ComponentProps, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import {
  Animated,
  LayoutChangeEvent,
  Platform,
  Pressable,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { COLORS } from '@/constants/colors';
import {
  BOTTOM_NAV_HEIGHT,
  BOTTOM_NAV_HORIZONTAL_MARGIN,
  BOTTOM_NAV_MAX_WIDTH,
} from '@/constants/layout';

type IconName = ComponentProps<typeof Ionicons>['name'];
type BottomNavProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

const ACTIVE_INDICATOR_WIDTH = 60;
const ACTIVE_INDICATOR_HEIGHT = 42;
const ICON_SLOT_SIZE = 44;
const NAVIGATION_LOCK_MS = 260;

const items: Record<
  string,
  { label: string; icon: IconName; activeIcon: IconName }
> = {
  index: { label: '홈', icon: 'home-outline', activeIcon: 'home' },
  community: {
    label: '커뮤니티',
    icon: 'chatbubbles-outline',
    activeIcon: 'chatbubbles',
  },
  reservation: {
    label: '예약',
    icon: 'calendar-outline',
    activeIcon: 'calendar',
  },
  mypage: { label: '마이', icon: 'person-outline', activeIcon: 'person' },
};

const webPressableStyle: ViewStyle | undefined =
  Platform.OS === 'web'
    ? ({
        outlineStyle: 'none',
        transitionProperty: 'none',
      } as unknown as ViewStyle)
    : undefined;

export default function BottomNav({
  state,
  descriptors,
  navigation,
}: BottomNavProps) {
  const pendingRouteKey = useRef<string | null>(null);
  const pendingUnlockTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [itemsWidth, setItemsWidth] = useState(0);
  const indicatorPosition = useRef(new Animated.Value(state.index)).current;
  const slotWidth = itemsWidth / Math.max(1, state.routes.length);
  const routeIndexes = useMemo(
    () => state.routes.map((_, index) => index),
    [state.routes],
  );
  const bottomGap = BOTTOM_NAV_HORIZONTAL_MARGIN;

  useEffect(
    () => () => {
      if (pendingUnlockTimer.current) {
        clearTimeout(pendingUnlockTimer.current);
      }
    },
    [],
  );

  useEffect(() => {
    Animated.spring(indicatorPosition, {
      toValue: state.index,
      damping: 24,
      stiffness: 260,
      mass: 0.8,
      useNativeDriver: true,
    }).start();
  }, [indicatorPosition, state.index]);

  const releaseNavigationLock = useCallback(() => {
    if (pendingUnlockTimer.current) {
      clearTimeout(pendingUnlockTimer.current);
      pendingUnlockTimer.current = null;
    }
    pendingRouteKey.current = null;
  }, []);

  const handleItemsLayout = useCallback((event: LayoutChangeEvent) => {
    const nextWidth = Math.round(event.nativeEvent.layout.width * 10) / 10;
    setItemsWidth((current) => (current === nextWidth ? current : nextWidth));
  }, []);

  const handlePress = useCallback(
    (route: (typeof state.routes)[number], active: boolean) => {
      if (active || pendingRouteKey.current) return;

      pendingRouteKey.current = route.key;
      const event = navigation.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true,
      });

      if (event.defaultPrevented) {
        releaseNavigationLock();
        return;
      }

      navigation.navigate(route.name, route.params);
      pendingUnlockTimer.current = setTimeout(
        releaseNavigationLock,
        NAVIGATION_LOCK_MS,
      );
    },
    [navigation, releaseNavigationLock, state.routes],
  );

  const indicatorTranslateX = Animated.multiply(indicatorPosition, slotWidth);

  return (
    <View style={[styles.shell, { bottom: bottomGap }]}>
      <View style={styles.bar}>
        <View onLayout={handleItemsLayout} style={styles.items}>
          {itemsWidth > 0 ? (
            <Animated.View
              style={[
                styles.activeIndicator,
                styles.pointerNone,
                {
                  left: (slotWidth - ACTIVE_INDICATOR_WIDTH) / 2,
                  transform: [
                    { translateX: indicatorTranslateX },
                    { translateY: -ACTIVE_INDICATOR_HEIGHT / 2 },
                  ],
                },
              ]}
            />
          ) : null}

          {state.routes.map((route, index) => {
            const item = items[route.name];
            if (!item) return null;

            const active = state.index === index;
            const options = descriptors[route.key]?.options;
            const accessibilityLabel =
              options?.tabBarAccessibilityLabel ?? `${item.label} 탭`;
            const focusOpacity = indicatorPosition.interpolate({
              inputRange: routeIndexes,
              outputRange: routeIndexes.map((routeIndex) =>
                Math.max(0, 1 - Math.abs(routeIndex - index)),
              ),
              extrapolate: 'clamp',
            });
            const inactiveOpacity = Animated.subtract(1, focusOpacity);

            return (
              <Pressable
                key={route.key}
                aria-label={accessibilityLabel}
                aria-selected={active}
                accessibilityLabel={accessibilityLabel}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                hitSlop={2}
                onLongPress={() =>
                  navigation.emit({ type: 'tabLongPress', target: route.key })
                }
                onPress={() => handlePress(route, active)}
                style={({ pressed }) => [
                  styles.item,
                  webPressableStyle,
                  pressed && !active && styles.pressed,
                ]}
              >
                <View style={[styles.itemContent, styles.pointerNone]}>
                  <View style={styles.iconSlot}>
                    <Animated.View
                      style={[styles.iconLayer, { opacity: inactiveOpacity }]}
                    >
                      <Ionicons
                        color={COLORS.subText}
                        name={item.icon}
                        size={20}
                      />
                    </Animated.View>
                    <Animated.View
                      style={[styles.iconLayer, { opacity: focusOpacity }]}
                    >
                      <Ionicons
                        color={COLORS.primary}
                        name={item.activeIcon}
                        size={20}
                      />
                    </Animated.View>
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    pointerEvents: 'box-none',
    position: 'absolute',
    right: 0,
    left: 0,
    zIndex: 100,
    alignItems: 'center',
    paddingHorizontal: BOTTOM_NAV_HORIZONTAL_MARGIN,
  },
  bar: {
    height: BOTTOM_NAV_HEIGHT,
    width: '100%',
    maxWidth: BOTTOM_NAV_MAX_WIDTH,
    overflow: 'hidden',
    borderRadius: BOTTOM_NAV_HEIGHT / 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(120, 105, 111, 0.14)',
    backgroundColor: '#FFFFFF',
  },
  pointerNone: {
    pointerEvents: 'none',
  },
  items: {
    position: 'relative',
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  activeIndicator: {
    position: 'absolute',
    top: '50%',
    width: ACTIVE_INDICATOR_WIDTH,
    height: ACTIVE_INDICATOR_HEIGHT,
    overflow: 'hidden',
    borderRadius: ACTIVE_INDICATOR_HEIGHT / 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(223, 166, 182, 0.38)',
    backgroundColor: '#F8EEF1',
  },
  item: {
    zIndex: 1,
    flex: 1,
    height: '100%',
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemContent: {
    width: '100%',
    height: ICON_SLOT_SIZE,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconSlot: {
    width: ICON_SLOT_SIZE,
    height: ICON_SLOT_SIZE,
  },
  iconLayer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.76,
  },
});
