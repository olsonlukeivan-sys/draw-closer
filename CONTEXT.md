# Draw Closer — Project Context

## What this is
Draw Closer is an iOS conversation card app for couples, friends, and family. Each day, two new cards surface. You tap to flip them, read the question out loud, put the phone down, and talk. Built by Livo Studio LLC (Wyoming).

## Tech stack
- React Native with Expo SDK 57
- Expo Router (file-based navigation)
- AsyncStorage for local persistence (no backend, no accounts in V1)
- expo-notifications for local daily reminders
- @react-native-community/datetimepicker for exact reminder-time selection
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

## Current state (as of September 2026)
- V1 was rejected by App Store review (4.2 Minimum Functionality, 2.3.10 Accurate Metadata); building v1.1 to address 4.2 before resubmission
- Bundle ID: com.livostudio.drawcloser
- 375 conversation prompt cards in data/cards.json — exactly 75 per category (reflective, playful, romantic, philosophical, deep), so every lens now cycles ~37 days before repeating, same as the original single-deck cadence
- Onboarding: 4 steps (welcome, how it works, daily reminder + time picker, pick-your-lens category preference) — finishing onboarding both saves the reminder/category preferences and performs today's draw immediately, landing on cards rather than bouncing back to a picker
- Daily draw: same 2 cards all day per category, advances through a per-category shuffled deck each day (lib/dailyDraw.ts); first open each day (if no draw yet) shows a lens picker on the main screen, pre-highlighting the last-used/preferred category
- Notifications: daily reminder persisted as `{enabled, hour, minute}` (lib/reminders.ts), settable during onboarding or later from Settings; hour presets (6–10pm) plus a "Custom" option opening a native time picker for any exact time
- Settings screen (app/settings.tsx) reachable via gear icon on the main screen: on/off toggle + reminder time, changes apply immediately
- No login, no paywall

## File structure
```
app/
  _layout.tsx       — root layout, loads fonts, StatusBar, registers routes
  index.tsx         — main card screen: daily lens picker (if no draw yet today) or cards, settings entry point
  onboarding.tsx    — 4-step onboarding flow (welcome, how it works, reminder time, lens preference)
  settings.tsx      — daily reminder on/off + time settings
components/
  CardTile.tsx      — flip animation card component
  CustomTimeModal.tsx — native time picker (spinner sheet on iOS, system dialog on Android)
hooks/
  useDailyDraw.ts   — thin hook wrapper around lib/dailyDraw.ts, exposes today's cards/category to index.tsx
lib/
  reminders.ts      — reminder settings persistence + notification scheduling
  categories.ts     — category list + persisted preferred-category preference
  dailyDraw.ts       — today's-draw persistence + per-category shuffle/pointer logic
data/
  cards.json        — 75 conversation prompts, each with a category tag
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
        <Stack.Screen name="settings" />
      </Stack>
    </>
  );
}
```

---

## app/index.tsx
```tsx
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
```

---

## app/onboarding.tsx
```tsx
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  REMINDER_HOURS,
  DEFAULT_REMINDER_HOUR,
  DEFAULT_REMINDER_MINUTE,
  formatTime,
  setReminderSettings,
} from '../lib/reminders';
import { CustomTimeModal } from '../components/CustomTimeModal';
import { CATEGORIES, CategoryId, setPreferredCategory } from '../lib/categories';
import { drawForCategory } from '../lib/dailyDraw';

export const ONBOARDING_KEY = '@draw_closer/onboarding_complete';

const DEFAULT_CATEGORY: CategoryId = 'reflective';

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
    body: "Want a nudge each evening to open your cards?\n\nPick a time below — you can turn reminders off anytime from your phone's notification settings.",
  },
  {
    title: 'Pick your lens',
    body: "Each day, choose the kind of conversation you're in the mood for.\n\nThis just sets your starting point — you can change it any day.",
  },
];

export default function OnboardingScreen() {
  const [step, setStep] = useState(0);
  const [reminderHour, setReminderHour] = useState(DEFAULT_REMINDER_HOUR);
  const [reminderMinute, setReminderMinute] = useState(DEFAULT_REMINDER_MINUTE);
  const [isCustomTime, setIsCustomTime] = useState(false);
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [category, setCategory] = useState<CategoryId>(DEFAULT_CATEGORY);
  const isLast = step === steps.length - 1;

  const selectPreset = (hour: number) => {
    setReminderHour(hour);
    setReminderMinute(0);
    setIsCustomTime(false);
  };

  const confirmCustomTime = (hour: number, minute: number) => {
    setReminderHour(hour);
    setReminderMinute(minute);
    setIsCustomTime(true);
    setShowCustomPicker(false);
  };

  const advanceReminderStep = (withNotifications: boolean) => {
    setNotificationsEnabled(withNotifications);
    setStep(s => s + 1);
  };

  const finish = async () => {
    await setReminderSettings({ enabled: notificationsEnabled, hour: reminderHour, minute: reminderMinute });
    await setPreferredCategory(category);
    await drawForCategory(category);
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

        {step === 2 && (
          <View style={styles.pickerBlock}>
            <Text style={styles.pickerLabel}>Pick a time</Text>
            <View style={styles.chipGrid}>
              {REMINDER_HOURS.map(hour => {
                const selected = !isCustomTime && hour === reminderHour;
                return (
                  <Pressable
                    key={hour}
                    style={[styles.chip, selected && styles.chipSelected]}
                    onPress={() => selectPreset(hour)}
                  >
                    <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                      {formatTime(hour, 0)}
                    </Text>
                  </Pressable>
                );
              })}
              <Pressable
                style={[styles.chip, isCustomTime && styles.chipSelected]}
                onPress={() => setShowCustomPicker(true)}
              >
                <Text style={[styles.chipText, isCustomTime && styles.chipTextSelected]}>
                  {isCustomTime ? formatTime(reminderHour, reminderMinute) : 'Custom'}
                </Text>
              </Pressable>
            </View>
          </View>
        )}

        {step === 3 && (
          <View style={styles.pickerBlock}>
            <Text style={styles.pickerLabel}>Pick a lens</Text>
            <View style={styles.chipGrid}>
              {CATEGORIES.map(cat => {
                const selected = cat.id === category;
                return (
                  <Pressable
                    key={cat.id}
                    style={[styles.chip, selected && styles.chipSelected]}
                    onPress={() => setCategory(cat.id)}
                  >
                    <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                      {cat.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}
      </View>

      <View style={styles.actions}>
        {step === 2 ? (
          <>
            <Pressable style={styles.primary} onPress={() => advanceReminderStep(true)}>
              <Text style={styles.primaryText}>Remind me at {formatTime(reminderHour, reminderMinute)}</Text>
            </Pressable>
            <Pressable style={styles.secondary} onPress={() => advanceReminderStep(false)}>
              <Text style={styles.secondaryText}>Skip for now</Text>
            </Pressable>
          </>
        ) : isLast ? (
          <Pressable style={styles.primary} onPress={finish}>
            <Text style={styles.primaryText}>Start drawing closer</Text>
          </Pressable>
        ) : (
          <Pressable style={styles.primary} onPress={() => setStep(s => s + 1)}>
            <Text style={styles.primaryText}>Next</Text>
          </Pressable>
        )}
        {step > 0 && (
          <Pressable style={styles.back} onPress={() => setStep(s => s - 1)}>
            <Text style={styles.backText}>Back</Text>
          </Pressable>
        )}
      </View>

      <CustomTimeModal
        visible={showCustomPicker}
        initialHour={reminderHour}
        initialMinute={reminderMinute}
        onCancel={() => setShowCustomPicker(false)}
        onConfirm={confirmCustomTime}
      />
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
  pickerBlock: {
    marginTop: 4,
  },
  pickerLabel: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: '#8E86A0',
    marginBottom: 12,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    flexBasis: '47%',
    flexGrow: 1,
    borderWidth: 1.5,
    borderColor: 'rgba(221,169,78,0.35)',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#2C2440',
  },
  chipSelected: {
    backgroundColor: 'rgba(221,169,78,0.16)',
    borderColor: '#DDA94E',
  },
  chipText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 15,
    color: '#EFE6D5',
  },
  chipTextSelected: {
    color: '#DDA94E',
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

## app/settings.tsx
```tsx
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Switch } from 'react-native';
import { router } from 'expo-router';
import {
  REMINDER_HOURS,
  DEFAULT_REMINDER_HOUR,
  DEFAULT_REMINDER_MINUTE,
  formatTime,
  getReminderSettings,
  setReminderSettings,
} from '../lib/reminders';
import { CustomTimeModal } from '../components/CustomTimeModal';

export default function SettingsScreen() {
  const [enabled, setEnabled] = useState(false);
  const [hour, setHour] = useState(DEFAULT_REMINDER_HOUR);
  const [minute, setMinute] = useState(DEFAULT_REMINDER_MINUTE);
  const [isCustomTime, setIsCustomTime] = useState(false);
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getReminderSettings().then(settings => {
      setEnabled(settings.enabled);
      setHour(settings.hour);
      setMinute(settings.minute);
      setIsCustomTime(settings.minute !== 0 || !REMINDER_HOURS.includes(settings.hour));
      setLoading(false);
    });
  }, []);

  const toggleEnabled = async (value: boolean) => {
    setEnabled(value);
    const applied = await setReminderSettings({ enabled: value, hour, minute });
    if (!applied) setEnabled(false);
  };

  const selectPreset = async (value: number) => {
    setHour(value);
    setMinute(0);
    setIsCustomTime(false);
    if (enabled) await setReminderSettings({ enabled, hour: value, minute: 0 });
  };

  const confirmCustomTime = async (newHour: number, newMinute: number) => {
    setHour(newHour);
    setMinute(newMinute);
    setIsCustomTime(true);
    setShowCustomPicker(false);
    if (enabled) await setReminderSettings({ enabled, hour: newHour, minute: newMinute });
  };

  if (loading) return <View style={styles.container} />;

  return (
    <View style={styles.container}>
      <Pressable style={styles.back} onPress={() => router.back()}>
        <Text style={styles.backText}>Back</Text>
      </Pressable>

      <Text style={styles.title}>Settings</Text>

      <View style={styles.row}>
        <Text style={styles.rowLabel}>Daily reminder</Text>
        <Switch
          value={enabled}
          onValueChange={toggleEnabled}
          trackColor={{ false: '#2C2440', true: 'rgba(221,169,78,0.5)' }}
          thumbColor={enabled ? '#DDA94E' : '#8E86A0'}
        />
      </View>

      <Text style={styles.pickerLabel}>Reminder time</Text>
      <View style={styles.chipGrid}>
        {REMINDER_HOURS.map(h => {
          const selected = !isCustomTime && h === hour;
          return (
            <Pressable
              key={h}
              style={[styles.chip, selected && styles.chipSelected]}
              onPress={() => selectPreset(h)}
            >
              <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                {formatTime(h, 0)}
              </Text>
            </Pressable>
          );
        })}
        <Pressable
          style={[styles.chip, isCustomTime && styles.chipSelected]}
          onPress={() => setShowCustomPicker(true)}
        >
          <Text style={[styles.chipText, isCustomTime && styles.chipTextSelected]}>
            {isCustomTime ? formatTime(hour, minute) : 'Custom'}
          </Text>
        </Pressable>
      </View>

      <CustomTimeModal
        visible={showCustomPicker}
        initialHour={hour}
        initialMinute={minute}
        onCancel={() => setShowCustomPicker(false)}
        onConfirm={confirmCustomTime}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1930',
    padding: 32,
    paddingTop: 60,
    gap: 28,
  },
  back: {
    alignSelf: 'flex-start',
  },
  backText: {
    fontFamily: 'DMSans_400Regular',
    color: '#8E86A0',
    fontSize: 15,
  },
  title: {
    fontFamily: 'Fraunces_400Regular',
    fontSize: 32,
    color: '#EFE6D5',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowLabel: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 17,
    color: '#EFE6D5',
  },
  pickerLabel: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: '#8E86A0',
    marginBottom: -14,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    flexBasis: '47%',
    flexGrow: 1,
    borderWidth: 1.5,
    borderColor: 'rgba(221,169,78,0.35)',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#2C2440',
  },
  chipSelected: {
    backgroundColor: 'rgba(221,169,78,0.16)',
    borderColor: '#DDA94E',
  },
  chipText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 15,
    color: '#EFE6D5',
  },
  chipTextSelected: {
    color: '#DDA94E',
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

## components/CustomTimeModal.tsx
```tsx
import { useState } from 'react';
import { Modal, View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

type Props = {
  visible: boolean;
  initialHour: number;
  initialMinute: number;
  onCancel: () => void;
  onConfirm: (hour: number, minute: number) => void;
};

function toDate(hour: number, minute: number) {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d;
}

export function CustomTimeModal({ visible, initialHour, initialMinute, onCancel, onConfirm }: Props) {
  const [date, setDate] = useState(() => toDate(initialHour, initialMinute));

  if (!visible) return null;

  if (Platform.OS === 'android') {
    const handleChange = (event: DateTimePickerEvent, selected?: Date) => {
      if (event.type === 'set' && selected) {
        onConfirm(selected.getHours(), selected.getMinutes());
      } else {
        onCancel();
      }
    };
    return <DateTimePicker value={date} mode="time" display="default" onChange={handleChange} />;
  }

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <DateTimePicker
            value={date}
            mode="time"
            display="spinner"
            themeVariant="dark"
            onChange={(_, selected) => selected && setDate(selected)}
          />
          <View style={styles.actions}>
            <Pressable onPress={onCancel}>
              <Text style={styles.cancel}>Cancel</Text>
            </Pressable>
            <Pressable onPress={() => onConfirm(date.getHours(), date.getMinutes())}>
              <Text style={styles.done}>Done</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#2C2440',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(221,169,78,0.25)',
  },
  cancel: {
    fontFamily: 'DMSans_500Medium',
    color: '#8E86A0',
    fontSize: 16,
    paddingVertical: 12,
  },
  done: {
    fontFamily: 'DMSans_600SemiBold',
    color: '#DDA94E',
    fontSize: 16,
    paddingVertical: 12,
  },
});
```

---

## hooks/useDailyDraw.ts
```tsx
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
```

---

## lib/categories.ts
```tsx
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
```

---

## lib/dailyDraw.ts
```tsx
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
```

---

## lib/reminders.ts
```tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

const SETTINGS_KEY = '@draw_closer/reminder_settings';

export const REMINDER_HOURS = [18, 19, 20, 21, 22];
export const DEFAULT_REMINDER_HOUR = 19;
export const DEFAULT_REMINDER_MINUTE = 0;

export type ReminderSettings = {
  enabled: boolean;
  hour: number;
  minute: number;
};

const DEFAULT_SETTINGS: ReminderSettings = {
  enabled: false,
  hour: DEFAULT_REMINDER_HOUR,
  minute: DEFAULT_REMINDER_MINUTE,
};

export function formatTime(hour: number, minute: number) {
  const period = hour >= 12 ? 'PM' : 'AM';
  const h = hour % 12 === 0 ? 12 : hour % 12;
  const m = minute.toString().padStart(2, '0');
  return `${h}:${m} ${period}`;
}

export async function getReminderSettings(): Promise<ReminderSettings> {
  const raw = await AsyncStorage.getItem(SETTINGS_KEY);
  if (!raw) return DEFAULT_SETTINGS;
  return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
}

export async function setReminderSettings(settings: ReminderSettings): Promise<boolean> {
  await Notifications.cancelAllScheduledNotificationsAsync();

  if (settings.enabled) {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...settings, enabled: false }));
      return false;
    }
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Your daily cards are ready',
        body: "Open Draw Closer to see today's questions.",
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: settings.hour,
        minute: settings.minute,
      },
    });
  }

  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  return true;
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
    "android": {
      "adaptiveIcon": {
        "backgroundColor": "#1E1930",
        "foregroundImage": "./assets/android-icon-foreground.png"
      },
      "predictiveBackGestureEnabled": false
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "plugins": [
      "expo-router",
      "expo-notifications",
      "@react-native-community/datetimepicker"
    ],
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
- (none currently — all three v1.1 features shipped: notification settings, onboarding lens preference, mood/category picker with 75 cards per lens)
