"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface UserData {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  plan: "free" | "pro" | "premium";
  businessId?: string;
  createdAt: string;
}

export interface BusinessData {
  id?: string;
  name: string;
  category: string;
  city: string;
  country: string;
  whatsApp: string;
  phone?: string;
  description: string;
  logo: string;
  cover: string;
  gallery: string[];
  instagram?: string;
  website?: string;
}

interface AuthContextType {
  user: any;
  userData: UserData | null;
  business: BusinessData | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  setBusiness: (business: BusinessData) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [business, setBusiness] = useState<BusinessData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load from localStorage
    const savedUser = localStorage.getItem("vitrinepro_user");
    const savedBusiness = localStorage.getItem("vitrinepro_business");
    
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      setUser(parsed.user);
      setUserData(parsed.userData);
    }
    
    if (savedBusiness) {
      setBusiness(JSON.parse(savedBusiness));
    }
    
    setLoading(false);
  }, []);

  const saveState = (newUser: any, newUserData: UserData | null, newBusiness: BusinessData | null) => {
    localStorage.setItem("vitrinepro_user", JSON.stringify({ user: newUser, userData: newUserData }));
    if (newBusiness) {
      localStorage.setItem("vitrinepro_business", JSON.stringify(newBusiness));
    }
  };

  const signInWithGoogle = async () => {
    const newUser = { uid: "demo", displayName: "Demo User", photoURL: null };
    const newUserData = {
      uid: "demo",
      email: "demo@example.com",
      displayName: "Demo User",
      photoURL: null,
      plan: "free" as const,
      createdAt: new Date().toISOString(),
    };
    setUser(newUser);
    setUserData(newUserData);
    saveState(newUser, newUserData, business);
  };

  const signInWithEmail = async (email: string, password: string) => {
    const newUser = { uid: "demo", email, displayName: email.split("@")[0], photoURL: null };
    const newUserData = {
      uid: "demo",
      email,
      displayName: email.split("@")[0],
      photoURL: null,
      plan: "free" as const,
      createdAt: new Date().toISOString(),
    };
    setUser(newUser);
    setUserData(newUserData);
    saveState(newUser, newUserData, business);
  };

  const signUpWithEmail = async (email: string, password: string) => {
    const newUser = { uid: "demo", email, displayName: email.split("@")[0], photoURL: null };
    const newUserData = {
      uid: "demo",
      email,
      displayName: email.split("@")[0],
      photoURL: null,
      plan: "free" as const,
      createdAt: new Date().toISOString(),
    };
    setUser(newUser);
    setUserData(newUserData);
    saveState(newUser, newUserData, business);
  };

  const signOut = async () => {
    setUser(null);
    setUserData(null);
    setBusiness(null);
    localStorage.removeItem("vitrinepro_user");
    localStorage.removeItem("vitrinepro_business");
  };

  const handleSetBusiness = (biz: BusinessData) => {
    setBusiness(biz);
    saveState(user, userData, biz);
  };

  return (
    <AuthContext.Provider value={{ user, userData, business, loading, signInWithGoogle, signInWithEmail, signUpWithEmail, signOut, setBusiness: handleSetBusiness }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}