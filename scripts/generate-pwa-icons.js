// Simple script to generate PWA icons using canvas
// Run with: node scripts/generate-pwa-icons.js
// Requires: npm install canvas (or use browser-based generation)

const fs = require('fs');
const path = require('path');

// Check if we're in a Node.js environment with canvas
let canvas;
try {
  const { createCanvas } = require('canvas');
  canvas = createCanvas;
} catch (e) {
  console.log('Canvas library not found. Generating HTML file to create icons in browser...');
  generateHTMLIconCreator();
  process.exit(0);
}

function generateIcon(size) {
  const canv = canvas(size, size);
  const ctx = canv.getContext('2d');
  
  // Black background
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, size, size);
  
  // White text
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Calculate font sizes
  const mainFontSize = size * 0.1875;
  const subFontSize = size * 0.125;
  
  // Draw "ocho"
  ctx.font = `300 ${mainFontSize}px system-ui, -apple-system, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif`;
  ctx.fillText('ocho', size / 2, size * 0.39);
  
  // Draw "construction"
  ctx.font = `200 ${subFontSize}px system-ui, -apple-system, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif`;
  ctx.globalAlpha = 0.9;
  ctx.fillText('construction', size / 2, size * 0.547);
  ctx.globalAlpha = 1.0;
  
  return canv.toBuffer('image/png');
}

function generateHTMLIconCreator() {
  const html = `<!DOCTYPE html>
<html>
<head>
  <title>Generate Icons</title>
  <script>
    function downloadIcon(size) {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, size, size);
      
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      const mainFontSize = size * 0.1875;
      const subFontSize = size * 0.125;
      
      ctx.font = \`300 \${mainFontSize}px system-ui, -apple-system, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif\`;
      ctx.fillText('ocho', size / 2, size * 0.39);
      
      ctx.font = \`200 \${subFontSize}px system-ui, -apple-system, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif\`;
      ctx.globalAlpha = 0.9;
      ctx.fillText('construction', size / 2, size * 0.547);
      ctx.globalAlpha = 1.0;
      
      canvas.toBlob(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = \`icon-\${size}x\${size}.png\`;
        a.click();
        URL.revokeObjectURL(url);
      });
    }
    
    window.onload = () => {
      [192, 512, 180, 48].forEach(size => {
        setTimeout(() => downloadIcon(size), size * 10);
      });
    };
  </script>
</head>
<body>
  <h1>Icon Generator</h1>
  <p>Icons should download automatically. If not, check your browser's download settings.</p>
  <button onclick="downloadIcon(192)">192x192</button>
  <button onclick="downloadIcon(512)">512x512</button>
  <button onclick="downloadIcon(180)">180x180</button>
  <button onclick="downloadIcon(48)">48x48</button>
</body>
</html>`;
  
  fs.writeFileSync(path.join(__dirname, '../public/generate-icons-auto.html'), html);
  console.log('Created public/generate-icons-auto.html');
  console.log('Open this file in your browser to generate icons automatically');
}

// Generate icons if canvas is available
const sizes = [
  { size: 192, name: 'icon-192x192.png' },
  { size: 512, name: 'icon-512x512.png' },
  { size: 180, name: 'apple-touch-icon.png' },
  { size: 48, name: 'favicon.png' }
];

const publicDir = path.join(__dirname, '../public');

sizes.forEach(({ size, name }) => {
  try {
    const buffer = generateIcon(size);
    const filePath = path.join(publicDir, name);
    fs.writeFileSync(filePath, buffer);
    console.log(`Generated ${name} (${size}x${size})`);
  } catch (error) {
    console.error(`Error generating ${name}:`, error.message);
  }
});

console.log('\nAll icons generated successfully!');

