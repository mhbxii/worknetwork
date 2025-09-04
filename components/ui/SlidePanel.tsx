import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

interface SlidePanelProps {
  visible: boolean;
  onClose: () => void;
  width?: number; // optional custom width
  children: React.ReactNode;
}

export const SlidePanel = React.memo<SlidePanelProps>(({
  visible,
  onClose,
  width = Dimensions.get("window").width * 0.95, // default leaves ~15% gap on left
  children,
}) => {
  const slideAnim = useRef(new Animated.Value(width)).current; // offscreen right
  const backdropAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: width,
          duration: 280,
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, width, slideAnim, backdropAnim]);

  // keep it mounted while animating in/out if you need smoother exit;
  // but returning null while hidden keeps DOM light — using visible flag here:
  if (!visible) return null;

  return (
    <View style={[StyleSheet.absoluteFill, { paddingTop: 14 }]}>
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

      {/* Panel anchored to the right: left edge will be screenWidth - width */}
      <Animated.View
        style={[
          styles.panel,
          {
            width,
            transform: [{ translateX: slideAnim }],
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
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  panel: {
    position: "absolute",
    top: 0,
    right: 0, // important: anchor to right so panel stops before left edge
    height: "100%",
    backgroundColor: Platform.OS === "ios" ? "#0f1724" : "#0f1724", // dark surface
    borderTopLeftRadius: 22,
    borderBottomLeftRadius: 22,
    shadowColor: "#000",
    shadowOffset: { width: -6, height: 0 }, // shadow cast to the left
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
    overflow: "hidden",
    marginTop: 14,
  },
  closeBtn: {
    position: "absolute",
    top: 14,
    right: 14,
    zIndex: 20,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 16,
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.06)",
    marginTop: 14, // avoid notch on iOS
  },
  closeBtnText: {
    color: "#fff",
    fontSize: 18,
    lineHeight: 18,
    fontWeight: "700",
  },
  content: {
    paddingTop: 60, // leave space for close button & header
    paddingHorizontal: 18,
    paddingBottom: 28,
    flex: 1,
  },
});
