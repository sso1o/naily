import { useRef } from 'react';
import { PanResponder, ScrollView, StyleSheet, View } from 'react-native';

type Props = {
  scrollRef: React.RefObject<ScrollView | null>;
  scrollY: number;
  contentHeight: number;
  viewportHeight: number;
};

export default function DragScrollBar({ scrollRef, scrollY, contentHeight, viewportHeight }: Props) {
  const metrics = useRef({ scrollY, contentHeight, viewportHeight });
  metrics.current = { scrollY, contentHeight, viewportHeight };
  const dragStart = useRef(0);
  const trackHeight = Math.max(0, viewportHeight - 12);
  const thumbHeight = contentHeight > viewportHeight ? Math.max(48, trackHeight * viewportHeight / contentHeight) : trackHeight;
  const thumbTravel = Math.max(0, trackHeight - thumbHeight);
  const scrollRange = Math.max(0, contentHeight - viewportHeight);
  const thumbY = scrollRange > 0 ? Math.min(thumbTravel, Math.max(0, scrollY / scrollRange * thumbTravel)) : 0;
  const responder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      const current = metrics.current;
      const currentTrack = Math.max(0, current.viewportHeight - 12);
      const currentThumb = current.contentHeight > current.viewportHeight ? Math.max(48, currentTrack * current.viewportHeight / current.contentHeight) : currentTrack;
      const currentTravel = Math.max(0, currentTrack - currentThumb);
      const currentRange = Math.max(0, current.contentHeight - current.viewportHeight);
      dragStart.current = currentRange > 0 ? current.scrollY / currentRange * currentTravel : 0;
    },
    onPanResponderMove: (_, gesture) => {
      const current = metrics.current;
      const currentTrack = Math.max(0, current.viewportHeight - 12);
      const currentThumb = current.contentHeight > current.viewportHeight ? Math.max(48, currentTrack * current.viewportHeight / current.contentHeight) : currentTrack;
      const currentTravel = Math.max(0, currentTrack - currentThumb);
      const currentRange = Math.max(0, current.contentHeight - current.viewportHeight);
      if (currentTravel <= 0) return;
      const nextThumbY = Math.min(currentTravel, Math.max(0, dragStart.current + gesture.dy));
      scrollRef.current?.scrollTo({ y: nextThumbY / currentTravel * currentRange, animated: false });
    },
  })).current;

  if (contentHeight <= viewportHeight || viewportHeight <= 0) return null;
  return <View style={styles.track}><View {...responder.panHandlers} style={[styles.thumbTouch, { height: thumbHeight, transform: [{ translateY: thumbY }] }]}><View style={styles.thumb} /></View></View>;
}

const styles = StyleSheet.create({
  track: { position: 'absolute', top: 6, right: 2, bottom: 6, width: 20, zIndex: 10, alignItems: 'flex-end' },
  thumbTouch: { width: 20, alignItems: 'flex-end', justifyContent: 'center', paddingRight: 3 },
  thumb: { width: 4, height: '100%', borderRadius: 2, backgroundColor: 'rgba(64,58,60,0.48)' },
});
