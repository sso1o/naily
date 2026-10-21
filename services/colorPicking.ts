export function normalizeColor(value?: string) {
  if (!value || value === 'transparent' || /rgba\([^)]*,\s*0\s*\)/.test(value)) return 'transparent';
  if (/^#[0-9a-f]{6}$/i.test(value)) return value.toUpperCase();
  if (/^#[0-9a-f]{3}$/i.test(value)) return `#${value.slice(1).split('').map(char => char + char).join('')}`.toUpperCase();
  const rgb = value.match(/^rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/);
  return rgb ? `#${rgb.slice(1).map(channel => Math.min(255, Number(channel)).toString(16).padStart(2, '0')).join('')}`.toUpperCase() : '#383438';
}

export function hsvColor(hue: number, saturation: number, value: number) {
  const c = value * saturation, x = c * (1 - Math.abs(hue / 60 % 2 - 1)), m = value - c;
  const rgb = hue < 60 ? [c, x, 0] : hue < 120 ? [x, c, 0] : hue < 180 ? [0, c, x] : hue < 240 ? [0, x, c] : hue < 300 ? [x, 0, c] : [c, 0, x];
  return `#${rgb.map(channel => Math.round((channel + m) * 255).toString(16).padStart(2, '0')).join('')}`.toUpperCase();
}

export function pixelColor(image: { width: number; height: number; data: Uint8Array }, x: number, y: number) {
  const px = Math.max(0, Math.min(image.width - 1, Math.floor(x * image.width)));
  const py = Math.max(0, Math.min(image.height - 1, Math.floor(y * image.height)));
  const index = (py * image.width + px) * 4;
  return `#${Array.from(image.data.slice(index, index + 3)).map(channel => channel.toString(16).padStart(2, '0')).join('')}`.toUpperCase();
}
