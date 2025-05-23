const express = require('express');
const path = require('path');
const xuiRouter = require('./routes/xui');
const logger = require('./log/logger'); // 引入 logger 模块
const apikeyAuth = require('./mid/apikeyAuth'); // 引入 IP 白名单中间件


const PORT = process.env.PORT || 21211;

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'nginx.html'));
});

if (PORT === 21211) {
  app.get('/test', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'api.html'));
  });
}

// 使用 clients 路由模块
app.use('/xuiop', apikeyAuth, xuiRouter);


// 启动服务器
app.listen(PORT, () => {
  logger.info(`Server is running on http://localhost:${PORT}`); // 记录服务器启动信息
});
