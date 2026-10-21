import { TYPOGRAPHY, authoredTextStyle } from '@/constants/typography';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { PostBlock, PostTextRun } from '@/types/models';
import { COLORS, RADIUS } from '@/constants/colors';
import DecoratedImage from './DecoratedImage';
import { textLines, textRuns } from '@/services/richWriting';
import PostExtraBlock from './PostExtraBlock';
import { imageWidthRatio } from '@/services/documentEditing';

function runStyle(run: PostTextRun) {
  return { ...authoredTextStyle(run.fontSize, run.bold), fontStyle: run.italic ? 'italic' as const : 'normal' as const, textDecorationLine: run.underline ? 'underline' as const : 'none' as const, color: run.color ?? '#383438', backgroundColor: run.backgroundColor ?? 'transparent', fontFamily: run.fontFamily === 'serif' ? (run.bold ? 'NailySerifBold' : 'NailySerifRegular') : run.fontFamily === 'monospace' ? (Platform.OS === 'ios' ? 'Courier' : 'monospace') : undefined };
}

export default function PostBlockRenderer({ blocks, interactive = true }: { blocks: PostBlock[]; interactive?: boolean }) {
  return (
    <View style={styles.container}>
      {blocks.map((block) => {
        if (['video', 'place', 'poll'].includes(block.type)) return <PostExtraBlock key={block.id} block={block} interactive={interactive} />;
        if (block.type === 'image') {
          if (block.decoratedImage) {
            return (
              <DecoratedImage
                key={block.id}
                image={block.decoratedImage}
                fallbackLabel="POST"
                style={[styles.image, { width: `${imageWidthRatio(block.widthRatio) * 100}%`, alignSelf: 'center' }]}
              />
            );
          }
          return block.imageUrl ? (
            <DecoratedImage
              key={block.id}
              image={{ uri: block.imageUrl, aspectRatio: 4 / 3, decorations: [] }}
              fallbackLabel="POST"
              style={[styles.image, { width: `${imageWidthRatio(block.widthRatio) * 100}%`, alignSelf: 'center' }]}
            />
          ) : null;
        }
        if (block.type === 'divider') {
          return <View key={block.id} style={styles.divider} />;
        }
        if (block.runs) return <View key={block.id}>{textLines(block).map((line, index) => <Text key={index} style={{ ...styles.text, ...authoredTextStyle(block.fontSize, block.bold, block.type === 'heading'), textAlign: line.align as 'left' | 'center' | 'right' }}>{line.runs.length ? line.runs.map((run, i) => <Text key={i} style={runStyle(run)}>{run.text}</Text>) : '\u200b'}</Text>)}</View>;
        return (
          <Text
            key={block.id}
            style={[
              block.type === 'heading' ? styles.heading : styles.text,
              {
                ...authoredTextStyle(block.fontSize, block.bold, block.type === 'heading'),
                textAlign: block.align ?? 'left',
              },
            ]}
          >
            {textRuns(block).map((run, index) => <Text key={index} style={authoredTextStyle(run.fontSize ?? block.fontSize, run.bold ?? block.bold, block.type === 'heading')}>{run.text}</Text>)}
          </Text>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 20 },
  heading: { ...TYPOGRAPHY.titleMedium, color: COLORS.text },
  text: { ...TYPOGRAPHY.bodyLarge, color: '#383438' },
  image: { width: '100%', borderRadius: RADIUS.md, backgroundColor: COLORS.lightPink },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 7 },
});
