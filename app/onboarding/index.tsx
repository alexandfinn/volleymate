import { router } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/auth';
import { supabase } from '@/lib/supabase';

const LEVELS = ['beginner', 'intermediate', 'advanced'];
const GENDERS = ['male', 'female', 'other'];

export default function OnboardingScreen() {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [level, setLevel] = useState('');
  const [gender, setGender] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!name || !level || !gender) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { error: updateError } = await supabase
        .from('user_profiles')
        .upsert({
          id: user?.id,
          name,
          level,
          gender,
        });

      if (updateError) throw updateError;

      // Navigate to home after successful profile creation
      router.replace('/');
    } catch (err: any) {
      setError(err.message || 'An error occurred while saving your profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Welcome to VolleyMate!</Text>
        <Text style={styles.subtitle}>Let's set up your profile</Text>
      </View>

      <View style={styles.formContainer}>
        <TextInput
          style={styles.input}
          placeholder="Your Name"
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.label}>Your Level</Text>
        <View style={styles.optionsContainer}>
          {LEVELS.map((l) => (
            <TouchableOpacity
              key={l}
              style={[
                styles.optionButton,
                level === l && styles.selectedOption,
              ]}
              onPress={() => setLevel(l)}
            >
              <Text
                style={[
                  styles.optionText,
                  level === l && styles.selectedOptionText,
                ]}
              >
                {l.charAt(0).toUpperCase() + l.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Gender</Text>
        <View style={styles.optionsContainer}>
          {GENDERS.map((g) => (
            <TouchableOpacity
              key={g}
              style={[
                styles.optionButton,
                gender === g && styles.selectedOption,
              ]}
              onPress={() => setGender(g)}
            >
              <Text
                style={[
                  styles.optionText,
                  gender === g && styles.selectedOptionText,
                ]}
              >
                {g.charAt(0).toUpperCase() + g.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Complete Profile</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  input: {
    width: '100%',
    height: 48,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 20,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#fff',
  },
  selectedOption: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  optionText: {
    fontSize: 14,
    color: '#333',
  },
  selectedOptionText: {
    color: '#fff',
  },
  errorText: {
    color: 'red',
    marginBottom: 16,
    textAlign: 'center',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 