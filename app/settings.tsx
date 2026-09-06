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
