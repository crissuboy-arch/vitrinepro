// Shared shape for a business review. Backed by the existing `reviews` table
// (see migration 009). Field mapping: reviewer_name -> author_name,
// approved -> is_approved.
export interface Review {
  id: string;
  business_id: string;
  author_name: string;
  reviewer_email?: string | null;
  rating: number;
  comment?: string | null;
  photo_url?: string | null;
  verified?: boolean | null;
  is_approved?: boolean | null;
  owner_reply?: string | null;
  owner_reply_at?: string | null;
  created_at: string;
}
