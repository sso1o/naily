import type { TextStyle } from 'react-native';

/** System font family is inherited. Only regular, semibold and bold UI weights. */
export const TYPOGRAPHY = {
  display: { fontSize: 28, lineHeight: 36, fontWeight: '700' },
  titleLarge: { fontSize: 24, lineHeight: 32, fontWeight: '700' },
  titleMedium: { fontSize: 20, lineHeight: 28, fontWeight: '700' },
  titleSmall: { fontSize: 18, lineHeight: 24, fontWeight: '700' },
  bodyLarge: { fontSize: 16, lineHeight: 24, fontWeight: '400' },
  bodyMedium: { fontSize: 15, lineHeight: 22, fontWeight: '400' },
  bodySmall: { fontSize: 14, lineHeight: 20, fontWeight: '400' },
  labelLarge: { fontSize: 14, lineHeight: 20, fontWeight: '600' },
  labelMedium: { fontSize: 13, lineHeight: 18, fontWeight: '600' },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '400' },
} as const satisfies Record<string, TextStyle>;

export const FONT_WEIGHT = { regular: '400', semibold: '600', bold: '700' } as const;

/** Preserve author-selected sizing; UI token defaults apply to unstyled content. */
export function authoredTextStyle(size: number | undefined, bold: boolean | undefined = undefined, heading = false): TextStyle {
  const base = heading ? TYPOGRAPHY.titleMedium : TYPOGRAPHY.bodyMedium;
  const fontSize = Math.max(12, size ?? base.fontSize);
  return { fontSize, lineHeight: size === undefined ? base.lineHeight : Math.ceil(fontSize * 1.5), fontWeight: (bold ?? heading) ? FONT_WEIGHT.bold : FONT_WEIGHT.regular };
}
