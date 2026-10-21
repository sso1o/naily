import { StyleSheet, View } from 'react-native';

export default function PageDragBar() {
  return <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.area}><View style={styles.bar} /></View>;
}

const styles = StyleSheet.create({
  area: { height: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' },
  bar: { width: 38, height: 4, borderRadius: 2, backgroundColor: '#D8D0D3' },
});
