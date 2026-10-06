"use client";

import ImageFramingEditor from "@/components/dashboard/ImageFramingEditor";
import {
  CoverFraming,
  normalizeCoverFraming,
  MIN_COVER_ZOOM,
  MAX_COVER_ZOOM,
} from "@/lib/cover-framing";

interface Props {
  coverUrl: string;
  initial: CoverFraming;
  onSave: (f: CoverFraming) => Promise<void>;
  onReplace: () => void;
  onRemove: () => Promise<void>;
  onClose: () => void;
}

/**
 * Editor de enquadramento da capa — agora usa o componente genérico
 * ImageFramingEditor (experiência consistente com o editor de produto).
 * Lógica de drag/zoom/save inalterada; mapeamento das colunas continua
 * em lib/cover-framing.ts.
 */
export default function CoverFramingEditor({
  coverUrl,
  initial,
  onSave,
  onReplace,
  onRemove,
  onClose,
}: Props) {
  return (
    <ImageFramingEditor
      imageUrl={coverUrl}
      initial={initial}
      onSave={onSave}
      onReplace={onReplace}
      onRemove={onRemove}
      onClose={onClose}
      title="Editar enquadramento"
      previewAspect="16/9"
      minZoom={MIN_COVER_ZOOM}
      maxZoom={MAX_COVER_ZOOM}
    />
  );
}

export { normalizeCoverFraming };
export type { CoverFraming };
