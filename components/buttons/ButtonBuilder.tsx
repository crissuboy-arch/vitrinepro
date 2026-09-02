"use client";

import { useCallback, useEffect, useState } from "react";
import { Layers, MousePointerClick, Palette, Plus, Sliders } from "lucide-react";
import type { ButtonPatch, NewPageButton, PageButton } from "@/types/buttons";
import {
  createButton,
  deleteButton,
  duplicateButton as duplicateButtonAction,
  listButtons,
  reorderButtons,
  updateButton,
} from "@/lib/button-actions";
import {
  BUTTON_CATALOG,
  catalogItemToStyle,
  type ButtonCatalogItem,
  type ButtonPreset,
} from "./buttonPresets";
import ButtonCatalogModal from "./ButtonCatalogModal";
import ButtonEditor from "./ButtonEditor";
import ButtonList from "./ButtonList";
import ButtonPreview, { type DeviceMode } from "./ButtonPreview";
import PresetPicker from "./PresetPicker";

export interface BuilderBusiness {
  id: string;
  name: string;
  description: string | null;
  logoUrl: string | null;
  slug: string;
}

type Tab = "list" | "editor" | "presets";

const DIVIDER_ITEM = BUTTON_CATALOG.find((i) => i.type === "divider")!;

export default function ButtonBuilder({ business }: { business: BuilderBusiness }) {
  const [buttons, setButtons] = useState<PageButton[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("list");
  const [deviceMode, setDeviceMode] = useState<DeviceMode>("mobile");
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string>("");
  const [catalogOpen, setCatalogOpen] = useState(false);

  const notify = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(""), 3000);
  }, []);

  // Recarrega a lista a partir da BD (usado por retry e após erros de escrita).
  const fetchButtons = useCallback(async () => {
    try {
      const data = await listButtons(business.id);
      setButtons(data);
      setSelectedId((cur) => cur ?? data[0]?.id ?? null);
      setStatus("ready");
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Erro ao carregar os botões.");
      setStatus("error");
    }
  }, [business.id]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await listButtons(business.id);
        if (cancelled) return;
        setButtons(data);
        setSelectedId((cur) => cur ?? data[0]?.id ?? null);
        setStatus("ready");
      } catch (e) {
        if (cancelled) return;
        setErrorMsg(
          e instanceof Error ? e.message : "Erro ao carregar os botões.",
        );
        setStatus("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [business.id]);

  const retry = () => {
    setStatus("loading");
    void fetchButtons();
  };

  const selected = buttons.find((b) => b.id === selectedId) ?? null;

  // ── Mutations ────────────────────────────────────────────────

  const runCreate = async (data: NewPageButton, label: string) => {
    setBusy(true);
    try {
      const created = await createButton(business.id, data);
      setButtons((prev) => [...prev, created]);
      setSelectedId(created.id);
      notify(`${label} adicionado.`);
    } catch (e) {
      notify(e instanceof Error ? e.message : "Erro ao criar o botão.");
    } finally {
      setBusy(false);
    }
  };

  const handleAddFromCatalog = (item: ButtonCatalogItem) => {
    setCatalogOpen(false);
    void runCreate(
      {
        type: item.type,
        label: item.defaultLabel,
        sublabel: item.defaultSublabel,
        url: item.defaultUrl,
        icon: item.iconName,
        style: catalogItemToStyle(item),
        rules: {},
        order: buttons.length,
        active: true,
      },
      `Botão "${item.name}"`,
    );
    setTab("editor");
  };

  const handleAddDivider = () => {
    void runCreate(
      {
        type: "divider",
        label: DIVIDER_ITEM.defaultLabel,
        url: "",
        icon: "Minus",
        style: { textColor: "#94A3B8" },
        rules: {},
        order: buttons.length,
        active: true,
      },
      "Separador",
    );
  };

  const handlePatch = async (id: string, patch: ButtonPatch) => {
    const prev = buttons;
    setButtons((list) =>
      list.map((b) =>
        b.id === id
          ? {
              ...b,
              ...("label" in patch ? { label: patch.label ?? b.label } : {}),
              ...("sublabel" in patch ? { sublabel: patch.sublabel } : {}),
              ...("url" in patch ? { url: patch.url ?? b.url } : {}),
              ...("whatsappMsg" in patch ? { whatsappMsg: patch.whatsappMsg } : {}),
              ...("active" in patch ? { active: patch.active ?? b.active } : {}),
              ...("presetId" in patch ? { presetId: patch.presetId } : {}),
              ...(patch.style ? { style: patch.style } : {}),
              ...(patch.rules ? { rules: patch.rules } : {}),
            }
          : b,
      ),
    );
    try {
      await updateButton(id, patch);
    } catch (e) {
      setButtons(prev);
      notify(e instanceof Error ? e.message : "Erro ao guardar.");
    }
  };

  const handleToggleActive = (button: PageButton) =>
    void handlePatch(button.id, { active: !button.active });

  const handleDuplicate = async (source: PageButton) => {
    setBusy(true);
    try {
      const copy = await duplicateButtonAction(business.id, source);
      setButtons((prev) => {
        const next = [...prev];
        const idx = next.findIndex((b) => b.id === source.id);
        next.splice(idx + 1, 0, copy);
        return next;
      });
      await reorderButtons(
        (() => {
          const ids = buttons.map((b) => b.id);
          const idx = ids.indexOf(source.id);
          ids.splice(idx + 1, 0, copy.id);
          return ids;
        })(),
      );
      setSelectedId(copy.id);
      notify("Botão duplicado.");
    } catch (e) {
      notify(e instanceof Error ? e.message : "Erro ao duplicar.");
      void fetchButtons();
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (button: PageButton) => {
    if (!window.confirm(`Eliminar o botão "${button.label || "sem nome"}"?`))
      return;
    const prev = buttons;
    setButtons((list) => list.filter((b) => b.id !== button.id));
    if (selectedId === button.id) {
      setSelectedId(prev.find((b) => b.id !== button.id)?.id ?? null);
      setTab("list");
    }
    try {
      await deleteButton(button.id);
      notify("Botão eliminado.");
    } catch (e) {
      setButtons(prev);
      notify(e instanceof Error ? e.message : "Erro ao eliminar.");
    }
  };

  const handleMove = async (id: string, direction: "up" | "down") => {
    const idx = buttons.findIndex((b) => b.id === id);
    const target = direction === "up" ? idx - 1 : idx + 1;
    if (target < 0 || target >= buttons.length) return;
    const next = [...buttons];
    [next[idx], next[target]] = [next[target], next[idx]];
    const reindexed = next.map((b, i) => ({ ...b, order: i }));
    setButtons(reindexed);
    try {
      await reorderButtons(reindexed.map((b) => b.id));
    } catch (e) {
      void fetchButtons();
      notify(e instanceof Error ? e.message : "Erro ao reordenar.");
    }
  };

  const applyPreset = (preset: ButtonPreset, scope: "selected" | "all") => {
    const targets =
      scope === "all" ? buttons.filter((b) => b.type !== "divider") : selected ? [selected] : [];
    targets.forEach((b) => {
      void handlePatch(b.id, {
        style: { ...b.style, ...preset.style },
        presetId: preset.id,
      });
    });
    notify(
      scope === "all"
        ? `Estilo "${preset.name}" aplicado a todos.`
        : `Estilo "${preset.name}" aplicado.`,
    );
  };

  // ── Render ───────────────────────────────────────────────────

  const tabBtn = (id: Tab, icon: React.ReactNode, label: string, disabled = false) => (
    <button
      type="button"
      disabled={disabled}
      onClick={() => setTab(id)}
      className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-[11px] font-bold transition-colors ${
        tab === id
          ? "bg-[#C8A96B] text-[#0F172A]"
          : "text-gray-400 hover:bg-white/5 disabled:opacity-30"
      }`}
    >
      {icon}
      <span className="hidden md:inline">{label}</span>
    </button>
  );

  return (
    <div className="flex min-h-screen flex-col bg-[#0A0D14] text-[#f5f0e8]">
      {toast && (
        <div className="fixed right-4 top-4 z-50 flex items-center gap-2 rounded-xl border border-[#C8A96B] bg-[#0F172A] px-4 py-2.5 text-xs font-bold shadow-2xl">
          <MousePointerClick className="h-4 w-4 text-[#C8A96B]" />
          {toast}
        </div>
      )}

      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-800 bg-[#0F172A] px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5">
            <MousePointerClick className="h-5 w-5 text-[#C8A96B]" />
          </span>
          <div>
            <h1 className="font-display text-lg font-bold text-white">
              Botões &amp; Links
            </h1>
            <p className="text-xs text-gray-500">
              Construtor visual da sua página de links · {business.name}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setCatalogOpen(true)}
          disabled={busy}
          className="flex items-center gap-2 rounded-xl bg-[#C8A96B] px-4 py-2 text-xs font-bold text-[#0F172A] transition-colors hover:bg-[#D4BB82] disabled:opacity-60"
        >
          <Plus className="h-4 w-4" />
          Adicionar botão
        </button>
      </header>

      <div className="flex flex-1 flex-col lg:flex-row">
        <div className="flex w-full flex-col border-b border-gray-800 lg:w-[460px] lg:border-b-0 lg:border-r xl:w-[500px]">
          <div className="flex gap-1 border-b border-gray-800 bg-[#0F172A] p-2">
            {tabBtn("list", <Layers className="h-4 w-4" />, `Lista (${buttons.length})`)}
            {tabBtn("editor", <Sliders className="h-4 w-4" />, "Editar", !selected)}
            {tabBtn("presets", <Palette className="h-4 w-4" />, "Estilos")}
          </div>

          <div className="flex-1 overflow-y-auto p-4 lg:h-[calc(100vh-8.5rem)]">
            {status === "loading" ? (
              <p className="py-16 text-center text-sm text-gray-500">
                A carregar botões...
              </p>
            ) : status === "error" ? (
              <div className="rounded-xl border border-red-900 bg-red-950/40 p-4 text-xs text-red-300">
                {errorMsg}
                <button
                  type="button"
                  onClick={retry}
                  className="mt-2 block rounded-lg bg-red-900/40 px-3 py-1 font-bold"
                >
                  Tentar de novo
                </button>
              </div>
            ) : tab === "list" ? (
              <ButtonList
                buttons={buttons}
                selectedId={selectedId}
                onSelect={(id) => {
                  setSelectedId(id);
                  setTab("editor");
                }}
                onMove={handleMove}
                onToggleActive={handleToggleActive}
                onDuplicate={handleDuplicate}
                onDelete={handleDelete}
                onAddDivider={handleAddDivider}
              />
            ) : tab === "editor" && selected ? (
              <ButtonEditor
                key={selected.id}
                button={selected}
                onPatch={(patch) => void handlePatch(selected.id, patch)}
                onDuplicate={handleDuplicate}
              />
            ) : tab === "presets" ? (
              <PresetPicker
                hasSelection={!!selected}
                onApplyToSelected={(p) => applyPreset(p, "selected")}
                onApplyToAll={(p) => applyPreset(p, "all")}
              />
            ) : (
              <p className="py-16 text-center text-sm text-gray-500">
                Selecione um botão na lista para o editar.
              </p>
            )}
          </div>
        </div>

        <div className="flex-1 p-4 lg:h-[calc(100vh-5.5rem)]">
          <ButtonPreview
            businessName={business.name}
            businessDescription={business.description}
            logoUrl={business.logoUrl}
            buttons={buttons}
            deviceMode={deviceMode}
            onDeviceModeChange={setDeviceMode}
            selectedId={selectedId}
          />
        </div>
      </div>

      {catalogOpen && (
        <ButtonCatalogModal
          onPick={handleAddFromCatalog}
          onClose={() => setCatalogOpen(false)}
        />
      )}
    </div>
  );
}
