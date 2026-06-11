"use client";

import { useState, type ReactNode } from "react";
import type { ContentItem, RedeSocial, ContentStatus } from "@/types/content-calendar";
import { REDES, STATUS_OPTIONS, emptyContent } from "@/types/content-calendar";

interface Props {
  initial: ContentItem | null;
  saving: boolean;
  onClose: () => void;
  onSave: (item: ContentItem) => void;
}

const inputCls =
  "w-full rounded-lg border border-gray-800 bg-[#0a0d14] px-3 py-2 text-sm text-[#f5f0e8] outline-none focus:border-[#C8A96B]";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] uppercase tracking-wide text-gray-500">{label}</span>
      {children}
    </label>
  );
}

export default function ContentForm({ initial, saving, onClose, onSave }: Props) {
  const [form, setForm] = useState<ContentItem>(() =>
    initial ? { ...initial } : emptyContent(),
  );
  const [err, setErr] = useState("");

  const set = <K extends keyof ContentItem>(key: K, value: ContentItem[K]) =>
    setForm((f) => ({ ...f, [key]: value } as ContentItem));

  const submit = () => {
    if (!form.titulo.trim()) {
      setErr("O título é obrigatório.");
      return;
    }
    if (!form.data) {
      setErr("A data é obrigatória.");
      return;
    }
    onSave({ ...form, titulo: form.titulo.trim() });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={initial ? "Editar conteúdo" : "Novo conteúdo"}
    >
      <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-2xl border border-gray-800 bg-[#0F172A] p-5 shadow-2xl sm:max-w-lg sm:rounded-2xl sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-[#C8A96B]">
            {initial ? "Editar conteúdo" : "Novo conteúdo"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="text-xl leading-none text-gray-400 hover:text-white"
          >
            ×
          </button>
        </div>

        {err && (
          <p className="mb-3 rounded-lg bg-red-950/60 px-3 py-2 text-xs text-red-300">{err}</p>
        )}

        <div className="space-y-3">
          <Field label="Título">
            <input
              value={form.titulo}
              onChange={(e) => set("titulo", e.target.value)}
              className={inputCls}
              placeholder="Ex.: Post de lançamento"
            />
          </Field>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Rede social">
              <select
                value={form.rede_social}
                onChange={(e) => set("rede_social", e.target.value as RedeSocial)}
                className={inputCls}
              >
                {REDES.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Status">
              <select
                value={form.status}
                onChange={(e) => set("status", e.target.value as ContentStatus)}
                className={inputCls}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Data">
              <input
                type="date"
                value={form.data}
                onChange={(e) => set("data", e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Hora">
              <input
                type="time"
                value={form.hora ?? ""}
                onChange={(e) => set("hora", e.target.value)}
                className={inputCls}
              />
            </Field>
          </div>

          <Field label="Legenda">
            <textarea
              value={form.legenda ?? ""}
              onChange={(e) => set("legenda", e.target.value)}
              rows={3}
              className={inputCls}
              placeholder="Texto da publicação..."
            />
          </Field>

          <Field label="Observações">
            <textarea
              value={form.observacoes ?? ""}
              onChange={(e) => set("observacoes", e.target.value)}
              rows={2}
              className={inputCls}
              placeholder="Notas internas..."
            />
          </Field>
        </div>

        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-gray-700 py-2.5 text-xs font-semibold text-gray-300 hover:bg-white/5"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={saving}
            className="flex-1 rounded-lg bg-[#C8A96B] py-2.5 text-xs font-bold text-[#0F172A] hover:bg-[#D4BB82] disabled:opacity-60"
          >
            {saving ? "A guardar..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}
