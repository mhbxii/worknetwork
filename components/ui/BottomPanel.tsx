import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  View
} from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface BottomPanelProps {
  visible: boolean;
  onClose: () => void;
  height?: number; // optional custom height
  children: React.ReactNode;
}

export const BottomPanel = React.memo<BottomPanelProps>(({
  visible,
  onClose,
  height: propHeight, // allow custom height
  children,
}) => {
  const insets = useSafeAreaInsets(); // hook inside body
  const height = propHeight ?? Dimensions.get("window").height * 0.8 - insets.top;
  const slideAnim = useRef(new Animated.Value(height)).current; // offscreen bottom
  const backdropAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: height,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, height, slideAnim, backdropAnim]);

  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFill}>
      {/* Backdrop */}
      <Animated.View
        pointerEvents={visible ? "auto" : "none"}
        style={[
          styles.backdrop,
          {
            opacity: backdropAnim,
          },
        ]}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>
      
      {/* Panel anchored to the bottom */}
      <Animated.View
        style={[
          styles.panel,
          {
            height,
            bottom: 0,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Close Button */}
        <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={8}>
          <Text style={styles.closeBtnText}>✕</Text>
        </Pressable>
        
        {/* Content container */}
        <View style={styles.content}>{children}</View>
      </Animated.View>
    </View>
  );
});

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  panel: {
    position: "absolute",
    left: 0,
    right: 0,
    backgroundColor: "#fff", // dark surface
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 16,
  },
  closeBtn: {
    position: "absolute",
    top: 12,
    right: 16,
    zIndex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  closeBtnText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  content: {
    flex: 1,
    paddingTop: 12, // Space for close button
    paddingHorizontal: 6,
    backgroundColor: "#999",
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
});