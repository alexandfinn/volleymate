import { Link, router } from "expo-router";
import React, { useEffect } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import styled from "styled-components/native";
import { useAuth } from "@/contexts/auth";

const Container = styled(SafeAreaView)`
  flex: 1;
  padding: 20px;
  background-color: #fff;
`;

const Title = styled(Text)`
  font-size: 24px;
  font-weight: bold;
  color: #333333;
  margin-bottom: 20px;
`;

const UserInfo = styled(View)`
  margin-vertical: 20px;
  padding: 15px;
  border-radius: 8px;
  background-color: #f0f0f0;
`;

const UserEmail = styled(Text)`
  font-size: 16px;
  color: #333;
  margin-bottom: 10px;
`;

const Button = styled(TouchableOpacity)`
  padding: 12px 20px;
  background-color: #007AFF;
  border-radius: 8px;
  align-items: center;
  margin-top: 10px;
`;

const ButtonText = styled(Text)`
  color: #fff;
  font-size: 16px;
  font-weight: 600;
`;

export default function Home() {
  const { user, loading, signOut } = useAuth();

  // Handle redirect in useEffect, not during render
  useEffect(() => {
    if (!loading && !user) {
      router.replace('/auth');
    }
  }, [user, loading]);

  if (loading) {
    return (
      <Container>
        <ActivityIndicator size="large" color="#007AFF" />
      </Container>
    );
  }

  // Return a loading state or null instead of navigating directly
  if (!user) {
    return null;
  }

  return (
    <Container>
      <Title>Welcome to VolleyMate</Title>
      
      <UserInfo>
        <UserEmail>Logged in as: {user.email}</UserEmail>
        <Button onPress={signOut}>
          <ButtonText>Sign Out</ButtonText>
        </Button>
      </UserInfo>
      
      <Link href="/profile" style={{ color: '#007AFF', marginTop: 20 }}>
        Go to Profile
      </Link>
    </Container>
  );
}
