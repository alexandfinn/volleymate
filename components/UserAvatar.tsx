import { Feather } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { Image, StyleSheet, View } from "react-native";

const STORAGE_URL = "https://rhdlvwyzlqzdeabhvrsf.supabase.co/storage/v1/object/public/images";

interface UserAvatarProps {
  userId: string;
  size?: number;
  style?: any;
}

export default function UserAvatar({ userId, size = 40, style }: UserAvatarProps) {
  const [imageError, setImageError] = useState(false);
  const [timestamp, setTimestamp] = useState(Date.now());
  const avatarUrl = `${STORAGE_URL}/profile-images/${userId}.jpg?t=${timestamp}`;

  // Reset error state when userId changes
  useEffect(() => {
    setImageError(false);
    setTimestamp(Date.now());
  }, [userId]);

  if (imageError) {
    return (
      <View style={[styles.placeholder, { width: size, height: size, borderRadius: size / 2 }, style]}>
        <Feather name="user" size={size * 0.5} color="#666" />
      </View>
    );
  }

  return (
    <Image
      source={{ uri: avatarUrl }}
      style={[
        styles.avatar,
        { width: size, height: size, borderRadius: size / 2 },
        style,
      ]}
      onError={() => setImageError(true)}
    />
  );
}

const styles = StyleSheet.create({
  avatar: {
    backgroundColor: "#f0f0f0",
  },
  placeholder: {
    backgroundColor: "#f0f0f0",
    alignItems: "center",
    justifyContent: "center",
  },
}); 