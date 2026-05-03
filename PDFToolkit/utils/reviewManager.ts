import AsyncStorage from "@react-native-async-storage/async-storage";
import * as StoreReview from "expo-store-review";

const REVIEW_KEY = "PDF_REVIEW";

export async function tryRequestReview() {
  const raw = await AsyncStorage.getItem(REVIEW_KEY);
  const data = raw ? JSON.parse(raw) : { asked: false, filesProcessed: 0, firstUseDate: new Date().toISOString() };

  if (data.asked) return;

  data.filesProcessed = (data.filesProcessed ?? 0) + 1;

  const daysSinceFirstUse = (Date.now() - new Date(data.firstUseDate).getTime()) / (1000 * 60 * 60 * 24);

  if (data.filesProcessed >= 3 && daysSinceFirstUse >= 3) {
    const isAvailable = await StoreReview.isAvailableAsync();
    if (isAvailable) {
      await StoreReview.requestReview();
      data.asked = true;
    }
  }

  await AsyncStorage.setItem(REVIEW_KEY, JSON.stringify(data));
}