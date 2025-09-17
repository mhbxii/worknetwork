// SearchBar.tsx
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface SearchBarProps {
  visible: boolean;
  searchTerm: string;
  onPress: () => void;
  onClose: () => void;
  onClear: () => void;
  onChangeText: (text: string) => void;
}

export function SearchBar({
  visible,
  searchTerm,
  onPress,
  onClose,
  onClear,
  onChangeText,
}: SearchBarProps) {
  const inputRef = useRef<TextInput>(null);
  const widthAnim = useRef(new Animated.Value(0)).current;

  // Auto-focus when search bar becomes visible
  useEffect(() => {
    if (visible) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);

      // Animate input width
      Animated.timing(widthAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }).start();
    } else {
      inputRef.current?.blur();

      // Animate input width
      Animated.timing(widthAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }
  }, [visible, widthAnim]);

  if (!visible) {
    // Show search icon only
    return (
      <TouchableOpacity onPress={onPress} style={styles.searchIcon}>
        <Ionicons name="search" size={24} color="#fff" />
      </TouchableOpacity>
    );
  }

  const inputWidth = widthAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <View style={styles.searchContainer}>
      <Animated.View style={[styles.inputContainer, { width: inputWidth }]}>
        <Ionicons
          name="search"
          size={20}
          color="#999"
          style={styles.searchInputIcon}
        />
        <TextInput
          ref={inputRef}
          style={styles.searchInput}
          placeholder="Search jobs, skills, companies..."
          placeholderTextColor="#999"
          value={searchTerm}
          onChangeText={onChangeText}
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
        />
        {searchTerm.length > 0 && (
          <TouchableOpacity onPress={onClear} style={styles.clearButton}>
            <Ionicons name="close-circle" size={20} color="#999" />
          </TouchableOpacity>
        )}
      </Animated.View>
      <TouchableOpacity onPress={onClose} style={styles.backButton}>
        <Ionicons name="arrow-forward" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  searchIcon: {
    padding: 8,
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  inputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
  },
  searchInputIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: "#fff",
    fontSize: 16,
    paddingVertical: 0, // Remove default padding
  },
  clearButton: {
    marginLeft: 8,
    padding: 4,
  },
});
