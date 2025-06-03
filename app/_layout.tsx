import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { AuthProvider, useAuth } from "../contexts/auth";
import { supabase } from "../lib/supabase";

console.log("AppStack");

setTimeout(() => {
  console.log("AppStack");
}, 5000);

function AuthStack() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="auth" />
    </Stack>
  );
}

function AppStack() {
  console.log("AppStack");
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="profile" options={{ headerTitle: "Profile" }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
    </Stack>
  );
}

function RootLayoutNav() {
  const { user, loading } = useAuth();
  const [profileLoading, setProfileLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState(false);

  console.log("Rootlayout");

  useEffect(() => {
    async function checkProfile() {
      if (user) {
        try {
          const { data, error } = await supabase
            .from("user_profiles")
            .select("id")
            .eq("id", user.id)
            .maybeSingle();

          console.log("data", data);

          if (error && error.code !== "PGRST116") throw error;
          setHasProfile(!!data);
        } catch (error) {
          console.error("Error checking profile:", error);
        } finally {
          setProfileLoading(false);
        }
      } else {
        setProfileLoading(false);
      }
    }

    checkProfile();
  }, [user]);

  // Show loading screen while checking authentication and profile
  if (loading || profileLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  // If not authenticated, show auth screens only
  if (!user) {
    return <AuthStack />;
  }

  // If authenticated but no profile, show onboarding
  if (!hasProfile) {
    return (
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="onboarding" />
      </Stack>
    );
  }

  // If authenticated and has profile, show app screens
  return <AppStack />;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
