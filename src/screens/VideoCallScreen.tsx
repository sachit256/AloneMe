import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { RootStackScreenProps } from '../types/navigation';
import { startSession, endSession } from '../utils/sessionTracking';

type VideoCallScreenProps = RootStackScreenProps<'VideoCall'>;

interface UserData {
  gender?: string;
  display_name?: string;
}

const VideoCallScreen = ({ route, navigation }: VideoCallScreenProps) => {
  // ... existing state ...
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [otherUserData, setOtherUserData] = useState<UserData | null>(null);
  const currentUserId = route.params?.userId;
  const otherUserId = route.params?.otherUserId;

  useEffect(() => {
    const fetchUserData = async () => {
      if (!currentUserId || !otherUserId) return;

      try {
        // Fetch current user data
        const { data: currentUserData, error: currentUserError } = await supabase
          .from('user_preferences')
          .select('gender, display_name')
          .eq('user_id', currentUserId)
          .single();

        if (currentUserError) throw currentUserError;
        setUserData(currentUserData);

        // Fetch other user data
        const { data: otherUserData, error: otherUserError } = await supabase
          .from('user_preferences')
          .select('gender, display_name')
          .eq('user_id', otherUserId)
          .single();

        if (otherUserError) throw otherUserError;
        setOtherUserData(otherUserData);
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, [currentUserId, otherUserId]);

  useEffect(() => {
    const initializeVideoCall = async () => {
      // Start session if male user is calling female listener
      if (otherUserData?.gender?.toLowerCase() === 'female' && userData?.gender?.toLowerCase() === 'male') {
        const sessionId = await startSession(otherUserId, currentUserId, 'video');
        setCurrentSessionId(sessionId);
      }
    };

    initializeVideoCall();

    // Cleanup function to end session
    return () => {
      if (currentSessionId) {
        endSession(currentSessionId);
      }
    };
  }, [currentUserId, otherUserId, userData, otherUserData]);

  // ... rest of the existing code ...
} 