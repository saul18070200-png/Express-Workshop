import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const input = path.join(__dirname, 'public', 'logo.png');

const sizes = [
  { size: 192, out: path.join(__dirname, 'public', 'pwa-192x192.png') },
  { size: 512, out: path.join(__dirname, 'public', 'pwa-512x512.png') },
];

for (const { size, out } of sizes) {
  // Use the EXACT crop the user provided, no background color extensions, no padding.
  // Just standard resize to fit exact dimensions for PWA requirements.
  await sharp(input)
    .resize(size, size, { fit: 'fill' }) // fill ensures we use the exact user crop footprint
    .png()
    .toFile(out);

  console.log(`Generated: ${out}`);
}

console.log('Done!');
