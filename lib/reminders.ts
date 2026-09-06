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
