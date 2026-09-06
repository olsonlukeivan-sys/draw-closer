import AsyncStorage from '@react-native-async-storage/async-storage';
import cardsData from '../data/cards.json';
import { CategoryId } from './categories';

const KEY_SHUFFLE = '@draw_closer/shuffle_by_category';
const KEY_DRAW = '@draw_closer/daily_draw';

export type Card = { id: number; text: string; category: CategoryId };
type DailyDrawRecord = { date: string; category: CategoryId; cardIds: [number, number] };
type ShuffleState = { order: number[]; pointer: number };
type ShuffleByCategory = Partial<Record<CategoryId, ShuffleState>>;

function getTodayString() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function shuffle(ids: number[]): number[] {
  const arr = [...ids];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export async function getTodaysDraw(): Promise<{ category: CategoryId; cards: Card[] } | null> {
  const rawDraw = await AsyncStorage.getItem(KEY_DRAW);
  if (!rawDraw) return null;
  const draw: DailyDrawRecord = JSON.parse(rawDraw);
  if (draw.date !== getTodayString()) return null;
  return {
    category: draw.category,
    cards: (cardsData as Card[]).filter(c => draw.cardIds.includes(c.id)),
  };
}

export async function drawForCategory(chosen: CategoryId): Promise<Card[]> {
  const today = getTodayString();
  const pool = (cardsData as Card[]).filter(c => c.category === chosen);

  const rawShuffle = await AsyncStorage.getItem(KEY_SHUFFLE);
  const shuffleByCategory: ShuffleByCategory = rawShuffle ? JSON.parse(rawShuffle) : {};

  let state = shuffleByCategory[chosen];
  if (!state || state.pointer + 1 >= state.order.length) {
    state = { order: shuffle(pool.map(c => c.id)), pointer: 0 };
  }

  const cardIds: [number, number] = [state.order[state.pointer], state.order[state.pointer + 1]];
  state.pointer += 2;
  shuffleByCategory[chosen] = state;

  await AsyncStorage.setItem(KEY_SHUFFLE, JSON.stringify(shuffleByCategory));
  await AsyncStorage.setItem(KEY_DRAW, JSON.stringify({ date: today, category: chosen, cardIds }));

  return pool.filter(c => cardIds.includes(c.id));
}
