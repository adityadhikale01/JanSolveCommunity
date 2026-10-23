import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.resolve(__dirname, '../uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Media assets mapping
const offlineAssets = [
  // User Avatars
  {
    filename: 'avatar-admin.jpg',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
  },
  {
    filename: 'avatar-pooja.jpg',
    url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80',
  },
  {
    filename: 'avatar-amit.jpg',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
  },
  {
    filename: 'avatar-sunita.jpg',
    url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
  },
  {
    filename: 'avatar-rameshwar.jpg',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
  },
  {
    filename: 'avatar-birsa.jpg',
    url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&auto=format&fit=crop&q=80',
  },
  {
    filename: 'avatar-shabana.jpg',
    url: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200&auto=format&fit=crop&q=80',
  },
  {
    filename: 'avatar-anil.jpg',
    url: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=200&auto=format&fit=crop&q=80',
  },

  // Challenge Evidence Photos
  {
    filename: 'arsenic-handpump-sahibganj.jpg',
    url: 'https://images.unsplash.com/photo-1541888946425-d0fbb186156f?w=800&auto=format&fit=crop&q=80',
  },
  {
    filename: 'waste-dump-sakchi.jpg',
    url: 'https://images.unsplash.com/photo-1605600659873-d808a13e4d2a?w=800&auto=format&fit=crop&q=80',
  },
  {
    filename: 'phc-clinic-khunti.jpg',
    url: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=800&auto=format&fit=crop&q=80',
  },
  {
    filename: 'coal-dust-jharia.jpg',
    url: 'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?w=800&auto=format&fit=crop&q=80',
  },
  {
    filename: 'solar-grid-latehar.jpg',
    url: 'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=800&auto=format&fit=crop&q=80',
  },
  {
    filename: 'broken-bridge-barhi.jpg',
    url: 'https://images.unsplash.com/photo-1515263487990-61b07816b324?w=800&auto=format&fit=crop&q=80',
  },
  {
    filename: 'school-leak-dumka.jpg',
    url: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&auto=format&fit=crop&q=80',
  },
  {
    filename: 'tussar-silk-kuchai.jpg',
    url: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=800&auto=format&fit=crop&q=80',
  },
  {
    filename: 'pds-ration-palamu.jpg',
    url: 'https://images.unsplash.com/photo-1586769852044-692d6e3703f0?w=800&auto=format&fit=crop&q=80',
  },
  {
    filename: 'accessibility-chas.jpg',
    url: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&auto=format&fit=crop&q=80',
  },
  {
    filename: 'dry-borewell-deoghar.jpg',
    url: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&auto=format&fit=crop&q=80',
  },
  {
    filename: 'crop-damage-giridih.jpg',
    url: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800&auto=format&fit=crop&q=80',
  },
  {
    filename: 'snakebite-clinic-chaibasa.jpg',
    url: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=800&auto=format&fit=crop&q=80',
  },
  {
    filename: 'toilet-sanitation-ramgarh.jpg',
    url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&auto=format&fit=crop&q=80',
  },
  {
    filename: 'polluted-river-damodar.jpg',
    url: 'https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?w=800&auto=format&fit=crop&q=80',
  },
  {
    filename: 'pothole-road-godda.jpg',
    url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&auto=format&fit=crop&q=80',
  },
  {
    filename: 'science-lab-simdega.jpg',
    url: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800&auto=format&fit=crop&q=80',
  },
  {
    filename: 'burnt-transformer-garhwa.jpg',
    url: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=800&auto=format&fit=crop&q=80',
  },
  {
    filename: 'lac-cultivation-pakur.jpg',
    url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&auto=format&fit=crop&q=80',
  },
  {
    filename: 'ghat-road-lohardaga.jpg',
    url: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&auto=format&fit=crop&q=80',
  },
  {
    filename: 'digital-literacy-jamtara.jpg',
    url: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&auto=format&fit=crop&q=80',
  },
  {
    filename: 'pedestrian-overpass-ranchi.jpg',
    url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&auto=format&fit=crop&q=80',
  },
  {
    filename: 'silicosis-screening-koderma.jpg',
    url: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=800&auto=format&fit=crop&q=80',
  },
];

async function downloadAsset(item) {
  const filePath = path.join(uploadsDir, item.filename);

  // Skip if already downloaded and not empty
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    if (stats.size > 1024) {
      console.log(`[Offline Assets] Exists: ${item.filename} (${(stats.size / 1024).toFixed(1)} KB)`);
      return;
    }
  }

  console.log(`[Offline Assets] Downloading: ${item.filename}...`);
  try {
    const res = await fetch(item.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) JanSolveOfflineDownloader/1.0',
      },
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(filePath, buffer);
    console.log(`  ✓ Saved ${item.filename} (${(buffer.length / 1024).toFixed(1)} KB)`);
  } catch (err) {
    console.warn(`  ⚠ Failed to download ${item.filename} from URL: ${err.message}.`);
    // Create fallback SVG-based JPG or minimal PNG placeholder if needed
    if (!fs.existsSync(filePath)) {
      const minimalSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="100%" height="100%" fill="#1e293b"/><text x="50%" y="50%" fill="#e2e8f0" font-family="sans-serif" font-size="20" font-weight="bold" text-anchor="middle" dominant-baseline="middle">JanSolve Evidence: ${item.filename}</text></svg>`;
      fs.writeFileSync(filePath, minimalSvg, 'utf-8');
      console.log(`  ✓ Generated local fallback for ${item.filename}`);
    }
  }
}

export async function downloadAllOfflineAssets() {
  console.log(`[Offline Assets] Checking and downloading ${offlineAssets.length} offline media assets to backend/uploads...`);
  for (const asset of offlineAssets) {
    await downloadAsset(asset);
  }
  console.log('[Offline Assets] All offline assets verified on local disk.');
}

// Allow direct execution
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  downloadAllOfflineAssets()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
