import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import cardsData from '../data/cards.json';

const KEY_SHUFFLE = '@draw_closer/shuffle';
const KEY_DRAW = '@draw_closer/daily_draw';

type Card = { id: number; text: string };
type DailyDraw = { date: string; cardIds: [number, number] };
type ShuffleState = { order: number[]; pointer: number };

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

export function useDailyDraw() {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function pickCards() {
      const today = getTodayString();

      // If we already drew cards today, return the same ones
      const rawDraw = await AsyncStorage.getItem(KEY_DRAW);
      if (rawDraw) {
        const draw: DailyDraw = JSON.parse(rawDraw);
        if (draw.date === today) {
          setCards(cardsData.filter(c => draw.cardIds.includes(c.id)));
          setLoading(false);
          return;
        }
      }

      // Load or create the shuffled deck order
      const rawShuffle = await AsyncStorage.getItem(KEY_SHUFFLE);
      let state: ShuffleState = rawShuffle
        ? JSON.parse(rawShuffle)
        : { order: shuffle(cardsData.map(c => c.id)), pointer: 0 };

      // Re-shuffle when we've gone through the whole deck
      if (state.pointer + 1 >= state.order.length) {
        state = { order: shuffle(cardsData.map(c => c.id)), pointer: 0 };
      }

      const cardIds: [number, number] = [
        state.order[state.pointer],
        state.order[state.pointer + 1],
      ];
      state.pointer += 2;

      await AsyncStorage.setItem(KEY_SHUFFLE, JSON.stringify(state));
      await AsyncStorage.setItem(KEY_DRAW, JSON.stringify({ date: today, cardIds }));

      setCards(cardsData.filter(c => cardIds.includes(c.id)));
      setLoading(false);
    }

    pickCards();
  }, []);

  return { cards, loading };
}
