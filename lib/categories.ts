import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFERRED_CATEGORY_KEY = '@draw_closer/preferred_category';

export const CATEGORIES = [
  { id: 'reflective', label: 'Reflective' },
  { id: 'playful', label: 'Playful' },
  { id: 'romantic', label: 'Romantic' },
  { id: 'philosophical', label: 'Philosophical' },
  { id: 'deep', label: 'Deep' },
] as const;

export type CategoryId = (typeof CATEGORIES)[number]['id'];

export async function getPreferredCategory(): Promise<CategoryId | null> {
  const raw = await AsyncStorage.getItem(PREFERRED_CATEGORY_KEY);
  return raw as CategoryId | null;
}

export async function setPreferredCategory(category: CategoryId): Promise<void> {
  await AsyncStorage.setItem(PREFERRED_CATEGORY_KEY, category);
}
