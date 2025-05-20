const express = require('express');
const router = express.Router();
const db = require('../db/dbHandler');
const logger = require('../log/logger');
const { restartXUI } = require('../shell/xuiRestart');


// 读取 client_infos 表的全部内容
router.get('/info-list', async (req, res) => {
  try {
    const clients = await db.getAllClients();
    res.json(clients);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 根据 email 查询 client_infos 表中的 up, down, total 字段的值
router.get('/flow/:email/flow', async (req, res) => {
    const { email } = req.params;
    logger.info(`/flow/:email/flow Fetching flow for email: ${email}`);
    try {
        const clientInfo = db.getClientInfoFlowByEmail(email);
        const response = {
            usedTraffic: clientInfo.up + clientInfo.down,
            totalTraffic: clientInfo.total
        };
        res.json(response);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 读取 settings 字段中的 clients
router.get('/uuid-list', async (req, res) => {
  try {
    const clients = db.getClientsFromSettings();
    res.json(clients);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 根据 clients 的 id 更新 client_infos 表中的 enable 字段
router.put('/uuid/:id/enable', async (req, res) => {
  const { id } = req.params;
  const { enable } = req.body;

  try {
    const success = db.updateEnableByClientId(id, enable);
    if (success) {
      res.json({ message: '/uuid/:id/enable Enable updated successfully' });
    } else {
      res.status(404).json({ error: '/uuid/:id/enable Client not found' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 根据 clients 的 id 修改 clients 的 email 和 client_infos 表中的 email
router.put('/uuid/:id/email', async (req, res) => {
  const { id } = req.params;
  const { email } = req.body;
  logger.info(`/uuid/:id/email Updating email for client ID: ${id} to ${email}`);

  try {
    const success = db.updateEmailByClientId(id, email);
    if (success) {
      res.json({ message: '/uuid/:id/email Email updated successfully' });
    } else {
      res.status(404).json({ error: '/uuid/:id/email Client not found' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 根据 clients 的 id 删除 clients 中的该条数据，并删除 client_infos 表中 email 相同的记录
router.delete('/uuid/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const success = db.deleteClientById(id);
    if (success) {
      res.json({ message: '/uuid/:id Client deleted successfully' });
    } else {
      res.status(404).json({ error: '/uuid/:id Client not found' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 根据 clients 的 id 修改 clients 的 id
router.put('/uuid/:id', async (req, res) => {
  const { id } = req.params;
  const { newId } = req.body;

  try {
    const success = db.updateClientIdByClientId(id, newId);
    if (success) {
      res.json({ message: '/uuid/:id Client ID updated successfully' });
    } else {
      res.status(404).json({ error: '/uuid/:id Client not found' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 根据邮箱清空 client_infos 表中的上下行流量
router.delete('/flow/:email', async (req, res) => {
  const { email } = req.params;

  try {
    const success = db.clearClientFlowByEmail(email);
    if (success) {
      res.json({ message: '/flow/:email Flow cleared successfully' });
    } else {
      res.status(404).json({ error: '/flow/:email Client not found' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 重启 x-ui
router.post('/restart', async (req, res) => {
  try {
    const result = await restartXUI();
    logger.info('x-ui restarted successfully');
    res.json({ message: 'x-ui restarted successfully', result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
