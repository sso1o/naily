import { useFavorites } from '@/hooks/useFavorites';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { GestureResponderEvent, Pressable, StyleSheet } from 'react-native';
import { COLORS } from '@/constants/colors';

export default function ThumbnailHeartButton({ designId = '' }: { designId?: string }) {
  const [selected, toggleSelected] = useFavorites('designIds', designId);

  const toggle = (event: GestureResponderEvent) => {
    event.stopPropagation();
    toggleSelected();
  };

  return (
    <Pressable
      accessibilityLabel={selected ? '좋아요 취소' : '좋아요'}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      hitSlop={6}
      onPress={toggle}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <Ionicons name={selected ? 'heart' : 'heart-outline'} size={19} color={COLORS.primary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    top: 9,
    right: 9,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.94)',
  },
  pressed: { transform: [{ scale: 0.92 }], opacity: 0.86 },
});
