import { useAuth } from "@/contexts/auth";
import { supabase } from "@/lib/supabase";
import { Feather } from "@expo/vector-icons";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface UserProfile {
  name: string | null;
  level: string | null;
  gender: string | null;
}

const STORAGE_URL =
  "https://rhdlvwyzlqzdeabhvrsf.supabase.co/storage/v1/object/public/images";

export default function Profile() {
  const { user, loading: authLoading, signOut } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [profileImageKey, setProfileImageKey] = useState(Date.now());

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
        Alert.alert("Error", "Failed to load profile data");
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [user]);

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled) {
        await uploadImage(result.assets[0].uri);
      }
    } catch (err: any) {
      const errorMessage = err.message || "Failed to pick image";
      setError(errorMessage);
      Alert.alert("Error", errorMessage);
    }
  };

  const uploadImage = async (uri: string) => {
    if (!user) return;
    
    try {
      setUploading(true);
      
      // Resize and crop the image
      const manipResult = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 400, height: 400 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );

      // Get the image data
      const response = await fetch(manipResult.uri);
      const imageData = await response.arrayBuffer();

      // Upload to Supabase Storage
      const filePath = `profile-images/${user.id}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from("images")
        .upload(filePath, imageData, {
          upsert: true,
          contentType: "image/jpeg",
        });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      setProfileImageKey(Date.now()); // Update key to force reload
      Alert.alert("Success", "Profile picture updated successfully");
    } catch (err: any) {
      const errorMessage = err.message || "Failed to upload image";
      setError(errorMessage);
      Alert.alert("Error", errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const getAvatarUrl = () => {
    if (!user) return null;
    return `${STORAGE_URL}/profile-images/${user.id}.jpg?key=${profileImageKey}`;
  };

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

  const avatarUrl = getAvatarUrl();

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Profile</Text>

      <View style={styles.avatarContainer}>
        {avatarUrl ? (
          <Image
            key={profileImageKey}
            source={{ uri: avatarUrl }}
            style={styles.avatar}
            onError={() => {
              // If image fails to load, it will show the placeholder
              setError("Failed to load profile image");
              Alert.alert("Error", "Failed to load profile image");
            }}
          />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Feather name="user" size={40} color="#666" />
          </View>
        )}
        <TouchableOpacity
          style={styles.changePhotoButton}
          onPress={pickImage}
          disabled={uploading}
        >
          <Text style={styles.changePhotoText}>
            {uploading ? "Uploading..." : "Change Photo"}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.profileInfo}>
        <Text style={styles.label}>Email:</Text>
        <Text style={styles.value}>{user.email}</Text>

        {profile ? (
          <>
            <Text style={styles.label}>Name:</Text>
            <Text style={styles.value}>{profile.name || "Not set"}</Text>

            <Text style={styles.label}>Level:</Text>
            <Text style={styles.value}>
              {profile.level
                ? profile.level.charAt(0).toUpperCase() + profile.level.slice(1)
                : "Not set"}
            </Text>

            <Text style={styles.label}>Gender:</Text>
            <Text style={styles.value}>
              {profile.gender
                ? profile.gender.charAt(0).toUpperCase() +
                  profile.gender.slice(1)
                : "Not set"}
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
  avatarContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 10,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  changePhotoButton: {
    padding: 8,
  },
  changePhotoText: {
    color: "#007AFF",
    fontSize: 16,
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
