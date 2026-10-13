import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Crisp civil engineering logo: navy dark background with precision geometric delta / truss structure in blue and lime accents
const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0a1a2b"/>
      <stop offset="100%" stop-color="#050e18"/>
    </linearGradient>
    <linearGradient id="blueG" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#8acaff"/>
      <stop offset="100%" stop-color="#4aa8ff"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="104" fill="url(#bg)"/>
  <circle cx="256" cy="256" r="210" fill="none" stroke="#1d3d5d" stroke-width="4" stroke-dasharray="8 8"/>
  <!-- Engineering Truss Delta -->
  <polygon points="256,96 416,384 96,384" fill="none" stroke="url(#blueG)" stroke-width="22" stroke-linejoin="round"/>
  <!-- Internal truss cross-ties -->
  <line x1="256" y1="96" x2="256" y2="384" stroke="#4aa8ff" stroke-width="12" stroke-opacity="0.8"/>
  <line x1="176" y1="240" x2="336" y2="240" stroke="#4aa8ff" stroke-width="12" stroke-opacity="0.8"/>
  <line x1="176" y1="240" x2="256" y2="384" stroke="#b8ff5c" stroke-width="10" stroke-opacity="0.9"/>
  <line x1="336" y1="240" x2="256" y2="384" stroke="#b8ff5c" stroke-width="10" stroke-opacity="0.9"/>
  <!-- Apex nodal pins -->
  <circle cx="256" cy="96" r="14" fill="#b8ff5c"/>
  <circle cx="96" cy="384" r="14" fill="#4aa8ff"/>
  <circle cx="416" cy="384" r="14" fill="#4aa8ff"/>
  <circle cx="256" cy="384" r="10" fill="#eaf4ff"/>
  <circle cx="176" cy="240" r="10" fill="#eaf4ff"/>
  <circle cx="336" cy="240" r="10" fill="#eaf4ff"/>
</svg>`;

const svgMaskable = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgm" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0a1a2b"/>
      <stop offset="100%" stop-color="#050e18"/>
    </linearGradient>
    <linearGradient id="blueGm" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#8acaff"/>
      <stop offset="100%" stop-color="#4aa8ff"/>
    </linearGradient>
  </defs>
  <!-- Full bleed background for maskable -->
  <rect width="512" height="512" fill="url(#bgm)"/>
  <circle cx="256" cy="256" r="170" fill="none" stroke="#1d3d5d" stroke-width="3" stroke-dasharray="6 6"/>
  <!-- Within 80% safe zone (center 256, size ~280) -->
  <polygon points="256,130 380,360 132,360" fill="none" stroke="url(#blueGm)" stroke-width="18" stroke-linejoin="round"/>
  <line x1="256" y1="130" x2="256" y2="360" stroke="#4aa8ff" stroke-width="10" stroke-opacity="0.8"/>
  <line x1="194" y1="245" x2="318" y2="245" stroke="#4aa8ff" stroke-width="10" stroke-opacity="0.8"/>
  <line x1="194" y1="245" x2="256" y2="360" stroke="#b8ff5c" stroke-width="8" stroke-opacity="0.9"/>
  <line x1="318" y1="245" x2="256" y2="360" stroke="#b8ff5c" stroke-width="8" stroke-opacity="0.9"/>
  <circle cx="256" cy="130" r="12" fill="#b8ff5c"/>
  <circle cx="132" cy="360" r="12" fill="#4aa8ff"/>
  <circle cx="380" cy="360" r="12" fill="#4aa8ff"/>
  <circle cx="256" cy="360" r="8" fill="#eaf4ff"/>
</svg>`;

fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgIcon, 'utf8');

async function buildPngs() {
  const buf = Buffer.from(svgIcon);
  const bufMaskable = Buffer.from(svgMaskable);

  await sharp(buf).resize(192, 192).png().toFile(path.join(publicDir, 'pwa-192x192.png'));
  await sharp(buf).resize(512, 512).png().toFile(path.join(publicDir, 'pwa-512x512.png'));
  await sharp(bufMaskable).resize(512, 512).png().toFile(path.join(publicDir, 'pwa-maskable-512x512.png'));
  await sharp(buf).resize(180, 180).png().toFile(path.join(publicDir, 'apple-touch-icon.png'));

  // Also support icon-192.png for backwards compat if referenced
  const iconsSubdir = path.join(publicDir, 'icons');
  if (!fs.existsSync(iconsSubdir)) fs.mkdirSync(iconsSubdir, { recursive: true });
  await sharp(buf).resize(192, 192).png().toFile(path.join(iconsSubdir, 'icon-192.png'));
  await sharp(buf).resize(180, 180).png().toFile(path.join(iconsSubdir, 'apple-touch-icon.png'));

  console.log('All icons generated successfully!');
}

buildPngs().catch(err => {
  console.error(err);
  process.exit(1);
});
