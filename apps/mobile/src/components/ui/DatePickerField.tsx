import { useState } from 'react';
import { Platform, Text, TouchableOpacity, StyleSheet, View } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

export function DatePickerField({
  label,
  value,
  onChange,
  minimumDate,
}: {
  label: string;
  value: Date | null;
  onChange: (d: Date) => void;
  minimumDate?: Date;
}) {
  const [show, setShow] = useState(false);
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity style={styles.field} onPress={() => setShow(true)}>
        <Text style={styles.value}>
          {value ? value.toLocaleDateString('en-IN') : 'Select date'}
        </Text>
      </TouchableOpacity>
      {show && (
        <DateTimePicker
          value={value ?? new Date()}
          mode="date"
          minimumDate={minimumDate}
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          onChange={(_e: DateTimePickerEvent, d?: Date) => {
            setShow(Platform.OS === 'ios');
            if (d) onChange(d);
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 16 },
  label: { fontSize: 13, color: '#6b7280', marginBottom: 6 },
  field: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12 },
  value: { fontSize: 15, color: '#111827' },
});
