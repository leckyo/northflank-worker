const express = require('express');
const crypto = require('crypto');
const app = express();
const PORT = process.env.PORT || 8080;
function bitcoinRipemd160ForSha256(sha256Bytes) {
    const X = new Uint32Array(16);
    for (let i = 0; i < 8; i++) {
        X[i] = sha256Bytes[i*4] | (sha256Bytes[i*4+1]<<8) | (sha256Bytes[i*4+2]<<16) | (sha256Bytes[i*4+3]<<24);
    }
    X[8] = 0x80; X[14] = 256;

    let h0 = 0x67452301, h1 = 0xEFCDAB89, h2 = 0x98BADCFE, h3 = 0x10325476, h4 = 0xC3D2E1F0;
    const rol = (v, s) => (v << s) | (v >>> (32 - s));
    const F1 = (x, y, z) => x ^ y ^ z; const F2 = (x, y, z) => (x & y) | (~x & z);
    const F3 = (x, y, z) => (x | ~y) ^ z; const F4 = (x, y, z) => (x & z) | (y & ~z);
    const F5 = (x, y, z) => x ^ (y | ~z);

    let a = h0, b = h1, c = h2, d = h3, e = h4;
    let aa = h0, bb = h1, cc = h2, dd = h3, ee = h4;

    const stepL = (f, K, r, s) => { let t = (rol(a + f(b, c, d) + X[r] + K, s) + e) | 0; a = e; e = d; d = rol(c, 10); c = b; b = t; };
    const stepR = (f, K, r, s) => { let t = (rol(aa + f(bb, cc, dd) + X[r] + K, s) + ee) | 0; aa = ee; ee = dd; dd = rol(cc, 10); cc = bb; bb = t; };

    const r1=[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15], s1=[11,14,15,12,5,8,7,9,11,13,14,15,6,7,9,8];
    for(let j=0; j<16; j++) stepL(F1, 0, r1[j], s1[j]);
    const r2=[7,4,13,1,10,6,15,3,12,0,9,5,2,14,11,8], s2=[7,6,8,13,11,9,7,15,7,12,15,9,11,7,13,12];
    for(let j=0; j<16; j++) stepL(F2, 0x5A827999, r2[j], s2[j]);
    const r3=[3,10,14,4,9,15,8,1,2,7,0,6,13,11,5,12], s3=[11,13,6,7,14,9,13,15,14,8,13,6,5,12,7,5];
    for(let j=0; j<16; j++) stepL(F3, 0x6ED9EBA1, r3[j], s3[j]);
    const r4=[1,9,11,10,0,8,12,4,13,3,7,15,14,5,6,2], s4=[11,12,14,15,14,15,9,8,9,14,5,6,8,6,5,12];
    for(let j=0; j<16; j++) stepL(F4, 0x8F1BBCDC, r4[j], s4[j]);
    const r5=[4,0,5,9,7,12,2,10,14,1,3,8,11,6,15,13], s5=[9,15,5,11,6,8,13,12,5,12,13,14,11,8,5,6];
    for(let j=0; j<16; j++) stepL(F5, 0xA953FD4E, r5[j], s5[j]);

    const rr1=[5,14,7,0,9,2,11,4,13,6,15,8,1,10,3,12], ss1=[8,9,9,11,13,15,15,5,7,7,8,11,14,14,12,6];
    for(let j=0; j<16; j++) stepR(F5, 0x50A28BE6, rr1[j], ss1[j]);
    const rr2=[6,11,3,7,0,13,5,10,14,15,8,12,4,9,1,2], ss2=[9,13,15,7,12,8,9,11,7,7,12,7,6,15,13,11];
    for(let j=0; j<16; j++) stepR(F4, 0x5C4DD124, rr2[j], ss2[j]);
    const rr3=[15,5,1,3,7,14,6,9,11,8,12,2,10,0,4,13], ss3=[9,7,15,11,8,6,6,14,12,13,5,14,13,13,7,5];
    for(let j=0; j<16; j++) stepR(F3, 0x6D703EF3, rr3[j], ss3[j]);
    const rr4=[8,6,4,1,3,11,15,0,5,12,2,13,9,7,10,14], ss4=[15,5,8,11,14,14,6,14,6,9,12,9,12,5,15,8];
    for(let j=0; j<16; j++) stepR(F2, 0x7A6D76E9, rr4[j], ss4[j]);
    const rr5=[12,15,10,4,1,5,8,7,6,2,13,14,0,3,9,11], ss5=[8,5,12,9,12,5,14,6,8,13,6,5,15,13,11,11];
    for(let j=0; j<16; j++) stepR(F1, 0, rr5[j], ss5[j]);

    let temp = (h1 + c + dd) | 0; h1 = (h2 + d + ee) | 0; h2 = (h3 + e + aa) | 0; h3 = (h4 + a + bb) | 0; h4 = (h0 + b + cc) | 0; h0 = temp;

    const out = new Uint8Array(20);
    for (let i = 0; i < 4; i++) {
        out[i] = (h0>>>(i*8))&0xFF; out[i+4] = (h1>>>(i*8))&0xFF; out[i+8] = (h2>>>(i*8))&0xFF; out[i+12] = (h3>>>(i*8))&0xFF; out[i+16] = (h4>>>(i*8))&0xFF;
    }
    return out;
}

const P = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2Fn;
function modInverse(a, m) {
    let m0 = m, y = 0n, x = 1n; if (m === 1n) return 0n;
    let b = ((a % m) + m) % m;
    while (b > 1n) { let q = b / m; let t = m; m = b % m; b = t; t = y; y = x - q * y; x = t; }
    return x < 0n ? x + m0 : x;
}

function deriveCompressedPublicKeyBytes(privateKeyBigInt) {
    let Gx = 0x79BE667EF9DCBBAC55A06295CE870B07029BFCDB2DCE28D959F2815B16F81798n;
    let Gy = 0x483ADA7726A3C4655DA4FBFC0E1108A8FD17B448A68554199C47D08FFB10D4B8n;
    let Ax = 0n, Ay = 0n, isEmpty = true;
    let d = privateKeyBigInt;

    function addPoints(x1, y1, x2, y2) {
        if (x1 === x2 && y1 === y2) {
            let num = (3n * x1 * x1) % P; let den = (2n * y1) % P;
            let lambda = (num * modInverse(den, P)) % P;
            let x3 = ((lambda * lambda - 2n * x1) % P + P) % P;
            let y3 = ((lambda * (x1 - x3) - y1) % P + P) % P;
            return { x: x3, y: y3 };
        } else {
            let num = ((y2 - y1) % P + P) % P; let den = ((x2 - x1) % P + P) % P;
            let lambda = (num * modInverse(den, P)) % P;
            let x3 = ((lambda * lambda - x1 - x2) % P + P) % P;
            let y3 = ((lambda * (x1 - x3) - y1) % P + P) % P;
            return { x: x3, y: y3 };
        }
    }

    while (d > 0n) {
        if ((d & 1n) === 1n) {
            if (isEmpty) { Ax = Gx; Ay = Gy; isEmpty = false; }
            else { const res = addPoints(Ax, Ay, Gx, Gy); Ax = res.x; Ay = res.y; }
        }
        const doubled = addPoints(Gx, Gy, Gx, Gy);
        Gx = doubled.x; Gy = doubled.y;
        d >>= 1n;
    }
    
    const compressed = new Uint8Array(33);
    compressed[0] = ((Ay & 1n) === 0n) ? 0x02 : 0x03;
    let hexX = Ax.toString(16).padStart(64, '0');
    for (let i = 0; i < 32; i++) compressed[i + 1] = parseInt(hexX.substr(i * 2, 2), 16);
    return compressed;
}

const bytesToHex = (bytes) => Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") return res.sendStatus(200);
    next();
});
app.get('/api/scan', async (req, res) => {
    const startHex = req.query.start || "";
    const targetHash160 = req.query.target || "";
    const count = parseInt(req.query.count || "5");

    if (!startHex || !targetHash160) {
        return res.status(400).json({ error: "Missing required parameters" });
    }

    try {
        let currentKeyBig = BigInt("0x" + startHex.replace(/^0x/i, '').trim());
        const cleanTarget = targetHash160.trim().toLowerCase();
        
        let matchFound = false;
        let winningKey = "";
        let keysCheckedCounter = 0;

        for (let i = 0; i < count; i++) {
            const pubKeyBytes = deriveCompressedPublicKeyBytes(currentKeyBig);
            const sha256Bytes = new Uint8Array(crypto.createHash('sha256').update(pubKeyBytes).digest());
            const hash160Bytes = bitcoinRipemd160ForSha256(sha256Bytes);
            const currentHash160Hex = bytesToHex(hash160Bytes);

            if (currentHash160Hex === cleanTarget) { 
                matchFound = true;
                winningKey = currentKeyBig.toString(16).padStart(64, '0');
                break;
            }
            currentKeyBig++;
            keysCheckedCounter++;
        }

        return res.json({
            found: matchFound, 
            winningKey: winningKey,
            lastScanned: currentKeyBig.toString(16), 
            keysChecked: keysCheckedCounter
        });

    } catch (err) {
        return res.status(500).json({ error: err.message, found: false });
    }
});

app.listen(PORT, () => console.log(`Northflank Scanning Engine running on port ${PORT}`));
