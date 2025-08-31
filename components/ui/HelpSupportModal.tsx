import { supabase } from '@/lib/supabase';
import { useAuth } from '@/store/authStore';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import {
  Button,
  IconButton,
  Surface,
  Text
} from 'react-native-paper';

interface Props {
  visible: boolean;
  onClose: () => void;
}

const supportTypes = [
  { id: 'bug', label: 'Bug Report', icon: 'bug' },
  { id: 'feature', label: 'Feature Request', icon: 'lightbulb-outline' },
  { id: 'account', label: 'Account Issue', icon: 'account-alert' },
  { id: 'general', label: 'General Question', icon: 'help-circle-outline' },
  { id: 'other', label: 'Other', icon: 'dots-horizontal' },
];

export default function HelpSupportModal({ visible, onClose }: Props) {
  const { user } = useAuth();
  const [selectedType, setSelectedType] = useState<string>('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedType.trim()) {
      Alert.alert('Error', 'Please select a support type');
      return;
    }

    if (!message.trim()) {
      Alert.alert('Error', 'Please enter your message');
      return;
    }

    if (!user?.id) {
      Alert.alert('Error', 'User not found. Please try signing in again.');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from('support_tickets').insert({
        reporter_id: user.id,
        content: message.trim(),
        type: selectedType,
        state: 'unread',
      });

      if (error) {
        throw error;
      }

      Alert.alert(
        'Success',
        'Your support request has been submitted. We\'ll get back to you soon!',
        [
          {
            text: 'OK',
            onPress: () => {
              setMessage('');
              setSelectedType('');
              onClose();
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Error submitting support ticket:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to submit support request. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setMessage('');
      setSelectedType('');
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <LinearGradient colors={['#1a1a2e', '#16213e']} style={styles.container}>
          <SafeAreaView style={styles.safeArea}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Help & Support</Text>
              <IconButton
                icon="close"
                iconColor="#fff"
                size={24}
                onPress={handleClose}
                disabled={isSubmitting}
              />
            </View>

            <ScrollView 
              style={styles.content}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Support Type Selection */}
              <Surface style={styles.section} elevation={1}>
                <Text style={styles.sectionTitle}>What can we help you with?</Text>
                <View style={styles.typeGrid}>
                  {supportTypes.map((type) => (
                    <TouchableOpacity
                      key={type.id}
                      style={[
                        styles.typeOption,
                        selectedType === type.id && styles.typeOptionSelected,
                      ]}
                      onPress={() => setSelectedType(type.id)}
                      disabled={isSubmitting}
                      activeOpacity={0.7}
                    >
                      <MaterialCommunityIcons
                        name={type.icon as any}
                        size={24}
                        color={selectedType === type.id ? '#1a1a2e' : '#fff'}
                        style={styles.typeIcon}
                      />
                      <Text
                        style={[
                          styles.typeLabel,
                          selectedType === type.id && styles.typeLabelSelected,
                        ]}
                      >
                        {type.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </Surface>

              {/* Message Input */}
              <Surface style={styles.section} elevation={1}>
                <Text style={styles.sectionTitle}>Describe your issue</Text>
                <TextInput
                  style={styles.messageInput}
                  placeholder="Tell us about your issue or question..."
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  value={message}
                  onChangeText={setMessage}
                  multiline
                  numberOfLines={6}
                  textAlignVertical="top"
                  editable={!isSubmitting}
                />
                <Text style={styles.characterCount}>
                  {message.length}/500
                </Text>
              </Surface>

              {/* Contact Info */}
              <Surface style={styles.section} elevation={1}>
                <View style={styles.contactInfo}>
                  <MaterialCommunityIcons
                    name="information-outline"
                    size={20}
                    color="rgba(255,255,255,0.7)"
                    style={styles.infoIcon}
                  />
                  <Text style={styles.contactText}>
                    We'll respond to your request as soon as possible. For urgent
                    issues, you can also email us directly.
                  </Text>
                </View>
              </Surface>
            </ScrollView>

            {/* Submit Button */}
            <View style={styles.footer}>
              <Button
                mode="contained"
                onPress={handleSubmit}
                disabled={isSubmitting || !selectedType || !message.trim()}
                style={styles.submitButton}
                contentStyle={styles.submitButtonContent}
                loading={isSubmitting}
              >
                {isSubmitting ? 'Sending...' : 'Send Message'}
              </Button>
            </View>
          </SafeAreaView>
        </LinearGradient>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  container: {
    flex: 1,
    marginTop: 60,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  section: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    minWidth: '45%',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  typeOptionSelected: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderColor: '#fff',
  },
  typeIcon: {
    marginRight: 8,
  },
  typeLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  typeLabelSelected: {
    color: '#1a1a2e',
    fontWeight: '600',
  },
  messageInput: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    color: '#fff',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  characterCount: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    textAlign: 'right',
    marginTop: 4,
  },
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  contactText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  submitButton: {
    borderRadius: 8,
  },
  submitButtonContent: {
    paddingVertical: 4,
  },
});