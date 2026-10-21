import { useCallback, useRef } from 'react';
import { useNavigation, usePreventRemove } from 'expo-router/react-navigation';
import { Alert, Platform } from 'react-native';

/** Protect route removal (header, native gesture, system back, or replace).
 * Pushing the image editor does not remove the draft route and remains allowed.
 */
export function useUnsavedChanges(dirty: boolean) {
  const navigation = useNavigation();
  const allowNextRemoval = useRef(false);
  const confirming = useRef(false);

  usePreventRemove(dirty, ({ data }) => {
    if (allowNextRemoval.current) {
      allowNextRemoval.current = false;
      navigation.dispatch(data.action);
      return;
    }
    if (confirming.current) return;
    const message = '저장하지 않은 변경사항이 있어요. 변경사항을 버리고 나갈까요?';
    if (Platform.OS === 'web') {
      if (window.confirm(message)) navigation.dispatch(data.action);
      return;
    }
    confirming.current = true;
    const cancel = () => { confirming.current = false; };
    Alert.alert('변경사항을 버릴까요?', message, [
      { text: '계속 편집', style: 'cancel', onPress: cancel },
      { text: '나가기', style: 'destructive', onPress: () => {
        confirming.current = false;
        // Replay the exact intercepted action, preserving its destination/history.
        navigation.dispatch(data.action);
      } },
    ], { cancelable: true, onDismiss: cancel });
  });

  return useCallback(() => { allowNextRemoval.current = true; }, []);
}
