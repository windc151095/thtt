import express from 'express';
import path from 'path';
import fs from 'fs';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, collection, getDocs, deleteDoc } from 'firebase/firestore';

const app = express();
app.use(express.json({ limit: '50mb' }));

const firebaseConfigStr = fs.readFileSync(path.join(process.cwd(), 'firebase-applet-config.json'), 'utf8');
const firebaseConfig = JSON.parse(firebaseConfigStr);
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId || '(default)');

// Default initial data
let defaultConfig = {
  fontSize: 11,
  textColor: '#4b5563',
  fontFamily: "'Google Sans', 'Be Vietnam Pro', sans-serif",
  headingColor1: '#1d4ed8',
  headingColor2: '#ef4444',
  borderColor1: '#1d4ed8',
  borderColor2: '#ef4444',
  borderColor3: '#93c5fd',
  backgroundColor: '#ffffff',
  fieldsConfig: {
    thucCanh: {
      type: "select",
      options: [
        "Thực cảnh 01. Được nuông chiều từ nhỏ",
        "Thực cảnh 02. Không biết ngày mai ra sao",
        "Thực cảnh 03. Mù quáng giữa đám đông",
        "Thực cảnh 04. Tiêu xài vượt quá khả năng",
        "Thực cảnh 05. Không ai dạy mình nên người",
        "Thực cảnh 06. Lớn lên trong sự thua kém",
        "Thực cảnh 07. Không mục đích, không mục tiêu",
        "Thực cảnh 08. Liên tục bị từ chối",
        "Thực cảnh 09. Cố gắng không được công nhận",
        "Thực cảnh 10. Không có hình mẫu lãnh đạo"
      ]
    }
  }
};

// API Routes
app.get('/api/config', async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  try {
    const docRef = doc(db, 'config', 'global');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      res.json({ ...defaultConfig, ...docSnap.data() });
    } else {
      res.json(defaultConfig);
    }
  } catch (e: any) {
    console.error('Error fetching config:', e);
    res.json({ ...defaultConfig, error: e.message || e.toString() });
  }
});

app.post('/api/config', async (req, res) => {
  try {
    const docRef = doc(db, 'config', 'global');
    await setDoc(docRef, req.body, { merge: true });
    res.json({ success: true, config: req.body });
  } catch (e: any) {
    console.error('Error saving config:', e);
    res.status(500).json({ error: e.message || 'Failed to save config' });
  }
});

app.get('/api/drafts', async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  try {
    const querySnapshot = await getDocs(collection(db, 'drafts'));
    const drafts: any[] = [];
    querySnapshot.forEach((doc) => {
      drafts.push(doc.data());
    });
    res.json(drafts);
  } catch (e) {
    console.error('Error fetching drafts:', e);
    res.json([]);
  }
});

app.post('/api/drafts', async (req, res) => {
  const { pin, data, timestamp } = req.body;
  if (!pin) {
    return res.status(400).json({ error: 'PIN is required' });
  }
  try {
    const docRef = doc(db, 'drafts', pin);
    await setDoc(docRef, { pin, data, timestamp });
    res.json({ success: true });
  } catch (e: any) {
    console.error('Error saving draft:', e);
    res.status(500).json({ error: e.message || 'Failed to save draft' });
  }
});

app.get('/api/drafts/:pin', async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  try {
    const docRef = doc(db, 'drafts', req.params.pin);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      res.json(docSnap.data());
    } else {
      res.status(404).json({ error: 'Draft not found' });
    }
  } catch (e: any) {
    console.error('Error fetching draft:', e);
    res.status(500).json({ error: e.message || 'Failed to fetch draft' });
  }
});

app.delete('/api/drafts/:pin', async (req, res) => {
  try {
    const docRef = doc(db, 'drafts', req.params.pin);
    await deleteDoc(docRef);
    res.json({ success: true });
  } catch (e: any) {
    console.error('Error deleting draft:', e);
    res.status(500).json({ error: e.message || 'Failed to delete draft' });
  }
});

async function startServer() {
  const PORT = 3000;

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
