'use client';

import { useState } from 'react';
import { toggleFavoriteOnGymPage } from '@/app/academia/[slug]/actions';

export default function GymFavoriteButton({
  gymId,
  gymSlug,
  initialFavorite,
}: {
  gymId: string;
  gymSlug: string;
  initialFavorite: boolean;
}) {
  const [fav, setFav] = useState(initialFavorite);
  const [busy, setBusy] = useState(false);

  async function handleClick() {
    setFav((f) => !f);
    setBusy(true);
    try {
      await toggleFavoriteOnGymPage(gymId, gymSlug);
    } catch {
      setFav((f) => !f);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button className="btn-sm fav-btn" onClick={handleClick} disabled={busy} title="Favoritar">
      {fav ? '❤️ Favoritada' : '🤍 Favoritar'}
    </button>
  );
}
