import { Stack } from "expo-router";
import { AuthProvider } from "../contexts/auth";

function RootLayoutNav() {
  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
