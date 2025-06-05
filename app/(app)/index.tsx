import UserAvatar from "@/components/UserAvatar";
import { useAuth } from "@/contexts/auth";
import { supabase } from "@/lib/supabase";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import styled from "styled-components/native";

const Container = styled(SafeAreaView)`
  flex: 1;
  padding: 20px;
  background-color: #fff;
`;

const SectionTitle = styled(Text)`
  font-size: 20px;
  font-weight: bold;
  color: #222;
  margin-bottom: 2px;
`;

const SectionSubtitle = styled(Text)`
  font-size: 15px;
  color: #666;
  margin-bottom: 18px;
`;

const MatchCard = styled(TouchableOpacity)<{ isJoined?: boolean }>`
  background: #fff;
  border: 1.5px solid ${props => props.isJoined ? '#7b61ff' : '#e0e0e0'};
  border-radius: 12px;
  padding: 18px 16px 14px 16px;
  margin-bottom: 18px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
`;

const MatchHeader = styled(View)`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
`;

const MatchTitle = styled(Text)`
  font-size: 17px;
  font-weight: bold;
  color: #222;
`;

const MatchLevel = styled(Text)`
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
`;

const ParticipantsRow = styled(View)`
  flex-direction: row;
  align-items: center;
  margin-bottom: 10px;
`;

const Participant = styled(View)`
  align-items: center;
  margin-right: 18px;
`;

const Avatar = styled(View)`
  width: 38px;
  height: 38px;
  border-radius: 19px;
  background: #e9eef3;
  align-items: center;
  justify-content: center;
  margin-bottom: 2px;
`;

const AvatarText = styled(Text)`
  color: #7a869a;
  font-size: 18px;
  font-weight: 600;
`;

const LocationText = styled(Text)`
  font-size: 16px;
  color: #222;
  font-weight: 500;
`;

const AddressText = styled(Text)`
  font-size: 13px;
  color: #888;
  margin-bottom: 8px;
`;

const JoinButton = styled(TouchableOpacity)`
  border: 1.5px solid #a48fff;
  border-radius: 8px;
  padding: 7px 22px;
  align-items: center;
  margin-top: 6px;
  align-self: flex-end;
`;

const JoinButtonText = styled(Text)`
  color: #7b61ff;
  font-size: 16px;
  font-weight: 600;
`;

const JoinedText = styled(Text)`
  color: #7b61ff;
  font-size: 16px;
  font-weight: 600;
  margin-top: 6px;
  align-self: flex-end;
`;

const ProfileButtonRow = styled(View)`
  flex-direction: row;
  justify-content: flex-end;
  align-items: center;
  margin-bottom: 8px;
`;

const ProfileButton = styled(TouchableOpacity)`
  padding: 8px;
`;

const FloatingButton = styled(TouchableOpacity)`
  position: absolute;
  bottom: 30px;
  right: 30px;
  width: 60px;
  height: 60px;
  border-radius: 30px;
  background-color: #7b61ff;
  align-items: center;
  justify-content: center;
  elevation: 5;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.25;
  shadow-radius: 3.84px;
`;

const ScrollContainer = styled(ScrollView)`
  flex: 1;
`;

// Type definitions for match and participant
interface Participant {
  user_id: string;
  user_name: string | null;
}

interface Match {
  id: string;
  start_time: string;
  level: string | null;
  location_name: string | null;
  location_address: string | null;
  participants: Participant[];
}

function formatDateTime(dateStr: string) {
  const date = new Date(dateStr);
  return (
    date.toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "2-digit",
    }) +
    " | " +
    date.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
  );
}

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export default function Home() {
  const { user, loading, signOut } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/auth");
    }
  }, [user, loading]);

  useFocusEffect(
    React.useCallback(() => {
      async function fetchMatches() {
        setLoadingMatches(true);
        // Use dot notation to mimic the SQL left join
        const { data, error } = await supabase
          .from("enriched_matches_with_participants")
          .select("*")
          .gte("start_time", new Date().toISOString())
          .order("start_time", { ascending: true });
        if (error || !data) {
          setMatches([]);
        } else {
          // Transform the data to match our Match interface
          const transformedMatches: Match[] = data.map(match => ({
            id: match.id || '',
            start_time: match.start_time || '',
            level: match.level,
            location_name: match.location_name,
            location_address: match.location_address,
            participants: (match.participants as unknown as Participant[]) || []
          }));
          setMatches(transformedMatches);
        }
        setLoadingMatches(false);
      }
      fetchMatches();
    }, [])
  );

  if (loading) {
    return (
      <Container>
        <ActivityIndicator size="large" color="#007AFF" />
      </Container>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <Container>
      <ProfileButtonRow>
        <ProfileButton onPress={() => router.push("/profile")}>
          <UserAvatar key={user?.id} userId={user?.id || ''} size={32} />
        </ProfileButton>
      </ProfileButtonRow>
      <ScrollContainer contentContainerStyle={{ paddingBottom: 100 }}>
        <SectionTitle>Upcoming Matches</SectionTitle>
        <SectionSubtitle>Play some volley ball, mate!</SectionSubtitle>
        {loadingMatches ? (
          <ActivityIndicator
            size="large"
            color="#007AFF"
            style={{ marginTop: 30 }}
          />
        ) : matches.length > 0 ? (
          matches
            .sort((a, b) => {
              // Check if current user is a participant in each match
              const aIsJoined = (a.participants || []).some((p: Participant) => p.user_id === user?.id);
              const bIsJoined = (b.participants || []).some((p: Participant) => p.user_id === user?.id);
              
              // If one is joined and the other isn't, put the joined one first
              if (aIsJoined && !bIsJoined) return -1;
              if (!aIsJoined && bIsJoined) return 1;
              
              // If both are joined or both are not joined, sort by start time
              return new Date(a.start_time || '').getTime() - new Date(b.start_time || '').getTime();
            })
            .map((match) => {
              // Show up to 4 participants, fill with 'Available' if less
              const participants: (string | null)[] = (
                (match.participants || []) as unknown as Participant[]
              )
                .map((p: Participant) => p.user_name || "Unknown")
                .slice(0, 4);
              while (participants.length < 4) participants.push(null);
              
              const isJoined = (match.participants || []).some((p: Participant) => p.user_id === user?.id);
              
              return (
                <MatchCard 
                  key={match.id}
                  onPress={() => router.push(`/match/${match.id}`)}
                  isJoined={isJoined}
                >
                  <MatchHeader>
                    <MatchTitle>
                      {formatDateTime(match.start_time || "")}
                    </MatchTitle>
                  </MatchHeader>
                  <MatchLevel>{capitalize(match.level || "Beginner")}</MatchLevel>
                  <ParticipantsRow>
                    {participants.map((name: string | null, idx: number) =>
                      name ? (
                        <Participant key={idx}>
                          <UserAvatar 
                            userId={(match.participants || [])[idx]?.user_id || ''} 
                            size={38}
                          />
                          <Text
                            style={{ fontSize: 13, color: "#444", marginTop: 2 }}
                          >
                            {name}
                          </Text>
                        </Participant>
                      ) : (
                        <Participant key={idx}>
                          <Feather name="plus-circle" size={38} color="#3a4a5e" />
                        </Participant>
                      )
                    )}
                  </ParticipantsRow>
                  <LocationText>{match.location_name}</LocationText>
                  <AddressText>{match.location_address}</AddressText>
                  {isJoined ? (
                    <JoinedText>Joined Match</JoinedText>
                  ) : (
                    <JoinButton onPress={() => router.push(`/match/${match.id}`)}>
                      <JoinButtonText>Join Match</JoinButtonText>
                    </JoinButton>
                  )}
                </MatchCard>
              );
            })
        ) : (
          <Text style={{ textAlign: "center", marginTop: 30, color: "#666" }}>
            No upcoming matches found
          </Text>
        )}
      </ScrollContainer>
      <FloatingButton onPress={() => router.push("/create-match")}>
        <Feather name="plus" size={30} color="#fff" />
      </FloatingButton>
    </Container>
  );
}
