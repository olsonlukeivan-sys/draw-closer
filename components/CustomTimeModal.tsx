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
