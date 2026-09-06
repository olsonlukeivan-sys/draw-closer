import { useState, useEffect } from 'react';
import { CategoryId } from '../lib/categories';
import { Card, drawForCategory, getTodaysDraw } from '../lib/dailyDraw';

export function useDailyDraw() {
  const [cards, setCards] = useState<Card[]>([]);
  const [category, setCategory] = useState<CategoryId | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTodaysDraw().then(draw => {
      if (draw) {
        setCategory(draw.category);
        setCards(draw.cards);
      }
      setLoading(false);
    });
  }, []);

  const chooseCategory = async (chosen: CategoryId) => {
    const drawnCards = await drawForCategory(chosen);
    setCategory(chosen);
    setCards(drawnCards);
  };

  return { cards, category, loading, chooseCategory };
}
