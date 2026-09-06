import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Pressable } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDailyDraw } from '../hooks/useDailyDraw';
import { CardTile } from '../components/CardTile';
import { ONBOARDING_KEY } from './onboarding';
import { CATEGORIES, CategoryId, getPreferredCategory } from '../lib/categories';

export default function TodayScreen() {
  const { cards, category, loading, chooseCategory } = useDailyDraw();
  const [preferred, setPreferred] = useState<CategoryId | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY).then(val => {
      if (val !== 'true') router.replace('/onboarding');
    });
    getPreferredCategory().then(setPreferred);
  }, []);

  const selectLens = (chosen: CategoryId) => {
    setPreferred(chosen);
    chooseCategory(chosen);
  };

  const settingsButton = (
    <Pressable style={styles.settingsButton} onPress={() => router.push('/settings')}>
      <Text style={styles.settingsIcon}>⚙</Text>
    </Pressable>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#DDA94E" />
      </View>
    );
  }

  if (!category) {
    return (
      <View style={styles.container}>
        {settingsButton}
        <Text style={styles.label}>Today, I'm feeling</Text>
        <View style={styles.lensGrid}>
          {CATEGORIES.map(cat => {
            const selected = cat.id === preferred;
            return (
              <Pressable
                key={cat.id}
                style={[styles.lensChip, selected && styles.lensChipSelected]}
                onPress={() => selectLens(cat.id)}
              >
                <Text style={[styles.lensChipText, selected && styles.lensChipTextSelected]}>
                  {cat.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {settingsButton}
      <Text style={styles.label}>Today's cards</Text>
      <View style={styles.deck}>
        {cards.map(card => (
          <CardTile key={card.id} text={card.text} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1930',
    justifyContent: 'center',
    padding: 24,
    gap: 16,
  },
  settingsButton: {
    position: 'absolute',
    top: 60,
    right: 24,
    padding: 8,
  },
  settingsIcon: {
    fontSize: 20,
    color: '#8E86A0',
  },
  label: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: '#8E86A0',
    marginBottom: 4,
  },
  deck: {
    gap: 16,
  },
  lensGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  lensChip: {
    flexBasis: '47%',
    flexGrow: 1,
    borderWidth: 1.5,
    borderColor: 'rgba(221,169,78,0.35)',
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
    backgroundColor: '#2C2440',
  },
  lensChipSelected: {
    backgroundColor: 'rgba(221,169,78,0.16)',
    borderColor: '#DDA94E',
  },
  lensChipText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 16,
    color: '#EFE6D5',
  },
  lensChipTextSelected: {
    color: '#DDA94E',
  },
});
