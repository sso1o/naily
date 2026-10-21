import { useState } from "react";
import { useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";
import SimplePage, { Field, Action } from "@/components/SimplePage";
import { shops, preferences, commitData } from "@/data/mockData";
export default function Inquiries() {
  const { shopId = shops[0].id, owner } = useLocalSearchParams<{
    shopId?: string;
    owner?: string;
  }>();
  const [text, setText] = useState("");
  const [message, setMessage] = useState("");
  const [, refresh] = useState(0);
  const entries = preferences.inquiries.filter((i) => i.shopId === shopId);
  return (
    <SimplePage title="샵 문의">
      <Text>
        로컬 문의함 · 실제 샵으로 전송되지 않습니다. 대시보드 미리보기에서
        답변을 작성할 수 있어요.
      </Text>
      <Text>{shops.find((s) => s.id === shopId)?.name}</Text>
      {entries.map((i) => (
        <View
          key={i.id}
          style={{ gap: 10, padding: 12, borderWidth: 1, borderColor: "#ddd" }}
        >
          <Text>문의: {i.text}</Text>
          <Text>답변: {i.answer || "답변 대기"}</Text>
          {owner === "1" && (
            <Field
              label="답변"
              value={i.answer ?? ""}
              onChangeText={(v) => {
                i.answer = v;
                refresh((n) => n + 1);
              }}
            />
          )}
          {owner === "1" && (
            <Action
              label="답변 저장"
              onPress={() => {
                commitData();
                setMessage("답변을 저장했어요.");
              }}
            />
          )}
        </View>
      ))}
      <Field label="문의 내용" value={text} onChangeText={setText} multiline />
      <Action
        label="문의 남기기"
        onPress={() => {
          if (!text.trim()) {
            setMessage("문의 내용을 입력해주세요.");
            return;
          }
          preferences.inquiries.push({
            id: "inquiry-" + Date.now(),
            shopId,
            text: text.trim(),
          });
          commitData();
          setText("");
          refresh((n) => n + 1);
          setMessage("이 기기에 문의를 저장했어요.");
        }}
      />
      <Text accessibilityRole="alert">{message}</Text>
    </SimplePage>
  );
}
