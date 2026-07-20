const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 1x1 green PNG base64
const greenPngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
const buffer = Buffer.from(greenPngBase64, 'base64');

// Write mock PNG files
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), buffer);
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), buffer);
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), buffer);
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), buffer);

// Write SVG mask-icon
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="#22c55e">
  <circle cx="50" cy="50" r="40" />
</svg>`;
fs.writeFileSync(path.join(publicDir, 'mask-icon.svg'), svgContent);

console.log('✅ Mock PWA assets created successfully!');
