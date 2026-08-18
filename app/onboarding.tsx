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
