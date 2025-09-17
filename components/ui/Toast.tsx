// components/ui/Toast.tsx
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface ToastProps {
  message: string;
  type: "success" | "error";
  visible: boolean;
  onHide: () => void;
}

// Reusable Toast Component
export const Toast: React.FC<ToastProps> = ({ message, type, visible, onHide }) => {
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        onHide();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [visible, onHide]);

  if (!visible) return null;

  return (
    <View
      style={[
        styles.toast,
        type === "success" ? styles.toastSuccess : styles.toastError,
      ]}
    >
      <MaterialCommunityIcons
        name={type === "success" ? "check-circle" : "alert-circle"}
        size={16}
        color="#fff"
      />
      <Text style={styles.toastText}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    zIndex: 1000,
    elevation: 1000,
    gap: 8,
  },
  toastSuccess: {
    backgroundColor: 'rgba(34, 197, 94, 0.9)',
  },
  toastError: {
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
  },
  toastText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
});