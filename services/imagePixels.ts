import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { Image } from 'react-native';
import { decode } from 'jpeg-js';
import { toByteArray } from 'base64-js';

/** Bound memory and sampling latency; pixels refer to the oriented source photo. */
export async function imagePixels(uri: string) {
  const size = await new Promise<{ width: number; height: number }>((resolve, reject) => Image.getSize(uri, (width, height) => resolve({ width, height }), reject));
  const scale = Math.min(1, 512 / Math.max(size.width, size.height));
  const context = ImageManipulator.manipulate(uri);
  context.resize({ width: Math.max(1, Math.round(size.width * scale)), height: Math.max(1, Math.round(size.height * scale)) });
  const image = await context.renderAsync();
  const result = await image.saveAsync({ format: SaveFormat.JPEG, compress: 1, base64: true });
  if (!result.base64) throw new Error('사진 픽셀을 읽지 못했어요.');
  const pixels = decode(toByteArray(result.base64), { useTArray: true, maxResolutionInMP: 4, maxMemoryUsageInMB: 32 });
  return { ...pixels, uri: result.uri };
}
