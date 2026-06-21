import { TextInput, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import type { ReactNode } from 'react';

export function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <View style={uiStyles.field}>
      <Text style={uiStyles.label}>{label}</Text>
      {children}
      {error ? <Text style={uiStyles.error}>{error}</Text> : null}
    </View>
  );
}

export function TextField({
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  multiline = false,
}: {
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'number-pad' | 'decimal-pad';
  multiline?: boolean;
}) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor="#9ca3af"
      keyboardType={keyboardType}
      multiline={multiline}
      style={[uiStyles.input, multiline && uiStyles.inputMultiline]}
    />
  );
}

export function NumberField({
  value,
  onChange,
  placeholder,
}: {
  value?: number;
  onChange: (n: number | undefined) => void;
  placeholder?: string;
}) {
  return (
    <TextField
      value={value === undefined || value === null ? '' : String(value)}
      onChangeText={(t) => {
        const cleaned = t.replace(/[^0-9.]/g, '');
        if (cleaned === '') return onChange(undefined);
        const n = Number(cleaned);
        if (!Number.isNaN(n)) onChange(n);
      }}
      placeholder={placeholder}
      keyboardType="decimal-pad"
    />
  );
}

export function OptionRow<T extends string>({
  options,
  selected,
  onSelect,
}: {
  options: ReadonlyArray<T>;
  selected: T | '';
  onSelect: (v: T) => void;
}) {
  return (
    <View style={uiStyles.optionRow}>
      {options.map((opt) => (
        <TouchableOpacity
          key={opt}
          style={[uiStyles.optionChip, selected === opt && uiStyles.optionChipActive]}
          onPress={() => onSelect(opt)}
        >
          <Text style={[uiStyles.optionText, selected === opt && uiStyles.optionTextActive]}>
            {opt}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export const uiStyles = StyleSheet.create({
  field: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  error: { fontSize: 12, color: '#ef4444', marginTop: 4 },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#fff',
  },
  inputMultiline: { minHeight: 90, textAlignVertical: 'top' },
  optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  optionChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#fff',
  },
  optionChipActive: { borderColor: '#2563eb', backgroundColor: '#eff6ff' },
  optionText: { fontSize: 13, color: '#374151' },
  optionTextActive: { color: '#2563eb', fontWeight: '600' },
});
