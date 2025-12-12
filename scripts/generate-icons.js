// Script to generate PWA icons from SVG
// This requires sharp: npm install --save-dev sharp

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [192, 512];
const sourceIcon = path.join(__dirname, '../public/icon-source.svg');
const outputDir = path.join(__dirname, '../public');

async function generateIcons() {
  try {
    for (const size of sizes) {
      const outputPath = path.join(outputDir, `icon-${size}x${size}.png`);
      await sharp(sourceIcon)
        .resize(size, size)
        .png()
        .toFile(outputPath);
      console.log(`Generated ${outputPath}`);
    }
    
    // Also generate favicon
    await sharp(sourceIcon)
      .resize(48, 48)
      .png()
      .toFile(path.join(outputDir, 'favicon.png'));
    console.log('Generated favicon.png');
    
    // Generate apple-touch-icon (180x180)
    await sharp(sourceIcon)
      .resize(180, 180)
      .png()
      .toFile(path.join(outputDir, 'apple-touch-icon.png'));
    console.log('Generated apple-touch-icon.png');
    
  } catch (error) {
    console.error('Error generating icons:', error);
    console.log('\nNote: This script requires the "sharp" package.');
    console.log('Install it with: npm install --save-dev sharp');
  }
}

generateIcons();

