import UserAvatar from '@/components/UserAvatar';
import { useAuth } from '@/contexts/auth';
import { supabase } from '@/lib/supabase';
import { Feather } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import styled from 'styled-components/native';

const Container = styled(SafeAreaView)`
  flex: 1;
  background-color: #fff;
`;

const Header = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 16px 16px 0 16px;
`;

const HeaderLeft = styled.View`
  flex-direction: row;
  align-items: center;
`;

const BackButton = styled.TouchableOpacity`
  margin-right: 16px;
`;

const Title = styled.Text`
  font-size: 20px;
  font-weight: bold;
  color: #222;
`;

const DeleteButton = styled.TouchableOpacity`
  padding: 8px;
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

const LocationCard = styled.TouchableOpacity`
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 16px 16px 16px 16px;
  margin: 16px 16px 0 16px;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
`;

const LocationInfo = styled.View`
  flex: 1;
`;

const LocationIconButton = styled.TouchableOpacity`
  padding: 8px;
  border-radius: 20px;
  background: #f3f6fa;
  margin-left: 12px;
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

interface MatchWithLocation {
  id: string;
  start_time: string;
  end_time: string;
  level: string | null;
  owner_id: string | null;
  location: {
    id: number;
    name: string | null;
    address: string | null;
    city: string | null;
  } | null;
  participants: Array<{
    user_id: string;
    user_name: string;
  }>;
}

export default function MatchDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [match, setMatch] = useState<MatchWithLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [isParticipant, setIsParticipant] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    async function fetchMatch() {
      const { data, error } = await supabase
        .from('matches')
        .select(`
          *,
          location:locations(*)
        `)
        .eq('id', id)
        .single();

      if (error) {
        setMatch(null);
      } else {
        // Fetch participants separately
        const { data: participantsData, error: participantsError } = await supabase
          .from('match_participants')
          .select('user_id')
          .eq('match_id', id);

        if (!participantsError && participantsData) {
          // Fetch user profiles for participants
          const userIds = participantsData.map(p => p.user_id);
          const { data: profilesData, error: profilesError } = await supabase
            .from('user_profiles')
            .select('id, name')
            .in('id', userIds);

          if (!profilesError && profilesData) {
            const participants = participantsData.map(p => {
              const profile = profilesData.find(prof => prof.id === p.user_id);
              return {
                user_id: p.user_id,
                user_name: profile?.name || 'Unknown'
              };
            });
            setMatch({ ...data, participants });
            setIsParticipant(participants.some(p => p.user_id === user?.id));
            setIsOwner(data.owner_id === user?.id);
          }
        }
      }
      setLoading(false);
    }
    fetchMatch();
  }, [id, user?.id]);

  const joinMatch = async () => {
    if (!user || !match) return;
    
    setJoining(true);
    try {
      const { error } = await supabase
        .from('match_participants')
        .insert({
          match_id: match.id,
          user_id: user.id,
          joined_at: new Date().toISOString(),
        });

      if (error) throw error;

      // Refresh match data
      const { data: participantsData, error: participantsError } = await supabase
        .from('match_participants')
        .select('user_id')
        .eq('match_id', id);

      if (!participantsError && participantsData) {
        // Fetch user profiles for participants
        const userIds = participantsData.map(p => p.user_id);
        const { data: profilesData, error: profilesError } = await supabase
          .from('user_profiles')
          .select('id, name')
          .in('id', userIds);

        if (!profilesError && profilesData) {
          const participants = participantsData.map(p => {
            const profile = profilesData.find(prof => prof.id === p.user_id);
            return {
              user_id: p.user_id,
              user_name: profile?.name || 'Unknown'
            };
          });
          setMatch(prev => prev ? { ...prev, participants } : null);
          setIsParticipant(true);
        }
      }
    } catch (error) {
      console.error('Error joining match:', error);
    } finally {
      setJoining(false);
    }
  };

  const leaveMatch = async () => {
    if (!user || !match) return;
    
    setJoining(true);
    try {
      const { error } = await supabase
        .from('match_participants')
        .delete()
        .eq('match_id', match.id)
        .eq('user_id', user.id);

      if (error) throw error;

      // Refresh match data
      const { data: participantsData, error: participantsError } = await supabase
        .from('match_participants')
        .select('user_id')
        .eq('match_id', id);

      if (!participantsError && participantsData) {
        // Fetch user profiles for participants
        const userIds = participantsData.map(p => p.user_id);
        const { data: profilesData, error: profilesError } = await supabase
          .from('user_profiles')
          .select('id, name')
          .in('id', userIds);

        if (!profilesError && profilesData) {
          const participants = participantsData.map(p => {
            const profile = profilesData.find(prof => prof.id === p.user_id);
            return {
              user_id: p.user_id,
              user_name: profile?.name || 'Unknown'
            };
          });
          setMatch(prev => prev ? { ...prev, participants } : null);
          setIsParticipant(false);
        }
      }
    } catch (error) {
      console.error('Error leaving match:', error);
    } finally {
      setJoining(false);
    }
  };

  const deleteMatch = async () => {
    if (!match) return;

    Alert.alert(
      "Delete Match",
      "Are you sure you want to delete this match? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              // Delete all participants first (due to foreign key constraints)
              const { error: participantsError } = await supabase
                .from('match_participants')
                .delete()
                .eq('match_id', match.id);

              if (participantsError) throw participantsError;

              // Delete all messages
              const { error: messagesError } = await supabase
                .from('match_messages')
                .delete()
                .eq('match_id', match.id);

              if (messagesError) throw messagesError;

              // Finally delete the match
              const { error: matchError } = await supabase
                .from('matches')
                .delete()
                .eq('id', match.id);

              if (matchError) throw matchError;

              router.replace('/');
            } catch (error) {
              console.error('Error deleting match:', error);
              Alert.alert('Error', 'Failed to delete match. Please try again.');
            }
          }
        }
      ]
    );
  };

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
          <HeaderLeft>
            <BackButton onPress={() => router.back()}>
              <Feather name="arrow-left" size={24} color="#222" />
            </BackButton>
            <Title>Match not found</Title>
          </HeaderLeft>
        </Header>
      </Container>
    );
  }

  // Prepare participants (show up to 4, fill with null for available slots)
  const participants: (string | null)[] = (match.participants || [])
    .map((p) => p.user_name)
    .slice(0, 4);
  while (participants.length < 4) participants.push(null);

  return (
    <Container>
      <Header>
        <HeaderLeft>
          <BackButton onPress={() => router.back()}>
            <Feather name="arrow-left" size={24} color="#222" />
          </BackButton>
          <Title>Match</Title>
        </HeaderLeft>
        {isOwner && (
          <DeleteButton onPress={deleteMatch}>
            <Feather name="trash-2" size={20} color="#ff3b30" />
          </DeleteButton>
        )}
      </Header>
      <MatchCard>
        <MatchHeader>
          <MatchTitle>{formatDateTime(match.start_time)}</MatchTitle>
        </MatchHeader>
        <MatchLevel>{capitalize(match.level || 'Beginner')}</MatchLevel>
        <ParticipantsRow>
          {match.participants.map((p) => (
            <Participant key={p.user_id}>
              <UserAvatar 
                userId={p.user_id} 
                size={38} 
                showName={true}
                name={p.user_name}
              />
            </Participant>
          ))}
        </ParticipantsRow>
      </MatchCard>
      {match.location?.address && (() => {
        function openInMaps() {
          const query = encodeURIComponent(`${match.location?.name || ''} ${match.location?.address || ''}`);
          const url = Platform.select({
            ios: `http://maps.apple.com/?q=${query}`,
            android: `geo:0,0?q=${query}`,
            default: `https://www.google.com/maps/search/?api=1&query=${query}`,
          });
          Linking.openURL(url!);
        }
        return (
          <LocationCard onPress={openInMaps} accessibilityRole="button" accessibilityLabel="Open location in Maps">
            <LocationInfo>
              <LocationText>{match.location?.name}</LocationText>
              <AddressText>{match.location?.address}</AddressText>
            </LocationInfo>
            <LocationIconButton pointerEvents="none">
              <Feather name="map-pin" size={22} color="#7b61ff" />
            </LocationIconButton>
          </LocationCard>
        );
      })()}
      <ButtonRow>
        <ActionButton onPress={() => Share.share({ message: `Join my match: https://volleymate.app/match/${match.id}` })}>
          <ActionButtonText>Share match</ActionButtonText>
        </ActionButton>
        {isParticipant ? (
          <ActionButtonPrimary onPress={leaveMatch} disabled={joining}>
            {joining ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <ActionButtonTextPrimary>Leave match</ActionButtonTextPrimary>
            )}
          </ActionButtonPrimary>
        ) : (
          <ActionButtonPrimary onPress={joinMatch} disabled={joining}>
            {joining ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <ActionButtonTextPrimary>Join match</ActionButtonTextPrimary>
            )}
          </ActionButtonPrimary>
        )}
      </ButtonRow>
      {isParticipant && (
        <ActionButton
          style={{ marginHorizontal: 16, marginTop: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 8 }}
          onPress={() => router.push(`/match/${match.id}/chat`)}
        >
          <Feather name="message-circle" size={18} color="#7b61ff" style={{ marginRight: 6 }} />
          <ActionButtonText style={{ fontSize: 15 }}>Open Match Chat</ActionButtonText>
        </ActionButton>
      )}
    </Container>
  );
} 