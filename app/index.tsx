import { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDailyDraw } from '../hooks/useDailyDraw';
import { CardTile } from '../components/CardTile';
import { ONBOARDING_KEY } from './onboarding';

export default function TodayScreen() {
  const { cards, loading } = useDailyDraw();

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY).then(val => {
      if (val !== 'true') router.replace('/onboarding');
    });
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#DDA94E" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
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
});
