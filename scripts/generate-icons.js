// Simple script to generate PWA icons
// Run with: node scripts/generate-icons.js

const fs = require('fs');
const path = require('path');

// Create a simple SVG icon
function createSVGIcon(size) {
  return `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#7c3aed;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#5b21b6;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#grad)" rx="${size * 0.2}"/>
  <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${size * 0.4}" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">🏗️</text>
  <text x="50%" y="${size * 0.75}" font-family="Arial, sans-serif" font-size="${size * 0.15}" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">PM</text>
</svg>`;
}

// Create public directory if it doesn't exist
const publicDir = path.join(__dirname, '..', 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Note: This creates SVG files. For proper PWA, you need PNG files.
// The HTML generator (pwa-icon-generator.html) can create PNG files.
console.log('Note: For proper PWA icons, please use the pwa-icon-generator.html file in the public folder.');
console.log('Open it in a browser and download the generated PNG files.');
console.log('Place them in the public folder as:');
console.log('  - pwa-192x192.png');
console.log('  - pwa-512x512.png');
console.log('  - apple-touch-icon.png');






