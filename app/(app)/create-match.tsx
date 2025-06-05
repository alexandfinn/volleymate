import { useAuth } from "@/contexts/auth";
import { supabase } from "@/lib/supabase";
import { Feather } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import styled from "styled-components/native";

const Container = styled(SafeAreaView)`
  flex: 1;
  background-color: #fff;
`;

const Header = styled(View)`
  flex-direction: row;
  align-items: center;
  padding: 16px;
  border-bottom-width: 1px;
  border-bottom-color: #e0e0e0;
`;

const BackButton = styled(TouchableOpacity)`
  padding: 8px;
`;

const HeaderTitle = styled(Text)`
  font-size: 20px;
  font-weight: bold;
  margin-left: 16px;
`;

const FormContainer = styled(ScrollView)`
  padding: 20px;
`;

const FormGroup = styled(View)`
  margin-bottom: 20px;
`;

const Label = styled(Text)`
  font-size: 16px;
  font-weight: 500;
  color: #333;
  margin-bottom: 8px;
`;

const Input = styled(TextInput)`
  border-width: 1px;
  border-color: #e0e0e0;
  border-radius: 8px;
  padding: 12px;
  font-size: 16px;
`;

const LevelSelector = styled(View)`
  flex-direction: row;
  flex-wrap: wrap;
  gap: 10px;
`;

const LevelButton = styled(TouchableOpacity)<{ selected: boolean }>`
  padding: 10px 20px;
  border-radius: 8px;
  background-color: ${(props) => (props.selected ? "#7b61ff" : "#f3f6fa")};
`;

const LevelButtonText = styled(Text)<{ selected: boolean }>`
  color: ${(props) => (props.selected ? "#fff" : "#333")};
  font-weight: 500;
`;

const CreateButton = styled(TouchableOpacity)`
  background-color: #7b61ff;
  padding: 16px;
  border-radius: 8px;
  align-items: center;
  margin-top: 20px;
`;

const CreateButtonText = styled(Text)`
  color: #fff;
  font-size: 18px;
  font-weight: 600;
`;

const DateTimeButton = styled(TouchableOpacity)`
  border-width: 1px;
  border-color: #e0e0e0;
  border-radius: 8px;
  padding: 12px;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`;

const DateTimeText = styled(Text)`
  font-size: 16px;
  color: #333;
`;

const LocationButton = styled(TouchableOpacity)`
  border-width: 1px;
  border-color: #e0e0e0;
  border-radius: 8px;
  padding: 12px;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`;

const LocationText = styled(Text)`
  font-size: 16px;
  color: #333;
`;

const LocationAddress = styled(Text)`
  font-size: 14px;
  color: #666;
  margin-top: 4px;
`;

const LocationInfo = styled(View)`
  flex: 1;
`;

const levels = ["Beginner", "Intermediate", "Advanced"];

interface Location {
  id: number;
  name: string | null;
  address: string | null;
  city: string | null;
}

// Helper function to round time to nearest 15 minutes
function roundToNearest15Minutes(date: Date): Date {
  const minutes = date.getMinutes();
  const roundedMinutes = Math.round(minutes / 15) * 15;
  const newDate = new Date(date);
  newDate.setMinutes(roundedMinutes);
  newDate.setSeconds(0);
  newDate.setMilliseconds(0);
  return newDate;
}

export default function CreateMatch() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [locations, setLocations] = useState<Location[]>([]);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [formData, setFormData] = useState({
    level: "Beginner",
    location_id: null as number | null,
    start_time: new Date(),
    end_time: new Date(new Date().getTime() + 2 * 60 * 60 * 1000), // Default to 2 hours later
  });

  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  useEffect(() => {
    async function fetchLocations() {
      const { data, error } = await supabase
        .from("locations")
        .select("*")
        .order("name");
      
      if (error) {
        console.error("Error fetching locations:", error);
        return;
      }
      
      setLocations(data || []);
    }
    
    fetchLocations();
  }, []);

  const handleCreateMatch = async () => {
    if (!user || !formData.location_id) return;
    
    setLoading(true);
    try {
      const { data: match, error: matchError } = await supabase
        .from("matches")
        .insert({
          level: formData.level,
          location: formData.location_id,
          start_time: formData.start_time.toISOString(),
          end_time: formData.end_time.toISOString(),
          owner_id: user.id,
        })
        .select()
        .single();

      if (matchError) throw matchError;

      // Add creator as participant
      const { error: participantError } = await supabase
        .from("match_participants")
        .insert({
          match_id: match.id,
          user_id: user.id,
          joined_at: new Date().toISOString(),
        });

      if (participantError) throw participantError;

      router.replace("/");
    } catch (error) {
      Alert.alert("Error", "Failed to create match. Please try again.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (date: Date) => {
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const selectedLocation = locations.find(loc => loc.id === formData.location_id);

  return (
    <Container>
      <Header>
        <BackButton onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color="#333" />
        </BackButton>
        <HeaderTitle>Create New Match</HeaderTitle>
      </Header>

      <FormContainer>
        <FormGroup>
          <Label>Level</Label>
          <LevelSelector>
            {levels.map((level) => (
              <LevelButton
                key={level}
                selected={formData.level === level}
                onPress={() => setFormData({ ...formData, level })}
              >
                <LevelButtonText selected={formData.level === level}>
                  {level}
                </LevelButtonText>
              </LevelButton>
            ))}
          </LevelSelector>
        </FormGroup>

        <FormGroup>
          <Label>Location</Label>
          <LocationButton onPress={() => setShowLocationPicker(true)}>
            {selectedLocation ? (
              <LocationInfo>
                <LocationText>{selectedLocation.name}</LocationText>
                <LocationAddress>{selectedLocation.address}</LocationAddress>
              </LocationInfo>
            ) : (
              <LocationText>Select a location</LocationText>
            )}
            <Feather name="chevron-down" size={20} color="#666" />
          </LocationButton>
          {showLocationPicker && (
            <View style={{ marginTop: 8, borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 8 }}>
              {locations.map((location) => (
                <TouchableOpacity
                  key={location.id}
                  style={{
                    padding: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: '#e0e0e0',
                    backgroundColor: location.id === formData.location_id ? '#f3f6fa' : '#fff',
                  }}
                  onPress={() => {
                    setFormData({ ...formData, location_id: location.id });
                    setShowLocationPicker(false);
                  }}
                >
                  <Text style={{ fontSize: 16, color: '#333' }}>{location.name}</Text>
                  <Text style={{ fontSize: 14, color: '#666', marginTop: 4 }}>
                    {location.address}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </FormGroup>

        <FormGroup>
          <Label>Start Time</Label>
          <DateTimeButton onPress={() => setShowStartPicker(true)}>
            <DateTimeText>{formatDateTime(formData.start_time)}</DateTimeText>
            <Feather name="calendar" size={20} color="#666" />
          </DateTimeButton>
          {showStartPicker && (
            <DateTimePicker
              value={formData.start_time}
              mode="datetime"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              minuteInterval={15}
              onChange={(event, selectedDate) => {
                setShowStartPicker(false);
                if (selectedDate) {
                  if (Platform.OS === 'android') {
                    // For Android, round to nearest 15 minutes
                    const minutes = selectedDate.getMinutes();
                    const roundedMinutes = Math.round(minutes / 15) * 15;
                    selectedDate.setMinutes(roundedMinutes);
                    selectedDate.setSeconds(0);
                    selectedDate.setMilliseconds(0);
                  }
                  setFormData({ ...formData, start_time: selectedDate });
                  // Update end time to be 2 hours after start time
                  setFormData(prev => ({
                    ...prev,
                    end_time: new Date(selectedDate.getTime() + 2 * 60 * 60 * 1000)
                  }));
                }
              }}
            />
          )}
        </FormGroup>

        <FormGroup>
          <Label>End Time</Label>
          <DateTimeButton onPress={() => setShowEndPicker(true)}>
            <DateTimeText>{formatDateTime(formData.end_time)}</DateTimeText>
            <Feather name="calendar" size={20} color="#666" />
          </DateTimeButton>
          {showEndPicker && (
            <DateTimePicker
              value={formData.end_time}
              mode="datetime"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              minimumDate={formData.start_time}
              minuteInterval={15}
              onChange={(event, selectedDate) => {
                setShowEndPicker(false);
                if (selectedDate) {
                  if (Platform.OS === 'android') {
                    // For Android, round to nearest 15 minutes
                    const minutes = selectedDate.getMinutes();
                    const roundedMinutes = Math.round(minutes / 15) * 15;
                    selectedDate.setMinutes(roundedMinutes);
                    selectedDate.setSeconds(0);
                    selectedDate.setMilliseconds(0);
                  }
                  setFormData({ ...formData, end_time: selectedDate });
                }
              }}
            />
          )}
        </FormGroup>

        <CreateButton 
          onPress={handleCreateMatch} 
          disabled={loading || !formData.location_id}
          style={{ opacity: !formData.location_id ? 0.5 : 1 }}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <CreateButtonText>Create Match</CreateButtonText>
          )}
        </CreateButton>
      </FormContainer>
    </Container>
  );
} 