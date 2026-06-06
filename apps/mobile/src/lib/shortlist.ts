import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'rdn_shortlist';

export async function getShortlist(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    /* storage unavailable */
    return [];
  }
}

export async function isSaved(id: string): Promise<boolean> {
  return (await getShortlist()).includes(id);
}

export async function toggleSaved(id: string): Promise<boolean> {
  const ids = await getShortlist();
  const next = ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id];
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
  return next.includes(id);
}
