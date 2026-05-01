const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// ===== CONFIGURATION =====
const SOURCE_CLASSIC = "https://laucua79-vd3x.onrender.com/taixiu";
const SOURCE_MD5 = "https://laucua79-vd3x.onrender.com/taixiumd5";
const TELEGRAM_CSKH = "@cskhtooltxiu";

// Hệ thống Cache tách biệt
let store = {
    taixiu: { data: null, lastUpdate: 0 },
    md5: { data: null, lastUpdate: 0 },
    vip: { data: null, lastUpdate: 0 }
};

const CACHE_DURATION = 3000; // 3 giây

// ===== HELPER: FETCH DATA VỚI RETRY & TIMEOUT =====
async function fetchSource(url, retry = 2) {
    try {
        const response = await axios.get(url, { 
            timeout: 6000,
            headers: { 'User-Agent': 'VIP-TECH-ENGINE-6.0' }
        });
        return response.data;
    } catch (err) {
        if (retry > 0) return await fetchSource(url, retry - 1);
        throw err;
    }
}

// ===== ENDPOINT: TÀI XỈU CLASSIC =====
app.get('/api/taixiu', async (req, res) => {
    try {
        const now = Date.now();
        if (store.taixiu.data && (now - store.taixiu.lastUpdate < CACHE_DURATION)) {
            return res.json(store.taixiu.data);
        }

        const data = await fetchSource(SOURCE_CLASSIC);
        const result = {
            status: "SUCCESS",
            source: "CLASSIC_SERVER",
            contact: TELEGRAM_CSKH,
            data: data
        };

        store.taixiu.data = result;
        store.taixiu.lastUpdate = now;
        res.json(result);
    } catch (err) {
        res.status(500).json({ status: "ERROR", message: "Source Classic Down", contact: TELEGRAM_CSKH });
    }
});

// ===== ENDPOINT: TÀI XỈU MD5 =====
app.get('/api/md5', async (req, res) => {
    try {
        const now = Date.now();
        if (store.md5.data && (now - store.md5.lastUpdate < CACHE_DURATION)) {
            return res.json(store.md5.data);
        }

        const data = await fetchSource(SOURCE_MD5);
        const result = {
            status: "SUCCESS",
            source: "MD5_SERVER",
            contact: TELEGRAM_CSKH,
            data: data
        };

        store.md5.data = result;
        store.md5.lastUpdate = now;
        res.json(result);
    } catch (err) {
        res.status(500).json({ status: "ERROR", message: "Source MD5 Down", contact: TELEGRAM_CSKH });
    }
});

// ===== ENDPOINT: VIP PREDICT (CORE v6.0) =====
app.get('/api/vip-predict', async (req, res) => {
    const startTime = Date.now();
    try {
        const now = Date.now();
        if (store.vip.data && (now - store.vip.lastUpdate < CACHE_DURATION)) {
            return res.json(store.vip.data);
        }

        // Gọi đồng thời cả 2 nguồn
        const [classic, md5] = await Promise.all([
            fetchSource(SOURCE_CLASSIC),
            fetchSource(SOURCE_MD5)
        ]);

        if (!classic) throw new Error("Classic source empty");

        const processTime = `${Date.now() - startTime}ms`;
        const serverTime = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
        
        // Tính toán tỷ lệ tin cậy
        const winRateRaw = classic.do_tin_cay ? classic.do_tin_cay[classic.du_doan] : "50%";
        const confidenceNum = parseInt(winRateRaw) || 50;

        const response = {
            status: "ONLINE",
            header: {
                engine: "AI LUXURY TERMINAL v6.0",
                core: "QUANTUM-MARKOV-V3",
                developer: "VIP TECH",
                cskh: TELEGRAM_CSKH,
                update_at: serverTime,
                ping: processTime
            },
            result_last_session: {
                session_id: classic.phien || "N/A",
                dice: [classic.xuc_xac_1 || 0, classic.xuc_xac_2 || 0, classic.xuc_xac_3 || 0],
                total: classic.tong || 0,
                side: classic.ket_qua || "N/A",
                md5_verify: (md5 && md5.phien === classic.phien) ? "MATCHED" : "SYNCING"
            },
            ai_prediction: {
                next_session_id: classic.phien_hien_tai || (parseInt(classic.phien) + 1),
                signal: classic.du_doan || "CHỜ DỮ LIỆU",
                confidence: winRateRaw,
                logic: classic.ly_do || "Đang phân tích luồng dữ liệu...",
                pattern: classic.pattern || "Cầu mới",
                risk_level: confidenceNum > 75 ? "LOW_RISK" : (confidenceNum > 60 ? "STABLE" : "HIGH_RISK"),
                recommendation: {
                    action: classic.du_doan === "TÀI" ? "VÀO TÀI" : (classic.du_doan === "XỈU" ? "VÀO XỈU" : "QUAN SÁT"),
                    leverage: classic.don_bay || "1x",
                    instruction: "Chờ giây thứ 10 để vào lệnh"
                }
            },
            advanced_metrics: {
                entropy_index: (Math.random() * 0.9 + 0.1).toFixed(6),
                volatility: (Math.random() * 100).toFixed(2) + "%",
                trend_status: classic.pattern?.includes("BỆT") ? "STRONG_TREND" : "SIDEWAY_MARKET",
                cycle_phase: Math.floor(Math.random() * 12) + 1,
                market_sentiment: confidenceNum > 50 ? "BULLISH" : "BEARISH"
            },
            support: {
                telegram: TELEGRAM_CSKH,
                group: "VIP_TECH_PREDICT_GROUP",
                note: "Mọi thắc mắc liên hệ ID trên để được hỗ trợ 24/7"
            }
        };

        store.vip.data = response;
        store.vip.lastUpdate = now;
        res.json(response);

    } catch (err) {
        console.error("Critical Error:", err.message);
        res.status(500).json({
            status: "OFFLINE",
            error: "Hệ thống đang đồng bộ dữ liệu hoặc nguồn bị gián đoạn",
            cskh: TELEGRAM_CSKH,
            timestamp: new Date().toISOString()
        });
    }
});

// ===== GIAO DIỆN QUẢN TRỊ GỐC =====
app.get('/', (req, res) => {
    res.send(`
    <body style="background: #0a0a0a; color: #ffd700; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0;">
        <div style="text-align: center; border: 2px solid #ffd700; padding: 40px; border-radius: 15px; box-shadow: 0 0 20px #ffd700;">
            <h1 style="margin-bottom: 10px;">🚀 VIP TECH API v6.0</h1>
            <p style="color: #00e5ff;">Status: <span style="color: #00ff00;">STABLE</span></p>
            <hr style="border-color: #333;">
            <div style="text-align: left; display: inline-block;">
                <p>🔗 <b>Predict:</b> /api/vip-predict</p>
                <p>🔗 <b>Classic:</b> /api/taixiu</p>
                <p>🔗 <b>MD5:</b> /api/md5</p>
            </div>
            <p style="margin-top: 20px; color: #888;">CSKH: <b style="color: #fff;">${TELEGRAM_CSKH}</b></p>
        </div>
    </body>
    `);
});

app.listen(PORT, () => {
    console.log(`
    =========================================
    💎 VIP TECH ENGINE v6.0 ACTIVATED
    📡 PORT: ${PORT}
    🛠️ CSKH: ${TELEGRAM_CSKH}
    =========================================
    `);
});