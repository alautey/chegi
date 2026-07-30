import sharp from 'sharp';
import pngToIco from 'png-to-ico';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const svgPath = path.join(dir, 'icon-source.svg');
const sizes = [16, 24, 32, 48, 64, 128, 256];

const buffers = await Promise.all(
  sizes.map((size) => sharp(svgPath).resize(size, size).png().toBuffer()),
);

const ico = await pngToIco(buffers);
fs.writeFileSync(path.join(dir, 'icon.ico'), ico);

// Also keep a large PNG around for reference / other platforms.
await sharp(svgPath).resize(512, 512).png().toFile(path.join(dir, 'icon.png'));

console.log('Wrote icon.ico and icon.png');
