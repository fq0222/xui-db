const logger = require('../log/logger');

const API_KEY = process.env.API_KEY || 'your-key'; // 建议从环境变量中读取密钥

function apiKeyAuth(req, res, next) {
    logger.info(`apiKeyAuth ip: ${req.ip}, cf-connecting-ip: ${req.headers['cf-connecting-ip']}`); // 记录请求头信息
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing or invalid Authorization header' });
    }

    const token = authHeader.split(' ')[1];

    if (token !== API_KEY) {
        logger.warn(`Unauthorized access attempt with token: ${token}`);
        return res.status(403).json({ error: 'Invalid API Key' });
    }

    next(); // 授权通过
}

module.exports = apiKeyAuth;
