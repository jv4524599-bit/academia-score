// Script de seed: popula o banco com os dados reais das academias
// cadastradas no protótipo, em todas as cidades do seed-data.json.
// Roda com: npm run db:seed
//
// Importante: o upsert de academia atualiza (não só cria) os campos a cada
// execução -- rodar o seed de novo depois de corrigir um dado no
// seed-data.json agora realmente aplica a correção no banco. Fotos não são
// re-sincronizadas no update (ver nota abaixo) para não duplicar registros
// a cada execução.

import { PrismaClient, Status } from '@prisma/client';
import seedData from './seed-data.json';

const prisma = new PrismaClient();

function mapStatus(v: string | undefined): Status {
  if (v === 'sim') return 'SIM';
  if (v === 'nao') return 'NAO';
  return 'A_CONFIRMAR';
}

// Cidades conhecidas pelo seed. A chave é o valor usado no campo "cidade"
// de cada academia em seed-data.json; o valor é o que vira a linha de City
// no banco. Pra adicionar uma cidade nova: cadastrar aqui + marcar as
// academias dela com "cidade": "<chave>" no seed-data.json.
const CITIES: Record<string, { nome: string; uf: string; slug: string }> = {
  'valparaiso-goias': { nome: 'Valparaíso de Goiás', uf: 'GO', slug: 'valparaiso-go' },
  'cidade-ocidental': { nome: 'Cidade Ocidental', uf: 'GO', slug: 'cidade-ocidental-go' },
};

// Academias antigas no seed-data.json que ainda não tinham o campo "cidade"
// caem aqui por padrão, pra não quebrar quem salvou o JSON antes dessa
// mudança.
const DEFAULT_CITY_KEY = 'valparaiso-goias';

async function main() {
  console.log(`Semeando ${seedData.length} academias...`);

  const cityIdByKey: Record<string, string> = {};
  for (const [key, c] of Object.entries(CITIES)) {
    const city = await prisma.city.upsert({
      where: { slug: c.slug },
      update: { nome: c.nome, uf: c.uf, ativa: true },
      create: { nome: c.nome, uf: c.uf, slug: c.slug, ativa: true },
    });
    cityIdByKey[key] = city.id;
    console.log(`Cidade pronta: ${city.nome} (${city.slug})`);
  }

  for (const g of seedData as any[]) {
    const cityKey = g.cidade && cityIdByKey[g.cidade] ? g.cidade : DEFAULT_CITY_KEY;
    const cityId = cityIdByKey[cityKey];

    const fields = {
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
      cityId,
    };

    const gym = await prisma.gym.upsert({
      where: { slug: g.slug },
      update: fields,
      create: {
        slug: g.slug,
        ...fields,
        photos: {
          create: (g.photoUrls || []).map((url: string, i: number) => ({
            url,
            ordem: i,
          })),
        },
      },
    });
    console.log(`  ✓ ${gym.name} (${CITIES[cityKey].nome})`);
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
