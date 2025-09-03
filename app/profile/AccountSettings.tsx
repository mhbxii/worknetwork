import { supabase } from '@/lib/supabase';
import { useAuth } from '@/store/authStore';
import { useMetaStore } from '@/store/useMetaStore';
import { MetaOption } from '@/types/entities';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useNavigation } from 'expo-router';
import React, { useEffect, useLayoutEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import CountryFlag from 'react-native-country-flag';
import {
  Avatar,
  Button,
  IconButton,
  Surface,
  Text,
  TextInput
} from 'react-native-paper';

export default function AccountSettings() {
  const navigation = useNavigation();
  const { user, setUser } = useAuth();
  const { countryOptions } = useMetaStore();
  
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    country: null as MetaOption | null,
  });

  // Initialize form with user data
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        country: user.country || null,
      });
    }
  }, [user]);

  // Filter countries based on search
  const filteredCountries = countryOptions.filter((country) =>
    country.name.toLowerCase().includes(countrySearch.toLowerCase())
  );

  const handleSave = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'User not found');
      return;
    }

    if (!formData.name.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }

    if (!formData.country) {
      Alert.alert('Error', 'Please select a country');
      return;
    }

    setIsSaving(true);

    try {
      // Update user in database
      const { error } = await supabase
        .from('users')
        .update({
          name: formData.name.trim(),
          country_id: formData.country.id,
        })
        .eq('id', user.id);

      if (error) {
        throw error;
      }

      // Update local user state
      setUser({
        ...user,
        name: formData.name.trim(),
        country: formData.country,
      });

      Alert.alert('Success', 'Account settings updated successfully!');
      setIsEditing(false);
    } catch (error: any) {
      console.error('Error updating account:', error);
      Alert.alert('Error', error.message || 'Failed to update account settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset form to original user data
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        country: user.country || null,
      });
    }
    setCountrySearch('');
    setIsEditing(false);
  };

  const handleProfilePicturePress = () => {
    Alert.alert(
      'Profile Picture',
      'Profile picture upload feature coming soon!',
      [{ text: 'OK' }]
    );
  };

  // Setup header controls (back + actions)
  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerStyle: {
        backgroundColor: "#1a1a2e",
        borderBottomWidth: 1,
        borderBottomColor: "rgba(255,255,255,0.06)",
      },
      headerTintColor: "#fff",
      headerTitle: "Account Settings",
      headerLeft: () => (
        <IconButton
          icon="arrow-left"
          iconColor="#fff"
          size={24}
          onPress={() => navigation.canGoBack() ? navigation.goBack() : router.back()}
        />
      ),
      headerRight: () =>
        isEditing ? (
          <React.Fragment>
            <Button
              mode="text"
              onPress={handleCancel}
              textColor="rgba(255,255,255,0.7)"
              disabled={isSaving}
              compact
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleSave}
              loading={isSaving}
              disabled={isSaving}
              style={styles.saveButton}
              compact
            >
              Save
            </Button>
          </React.Fragment>
        ) : (
          <IconButton
            icon="pencil"
            iconColor="#fff"
            size={24}
            onPress={() => setIsEditing(true)}
          />
        ),
    });
  }, [navigation, isEditing, isSaving, /* include handlers if defined outside */]);

  if (!user) {
    return (
      <LinearGradient colors={['#1a1a2e', '#16213e']} style={styles.container}>
        <SafeAreaView style={styles.container}>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#1a1a2e', '#16213e']} style={styles.container}>
      <SafeAreaView style={styles.container}>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoid}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Profile Picture Section */}
            <Surface style={styles.profileSection} elevation={2}>
              <View style={styles.profileContent}>
                <TouchableOpacity
                  onPress={handleProfilePicturePress}
                  style={styles.avatarContainer}
                  activeOpacity={0.7}
                >
                  <Avatar.Text
                    size={80}
                    label={(formData.name || 'U').charAt(0).toUpperCase()}
                    style={styles.avatar}
                    labelStyle={styles.avatarLabel}
                  />
                  <View style={styles.cameraOverlay}>
                    <MaterialCommunityIcons
                      name="camera"
                      size={20}
                      color="#fff"
                    />
                  </View>
                </TouchableOpacity>
                <View style={styles.profileInfo}>
                  <Text style={styles.profileName}>
                    {formData.name || 'No name'}
                  </Text>
                  <Text style={styles.profileEmail}>{formData.email}</Text>
                </View>
              </View>
            </Surface>

            {/* Account Information */}
            <Surface style={styles.section} elevation={1}>
              <Text style={styles.sectionTitle}>Account Information</Text>

              {/* Name Field */}
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Full Name</Text>
                {isEditing ? (
                  <TextInput
                    mode="outlined"
                    value={formData.name}
                    onChangeText={(text) =>
                      setFormData({ ...formData, name: text })
                    }
                    placeholder="Enter your full name"
                    style={styles.textInput}
                    contentStyle={styles.textInputContent}
                    outlineStyle={styles.textInputOutline}
                    placeholderTextColor="rgba(255,255,255,0.5)"
                  />
                ) : (
                  <View style={styles.displayField}>
                    <Text style={styles.displayText}>
                      {formData.name || 'Not specified'}
                    </Text>
                  </View>
                )}
              </View>

              {/* Email Field (Read-only) */}
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Email Address</Text>
                <View style={[styles.displayField, styles.readOnlyField]}>
                  <Text style={[styles.displayText, styles.readOnlyText]}>
                    {formData.email}
                  </Text>
                  <MaterialCommunityIcons
                    name="lock"
                    size={16}
                    color="rgba(255,255,255,0.4)"
                  />
                </View>
                <Text style={styles.helperText}>
                  Email cannot be changed here. Contact support if needed.
                </Text>
              </View>

              {/* Country Field */}
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Country</Text>
                {isEditing ? (
                  <>
                    <TextInput
                      mode="outlined"
                      value={countrySearch}
                      onChangeText={setCountrySearch}
                      placeholder="Search country..."
                      style={styles.textInput}
                      contentStyle={styles.textInputContent}
                      outlineStyle={styles.textInputOutline}
                      placeholderTextColor="rgba(255,255,255,0.5)"
                      left={
                        <TextInput.Icon
                          icon="magnify"
                          color="rgba(255,255,255,0.6)"
                        />
                      }
                    />
                    
                    {/* Country Options */}
                    <View style={styles.countryGrid}>
                      {filteredCountries.slice(0, 3).map((country) => (
                        <TouchableOpacity
                          key={country.id}
                          style={[
                            styles.countryOption,
                            formData.country?.id === country.id &&
                              styles.countryOptionSelected,
                          ]}
                          onPress={() => {
                            setFormData({ ...formData, country });
                            setCountrySearch('');
                          }}
                        >
                          <CountryFlag isoCode={country.name} size={20} />
                          <Text style={styles.countryName}>{country.name}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </>
                ) : (
                  <View style={styles.displayField}>
                    {formData.country ? (
                      <View style={styles.countryDisplay}>
                        <CountryFlag isoCode={formData.country.name} size={20} />
                        <Text style={styles.displayText}>
                          {formData.country.name}
                        </Text>
                      </View>
                    ) : (
                      <Text style={styles.displayText}>Not specified</Text>
                    )}
                  </View>
                )}
              </View>
            </Surface>

            {/* Account Actions */}
            <Surface style={styles.section} elevation={1}>
              <Text style={styles.sectionTitle}>Account Actions</Text>
              
              <TouchableOpacity
                style={styles.actionItem}
                onPress={() => router.push('/profile/ChangePassword')}
              >
                <View style={styles.actionLeft}>
                  <MaterialCommunityIcons
                    name="lock-reset"
                    size={24}
                    color="rgba(255,255,255,0.8)"
                  />
                  <Text style={styles.actionText}>Change Password</Text>
                </View>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={20}
                  color="rgba(255,255,255,0.6)"
                />
              </TouchableOpacity>
            </Surface>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  saveButton: {
    borderRadius: 6,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  profileSection: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
  },
  profileContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  avatarLabel: {
    color: '#fff',
    fontWeight: '600',
  },
  cameraOverlay: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 12,
    padding: 4,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  profileEmail: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
  },
  section: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  fieldLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  textInputContent: {
    color: '#fff',
  },
  textInputOutline: {
    borderColor: 'rgba(255,255,255,0.3)',
  },
  displayField: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    padding: 12,
    minHeight: 48,
    justifyContent: 'center',
  },
  displayText: {
    color: '#fff',
    fontSize: 16,
  },
  readOnlyField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  readOnlyText: {
    color: 'rgba(255,255,255,0.7)',
  },
  helperText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    marginTop: 4,
  },
  countryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  countryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    padding: 10,
    minWidth: '30%',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  countryOptionSelected: {
    backgroundColor: 'rgba(135,206,250,0.3)',
    borderColor: 'rgba(135,206,250,0.6)',
  },
  countryName: {
    color: '#fff',
    fontSize: 12,
    marginLeft: 6,
  },
  countryDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  actionText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 12,
  },
});