import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/auth";
import { ActivityIndicator, Text, View } from "react-native";
import { Redirect, Stack } from "expo-router";

export default function Layout() {
  const { user, loading } = useAuth();
  const [profileLoading, setProfileLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState(false);

  useEffect(() => {
    async function checkProfile() {
      if (loading) {
        return;
      }

      if (!user) {
        setProfileLoading(false);
        return;
      }

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
    }

    checkProfile();
  }, [loading, user]);

  // Show loading screen while checking authentication and profile
  if (loading || profileLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/auth" />;
  }

  console.log(
    "hasProfile",
    hasProfile,
    "user",
    Boolean(user),
    "profileLoading",
    profileLoading
  );
  if (user && !hasProfile) {
    return <Redirect href="/onboarding" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
