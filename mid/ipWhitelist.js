const logger = require('../log/logger'); // 引入 logger 模块

const allowedIPs = [process.env.Allowed_IP]; // 替换为允许访问的 IP 地址列表

function ipWhitelist(req, res, next) {
    // 优先从 Cloudflare 的请求头中获取真实客户端 IP
    const clientIP = req.headers['cf-connecting-ip'] || req.ip.replace('::ffff:', '');
    logger.info(`Client IP: ${clientIP}`); // 记录客户端 IP

    // 如果是本地请求（127.0.0.1 或 ::1），直接放行
    if (clientIP === '127.0.0.1' || clientIP === '::1') {
        return next();
    }

    // 检查 IP 是否在白名单中
    if (allowedIPs.includes(clientIP)) {
        next(); // 如果 IP 在白名单中，继续处理请求
    } else {
        res.status(403).json({ error: 'Access denied: Your IP is not allowed to access this resource.' });
    }
}

module.exports = ipWhitelist;
