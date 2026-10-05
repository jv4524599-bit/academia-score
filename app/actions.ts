'use server';

import { db } from '@/lib/db';
import { getOrCreateSessionId } from '@/lib/session';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { revalidatePath } from 'next/cache';

const FIELD_MAX_LENGTH = 300;
const MESSAGE_MAX_LENGTH = 2000;

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
  // Formulário público, sem login -- só o rate limit por IP evita que um
  // bot encha a tabela de leads falsos (não tinha limite nenhum antes).
  const ip = getClientIp();
  if (!checkRateLimit(`partner-lead:${ip}`, 5, 10 * 60 * 1000)) {
    return { ok: false, error: 'Muitas tentativas. Aguarde alguns minutos e tente de novo.' };
  }

  const academia = String(formData.get('academia') || '').trim().slice(0, FIELD_MAX_LENGTH);
  const responsavel = String(formData.get('responsavel') || '').trim().slice(0, FIELD_MAX_LENGTH);
  const contato = String(formData.get('contato') || '').trim().slice(0, FIELD_MAX_LENGTH);
  const mensagem = String(formData.get('mensagem') || '').trim().slice(0, MESSAGE_MAX_LENGTH);

  if (!academia || !responsavel || !contato) {
    return { ok: false, error: 'Preencha nome da academia, seu nome e um contato.' };
  }

  await db.partnerLead.create({
    data: { academia, responsavel, contato, mensagem: mensagem || null },
  });

  return { ok: true };
}
