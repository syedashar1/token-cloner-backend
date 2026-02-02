import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

// =======================
// CONFIG
// =======================
const PORT = process.env.PORT || 3001;
const CACHE_TTL = Number(process.env.CACHE_TTL) || 10000;

const PUMP_URL =
  "https://frontend-api-v3.pump.fun/coins/for-you?offset=0&limit=100&includeNsfw=true";

// =======================
// MIDDLEWARE
// =======================
app.use(cors());
app.use(express.json());

// =======================
// SIMPLE CACHE
// =======================
let cache = null;
let lastFetch = 0;

function getCache() {
  if (!cache) return null;
  if (Date.now() - lastFetch > CACHE_TTL) return null;
  return cache;
}

function setCache(data) {
  cache = data;
  lastFetch = Date.now();
}

// =======================
// ROUTES
// =======================
app.get("/", (req, res) => {
  res.send("🚀 Pump.fun Proxy is running");
});

app.get("/get-pump-fun-tokens", async (req, res) => {
  try {
    const cached = getCache();
    if (cached) {
      return res.json({
        cached: true,
        count: cached.length || 0,
        data: cached
      });
    }

    const response = await fetch(PUMP_URL, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept": "application/json"
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({
        error: "Pump.fun API error",
        status: response.status
      });
    }

    const data = await response.json();
    setCache(data);

    res.json({
      cached: false,
      count: data.length || 0,
      data
    });
  } catch (err) {
    res.status(500).json({
      error: "Failed to fetch Pump.fun tokens",
      message: err.message
    });
  }
});

// =======================
// START SERVER
// =======================
app.listen(PORT, () => {
  console.log(`🔥 Pump Proxy running on http://localhost:${PORT}`);
  console.log(`➡️  Endpoint: /get-pump-fun-tokens`);
});
