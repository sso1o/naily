import { Platform } from "react-native";
import { File, Paths } from "expo-file-system";
import type { PostBlock } from "@/types/models";

/** Copy picker/cache media before publishing. Web snapshots use portable data URLs. */
export async function prepareMedia(blocks: PostBlock[]): Promise<PostBlock[]> {
  const copies = JSON.parse(JSON.stringify(blocks)) as PostBlock[];
  const cache = new Map<string, string>();
  async function durable(uri: string) {
    if (/^(https?:|data:)/.test(uri)) return uri;
    if (cache.has(uri)) return cache.get(uri)!;
    let result: string;
    if (Platform.OS === "web") {
      const response = await fetch(uri);
      if (!response.ok) throw new Error("선택한 미디어를 다시 선택해주세요.");
      const blob = await response.blob();
      if (blob.size > 2 * 1024 * 1024)
        throw new Error("웹 체험에서는 2MB 이하의 미디어를 선택해주세요.");
      result = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } else {
      if (uri.startsWith(Paths.document.uri)) return uri;
      const extension =
        uri
          .split("?")[0]
          .split(".")
          .pop()
          ?.replace(/[^a-z0-9]/gi, "")
          .slice(0, 8) || "bin";
      const destination = new File(
        Paths.document,
        `naily-media-${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`,
      );
      new File(uri).copy(destination);
      result = destination.uri;
    }
    cache.set(uri, result);
    return result;
  }
  for (const block of copies) {
    if (block.imageUrl) block.imageUrl = await durable(block.imageUrl);
    if (block.decoratedImage)
      block.decoratedImage.uri = await durable(block.decoratedImage.uri);
    if (block.video) block.video.uri = await durable(block.video.uri);
  }
  return copies;
}
