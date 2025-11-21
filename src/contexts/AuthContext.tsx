import React, { createContext, useState, useEffect, useContext, type ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  getToken: () => Promise<string | null>;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for dev bypass
    if (localStorage.getItem("dev_bypass") === "true") {
      console.log("🔓 Dev bypass active");
      setUser({
        id: "dev-user-id",
        email: "davidv111111@gmail.com",
        app_metadata: {},
        user_metadata: {},
        aud: "authenticated",
        created_at: new Date().toISOString()
      } as User);
      setLoading(false);
      return;
    }

    // Fetch the initial session
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getSession();

    // Listen for changes in authentication state
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (localStorage.getItem("dev_bypass") === "true") return;
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Cleanup listener on component unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Function to get the current session's JWT
  const getToken = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  };

  const value = {
    user,
    getToken,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// Custom hook for easy consumption of the context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
