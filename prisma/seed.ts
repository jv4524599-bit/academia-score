// Script de seed: popula o banco com os dados reais das 25 academias
// já cadastradas no protótipo. Roda com: npm run db:seed

import { PrismaClient, Status } from '@prisma/client';
import seedData from './seed-data.json';

const prisma = new PrismaClient();

function mapStatus(v: string | undefined): Status {
  if (v === 'sim') return 'SIM';
  if (v === 'nao') return 'NAO';
  return 'A_CONFIRMAR';
}

async function main() {
  console.log(`Semeando ${seedData.length} academias...`);

  const city = await prisma.city.upsert({
    where: { slug: 'valparaiso-go' },
    update: {},
    create: {
      nome: 'Valparaíso de Goiás',
      uf: 'GO',
      slug: 'valparaiso-go',
      ativa: true,
    },
  });

  for (const g of seedData as any[]) {
    const gym = await prisma.gym.upsert({
      where: { slug: g.slug },
      update: {},
      create: {
        slug: g.slug,
        name: g.name,
        bairro: g.bairro,
        quadra: g.quadra ?? null,
        address: g.address,
        phone: g.phone || null,
        instagram: g.instagram || null,
        site: g.site || null,
        lat: g.lat ?? null,
        lng: g.lng ?? null,
        gympass: mapStatus(g.gympass),
        gympassNivel: g.gympassNivel || null,
        totalpass: mapStatus(g.totalpass),
        totalpassNivel: g.totalpassNivel || null,
        horarios: g.horarios || null,
        mensalidade: g.mensalidade ?? null,
        primeiraMensalidade: g.primeiraMensalidade ?? null,
        matricula: g.matricula ?? null,
        fidelidadeMeses: g.fidelidadeMeses ?? null,
        semFidelidade: g.semFidelidade ?? null,
        planoNome: g.planoNome || null,
        observacao: g.observacao || null,
        sourceNote: g.source_note || null,
        logoUrl: g.logoUrl || null,
        cityId: city.id,
        photos: {
          create: (g.photoUrls || []).map((url: string, i: number) => ({
            url,
            ordem: i,
          })),
        },
      },
    });
    console.log(`  ✓ ${gym.name}`);
  }

  console.log('Seed concluído.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
