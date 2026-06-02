"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "../lib/supabase";
import { User, Session } from "@supabase/supabase-js";

interface Profile {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  plan: "free" | "pro" | "premium";
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signInWithGoogle: (redirectTo?: string) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session: currentSession } }) => {
      try {
        if (currentSession) {
          setSession(currentSession);
          setUser(currentSession.user);
          console.log("[AUTH] User set from getSession:", currentSession.user.id);
          
          const { data: profileData } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", currentSession.user.id)
            .maybeSingle();
          
          if (profileData) {
            setProfile(profileData);
          }
        } else {
          console.log("[AUTH] No session found from getSession");
        }
      } catch (error) {
        console.error("[AUTH] getSession error:", error);
      } finally {
        setLoading(false);
        console.log("[AUTH] Loading set to false after getSession");
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, currentSession) => {
        console.log("[AUTH] onAuthStateChange:", _event, currentSession?.user?.id);
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        // Run database fetch asynchronously in next tick to avoid locking issues (Web Locks API deadlock)
        setTimeout(async () => {
          try {
            if (currentSession?.user) {
              const { data: profileData } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", currentSession.user.id)
                .maybeSingle();
              
              setProfile(profileData);
            } else {
              setProfile(null);
            }
          } catch (error) {
            console.error("[AUTH] Profile fetch error in state change:", error);
          }
        }, 0);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const createProfile = async (userId: string, email: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .upsert({
        id: userId,
        email,
        display_name: email.split("@")[0],
        plan: "free",
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  const signInWithGoogle = async (redirectTo?: string) => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: redirectTo || `${window.location.origin}/auth/callback`,
      },
    });

    if (error) throw error;
  };

  const signInWithEmail = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
  };

  const signUpWithEmail = async (email: string, password: string) => {
    const { error, data } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw error;

    if (data.user) {
      await createProfile(data.user.id, email);
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", user.id)
      .select()
      .single();

    if (error) throw error;
    setProfile(data);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signOut,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

const defaultAuthContext = {
  user: null,
  session: null,
  profile: null,
  loading: true,
  signInWithGoogle: async (redirectTo?: string) => {},
  signInWithEmail: async () => {},
  signUpWithEmail: async () => {},
  signOut: async () => {},
  updateProfile: async () => {},
};

export function useAuth() {
  const context = useContext(AuthContext);
  return context || defaultAuthContext;
}