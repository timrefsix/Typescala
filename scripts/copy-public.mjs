import { cp, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const publicDir = join(process.cwd(), 'public');
const distDir = join(process.cwd(), 'dist');

async function main() {
  if (!existsSync(publicDir)) {
    return;
  }

  await mkdir(distDir, { recursive: true });
  await cp(publicDir, distDir, { recursive: true });
}

main().catch(error => {
  console.error('Failed to copy public assets:', error);
  process.exitCode = 1;
});
