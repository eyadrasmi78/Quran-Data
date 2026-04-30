import express from 'express';
import config from './config.mjs';
import cors from 'cors';
import helmet from 'helmet';
import rateLimiter from './middleware/rateLimiter.mjs';
import apiRoutes from './routes/apiRoutes.mjs';
import notFoundHandler from './utils/notFoundHandler.mjs';
import errorHandler from './utils/errorHandler.mjs';
import { loadAll } from './utils/dataStore.mjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataFolderPath     = path.join(__dirname, '..', 'data');
const apiDefinitionPath  = path.join(__dirname, '..', 'docs', 'api-definition.yaml');
const publicFolderPath   = path.join(__dirname, 'public');
const publicHtmlFilePath = path.join(__dirname, 'public', 'docs.html');

// Eager-load all Quran data into memory before accepting requests.
loadAll();

const app = express();

// Behind DigitalOcean App Platform / nginx — trust the first proxy hop so
// req.ip reflects the real client address instead of the gateway.
app.set('trust proxy', 1);

app.disable('x-powered-by');

// Security headers — CSP whitelists Google Fonts + mp3quran.net (audio source).
app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'"],
                styleSrc: ["'self'", "https://fonts.googleapis.com", "'unsafe-inline'"],
                fontSrc: ["'self'", "https://fonts.gstatic.com", 'data:'],
                imgSrc: ["'self'", 'data:'],
                mediaSrc: ["'self'", 'https://*.mp3quran.net'],
                connectSrc: ["'self'"],
                objectSrc: ["'none'"],
                frameAncestors: ["'none'"],
                baseUri: ["'self'"]
            }
        },
        crossOriginEmbedderPolicy: false, // allow loading external Google Fonts
        crossOriginResourcePolicy: { policy: 'cross-origin' }
    })
);

app.use(cors());

// ── Static assets (NOT rate-limited) ────────────────────────────────────
// Whitelist only the image folder and the public pages JSON.
// SQLite/CSV/raw verse JSON stay private.
app.use('/data/quran_image', express.static(path.join(dataFolderPath, 'quran_image')));
app.use('/data/pagesQuran.json', express.static(path.join(dataFolderPath, 'pagesQuran.json')));

app.use('/docs/api-definition.yaml', express.static(apiDefinitionPath));
app.use('/', express.static(publicFolderPath));
app.get('/docs', (req, res) => {
    res.sendFile(publicHtmlFilePath);
});

// ── Lightweight health check (NOT rate-limited, NOT touching JSON files) ─
app.get('/api/health', (req, res) => {
    res.json({ ok: true, ts: new Date().toISOString() });
});

// ── API (rate-limited) ─────────────────────────────────────────────────
app.use('/api', rateLimiter, apiRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(config.port, () => {
    console.log(`[QURAN-DATA]-[${new Date().toISOString()}] 🚀 Server is running on http://localhost:${config.port}`);
});
