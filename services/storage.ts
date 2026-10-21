import { Platform } from "react-native";
import { File, Paths } from "expo-file-system";

const KEY = "naily.portfolio.v1";
export let storageError = "";
export function readStore(): Record<string, any> | null {
  try {
    const text =
      Platform.OS === "web"
        ? typeof window === "undefined"
          ? null
          : window.localStorage.getItem(KEY)
        : (() => {
            const file = new File(Paths.document, `${KEY}.json`);
            return file.exists ? file.textSync() : null;
          })();
    if (!text) return null;
    const value = JSON.parse(text);
    if (value.version !== 1) throw new Error("지원하지 않는 저장 형식");
    return value;
  } catch {
    storageError = "저장 데이터를 읽지 못했습니다. 기기 저장소를 확인해주세요.";
    return null;
  }
}
export function writeStore(value: Record<string, unknown>) {
  const text = JSON.stringify({ ...value, version: 1 });
  try {
    if (Platform.OS === "web") {
      if (typeof window === "undefined") return;
      window.localStorage.setItem(KEY, text);
    } else {
      const file = new File(Paths.document, `${KEY}.json`);
      file.write(text);
    }
    storageError = "";
  } catch {
    storageError = "저장 공간이 부족하거나 저장소 접근이 차단됐습니다.";
    throw new Error(storageError);
  }
}
