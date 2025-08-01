// components/ui/Input.tsx
import { TextInput } from 'react-native-paper';

interface InputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address';
}

export function Input({ label, value, onChangeText, secureTextEntry, keyboardType }: InputProps) {
  return (
    <TextInput
      label={label}
      value={value}
      onChangeText={onChangeText}
      secureTextEntry={secureTextEntry}
      keyboardType={keyboardType}
      mode="outlined"
      style={{ marginBottom: 12, backgroundColor: '#fff' }}
    />
  );
}
