import { useLocalSearchParams, useRouter } from "expo-router";
import { Text } from "react-native";
import SimplePage, { Action } from "@/components/SimplePage";
import { allPosts, currentUser, preferences, shops } from "@/data/mockData";
export default function Activity() {
  const { kind = "내가 쓴 글" } = useLocalSearchParams<{ kind?: string }>();
  const router = useRouter();
  const posts = allPosts.filter((p) =>
    kind === "내가 쓴 글"
      ? p.authorId === currentUser.id
      : kind === "저장한 글"
        ? preferences.savedIds.includes(p.id)
        : preferences.likedIds.includes(p.id),
  );
  return (
    <SimplePage title={kind}>
      {kind === "설정" ? (
        <Action
          label="프로필과 설정 열기"
          onPress={() => router.push("/settings")}
        />
      ) : kind === "관심 샵" ? (
        <>
          {!preferences.shopIds.length && (
            <Text>관심 샵이 없습니다. 샵 상세에서 저장해주세요.</Text>
          )}
          {shops
            .filter((s) => preferences.shopIds.includes(s.id))
            .map((s) => (
              <Action
                key={s.id}
                label={s.name}
                onPress={() => router.push(("/shop/" + s.id) as any)}
              />
            ))}
        </>
      ) : (
        <>
          {!posts.length && <Text>표시할 글이 없습니다.</Text>}
          {posts.map((p) => (
            <Action
              key={p.id}
              label={p.title}
              onPress={() => router.push(("/post/" + p.id) as any)}
            />
          ))}
        </>
      )}
    </SimplePage>
  );
}
