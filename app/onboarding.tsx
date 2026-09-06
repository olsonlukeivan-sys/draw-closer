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
    body: "Want a nudge each evening to open your cards?\n\nPick a time below — you can turn reminders off anytime from your phone's notification settings.",
  },
];

export default function OnboardingScreen() {
  const [step, setStep] = useState(0);
  const [reminderHour, setReminderHour] = useState(DEFAULT_REMINDER_HOUR);
  const [reminderMinute, setReminderMinute] = useState(DEFAULT_REMINDER_MINUTE);
  const [isCustomTime, setIsCustomTime] = useState(false);
  const [showCustomPicker, setShowCustomPicker] = useState(false);
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

  const finish = async (withNotifications: boolean) => {
    await setReminderSettings({ enabled: withNotifications, hour: reminderHour, minute: reminderMinute });
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

        {isLast && (
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
      </View>

      <View style={styles.actions}>
        {!isLast ? (
          <Pressable style={styles.primary} onPress={() => setStep(s => s + 1)}>
            <Text style={styles.primaryText}>Next</Text>
          </Pressable>
        ) : (
          <>
            <Pressable style={styles.primary} onPress={() => finish(true)}>
              <Text style={styles.primaryText}>Remind me at {formatTime(reminderHour, reminderMinute)}</Text>
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
