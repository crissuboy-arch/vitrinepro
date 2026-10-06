"use client";

import ImageFramingEditor from "@/components/dashboard/ImageFramingEditor";
import {
  ProductFraming,
  normalizeProductFraming,
  MIN_PRODUCT_ZOOM,
  MAX_PRODUCT_ZOOM,
} from "@/lib/product-framing";

interface Props {
  imageUrl: string;
  initial: ProductFraming;
  onSave: (f: ProductFraming) => Promise<void>;
  onReplace: () => void;
  onRemove: () => Promise<void>;
  onClose: () => void;
}

/**
 * Editor de enquadramento da imagem do produto — usa o componente
 * genérico ImageFramingEditor (experiência consistente com a capa).
 * Preview em 4:5 (formato oficial). A original nunca é alterada.
 */
export default function ProductFramingEditor({
  imageUrl,
  initial,
  onSave,
  onReplace,
  onRemove,
  onClose,
}: Props) {
  return (
    <ImageFramingEditor
      imageUrl={imageUrl}
      initial={initial}
      onSave={onSave}
      onReplace={onReplace}
      onRemove={onRemove}
      onClose={onClose}
      title="Enquadramento do produto"
      previewAspect="4/5"
      minZoom={MIN_PRODUCT_ZOOM}
      maxZoom={MAX_PRODUCT_ZOOM}
    />
  );
}

export { normalizeProductFraming };
export type { ProductFraming };
