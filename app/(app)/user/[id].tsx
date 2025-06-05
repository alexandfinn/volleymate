import UserAvatar from "@/components/UserAvatar";
import { useAuth } from "@/contexts/auth";
import { supabase } from "@/lib/supabase";
import { Feather } from "@expo/vector-icons";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const STORAGE_URL = "https://rhdlvwyzlqzdeabhvrsf.supabase.co/storage/v1/object/public/images";

interface UserProfile {
  name: string | null;
  level: string | null;
  gender: string | null;
}

export default function UserProfileView() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [profileImageKey, setProfileImageKey] = useState(Date.now());
  const [isImageModalVisible, setIsImageModalVisible] = useState(false);
  const [imageError, setImageError] = useState(false);

  const isOwnProfile = user?.id === id;
  const avatarUrl = `${STORAGE_URL}/profile-images/${id}.jpg?t=${profileImageKey}`;

  useEffect(() => {
    async function fetchProfile() {
      try {
        const { data, error } = await supabase
          .from("user_profiles")
          .select("name, level, gender")
          .eq("id", id)
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
  }, [id]);

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

      setProfileImageKey(Date.now());
    } catch (err: any) {
      const errorMessage = err.message || "Failed to upload image";
      setError(errorMessage);
      Alert.alert("Error", errorMessage);
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Feather name="arrow-left" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.title}>Profile</Text>
        </View>
        <Text style={styles.errorText}>Profile not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Profile</Text>
      </View>

      <View style={styles.avatarContainer}>
        <UserAvatar 
          userId={id} 
          size={120} 
          key={profileImageKey}
          onPress={() => setIsImageModalVisible(true)}
          disableNavigation={true}
        />
        {isOwnProfile && (
          <TouchableOpacity
            style={styles.changePhotoButton}
            onPress={pickImage}
            disabled={uploading}
          >
            <Text style={styles.changePhotoText}>
              {uploading ? "Uploading..." : "Change Photo"}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.profileInfo}>
        {isOwnProfile && (
          <>
            <Text style={styles.label}>Email:</Text>
            <Text style={styles.value}>{user?.email}</Text>
          </>
        )}

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
      </View>

      {isOwnProfile && (
        <TouchableOpacity style={styles.button} onPress={signOut}>
          <Text style={styles.buttonText}>Sign Out</Text>
        </TouchableOpacity>
      )}

      <Modal
        visible={isImageModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsImageModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalContainer}
          activeOpacity={1}
          onPress={() => setIsImageModalVisible(false)}
        >
          <View style={styles.modalContent}>
            {imageError ? (
              <View style={styles.modalPlaceholder}>
                <Feather name="user" size={100} color="#666" />
              </View>
            ) : (
              <Image
                source={{ uri: avatarUrl }}
                style={styles.modalImage}
                onError={() => setImageError(true)}
              />
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  avatarContainer: {
    alignItems: "center",
    marginTop: 30,
    marginBottom: 30,
  },
  changePhotoButton: {
    padding: 8,
    marginTop: 10,
  },
  changePhotoText: {
    color: "#007AFF",
    fontSize: 16,
  },
  profileInfo: {
    backgroundColor: "#f5f5f5",
    padding: 20,
    margin: 20,
    borderRadius: 10,
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
    marginHorizontal: 20,
    marginBottom: 15,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').width,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  modalPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 