import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import posthog from 'posthog-js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*, teams(id, name, color, icon)')
        .eq('id', userId)
        .single();
      if (error) throw error;
      if (data) {
        // Auto-reset streak if user missed a day
        if (data.streak > 0 && data.last_active_date) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const parts = data.last_active_date.split('-');
          if (parts.length === 3) {
            const lastActive = new Date(parts[0], parts[1] - 1, parts[2]);
            lastActive.setHours(0, 0, 0, 0);
            const daysDiff = Math.floor((today - lastActive) / 86400000);
            if (daysDiff > 1) {
              // More than 1 day missed — reset streak
              await supabase
                .from('profiles')
                .update({ streak: 0, updated_at: new Date().toISOString() })
                .eq('id', userId);
              data.streak = 0;
            }
          }
        }

        setProfile(data);
        // Identify user in PostHog for analytics
        try {
          posthog.identify(data.id, {
            name: data.name,
            email: data.email,
            level: data.level,
            xp: data.xp,
            team: data.teams?.name || null,
            role: data.role,
          });
        } catch (_) { /* PostHog not initialized */ }
      }
      return data;
    } catch (err) {
      console.error("Error in fetchProfile:", err);
      return null;
    }
  }, []);

  useEffect(() => {
    let active = true;

    // Get initial session
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!active) return;

        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchProfile(session.user.id);
        }
      } catch (err) {
        console.error("Error getting session/profile on mount:", err);
      } finally {
        if (active) setLoading(false);
      }
    };
    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!active) return;
        setLoading(true);
        try {
          setUser(session?.user ?? null);
          if (session?.user) {
            await fetchProfile(session.user.id);
          } else {
            setProfile(null);
          }
        } catch (err) {
          console.error("Error in onAuthStateChange:", err);
        } finally {
          if (active) setLoading(false);
        }
      }
    );

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  // Subscribe to real-time changes on the current user's profile
  useEffect(() => {
    if (!user) {
      setProfile(null);
      return;
    }

    const channelId = `profile-realtime-${user.id}`;
    const channel = supabase
      .channel(channelId)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`,
        },
        async () => {
          await fetchProfile(user.id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchProfile]);

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  };

  const signUp = async (email, password, name) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
      },
    });
    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
    setProfile(null);
    try { posthog.reset(); } catch (_) { /* PostHog not initialized */ }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  const isAdmin = profile?.role === 'admin';

  const value = {
    user,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    refreshProfile,
    isAdmin,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
