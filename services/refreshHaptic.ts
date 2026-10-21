import * as Haptics from 'expo-haptics';

/** Unsupported hardware, browser restrictions, or native failures are optional. */
export async function refreshHaptic(): Promise<void> {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {
    // Device feedback must not affect the data request or its error banner.
  }
}
