import { useAuth } from "@/contexts/auth";
import { supabase } from "@/lib/supabase";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface UserProfile {
  name: string;
  level: string;
  gender: string;
}

export default function Profile() {
  const { user, loading: authLoading, signOut } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/auth");
    }
  }, [user, authLoading]);

  useEffect(() => {
    async function fetchProfile() {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from("user_profiles")
          .select("name, level, gender")
          .eq("id", user.id)
          .single();

        if (error) throw error;
        setProfile(data);
      } catch (err: any) {
        setError(err.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [user]);

  if (authLoading || loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
      </SafeAreaView>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Profile</Text>

      <View style={styles.profileInfo}>
        <Text style={styles.label}>Email:</Text>
        <Text style={styles.value}>{user.email}</Text>

        {profile ? (
          <>
            <Text style={styles.label}>Name:</Text>
            <Text style={styles.value}>{profile.name}</Text>

            <Text style={styles.label}>Level:</Text>
            <Text style={styles.value}>
              {profile.level.charAt(0).toUpperCase() + profile.level.slice(1)}
            </Text>

            <Text style={styles.label}>Gender:</Text>
            <Text style={styles.value}>
              {profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1)}
            </Text>
          </>
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : (
          <Text style={styles.errorText}>Profile not found</Text>
        )}
      </View>

      <TouchableOpacity style={styles.button} onPress={signOut}>
        <Text style={styles.buttonText}>Sign Out</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.secondaryButton]}
        onPress={() => router.back()}
      >
        <Text style={styles.secondaryButtonText}>Back to Home</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 30,
    color: "#333",
  },
  profileInfo: {
    backgroundColor: "#f5f5f5",
    padding: 20,
    borderRadius: 10,
    marginBottom: 30,
  },
  label: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
  },
  value: {
    fontSize: 16,
    color: "#333",
    marginBottom: 20,
  },
  errorText: {
    color: "#FF3B30",
    fontSize: 16,
    textAlign: "center",
    marginTop: 10,
  },
  button: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 15,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#007AFF",
  },
  secondaryButtonText: {
    color: "#007AFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
