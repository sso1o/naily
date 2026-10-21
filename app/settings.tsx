import { useState } from "react";
import { Text, Switch } from "react-native";
import SimplePage, { Field, Action } from "@/components/SimplePage";
import {
  currentUser,
  allPosts,
  publicPosts,
  shopPosts,
  preferences,
  commitData,
} from "@/data/mockData";
export default function Settings() {
  const [nickname, setNickname] = useState(currentUser.nickname);
  const [message, setMessage] = useState("");
  const [enabled, setEnabled] = useState(preferences.notifications);
  return (
    <SimplePage title="프로필과 설정">
      <Text>개인 포트폴리오 · 이 기기의 로컬 체험 계정입니다.</Text>
      <Field label="닉네임" value={nickname} onChangeText={setNickname} />
      <Action
        label="프로필 저장"
        onPress={() => {
          if (!nickname.trim() || nickname.trim().length > 20) {
            setMessage("닉네임은 1~20자로 입력해주세요.");
            return;
          }
          currentUser.nickname = nickname.trim();
          new Set([...allPosts, ...publicPosts, ...shopPosts]).forEach((p) => {
            if (p.authorId === currentUser.id)
              p.authorName = currentUser.nickname;
          });
          try {
            commitData();
            setMessage("저장했습니다.");
          } catch (e) {
            setMessage((e as Error).message);
          }
        }}
      />
      <Text accessibilityRole="alert">{message}</Text>
      <Text>앱 내 예약 알림 표시</Text>
      <Switch
        accessibilityLabel="앱 내 예약 알림"
        value={enabled}
        onValueChange={(v) => {
          preferences.notifications = v;
          setEnabled(v);
          commitData();
        }}
      />
      <Text>
        외부 푸시·회원가입·실제 사업자 인증은 제공하지 않습니다. 사진과 글은 이
        브라우저/기기에 보관됩니다. 저장소를 지우면 삭제됩니다.
      </Text>
    </SimplePage>
  );
}
