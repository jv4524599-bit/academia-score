// Sobe todas as imagens de public/images/ (logos, photos, premium) para o
// bucket público "academia-score" no Supabase Storage, preservando a mesma
// estrutura de pastas (logos/..., photos/..., premium/...) -- assim as URLs
// no banco só trocam o prefixo local por https://<projeto>.supabase.co/storage/...
//
// Como rodar (no seu computador, com Node 18+):
//   SUPABASE_URL="https://mbzqjtjxradfypkphvbe.supabase.co" \
//   SUPABASE_ANON_KEY="cole-a-chave-anon-aqui" \
//   node scripts/upload-to-supabase-storage.mjs
//
// A chave "anon" não é secreta (é a mesma usada no navegador), mas o bucket
// está com uma policy temporária permitindo upload por ela -- depois do
// upload, essa policy de escrita é removida (fica só leitura pública).

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const BUCKET = 'academia-score';
const ROOT = join(process.cwd(), 'public', 'images');

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Defina SUPABASE_URL e SUPABASE_ANON_KEY antes de rodar.');
  process.exit(1);
}

const CONTENT_TYPES = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };

function walk(dir, base = '') {
  const entries = readdirSync(dir);
  let files = [];
  for (const entry of entries) {
    const full = join(dir, entry);
    const rel = base ? `${base}/${entry}` : entry;
    if (statSync(full).isDirectory()) {
      files = files.concat(walk(full, rel));
    } else {
      files.push({ full, rel });
    }
  }
  return files;
}

async function main() {
  const files = walk(ROOT, 'images');
  console.log(`Encontradas ${files.length} imagens em public/images/`);

  let ok = 0;
  let fail = 0;

  for (const { full, rel } of files) {
    const ext = extname(full).toLowerCase();
    const contentType = CONTENT_TYPES[ext] || 'application/octet-stream';
    const data = readFileSync(full);

    const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${rel}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': contentType,
        'x-upsert': 'true',
      },
      body: data,
    });

    if (res.ok) {
      ok++;
      process.stdout.write('.');
    } else {
      fail++;
      console.error(`\nFalhou: ${rel} -> ${res.status} ${await res.text()}`);
    }
  }

  console.log(`\n\nConcluído: ${ok} enviadas, ${fail} falharam.`);
  if (fail > 0) process.exit(1);
}

main();
