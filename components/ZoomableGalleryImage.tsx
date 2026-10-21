import { Image, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';

export default function ZoomableGalleryImage({ uri, width, height }: { uri: string; width?: number; height?: number }) {
  const window = useWindowDimensions();
  const imageWidth = width ?? window.width;
  const imageHeight = height ?? window.height;
  const fullResolutionUri = uri.replace(/([?&])w=\d+/, '$1w=1800');

  return (
    <ScrollView
      bouncesZoom
      centerContent
      directionalLockEnabled
      maximumZoomScale={4}
      minimumZoomScale={1}
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
      style={styles.zoom}
      contentContainerStyle={[styles.content, { minWidth: imageWidth, minHeight: imageHeight }]}
    >
      <Image fadeDuration={0} source={{ uri: fullResolutionUri }} resizeMode="contain" style={[styles.image, { width: imageWidth, height: imageHeight }]} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  zoom: { flex: 1, width: '100%' },
  content: { flexGrow: 1, alignItems: 'center', justifyContent: 'center' },
  image: { alignSelf: 'center' },
});
