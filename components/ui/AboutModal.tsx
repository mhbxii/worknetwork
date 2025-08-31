import { MaterialCommunityIcons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
    Linking,
    Modal,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import {
    IconButton,
    Surface,
    Text,
} from 'react-native-paper';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function AboutModal({ visible, onClose }: Props) {
  const appVersion = Constants.expoConfig?.version || '1.0.0';

  const handleEmailPress = async () => {
    const email = 'mohebjr999@gmail.com';
    const subject = 'About JobConnect App';
    const url = `mailto:${email}?subject=${encodeURIComponent(subject)}`;
    
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        // Fallback - copy to clipboard or show alert
        console.log('Cannot open email client');
      }
    } catch (error) {
      console.error('Error opening email:', error);
    }
  };

  const aboutSections = [
    {
      id: 'version',
      icon: 'information-outline',
      title: 'App Version',
      content: `Version ${appVersion}`,
      action: null,
    },
    {
      id: 'developer',
      icon: 'account-circle',
      title: 'Created By',
      content: 'Moheb Jr',
      action: null,
    },
    {
      id: 'contact',
      icon: 'email-outline',
      title: 'Contact Developer',
      content: 'mohebjr999@gmail.com',
      action: handleEmailPress,
    },
    {
      id: 'description',
      icon: 'briefcase-outline',
      title: 'About JobConnect',
      content: 'Your gateway to career opportunities. Connect with employers, showcase your skills, and find your dream job.',
      action: null,
    },
  ];

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
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>About</Text>
              <IconButton
                icon="close"
                iconColor="#fff"
                size={24}
                onPress={onClose}
                style={styles.closeButton}
              />
            </View>

            {/* App Logo/Icon */}
            <View style={styles.logoContainer}>
              <Surface style={styles.logoBackground} elevation={3}>
                <MaterialCommunityIcons
                  name="briefcase"
                  size={40}
                  color="#fff"
                />
              </Surface>
              <Text style={styles.appName}>JobConnect</Text>
            </View>

            {/* About Sections */}
            <View style={styles.content}>
              {aboutSections.map((section) => (
                <TouchableOpacity
                  key={section.id}
                  style={[
                    styles.aboutItem,
                    section.action && styles.aboutItemClickable,
                  ]}
                  onPress={section.action || undefined}
                  disabled={!section.action}
                  activeOpacity={section.action ? 0.7 : 1}
                >
                  <Surface style={styles.aboutItemContent} elevation={1}>
                    <View style={styles.aboutItemLeft}>
                      <MaterialCommunityIcons
                        name={section.icon as any}
                        size={24}
                        color="rgba(255,255,255,0.8)"
                        style={styles.aboutIcon}
                      />
                      <View style={styles.aboutTextContainer}>
                        <Text style={styles.aboutTitle}>{section.title}</Text>
                        <Text style={[
                          styles.aboutContent,
                          section.action && styles.aboutContentClickable,
                        ]}>
                          {section.content}
                        </Text>
                      </View>
                    </View>
                    {section.action && (
                      <MaterialCommunityIcons
                        name="open-in-new"
                        size={16}
                        color="rgba(255,255,255,0.6)"
                      />
                    )}
                  </Surface>
                </TouchableOpacity>
              ))}
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Made with ❤️ for connecting talent with opportunity
              </Text>
              <Text style={styles.copyrightText}>
                © 2024 JobConnect. All rights reserved.
              </Text>
            </View>
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
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modal: {
    borderRadius: 16,
    overflow: 'hidden',
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
  closeButton: {
    margin: 0,
  },
  logoContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  logoBackground: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  appName: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
  },
  content: {
    paddingHorizontal: 20,
  },
  aboutItem: {
    marginBottom: 12,
  },
  aboutItemClickable: {
    // Add any clickable specific styles if needed
  },
  aboutItemContent: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  aboutItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  aboutIcon: {
    marginRight: 16,
    width: 24,
  },
  aboutTextContainer: {
    flex: 1,
  },
  aboutTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  aboutContent: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    lineHeight: 20,
  },
  aboutContentClickable: {
    color: 'rgba(135,206,250,0.9)', // Light blue for clickable text
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  footerText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
  },
  copyrightText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    textAlign: 'center',
  },
});