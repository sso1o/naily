import { forwardRef, useCallback, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react';
import { Platform, StyleSheet, TextInput, TextInputProps, useWindowDimensions } from 'react-native';
import { TYPOGRAPHY } from '@/constants/typography';

type Props = TextInputProps & { minimumLines?: number };
export function writingInputHeight(measured: number, minimum: number, border = 0) {
  return Math.ceil(Math.max(minimum, Number.isFinite(measured) ? measured + border : minimum));
}

/** Each input owns its measurement; only the surrounding document scrolls. */
const WritingTextInput = forwardRef<TextInput, Props>(function WritingTextInput({ style, minimumLines = 1, onContentSizeChange, onLayout, value, ...props }, forwardedRef) {
  const input = useRef<TextInput>(null);
  const [contentHeight, setContentHeight] = useState(0);
  const { width, fontScale } = useWindowDimensions();
  const flat = StyleSheet.flatten(style) ?? {};
  const numeric = (value: unknown) => typeof value === 'number' ? value : 0;
  const paddingTop = numeric(flat.paddingTop ?? flat.paddingVertical ?? flat.padding);
  const paddingBottom = numeric(flat.paddingBottom ?? flat.paddingVertical ?? flat.padding);
  const border = numeric(flat.borderTopWidth ?? flat.borderWidth) + numeric(flat.borderBottomWidth ?? flat.borderWidth);
  const scale = props.allowFontScaling === false ? 1 : props.maxFontSizeMultiplier && props.maxFontSizeMultiplier > 0 ? Math.min(fontScale, props.maxFontSizeMultiplier) : fontScale;
  const minimum = Math.ceil((flat.lineHeight ?? TYPOGRAPHY.bodyMedium.lineHeight) * minimumLines * scale + paddingTop + paddingBottom + border);
  const renderedHeight = writingInputHeight(value ? contentHeight : 0, minimum);
  useLayoutEffect(() => { if (!value) setContentHeight(0); }, [value]);
  useImperativeHandle(forwardedRef, () => input.current!, []);
  const resizeWeb = useCallback(() => {
    if (Platform.OS !== 'web' || !input.current) return;
    const element = input.current as unknown as HTMLTextAreaElement;
    const width = element.getBoundingClientRect().width;
    if (width <= 0) return;
    const previousWidth = element.style.width;
    // Collapsing the height can hide the document scrollbar and widen the field.
    // Measure at the displayed width so that wrapped lines are not undercounted.
    element.style.width = `${width}px`;
    // scrollHeight includes padding, but excludes borders. Clear the old height
    // and minimum before measuring, so neither can become the next content size.
    element.style.minHeight = '0px';
    element.style.height = '0px';
    const next = writingInputHeight(element.scrollHeight, minimum, border);
    element.style.minHeight = `${minimum}px`;
    element.style.height = `${next}px`;
    element.style.width = previousWidth;
  }, [minimum, border]);
  useLayoutEffect(resizeWeb, [resizeWeb, value, width, flat.lineHeight, flat.fontSize, flat.fontWeight]);
  return <TextInput {...props} ref={input} value={value} multiline scrollEnabled={false}
    style={[style, { minHeight: minimum, textAlignVertical: 'top', includeFontPadding: false }, Platform.OS === 'web' ? ({ overflow: 'hidden', resize: 'none' } as object) : { height: renderedHeight }]}
    onLayout={(event) => { resizeWeb(); onLayout?.(event); }}
    onContentSizeChange={(event) => {
      // RN iOS contentSize and Android text layout measurements include padding.
      // Store only content size, not rendered height; never add padding again.
      if (Platform.OS !== 'web') {
        const measured = Math.ceil(event.nativeEvent.contentSize.height);
        if (Number.isFinite(measured)) setContentHeight((previous) => Math.abs(previous - measured) <= 1 ? previous : measured);
      }
      onContentSizeChange?.(event);
    }}
  />;
});
export default WritingTextInput;
