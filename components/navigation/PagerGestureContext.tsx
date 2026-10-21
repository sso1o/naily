import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

type PagerGestureState = {
  horizontalGestureActive: boolean;
  setHorizontalGestureActive: (active: boolean) => void;
};

const PagerGestureContext = createContext<PagerGestureState>({
  horizontalGestureActive: false,
  setHorizontalGestureActive: () => undefined,
});

export function PagerGestureProvider({ children }: PropsWithChildren) {
  const [horizontalGestureActive, setHorizontalGestureActive] = useState(false);
  const value = useMemo(
    () => ({ horizontalGestureActive, setHorizontalGestureActive }),
    [horizontalGestureActive],
  );

  return (
    <PagerGestureContext.Provider value={value}>
      {children}
    </PagerGestureContext.Provider>
  );
}

export function usePagerGestureState() {
  return useContext(PagerGestureContext);
}

export function useHorizontalGestureBoundary() {
  const { setHorizontalGestureActive } = usePagerGestureState();
  const touchingRef = useRef(false);

  const lockPager = useCallback(() => {
    if (touchingRef.current) return;
    touchingRef.current = true;
    setHorizontalGestureActive(true);
  }, [setHorizontalGestureActive]);

  const unlockPager = useCallback(() => {
    if (!touchingRef.current) return;
    touchingRef.current = false;
    setHorizontalGestureActive(false);
  }, [setHorizontalGestureActive]);

  useEffect(() => unlockPager, [unlockPager]);

  return {
    onMomentumScrollEnd: unlockPager,
    onPointerCancel: unlockPager,
    onPointerDown: lockPager,
    onPointerUp: unlockPager,
    onScrollBeginDrag: lockPager,
    onScrollEndDrag: unlockPager,
    onTouchCancel: unlockPager,
    onTouchEnd: unlockPager,
    onTouchStart: lockPager,
  };
}
