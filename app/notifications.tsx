import { Text } from "react-native";
import SimplePage from "@/components/SimplePage";
import { reservations, currentUser, preferences, shops } from "@/data/mockData";
const labels = {
  pending: "접수 대기",
  confirmed: "확정",
  cancelled: "취소",
  completed: "방문 완료",
};
export default function Notifications() {
  const rows = preferences.notifications
    ? reservations.filter((r) => r.userId === currentUser.id)
    : [];
  return (
    <SimplePage title="예약 소식">
      <Text>이 기기에 저장된 예약의 현재 상태를 보여줍니다.</Text>
      {!rows.length && <Text>표시할 예약 소식이 없습니다.</Text>}
      {rows.map((r) => (
        <Text key={r.id}>
          {shops.find((s) => s.id === r.shopId)?.name} · {r.date} {r.time} ·{" "}
          {labels[r.status]}
        </Text>
      ))}
    </SimplePage>
  );
}
