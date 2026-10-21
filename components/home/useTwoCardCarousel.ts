import { useCallback, useMemo, useState } from 'react';
import { LayoutChangeEvent, useWindowDimensions } from 'react-native';
import {
  CONTENT_HORIZONTAL_PADDING,
  CONTENT_MAX_WIDTH,
  GRID_COLUMN_GAP,
} from '@/constants/layout';

export function useTwoCardCarousel() {
  const { width: windowWidth } = useWindowDimensions();
  const [measuredWidth, setMeasuredWidth] = useState<number>();

  const responsiveWidth = Math.min(windowWidth, CONTENT_MAX_WIDTH);
  const sectionWidth = measuredWidth ?? responsiveWidth;
  const listViewportWidth = Math.max(
    0,
    sectionWidth - CONTENT_HORIZONTAL_PADDING * 2,
  );
  const cardWidth = useMemo(
    () => Math.max(0, (listViewportWidth - GRID_COLUMN_GAP) / 2),
    [listViewportWidth],
  );

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const nextWidth = Math.round(event.nativeEvent.layout.width * 10) / 10;
    setMeasuredWidth((currentWidth) =>
      currentWidth === nextWidth ? currentWidth : nextWidth,
    );
  }, []);

  return { cardWidth, listViewportWidth, onLayout };
}
