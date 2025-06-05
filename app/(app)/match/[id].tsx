import UserAvatar from '@/components/UserAvatar';
import { useAuth } from '@/contexts/auth';
import { supabase } from '@/lib/supabase';
import { Feather } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Share, View } from 'react-native';
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

const ChatCard = styled.View`
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 16px 16px 16px 16px;
  margin: 16px 16px 0 16px;
`;

const ChatLabel = styled.Text`
  font-size: 15px;
  font-weight: bold;
  color: #222;
  margin-bottom: 8px;
`;

const ChatMessagesList = styled.View`
  flex-direction: column;
  gap: 8px;
`;

const ChatMessageRow = styled.View`
  flex-direction: row;
  align-items: flex-start;
`;

const ChatAvatar = styled.View`
  width: 32px;
  height: 32px;
  border-radius: 16px;
  background: #e9eef3;
  align-items: center;
  justify-content: center;
  margin-right: 10px;
`;

const ChatMessageContent = styled.View`
  flex: 1;
`;

const ChatSender = styled.Text`
  font-size: 14px;
  color: #666;
  font-weight: 600;
`;

const ChatMessageText = styled.Text`
  font-size: 15px;
  color: #222;
`;

const ChatButton = styled.TouchableOpacity`
  border: 1.5px solid #a48fff;
  border-radius: 8px;
  padding: 7px 22px;
  align-items: center;
`;

const ChatButtonText = styled.Text`
  color: #7b61ff;
  font-size: 16px;
  font-weight: 600;
`;

const PlayersCard = styled.View`
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 16px 16px 16px 16px;
  margin: 16px 16px 0 16px;
`;

const PlayersLabel = styled.Text`
  font-size: 15px;
  font-weight: bold;
  color: #222;
  margin-bottom: 8px;
`;

const PlayersRow = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 18px;
`;

const PlayerSlot = styled.View`
  align-items: center;
  width: 60px;
`;

const PlayerName = styled.Text`
  font-size: 13px;
  color: #666;
  margin-top: 4px;
  text-align: center;
`;

function formatDateTime(start: string, end: string) {
  const startDate = new Date(start);
  const endDate = new Date(end);
  
  const dateStr = startDate.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: '2-digit',
  });

  const startTime = startDate.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const endTime = endDate.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  return `${dateStr} | ${startTime} - ${endTime}`;
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
  maximum_participants: number | null;
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
  const [lastMessages, setLastMessages] = useState<any[]>([]);
  const [lastMessageSenders, setLastMessageSenders] = useState<any[]>([]);

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

  useEffect(() => {
    async function fetchLastMessages() {
      const { data: messages } = await supabase
        .from('match_messages')
        .select('*')
        .eq('match_id', id)
        .order('sent_at', { ascending: false })
        .limit(3);
      if (messages && messages.length > 0) {
        setLastMessages(messages.reverse());
        // Fetch all sender profiles
        const senderIds = Array.from(new Set(messages.map(m => m.sender_id)));
        const { data: senderProfiles } = await supabase
          .from('user_profiles')
          .select('id, name')
          .in('id', senderIds);
        setLastMessageSenders(senderProfiles || []);
      } else {
        setLastMessages([]);
        setLastMessageSenders([]);
      }
    }
    fetchLastMessages();
  }, [id]);

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
          <MatchTitle>
            {formatDateTime(match.start_time, match.end_time)}
          </MatchTitle>
        </MatchHeader>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 12, marginTop: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Feather name="trending-up" size={18} color="#666" />
            <MatchLevel style={{ fontSize: 15 }}>{capitalize(match.level || 'Beginner')}</MatchLevel>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Feather name="users" size={18} color="#666" />
            <MatchLevel style={{ fontSize: 15 }}>Max. {match.maximum_participants || 4} players</MatchLevel>
          </View>
        </View>
      </MatchCard>
      {/* Players Card below match card */}
      {(() => {
        const maxPlayers = match.maximum_participants || 4;
        const playerSlots = [...(match.participants || [])].slice(0, maxPlayers);
        while (playerSlots.length < maxPlayers) playerSlots.push(null);
        return (
          <PlayersCard>
            <PlayersLabel>Players</PlayersLabel>
            <PlayersRow>
              {playerSlots.map((p, idx) =>
                p ? (
                  <PlayerSlot key={p.user_id}>
                    <UserAvatar userId={p.user_id} size={38} showName={false} />
                    <PlayerName numberOfLines={1}>{p.user_name}</PlayerName>
                  </PlayerSlot>
                ) : (
                  <PlayerSlot key={idx}>
                    <Feather name="plus-circle" size={38} color="#aab4c8" />
                    <PlayerName>Available</PlayerName>
                  </PlayerSlot>
                )
              )}
            </PlayersRow>
          </PlayersCard>
        );
      })()}
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
      {(() => {
        function goToChat() {
          router.push(`/match/${match.id}/chat`);
        }
        return (
          <ChatCard>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <ChatLabel>Last Messages</ChatLabel>
              <ChatButton onPress={goToChat} accessibilityLabel="Open chat">
                <ChatButtonText>Chat</ChatButtonText>
              </ChatButton>
            </View>
            <ChatMessagesList>
              {lastMessages.length === 0 ? (
                <ChatMessageRow>
                  <ChatAvatar>
                    <Feather name="user" size={18} color="#888" />
                  </ChatAvatar>
                  <ChatMessageContent>
                    <ChatSender style={{ color: '#888' }}>No messages yet</ChatSender>
                    <ChatMessageText>Say hello!</ChatMessageText>
                  </ChatMessageContent>
                </ChatMessageRow>
              ) : (
                lastMessages.map((msg, idx) => {
                  const sender = lastMessageSenders.find(s => s.id === msg.sender_id);
                  return (
                    <ChatMessageRow key={msg.id}>
                      {sender ? (
                        <UserAvatar userId={sender.id} size={32} />
                      ) : (
                        <ChatAvatar>
                          <Feather name="user" size={18} color="#888" />
                        </ChatAvatar>
                      )}
                      <ChatMessageContent>
                        <ChatSender>{sender ? sender.name : 'Unknown'}</ChatSender>
                        <ChatMessageText>{msg.message}</ChatMessageText>
                      </ChatMessageContent>
                    </ChatMessageRow>
                  );
                })
              )}
            </ChatMessagesList>
          </ChatCard>
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
    </Container>
  );
} 