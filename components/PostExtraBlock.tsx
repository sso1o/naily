import { commitData } from '@/data/mockData';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { PostBlock } from '@/types/models';
import { COLORS } from '@/constants/colors';
import { TYPOGRAPHY } from '@/constants/typography';
function PostVideo({ video }: { video: NonNullable<PostBlock['video']> }) {
  const player = useVideoPlayer(video.uri);
  return <VideoView player={player} nativeControls contentFit="contain" style={{ width: '100%', aspectRatio: video.aspectRatio ?? 16 / 9, backgroundColor: '#111111', borderRadius: 8 }} />;
}
export default function PostExtraBlock({ block, interactive = false }: { block: PostBlock; interactive?: boolean }) {
  const [, refresh] = useState(0);
  if (block.type === 'video' && block.video) return <PostVideo video={block.video} />;
  if (block.type === 'place' && block.place) return <View style={styles.card}><Text style={styles.title}>장소 · {block.place.name}</Text><Text style={styles.body}>{block.place.address}</Text></View>;
  if (block.type === 'poll' && block.poll) return <View style={styles.card}><Text style={styles.title}>투표 · {block.poll.question}</Text>{block.poll.options.map((option, index) => <Pressable key={option.id} accessibilityRole={interactive ? 'button' : undefined} accessibilityState={{ selected: block.poll?.votedOptionId === option.id, disabled: !interactive || Boolean(block.poll?.votedOptionId) }} disabled={!interactive || Boolean(block.poll?.votedOptionId)} onPress={() => {
    // Same session-local record used by the existing post store. No fabricated votes.
    if (!block.poll || block.poll.votedOptionId) return;
    block.poll.votedOptionId = option.id; option.votes = (option.votes ?? 0) + 1; commitData?.(); refresh(value => value + 1);
  }} style={[styles.option, block.poll?.votedOptionId === option.id && { backgroundColor: COLORS.lightPink }]}><Text style={styles.body}>{index + 1}. {option.text}{block.poll?.votedOptionId ? ` · ${option.votes ?? 0}표` : ''}</Text></Pressable>)}{interactive && <Text style={styles.hint}>이 기기에 투표가 저장됩니다.</Text>}</View>;
  return null;
}
const styles = StyleSheet.create({ card: { padding: 16, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, gap: 8 }, title: { ...TYPOGRAPHY.labelLarge, color: COLORS.text }, body: { ...TYPOGRAPHY.bodyMedium, color: COLORS.text }, hint: { ...TYPOGRAPHY.caption, color: COLORS.subText }, option: { minHeight: 44, justifyContent: 'center', borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, paddingHorizontal: 12 } });
