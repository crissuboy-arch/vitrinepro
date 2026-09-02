"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/app/lib/supabase";
import ButtonBuilder, {
  type BuilderBusiness,
} from "@/components/buttons/ButtonBuilder";

export default function ButtonsPage() {
  const router = useRouter();
  const [business, setBusiness] = useState<BuilderBusiness | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "no-business">(
    "loading",
  );

  useEffect(() => {
    let active = true;
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push("/login?next=/dashboard/botoes");
        return;
      }

      const { data } = await supabase
        .from("businesses")
        .select("id, name, description, logo_url, slug")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (!active) return;

      if (!data) {
        setState("no-business");
        return;
      }

      setBusiness({
        id: data.id as string,
        name: (data.name as string) ?? "O meu negócio",
        description: (data.description as string | null) ?? null,
        logoUrl: (data.logo_url as string | null) ?? null,
        slug: (data.slug as string) ?? "",
      });
      setState("ready");
    })();
    return () => {
      active = false;
    };
  }, [router]);

  if (state === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0A0D14] text-sm text-gray-500">
        A carregar...
      </div>
    );
  }

  if (state === "no-business") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#0A0D14] px-6 text-center text-[#f5f0e8]">
        <p className="text-sm text-gray-400">
          Ainda não tem uma vitrine criada. Crie o seu negócio primeiro para
          configurar os botões.
        </p>
        <Link
          href="/onboarding"
          className="rounded-xl bg-[#C8A96B] px-5 py-2.5 text-xs font-bold text-[#0F172A] hover:bg-[#D4BB82]"
        >
          Criar a minha vitrine
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="bg-[#0A0D14] px-5 pt-4">
        <Link
          href="/dashboard"
          className="text-xs text-gray-500 hover:text-[#C8A96B]"
        >
          ← Voltar ao dashboard
        </Link>
      </div>
      {business && <ButtonBuilder business={business} />}
    </>
  );
}
