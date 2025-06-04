import { Database } from '@/database.types';
import { supabase } from '@/lib/supabase';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import styled from 'styled-components/native';

const Container = styled(SafeAreaView)`
  flex: 1;
  background-color: #fff;
`;

const Header = styled.View`
  flex-direction: row;
  align-items: center;
  padding: 16px 16px 0 16px;
`;

const BackButton = styled.TouchableOpacity`
  margin-right: 16px;
`;

const Title = styled.Text`
  font-size: 20px;
  font-weight: bold;
  color: #222;
`;

const MatchCard = styled.View`
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 18px 16px 14px 16px;
  margin: 20px 16px 0 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
`;

const MatchHeader = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
`;

const MatchTitle = styled.Text`
  font-size: 17px;
  font-weight: bold;
  color: #222;
`;

const MatchLevel = styled.Text`
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
`;

const ParticipantsRow = styled.View`
  flex-direction: row;
  align-items: center;
  margin-bottom: 10px;
`;

const Participant = styled.View`
  align-items: center;
  margin-right: 18px;
`;

const Avatar = styled.View`
  width: 38px;
  height: 38px;
  border-radius: 19px;
  background: #e9eef3;
  align-items: center;
  justify-content: center;
  margin-bottom: 2px;
`;

const AvatarText = styled.Text`
  color: #7a869a;
  font-size: 18px;
  font-weight: 600;
`;

const LocationText = styled.Text`
  font-size: 16px;
  color: #222;
  font-weight: 500;
`;

const AddressText = styled.Text`
  font-size: 13px;
  color: #888;
  margin-bottom: 8px;
`;

const ButtonRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  margin: 24px 16px 0 16px;
`;

const ActionButton = styled.TouchableOpacity`
  flex: 1;
  border-radius: 8px;
  padding: 14px 0;
  align-items: center;
  margin: 0 6px;
  background: #f3f6fa;
`;

const ActionButtonPrimary = styled(ActionButton)`
  background: #7b61ff;
`;

const ActionButtonText = styled.Text`
  color: #7b61ff;
  font-size: 16px;
  font-weight: 600;
`;

const ActionButtonTextPrimary = styled(ActionButtonText)`
  color: #fff;
`;

function formatDateTime(dateStr: string) {
  const date = new Date(dateStr);
  return (
    date.toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'long',
      day: '2-digit',
    }) +
    ' | ' +
    date.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
  );
}

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export default function MatchDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [match, setMatch] = useState<Database['public']['Views']['enriched_matches_with_participants']['Row'] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMatch() {
      const { data, error } = await supabase
        .from('enriched_matches_with_participants')
        .select('*')
        .eq('id', id)
        .single();
      if (error) {
        setMatch(null);
      } else {
        setMatch(data);
      }
      setLoading(false);
    }
    fetchMatch();
  }, [id]);

  if (loading) {
    return (
      <Container>
        <ActivityIndicator size="large" color="#7b61ff" style={{ flex: 1 }} />
      </Container>
    );
  }

  if (!match) {
    return (
      <Container>
        <Header>
          <BackButton onPress={() => router.back()}>
            <Feather name="arrow-left" size={24} color="#222" />
          </BackButton>
          <Title>Match not found</Title>
        </Header>
      </Container>
    );
  }

  // Prepare participants (show up to 4, fill with null for available slots)
  const participants: (string | null)[] = ((match.participants || []) as any[])
    .map((p) => p.user_name || 'Unknown')
    .slice(0, 4);
  while (participants.length < 4) participants.push(null);

  return (
    <Container>
      <Header>
        <BackButton onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color="#222" />
        </BackButton>
        <Title>Match</Title>
      </Header>
      <MatchCard>
        <MatchHeader>
          <MatchTitle>{formatDateTime(match.start_time || '')}</MatchTitle>
        </MatchHeader>
        <MatchLevel>{capitalize(match.level || 'Beginner')}</MatchLevel>
        <LocationText>{match.location_name}</LocationText>
        <AddressText>{match.address}</AddressText>
        <ParticipantsRow>
          {participants.map((name, idx) =>
            name ? (
              <Participant key={idx}>
                <Avatar>
                  <Feather name="user" size={24} color="#7a869a" />
                </Avatar>
                <AvatarText>{name}</AvatarText>
              </Participant>
            ) : (
              <Participant key={idx}>
                <Feather name="plus-circle" size={38} color="#3a4a5e" />
                <AvatarText>Available</AvatarText>
              </Participant>
            )
          )}
        </ParticipantsRow>
      </MatchCard>
      <ButtonRow>
        <ActionButton onPress={() => Share.share({ message: `Join my match: https://volleymate.app/match/${match.id}` })}>
          <ActionButtonText>Share match</ActionButtonText>
        </ActionButton>
        <ActionButtonPrimary>
          <ActionButtonTextPrimary>Join match</ActionButtonTextPrimary>
        </ActionButtonPrimary>
      </ButtonRow>
    </Container>
  );
} 