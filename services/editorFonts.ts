import { Asset } from 'expo-asset';
import { File } from 'expo-file-system';
import { Platform } from 'react-native';

export const editorFonts = {
  NailySerifRegular: require('@expo-google-fonts/nanum-myeongjo/400Regular/NanumMyeongjo_400Regular.ttf'),
  NailySerifBold: require('@expo-google-fonts/nanum-myeongjo/700Bold/NanumMyeongjo_700Bold.ttf'),
};
let css: Promise<string> | undefined;
export function editorFontCSS() {
  return css ??= Promise.all(Object.values(editorFonts).map(async (source, index) => {
    const asset = await Asset.fromModule(source).downloadAsync();
    const uri = Platform.OS === 'web' ? asset.uri : `data:font/ttf;base64,${await new File(asset.localUri ?? asset.uri).base64()}`;
    return `@font-face{font-family:NailySerif;src:url("${uri}") format("truetype");font-weight:${index ? 700 : 400};font-display:swap;}`;
  })).then(faces => faces.join('')).catch(error => { css = undefined; throw error; });
}
