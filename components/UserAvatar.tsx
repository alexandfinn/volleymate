import { supabase } from "@/lib/supabase";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const STORAGE_URL = "https://rhdlvwyzlqzdeabhvrsf.supabase.co/storage/v1/object/public/images";

interface UserAvatarProps {
  userId: string;
  size?: number;
  style?: any;
  showName?: boolean;
  name?: string;
  onPress?: () => void;
  disableNavigation?: boolean;
}

export default function UserAvatar({ 
  userId, 
  size = 40, 
  style, 
  showName = false, 
  name, 
  onPress,
  disableNavigation = false 
}: UserAvatarProps) {
  const router = useRouter();
  const [imageError, setImageError] = useState(false);
  const [timestamp, setTimestamp] = useState(Date.now());
  const [userName, setUserName] = useState<string | null>(name || null);
  const avatarUrl = `${STORAGE_URL}/profile-images/${userId}.jpg?t=${timestamp}`;

  // Reset error state when userId changes
  useEffect(() => {
    setImageError(false);
    setTimestamp(Date.now());
  }, [userId]);

  // Fetch user name if showName is true and name is not provided
  useEffect(() => {
    if (showName && !name) {
      async function fetchUserName() {
        const { data } = await supabase
          .from('user_profiles')
          .select('name')
          .eq('id', userId)
          .single();
        if (data?.name) {
          setUserName(data.name);
        }
      }
      fetchUserName();
    }
  }, [userId, showName, name]);

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else if (!disableNavigation) {
      router.push(`/user/${userId}`);
    }
  };

  const AvatarComponent = (
    <TouchableOpacity onPress={handlePress} disabled={!userId}>
      {imageError ? (
        <View style={[styles.placeholder, { width: size, height: size, borderRadius: size / 2 }, style]}>
          <Feather name="user" size={size * 0.5} color="#666" />
        </View>
      ) : (
        <Image
          source={{ uri: avatarUrl }}
          style={[
            styles.avatar,
            { width: size, height: size, borderRadius: size / 2 },
            style,
          ]}
          onError={() => setImageError(true)}
        />
      )}
    </TouchableOpacity>
  );

  if (showName) {
    return (
      <View style={styles.container}>
        {AvatarComponent}
        <Text style={[styles.name, { fontSize: size * 0.3 }]} numberOfLines={1}>
          {userName || 'Unknown'}
        </Text>
      </View>
    );
  }

  return AvatarComponent;
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  avatar: {
    backgroundColor: "#f0f0f0",
  },
  placeholder: {
    backgroundColor: "#f0f0f0",
    alignItems: "center",
    justifyContent: "center",
  },
  name: {
    marginTop: 4,
    color: '#444',
    textAlign: 'center',
  },
}); 