'use client';

import { useState } from 'react';
import { reportReview } from '@/app/academia/[slug]/actions';

export default function ReportReviewButton({ reviewId, gymSlug }: { reviewId: string; gymSlug: string }) {
  const [reported, setReported] = useState(false);

  async function handleClick() {
    setReported(true);
    try {
      await reportReview(reviewId, gymSlug);
    } catch {
      setReported(false);
    }
  }

  return (
    <button className="report-link" onClick={handleClick} disabled={reported}>
      {reported ? '🚩 Denunciado, obrigado' : '🚩 Denunciar'}
    </button>
  );
}
