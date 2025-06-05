import * as Notifications from 'expo-notifications';
import { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { supabase } from '../lib/supabase';

type NotificationsContextType = {
  expoPushToken: string | null;
  registerForPushNotifications: () => Promise<void>;
};

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);

  async function updateTokenInDatabase(token: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // First get the current token
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('expo_push_token')
          .eq('id', user.id)
          .single();

        // Only update if the token has changed
        if (profile?.expo_push_token !== token) {
          await supabase
            .from('user_profiles')
            .update({ expo_push_token: token })
            .eq('id', user.id);
        }
      }
    } catch (error) {
      console.error('Error updating push token in database:', error);
    }
  }

  async function registerForPushNotifications() {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return;
      }

      const token = (await Notifications.getExpoPushTokenAsync()).data;
      setExpoPushToken(token);
      await updateTokenInDatabase(token);

      if (Platform.OS === 'android') {
        Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }
    } catch (error) {
      console.error('Error registering for push notifications:', error);
    }
  }

  // Set up notification handler
  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // Register for push notifications on startup
  useEffect(() => {
    registerForPushNotifications();
  }, []);

  return (
    <NotificationsContext.Provider value={{ expoPushToken, registerForPushNotifications }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
} 