// Generate simple PNG icons for PWA without external dependencies
// These are minimal valid PNG files with the "OCHO" branding colors

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// CRC32 implementation for PNG chunks
function crc32(data) {
  let crc = -1;
  for (let i = 0; i < data.length; i++) {
    crc = (crc >>> 8) ^ crc32Table[(crc ^ data[i]) & 0xff];
  }
  return (crc ^ -1) >>> 0;
}

const crc32Table = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let j = 0; j < 8; j++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crc32Table[i] = c;
}

function createPNGChunk(type, data) {
  const typeBytes = Buffer.from(type, 'ascii');
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  
  const crcData = Buffer.concat([typeBytes, data]);
  const crcValue = crc32(crcData);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crcValue, 0);
  
  return Buffer.concat([length, typeBytes, data, crc]);
}

function createSimplePNG(size) {
  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  
  // IHDR chunk - image header
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);  // width
  ihdr.writeUInt32BE(size, 4);  // height
  ihdr.writeUInt8(8, 8);        // bit depth
  ihdr.writeUInt8(2, 9);        // color type (RGB)
  ihdr.writeUInt8(0, 10);       // compression
  ihdr.writeUInt8(0, 11);       // filter
  ihdr.writeUInt8(0, 12);       // interlace
  
  const ihdrChunk = createPNGChunk('IHDR', ihdr);
  
  // Create image data (black background with white "O" in center)
  const rawData = [];
  const centerX = size / 2;
  const centerY = size / 2;
  const outerRadius = size * 0.35;
  const innerRadius = size * 0.22;
  
  for (let y = 0; y < size; y++) {
    rawData.push(0); // filter byte (none)
    for (let x = 0; x < size; x++) {
      const dx = x - centerX;
      const dy = y - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      // Draw "O" ring
      if (dist >= innerRadius && dist <= outerRadius) {
        rawData.push(255, 255, 255); // white
      } else {
        rawData.push(0, 0, 0); // black
      }
    }
  }
  
  // Compress image data
  const compressed = zlib.deflateSync(Buffer.from(rawData), { level: 9 });
  const idatChunk = createPNGChunk('IDAT', compressed);
  
  // IEND chunk
  const iendChunk = createPNGChunk('IEND', Buffer.alloc(0));
  
  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Generate icons
const publicDir = path.join(__dirname, '../public');

const icons = [
  { size: 192, name: 'icon-192x192.png' },
  { size: 512, name: 'icon-512x512.png' },
  { size: 180, name: 'apple-touch-icon.png' }
];

console.log('Generating PWA icons...\n');

icons.forEach(({ size, name }) => {
  const pngBuffer = createSimplePNG(size);
  const filePath = path.join(publicDir, name);
  fs.writeFileSync(filePath, pngBuffer);
  console.log(`✓ Created ${name} (${size}x${size})`);
});

console.log('\nAll icons generated successfully!');
console.log('Run "npm run build" to rebuild with the new icons.');

