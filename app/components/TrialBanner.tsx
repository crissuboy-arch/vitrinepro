"use client";

import { useState, useEffect } from "react";

interface UserAccess {
  userId: string;
  plan: "founder" | "trial" | "pro" | null;
  trialEndsAt: string | null;
  isActive: boolean;
}

const FOUNDER_LIMIT = 5;
const TRIAL_DAYS = 7;

export default function TrialBanner() {
  const [founderCount, setFounderCount] = useState(2);
  const [userAccess, setUserAccess] = useState<UserAccess>({
    userId: "",
    plan: null,
    trialEndsAt: null,
    isActive: false,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedAccess = localStorage.getItem("vitrinepro_access");
    if (storedAccess) {
      const parsed = JSON.parse(storedAccess);
      setUserAccess(parsed);
    } else {
      setUserAccess({
        userId: crypto.randomUUID(),
        plan: null,
        trialEndsAt: null,
        isActive: false,
      });
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!isLoading && userAccess.plan === null) {
      const trialEndDate = new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000).toISOString();
      const newAccess: UserAccess = {
        ...userAccess,
        plan: "trial",
        trialEndsAt: trialEndDate,
        isActive: true,
      };
      setUserAccess(newAccess);
      localStorage.setItem("vitrinepro_access", JSON.stringify(newAccess));
    }
  }, [isLoading]);

  const spotsLeft = FOUNDER_LIMIT - founderCount;
  const trialEndsAt = userAccess.trialEndsAt;
  const isTrialActive = userAccess.plan === "trial" && trialEndsAt;
  const trialDaysLeft = isTrialActive
    ? Math.ceil(
        (new Date(trialEndsAt).getTime() - Date.now()) /
          (1000 * 60 * 60 * 24)
      )
    : 0;
  const isTrialExpired = isTrialActive && trialDaysLeft <= 0;

  const getAccessBadge = () => {
    if (userAccess.plan === "founder") {
      return {
        label: "Fundador",
        color: "bg-[#C8A96B] text-[#0F172A]",
        icon: "★",
      };
    }
    if (userAccess.plan === "trial" && !isTrialExpired) {
      return {
        label: `Trial (${trialDaysLeft} dias)`,
        color: "bg-[#25D366] text-white",
        icon: "⚡",
      };
    }
    if (userAccess.plan === "trial" && isTrialExpired) {
      return {
        label: "Trial expirado",
        color: "bg-red-600 text-white",
        icon: "⏰",
      };
    }
    if (userAccess.plan === "pro") {
      return {
        label: "Pro",
        color: "bg-[#C8A96B] text-[#0F172A]",
        icon: "★",
      };
    }
    return null;
  };

  const badge = getAccessBadge();

  if (isLoading) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-[#0F172A] border-b border-[#1F2937]">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-2 py-2">
          {/* Left - Founder spots */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-[#C8A96B]">★</span>
            <span className="text-[#E5E7EB]">
              Vagas de fundador:{" "}
              <span className="text-[#C8A96B] font-semibold">{spotsLeft}</span> /{" "}
              {FOUNDER_LIMIT}
            </span>
          </div>

          {/* Center - User access badge */}
          {badge && (
            <div
              className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${badge.color}`}
            >
              <span>{badge.icon}</span>
              <span>{badge.label}</span>
            </div>
          )}

          {/* Right - Trial/CTA */}
          <div className="flex items-center gap-3">
            {isTrialExpired && (
              <button className="px-4 py-1.5 bg-[#C8A96B] text-[#0F172A] text-xs font-semibold rounded-full animate-pulse">
                Ative já - €29.90/mês
              </button>
            )}
            {userAccess.plan === "trial" && !isTrialExpired && (
              <span className="text-[#25D366] text-xs">
                Trial: {trialDaysLeft} dias restantes
              </span>
            )}
            {userAccess.plan === "pro" && (
              <span className="text-[#C8A96B] text-xs">Pro unlocked</span>
            )}
            {userAccess.plan === "founder" && (
              <span className="text-[#C8A96B] text-xs">Acesso Fundador</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function useAccessCheck() {
  const [access, setAccess] = useState<UserAccess | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("vitrinepro_access");
    if (stored) {
      setAccess(JSON.parse(stored));
    }
    setIsLoading(false);
  }, []);

  const canAccess = (feature: "premium" | "stats" | "banner") => {
    if (!access) return false;
    if (access.plan === "founder") return true;
    if (access.plan === "pro") return true;
    if (access.plan === "trial" && access.trialEndsAt) {
      const daysLeft =
        (new Date(access.trialEndsAt).getTime() - Date.now()) /
        (1000 * 60 * 60 * 24);
      if (daysLeft <= 0) return false;
      if (feature === "premium") return false;
      if (feature === "stats") return false;
      return true;
    }
    return false;
  };

  const upgradeToPro = () => {
    if (access) {
      const newAccess = { ...access, plan: "pro" as const };
      localStorage.setItem("vitrinepro_access", JSON.stringify(newAccess));
      setAccess(newAccess);
    }
  };

  const becomeFounder = () => {
    if (access) {
      const newAccess = { ...access, plan: "founder" as const };
      localStorage.setItem("vitrinepro_access", JSON.stringify(newAccess));
      setAccess(newAccess);
    }
  };

  return { access, isLoading, canAccess, upgradeToPro, becomeFounder };
}