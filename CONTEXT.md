# Draw Closer — Project Context

## What this is
Draw Closer is an iOS conversation card app for couples, friends, and family. Each day, two new cards surface. You tap to flip them, read the question out loud, put the phone down, and talk. Built by Livo Studio LLC (Wyoming).

## Tech stack
- React Native with Expo SDK 57
- Expo Router (file-based navigation)
- AsyncStorage for local persistence (no backend, no accounts in V1)
- expo-notifications for local daily reminders
- Fraunces (serif, display) + DM Sans (sans-serif, body) fonts
- Nightfall dark palette (see colors below)

## Design palette
- Background: #1E1930
- Surface / card back: #2C2440
- Gold accent: #DDA94E
- Text: #EFE6D5
- Muted text: #8E86A0
- Card front (bone): #EFE6D5 with text #2A211B
- Gold border on cards: rgba(221,169,78,0.45)

## Current state (as of August 2026)
- V1 is complete and submitted to Apple App Store review
- Bundle ID: com.livostudio.drawcloser
- 75 conversation prompt cards in data/cards.json
- Onboarding: 3 steps (welcome, how it works, daily reminder)
- Daily draw: same 2 cards all day, advances through shuffled deck each day
- Notifications: daily at 7pm (hardcoded — time picker planned for next update)
- No login, no paywall, no settings screen in V1

## File structure
```
app/
  _layout.tsx       — root layout, loads fonts, StatusBar
  index.tsx         — main card screen
  onboarding.tsx    — 3-step onboarding flow
components/
  CardTile.tsx      — flip animation card component
hooks/
  useDailyDraw.ts   — daily card draw logic with AsyncStorage
data/
  cards.json        — 75 conversation prompts
```

---

## app/_layout.tsx
```tsx
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import { Fraunces_400Regular } from '@expo-google-fonts/fraunces';
import { DMSans_400Regular, DMSans_500Medium, DMSans_600SemiBold } from '@expo-google-fonts/dm-sans';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Fraunces_400Regular,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
  });

  if (!fontsLoaded) return null;

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" />
      </Stack>
    </>
  );
}
```

---

## app/index.tsx
```tsx
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
```

---

## app/onboarding.tsx
```tsx
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

export const ONBOARDING_KEY = '@draw_closer/onboarding_complete';

const steps = [
  {
    title: 'Draw Closer',
    body: 'A daily ritual for the people who matter most.\n\nEach day, two new cards surface. Each card holds a question worth asking.',
  },
  {
    title: 'How it works',
    body: 'Open the app together.\n\nTap a card to flip it, then read the question out loud.\n\nPut the phone down and talk.\n\nNo scores. No tracking. Just conversation.',
  },
  {
    title: 'Daily reminder',
    body: "Want a nudge each evening to open your cards?\n\nYou can always change this later in your phone's notification settings.",
  },
];

async function scheduleDaily() {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return;
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Your daily cards are ready',
      body: "Open Draw Closer to see today's questions.",
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 19,
      minute: 0,
    },
  });
}

export default function OnboardingScreen() {
  const [step, setStep] = useState(0);
  const isLast = step === steps.length - 1;

  const finish = async (withNotifications: boolean) => {
    if (withNotifications) await scheduleDaily();
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    router.replace('/');
  };

  return (
    <View style={styles.container}>
      <View style={styles.dots}>
        {steps.map((_, i) => (
          <View key={i} style={[styles.dot, i === step && styles.dotActive]} />
        ))}
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>{steps[step].title}</Text>
        <Text style={styles.body}>{steps[step].body}</Text>
      </View>

      <View style={styles.actions}>
        {!isLast ? (
          <Pressable style={styles.primary} onPress={() => setStep(s => s + 1)}>
            <Text style={styles.primaryText}>Next</Text>
          </Pressable>
        ) : (
          <>
            <Pressable style={styles.primary} onPress={() => finish(true)}>
              <Text style={styles.primaryText}>Yes, remind me at 7pm</Text>
            </Pressable>
            <Pressable style={styles.secondary} onPress={() => finish(false)}>
              <Text style={styles.secondaryText}>Skip for now</Text>
            </Pressable>
          </>
        )}
        {step > 0 && (
          <Pressable style={styles.back} onPress={() => setStep(s => s - 1)}>
            <Text style={styles.backText}>Back</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1930',
    padding: 32,
    justifyContent: 'space-between',
  },
  dots: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 60,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2C2440',
  },
  dotActive: {
    backgroundColor: '#DDA94E',
    width: 20,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    gap: 20,
  },
  title: {
    fontFamily: 'Fraunces_400Regular',
    fontSize: 38,
    color: '#EFE6D5',
    lineHeight: 44,
  },
  body: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 17,
    lineHeight: 27,
    color: '#A89EC0',
  },
  actions: {
    gap: 12,
    paddingBottom: 40,
  },
  primary: {
    backgroundColor: '#2C2440',
    borderWidth: 1.5,
    borderColor: '#DDA94E',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
  },
  primaryText: {
    fontFamily: 'DMSans_600SemiBold',
    color: '#DDA94E',
    fontSize: 16,
  },
  secondary: {
    backgroundColor: '#2C2440',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
  },
  secondaryText: {
    fontFamily: 'DMSans_600SemiBold',
    color: '#EFE6D5',
    fontSize: 16,
  },
  back: {
    alignItems: 'center',
    padding: 12,
  },
  backText: {
    fontFamily: 'DMSans_400Regular',
    color: '#8E86A0',
    fontSize: 15,
  },
});
```

---

## components/CardTile.tsx
```tsx
import { useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  text: string;
};

export function CardTile({ text }: Props) {
  const anim = useRef(new Animated.Value(0)).current;
  const isFlipped = useRef(false);

  const flip = () => {
    const toValue = isFlipped.current ? 0 : 1;
    isFlipped.current = !isFlipped.current;
    Animated.spring(anim, {
      toValue,
      friction: 8,
      tension: 40,
      useNativeDriver: false,
    }).start();
  };

  const backRotate = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '90deg'],
  });

  const frontRotate = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['-90deg', '0deg'],
  });

  const backOpacity = anim.interpolate({
    inputRange: [0.45, 0.55],
    outputRange: [1, 0],
  });

  const frontOpacity = anim.interpolate({
    inputRange: [0.45, 0.55],
    outputRange: [0, 1],
  });

  return (
    <Pressable onPress={flip} style={styles.wrapper}>
      {/* Back face */}
      <Animated.View
        style={[
          styles.face,
          styles.back,
          { opacity: backOpacity, transform: [{ rotateY: backRotate }] },
        ]}
      >
        <Text style={styles.backSymbol}>✦</Text>
        <Text style={styles.backTitle}>Draw Closer</Text>
        <Text style={styles.backHint}>tap to reveal</Text>
      </Animated.View>

      {/* Front face */}
      <Animated.View
        style={[
          styles.face,
          styles.front,
          { opacity: frontOpacity, transform: [{ rotateY: frontRotate }] },
        ]}
      >
        <Text style={styles.question}>{text}</Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    height: 240,
  },
  face: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  back: {
    backgroundColor: '#2C2440',
    borderWidth: 1,
    borderColor: 'rgba(221,169,78,0.45)',
    gap: 6,
  },
  backSymbol: {
    fontSize: 22,
    color: '#DDA94E',
    marginBottom: 2,
  },
  backTitle: {
    fontFamily: 'Fraunces_400Regular',
    fontSize: 15,
    letterSpacing: 3,
    textTransform: 'uppercase',
    color: '#DDA94E',
  },
  backHint: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 11,
    letterSpacing: 0.5,
    color: '#C58A72',
    marginTop: 2,
  },
  front: {
    backgroundColor: '#EFE6D5',
    padding: 28,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  question: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 19,
    lineHeight: 29,
    color: '#2A211B',
  },
});
```

---

## hooks/useDailyDraw.ts
```tsx
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

      const rawDraw = await AsyncStorage.getItem(KEY_DRAW);
      if (rawDraw) {
        const draw: DailyDraw = JSON.parse(rawDraw);
        if (draw.date === today) {
          setCards(cardsData.filter(c => draw.cardIds.includes(c.id)));
          setLoading(false);
          return;
        }
      }

      const rawShuffle = await AsyncStorage.getItem(KEY_SHUFFLE);
      let state: ShuffleState = rawShuffle
        ? JSON.parse(rawShuffle)
        : { order: shuffle(cardsData.map(c => c.id)), pointer: 0 };

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
```

---

## app.json
```json
{
  "expo": {
    "name": "Draw Closer",
    "slug": "draw-closer",
    "scheme": "drawcloser",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "dark",
    "splash": {
      "image": "./assets/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#1E1930"
    },
    "ios": {
      "supportsTablet": false,
      "bundleIdentifier": "com.livostudio.drawcloser",
      "infoPlist": {
        "ITSAppUsesNonExemptEncryption": false
      }
    },
    "plugins": ["expo-router", "expo-notifications"],
    "extra": {
      "router": {},
      "eas": {
        "projectId": "277479b1-3292-493d-83aa-6a2fafdea15e"
      }
    }
  }
}
```

---

## Planned for next update
- Notification time picker on the onboarding "Daily reminder" step (currently hardcoded to 7pm)
