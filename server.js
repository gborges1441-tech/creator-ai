const http = require('http');
const https = require('https');
const url = require('url');
const fs = require('fs');
const path = require('path');

const PORT = 3000;

const server = http.createServer((req, res) => {
    // Configurar CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;
    const query = parsedUrl.query;

    // Rota para servir arquivos estáticos
    if (pathname === '/' || pathname === '/index.html') {
        const filePath = path.join(__dirname, 'index.html');
        fs.readFile(filePath, (err, data) => {
            if (err) {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('404 Not Found');
                return;
            }
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(data);
        });
        return;
    }

    // Rota para proxy de imagens
    if (pathname === '/api/generate') {
        const prompt = query.prompt;
        const width = query.width || 768;
        const height = query.height || 432;
        const seed = query.seed || Math.floor(Math.random() * 1000000);

        if (!prompt) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Prompt é obrigatório' }));
            return;
        }

        const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${width}&height=${height}&model=flux&seed=${seed}`;

        https.get(imageUrl, (imageRes) => {
            res.writeHead(imageRes.statusCode, {
                'Content-Type': imageRes.headers['content-type'],
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'public, max-age=31536000'
            });
            imageRes.pipe(res);
        }).on('error', (err) => {
            console.error('Erro ao buscar imagem:', err);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Erro ao gerar imagem' }));
        });
        return;
    }

    // Servir arquivos estáticos (CSS, JS, etc)
    const filePath = path.join(__dirname, pathname);
    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('404 Not Found');
            return;
        }

        let contentType = 'text/plain';
        if (filePath.endsWith('.js')) contentType = 'application/javascript';
        else if (filePath.endsWith('.css')) contentType = 'text/css';
        else if (filePath.endsWith('.png')) contentType = 'image/png';
        else if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) contentType = 'image/jpeg';

        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
    });
});

server.listen(PORT, () => {
    console.log(`✨ CreatorAI Studio rodando em http://localhost:${PORT}`);
    console.log(`Acesse: http://localhost:${PORT}`);
});
