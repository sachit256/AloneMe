import {useEffect, useState} from 'react';
import {supabase} from '../lib/supabase';
import {useSelector, useDispatch} from 'react-redux';
import type {RootState} from '../redux/store';
import type {User} from '@supabase/supabase-js';
import {updateUserPreferences} from '../redux/slices/userSlice';
import {setAuthenticated} from '../store/slices/authSlice';

export const useUser = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const dispatch = useDispatch();
  const preferences = useSelector((state: RootState) => state.user?.preferences || {});
  const error = useSelector((state: RootState) => state.user?.error || null);

  useEffect(() => {
    let isMounted = true;

    const initializeUser = async () => {
      try {
        setIsLoading(true);
        // Get current user
        const {data: {user: currentUser}} = await supabase.auth.getUser();
        console.log('Current user from Supabase:', currentUser?.id);

        if (isMounted) {
          setUser(currentUser);
          // Update Redux auth state
          dispatch(setAuthenticated(!!currentUser));

          // If we have a user, fetch their preferences
          if (currentUser) {
            const {data: userPrefs, error: prefsError} = await supabase
              .from('user_preferences')
              .select('*')
              .eq('user_id', currentUser.id)
              .single();

            console.log('User preferences from Supabase:', userPrefs);
            
            if (prefsError) {
              console.error('Error fetching user preferences:', prefsError);
            } else if (userPrefs && isMounted) {
              console.log('Updating Redux with preferences:', userPrefs);
              // Update Redux with the latest preferences
              dispatch(updateUserPreferences(userPrefs));
            }
          } else {
            // If no user, make sure auth state is false
            dispatch(setAuthenticated(false));
          }
        }
      } catch (error) {
        console.error('Error in useUser hook:', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    // Initialize
    initializeUser();

    // Listen for auth changes
    const {data: {subscription}} = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.id);
      
      if (isMounted) {
        setIsLoading(true);
        const newUser = session?.user || null;
        setUser(newUser);
        dispatch(setAuthenticated(!!newUser));

        // If we have a new session, fetch updated preferences
        if (session?.user) {
          const {data: userPrefs, error: prefsError} = await supabase
            .from('user_preferences')
            .select('*')
            .eq('user_id', session.user.id)
            .single();

          if (prefsError) {
            console.error('Error fetching updated preferences:', prefsError);
          } else if (userPrefs && isMounted) {
            console.log('Updated preferences after auth change:', userPrefs);
            dispatch(updateUserPreferences(userPrefs));
          }
        }
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [dispatch]);

  return {
    user,
    preferences,
    isLoading,
    error,
  };
}; 