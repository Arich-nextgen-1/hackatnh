const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Initialize CRC32 Table
const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length);
  
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
  
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function makeIHDR(width, height) {
  const buf = Buffer.alloc(13);
  buf.writeUInt32BE(width, 0);
  buf.writeUInt32BE(height, 4);
  buf[8] = 8; // bit depth
  buf[9] = 2; // color type (RGB)
  buf[10] = 0; // compression
  buf[11] = 0; // filter
  buf[12] = 0; // interlace
  return buf;
}

function generateGradientPNG(width, height, outputPath) {
  const pngSignature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  
  // IHDR
  const ihdrData = makeIHDR(width, height);
  const ihdrChunk = makeChunk('IHDR', ihdrData);
  
  // IDAT raw bytes (Filter type 0 + RGB values)
  const raw = Buffer.alloc(height * (1 + width * 3));
  let pos = 0;
  for (let y = 0; y < height; y++) {
    raw[pos++] = 0; // Filter 0
    for (let x = 0; x < width; x++) {
      // Beautiful gradient matching MediRoute AI styling (Blue to light Purple)
      const r = Math.round(37 + (x / width) * 20); // ~2563EB primary blue components
      const g = Math.round(99 + (y / height) * 40);
      const b = Math.round(235 - (x / width) * 30);
      raw[pos++] = r;
      raw[pos++] = g;
      raw[pos++] = b;
    }
  }
  
  const compressed = zlib.deflateSync(raw);
  const idatChunk = makeChunk('IDAT', compressed);
  
  // IEND
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));
  
  const finalPng = Buffer.concat([pngSignature, ihdrChunk, idatChunk, iendChunk]);
  
  // Ensure directory exists
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(outputPath, finalPng);
  console.log(`[Screenshot Generator] Generated PNG (${width}x${height}) at: ${outputPath}`);
}

// Generate wide screenshot (desktop)
generateGradientPNG(1280, 720, path.join(__dirname, '../public/screenshots/wide.png'));

// Generate narrow screenshot (mobile)
generateGradientPNG(720, 1280, path.join(__dirname, '../public/screenshots/narrow.png'));
