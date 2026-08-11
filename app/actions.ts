'use server';

import { db } from '@/lib/db';
import { getOrCreateSessionId } from '@/lib/session';
import { revalidatePath } from 'next/cache';

// Favoritar / desfavoritar uma academia -- vinculado ao cookie de sessão
// (sem exigir login), igual ao localStorage `favorites-list` do protótipo.
export async function toggleFavorite(gymId: string) {
  const sessionId = getOrCreateSessionId();

  const existing = await db.favorite.findUnique({
    where: { gymId_sessionId: { gymId, sessionId } },
  });

  if (existing) {
    await db.favorite.delete({ where: { id: existing.id } });
  } else {
    await db.favorite.create({ data: { gymId, sessionId } });
  }

  revalidatePath('/');
  revalidatePath('/academia/[slug]', 'page');
  return { favorited: !existing };
}

// Formulário "Quero ser parceira" do rodapé -- equivalente ao
// sendPartnerContact() do protótipo (que só compunha um mailto);
// aqui persistimos de verdade no modelo PartnerLead já existente no schema.
export async function createPartnerLead(formData: FormData) {
  const academia = String(formData.get('academia') || '').trim();
  const responsavel = String(formData.get('responsavel') || '').trim();
  const contato = String(formData.get('contato') || '').trim();
  const mensagem = String(formData.get('mensagem') || '').trim();

  if (!academia || !responsavel || !contato) {
    return { ok: false, error: 'Preencha nome da academia, seu nome e um contato.' };
  }

  await db.partnerLead.create({
    data: { academia, responsavel, contato, mensagem: mensagem || null },
  });

  return { ok: true };
}
