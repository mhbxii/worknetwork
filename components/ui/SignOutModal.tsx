import { useAuth } from '@/store/authStore';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
    Modal,
    StyleSheet,
    View,
} from 'react-native';
import {
    Button,
    Surface,
    Text,
} from 'react-native-paper';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function SignOutModal({ visible, onClose }: Props) {
  const { signOut } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
      // Note: The signOut function should handle navigation
      onClose();
    } catch (error) {
      console.error('Error signing out:', error);
      // Handle error if needed
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <LinearGradient colors={['#1a1a2e', '#16213e']} style={styles.modal}>
            <Surface style={styles.content} elevation={3}>
              {/* Icon */}
              <View style={styles.iconContainer}>
                <MaterialCommunityIcons
                  name="logout"
                  size={48}
                  color="rgba(255,255,255,0.8)"
                />
              </View>

              {/* Title and Message */}
              <Text style={styles.title}>Sign Out</Text>
              <Text style={styles.message}>
                Are you sure you want to sign out of your account?
              </Text>

              {/* Action Buttons */}
              <View style={styles.buttonContainer}>
                <Button
                  mode="outlined"
                  onPress={onClose}
                  style={styles.cancelButton}
                  labelStyle={styles.cancelButtonLabel}
                  disabled={isSigningOut}
                >
                  Cancel
                </Button>
                <Button
                  mode="contained"
                  onPress={handleSignOut}
                  style={styles.signOutButton}
                  labelStyle={styles.signOutButtonLabel}
                  loading={isSigningOut}
                  disabled={isSigningOut}
                >
                  {isSigningOut ? 'Signing Out...' : 'Sign Out'}
                </Button>
              </View>
            </Surface>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    maxWidth: 340,
  },
  modal: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  content: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    padding: 24,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 8,
  },
  cancelButtonLabel: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 16,
    fontWeight: '600',
  },
  signOutButton: {
    flex: 1,
    backgroundColor: 'rgba(220,53,69,0.8)',
    borderRadius: 8,
  },
  signOutButtonLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});