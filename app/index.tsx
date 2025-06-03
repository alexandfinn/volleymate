import { Link } from "expo-router";
import { Text, SafeAreaView } from "react-native";
import styled from "styled-components/native";

const Title = styled(Text)`
  font-size: 24px;
  font-weight: bold;
  color: #333333;
  margin-bottom: 20px;
`;

const StyledLink = styled(Link)`
  color: #007AFF;
  font-size: 16px;
  text-decoration: none;
`;

export default function Home() {
  return (
    <SafeAreaView>
      <Title>Welcome to VolleyMate</Title>
      <StyledLink href="/profile">Profile</StyledLink>
    </SafeAreaView>
  );
}
