import UserAvatar from '@/components/UserAvatar';
import { useAuth } from '@/contexts/auth';
import { supabase } from '@/lib/supabase';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
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

const ParticipantsRow = styled.View`
  flex-direction: row;
  align-items: center;
  padding: 12px 0 8px 0;
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

const MessageList = styled(FlatList as new () => FlatList<any>)`
  flex: 1;
  padding: 0 16px;
`;

const MessageRow = styled.View<{ isOwn: boolean }>`
  flex-direction: row;
  justify-content: ${props => (props.isOwn ? 'flex-end' : 'flex-start')};
  margin-bottom: 10px;
`;

const MessageBubble = styled.View<{ isOwn: boolean }>`
  background: ${props => (props.isOwn ? '#7b61ff' : '#f3f6fa')};
  padding: 10px 14px;
  border-radius: 18px;
  max-width: 75%;
`;

const MessageText = styled.Text<{ isOwn: boolean }>`
  color: ${props => (props.isOwn ? '#fff' : '#222')};
  font-size: 16px;
`;

const MessageMeta = styled.Text`
  font-size: 11px;
  color: #888;
  margin-top: 2px;
`;

const InputRow = styled.View`
  flex-direction: row;
  align-items: center;
  padding: 8px 16px 16px 16px;
  border-top-width: 1px;
  border-top-color: #e0e0e0;
  background: #fff;
`;

const MessageInput = styled.TextInput`
  flex: 1;
  border-radius: 20px;
  background: #f3f6fa;
  padding: 12px 16px;
  font-size: 16px;
  margin-right: 10px;
`;

const SendButton = styled.TouchableOpacity`
  padding: 8px;
`;

export default function MatchChat() {
  const { id: matchId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [participants, setParticipants] = useState<{ user_id: string; user_name: string }[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [input, setInput] = useState('');
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    async function fetchParticipants() {
      const { data: participantsData, error: participantsError } = await supabase
        .from('match_participants')
        .select('user_id')
        .eq('match_id', matchId);
      if (!participantsError && participantsData) {
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
              user_name: profile?.name || 'Unknown',
            };
          });
          setParticipants(participants);
        }
      }
    }
    async function fetchMessages() {
      setLoading(true);
      const { data, error } = await supabase
        .from('match_messages')
        .select('*')
        .eq('match_id', matchId)
        .order('sent_at', { ascending: true });
      if (!error && data) {
        setMessages(data);
      }
      setLoading(false);
    }
    fetchParticipants();
    fetchMessages();
    // Poll for new messages every 3 seconds
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [matchId]);

  async function sendMessage() {
    if (!input.trim() || !user) return;
    setSending(true);
    const { error } = await supabase.from('match_messages').insert({
      match_id: matchId,
      message: input,
      sender_id: user.id,
      sent_at: new Date().toISOString(),
    });
    if (!error) {
      setInput('');
      // Refresh messages
      const { data } = await supabase
        .from('match_messages')
        .select('*')
        .eq('match_id', matchId)
        .order('sent_at', { ascending: true });
      setMessages(data || []);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
    setSending(false);
  }

  return (
    <Container>
      <Header>
        <BackButton onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color="#222" />
        </BackButton>
        <Title>Match Chat</Title>
      </Header>
      <ParticipantsRow>
        {participants.map((p, idx) => (
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
      {loading && messages.length === 0 ? (
        <ActivityIndicator size="large" color="#7b61ff" style={{ flex: 1 }} />
      ) : (
        <MessageList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item.id}
          renderItem={({ item }) => {
            const isOwn = item.sender_id === user?.id;
            const sender = participants.find(p => p.user_id === item.sender_id);
            return (
              <MessageRow isOwn={isOwn}>
                <MessageBubble isOwn={isOwn}>
                  <MessageText isOwn={isOwn}>{item.message}</MessageText>
                  <MessageMeta>
                    {sender ? sender.user_name : 'Unknown'} · {item.sent_at ? new Date(item.sent_at).toLocaleTimeString() : ''}
                  </MessageMeta>
                </MessageBubble>
              </MessageRow>
            );
          }}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />
      )}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <InputRow>
          <MessageInput
            placeholder="Write a message"
            value={input}
            onChangeText={setInput}
            editable={!sending}
            returnKeyType="send"
            onSubmitEditing={sendMessage}
          />
          <SendButton onPress={sendMessage} disabled={sending || !input.trim()}>
            <Feather name="send" size={22} color={sending || !input.trim() ? '#ccc' : '#7b61ff'} />
          </SendButton>
        </InputRow>
      </KeyboardAvoidingView>
    </Container>
  );
} 