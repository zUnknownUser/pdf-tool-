import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "PDF_HISTORY";

export type HistoryItem = {
  id: string;
  name: string;
  uri: string;
  date: string;
  size?: number | null;
};

export async function saveToHistory(item: HistoryItem) {
  const existing = await getHistory();
  const updated = [item, ...existing];

  await AsyncStorage.setItem(KEY, JSON.stringify(updated));
}

export async function getHistory(): Promise<HistoryItem[]> {
  const data = await AsyncStorage.getItem(KEY);

  if (!data) return [];

  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export async function deleteHistoryItem(id: string) {
  const existing = await getHistory();
  const updated = existing.filter((item) => item.id !== id);

  await AsyncStorage.setItem(KEY, JSON.stringify(updated));
}

export async function clearHistory() {
  await AsyncStorage.removeItem(KEY);
}