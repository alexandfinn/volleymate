import { Stack } from "expo-router";
import { AuthProvider } from "../contexts/auth";
import { NotificationsProvider } from "../contexts/NotificationsContext";
import { OnboardingProvider } from "../contexts/onboarding";

function RootLayoutNav() {
  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <OnboardingProvider>
        <NotificationsProvider>
          <RootLayoutNav />
        </NotificationsProvider>
      </OnboardingProvider>
    </AuthProvider>
  );
}