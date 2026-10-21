import { useState } from "react";
import { useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";
import SimplePage, { Field, Action } from "@/components/SimplePage";
import { shops, designs, reviews, commitData } from "@/data/mockData";
export default function Manage() {
  const { kind = "가격 메뉴 관리", shopId = shops[0].id } =
    useLocalSearchParams<{ kind?: string; shopId?: string }>();
  const shop = shops.find((s) => s.id === shopId) ?? shops[0];
  const [, refresh] = useState(0);
  const [message, setMessage] = useState("");
  const [notice, setNotice] = useState(shop.notice ?? "");
  const [menus, setMenus] = useState((shop.menus ?? []).map((m) => ({ ...m })));
  const [art, setArt] = useState(
    shop.monthlyArtAlbums?.[0]?.media[0]?.uri ?? "",
  );
  return (
    <SimplePage title={kind}>
      <Text>로컬 샵 관리 미리보기 · {shop.name}</Text>
      {kind === "가격 메뉴 관리" ? (
        <>
          {menus.map((m, i) => (
            <Field
              key={i}
              label={m.name + " 가격"}
              value={m.price}
              onChangeText={(v) =>
                setMenus((rows) =>
                  rows.map((r, j) => (i === j ? { ...r, price: v } : r)),
                )
              }
            />
          ))}
          <Action
            label="메뉴 추가"
            onPress={() =>
              setMenus((rows) => [
                ...rows,
                { name: "새 메뉴", detail: "상담 후 확정", price: "50,000원" },
              ])
            }
          />
          <Action
            label="가격 저장"
            onPress={() => {
              shop.menus = menus;
              commitData();
              setMessage("저장했어요.");
            }}
          />
        </>
      ) : kind === "이달의 아트 관리" ? (
        <>
          <Field label="이미지 URL (https)" value={art} onChangeText={setArt} />
          <Action
            label="이달의 아트 저장"
            onPress={() => {
              if (!/^https:\/\//.test(art)) {
                setMessage("https 이미지 URL을 입력해주세요.");
                return;
              }
              shop.monthlyArtAlbums = [
                {
                  id: "local-art",
                  month: new Date().toISOString().slice(0, 7),
                  media: [
                    {
                      id: "local-media",
                      type: "image",
                      uri: art,
                      aspectRatio: 1,
                      price: shop.priceRange,
                    },
                  ],
                },
              ];
              commitData();
              setMessage("저장했어요.");
            }}
          />
        </>
      ) : kind === "대표 디자인 관리" ? (
        <>
          {designs.map((d) => (
            <Action
              key={d.id}
              label={
                (d.availableShopIds.includes(shop.id) ? "✓ " : "") + d.title
              }
              onPress={() => {
                d.availableShopIds = d.availableShopIds.includes(shop.id)
                  ? d.availableShopIds.filter((id) => id !== shop.id)
                  : [...d.availableShopIds, shop.id];
                commitData();
                refresh((n) => n + 1);
              }}
            />
          ))}
        </>
      ) : kind === "리뷰 관리" ? (
        <>
          {reviews
            .filter((r) => r.shopId === shop.id)
            .map((r) => (
              <View key={r.id}>
                <Text>
                  ★ {r.rating} {r.userName}: {r.content}
                </Text>
                <Field
                  label={r.userName + " 리뷰 답변"}
                  value={r.ownerReply ?? ""}
                  onChangeText={(v) => {
                    r.ownerReply = v;
                    refresh((n) => n + 1);
                  }}
                />
                <Action
                  label="답변 저장"
                  onPress={() => {
                    commitData();
                    setMessage("리뷰 답변을 저장했어요.");
                  }}
                />
              </View>
            ))}
          <Text>고객 리뷰를 확인하고 샵 답변을 남겨보세요.</Text>
        </>
      ) : (
        <>
          <Field
            label="샵 공지"
            value={notice}
            onChangeText={setNotice}
            multiline
          />
          <Action
            label="공지 저장"
            onPress={() => {
              shop.notice = notice;
              commitData();
              setMessage("저장했어요.");
            }}
          />
        </>
      )}
      <Text accessibilityRole="alert">{message}</Text>
    </SimplePage>
  );
}
