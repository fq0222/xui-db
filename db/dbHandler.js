const Database = require('better-sqlite3');
const path = require('path');
const logger = require('../log/logger'); // 引入 logger 模块

// 打开数据库连接
const dbPath = process.env.DB_PATH || path.resolve(__dirname, '../../x-ui.db');
const db = new Database(dbPath, { verbose: (sql) => logger.info(sql) }); // 使用 logger 记录 SQL 查询

// 读取 client_infos 表的全部内容
function getAllClients() {
  try {
    const stmt = db.prepare('SELECT * FROM client_infos');
    const rows = stmt.all();
    return rows;
  } catch (err) {
    throw new Error(`Error fetching clients: ${err.message}`);
  }
}

// 根据email查询 client_infos 表中的 up down total字段的值
function getClientInfoFlowByEmail(email) {
    try {
        const stmt = db.prepare('SELECT up, down, total FROM client_infos WHERE email = ?');
        const row = stmt.get(email);
        if (!row) {
            throw new Error(`Client with email ${email} not found`);
        }
        return row;
    } catch (err) {
        throw new Error(`Error fetching client info by email: ${err.message}`);
    }
}

// 读取 settings 字段中的 clients
function getClientsFromSettings() {
    try {
        const stmt = db.prepare("SELECT settings FROM inbounds WHERE JSON_EXTRACT(settings, '$.clients') IS NOT NULL");
        const row = stmt.get();
        if (!row || !row.settings) {
            throw new Error('No valid settings data found in inbounds table');
        }

        const settings = JSON.parse(row.settings);
        return settings.clients || [];
    } catch (err) {
        throw new Error(`Error fetching clients from settings: ${err.message}`);
    }
}

// 根据 clients 的 id 更新 client_infos 表中的 enable 字段
function updateEnableByClientId(clientId, enable) {
    try {
        // 从 settings 中找到对应的 email
        const stmt = db.prepare("SELECT settings FROM inbounds WHERE JSON_EXTRACT(settings, '$.clients') IS NOT NULL");
        const row = stmt.get();
        if (!row || !row.settings) {
            throw new Error('No valid settings data found in inbounds table');
        }

        const settings = JSON.parse(row.settings);
        const client = settings.clients.find((c) => c.id === clientId);
        if (!client) {
            throw new Error(`Client with id ${clientId} not found`);
        }

        const email = client.email;

        // 在 client_infos 表中更新 enable 字段
        const updateStmt = db.prepare('UPDATE client_infos SET enable = ? WHERE email = ?');
        const result = updateStmt.run(enable, email);

        return result.changes > 0;
    } catch (err) {
        throw new Error(`Error updating enable by clientId: ${err.message}`);
    }
}

// 根据 clients 的 id 修改 clients 的 email 和 client_infos 表中的 email
function updateEmailByClientId(clientId, newEmail) {
    try {
      // 从 settings 中找到对应的 client
      const stmt = db.prepare("SELECT settings FROM inbounds WHERE JSON_EXTRACT(settings, '$.clients') IS NOT NULL");
      const row = stmt.get();
      if (!row || !row.settings) {
        throw new Error('No valid settings data found in inbounds table');
      }
  
      const settings = JSON.parse(row.settings);
      const client = settings.clients.find((c) => c.id === clientId);
      if (!client) {
        throw new Error(`Client with id ${clientId} not found`);
      }
  
      const oldEmail = client.email;
  
      // 更新 settings 中的 email
      client.email = newEmail;
  
      // 更新 inbounds 表中的 settings 字段
      const updateSettingsStmt = db.prepare("UPDATE inbounds SET settings = ? WHERE JSON_EXTRACT(settings, '$.clients') IS NOT NULL");
      const settingsResult = updateSettingsStmt.run(JSON.stringify(settings));
      if (settingsResult.changes === 0) {
        throw new Error('Failed to update email in settings');
      }
  
      // 更新 client_infos 表中的 email
      const updateClientInfosStmt = db.prepare('UPDATE client_infos SET email = ? WHERE email = ?');
      const clientInfosResult = updateClientInfosStmt.run(newEmail, oldEmail);
      if (clientInfosResult.changes === 0) {
        throw new Error('Failed to update email in client_infos');
      }
  
      return true;
    } catch (err) {
      throw new Error(`Error updating email by clientId: ${err.message}`);
    }
}

// 根据 clients 的 id 删除 clients 中的该条数据，并删除 client_infos 表中 email 相同的记录
function deleteClientById(clientId) {
    try {
      // 从 settings 中找到对应的 client
      const stmt = db.prepare("SELECT settings FROM inbounds WHERE JSON_EXTRACT(settings, '$.clients') IS NOT NULL");
      const row = stmt.get();
      if (!row || !row.settings) {
        throw new Error('No valid settings data found in inbounds table');
      }
  
      const settings = JSON.parse(row.settings);
      const clientIndex = settings.clients.findIndex((c) => c.id === clientId);
      if (clientIndex === -1) {
        throw new Error(`Client with id ${clientId} not found`);
      }
  
      const email = settings.clients[clientIndex].email;
  
      // 删除 settings 中的 client
      settings.clients.splice(clientIndex, 1);
  
      // 更新 inbounds 表中的 settings 字段
      const updateSettingsStmt = db.prepare("UPDATE inbounds SET settings = ? WHERE JSON_EXTRACT(settings, '$.clients') IS NOT NULL");
      const settingsResult = updateSettingsStmt.run(JSON.stringify(settings));
      if (settingsResult.changes === 0) {
        throw new Error('Failed to update settings after deleting client');
      }
  
      // 删除 client_infos 表中的记录
      const deleteClientInfosStmt = db.prepare('DELETE FROM client_infos WHERE email = ?');
      const clientInfosResult = deleteClientInfosStmt.run(email);
      if (clientInfosResult.changes === 0) {
        throw new Error('Failed to delete client from client_infos');
      }
  
      return true;
    } catch (err) {
      throw new Error(`Error deleting client by clientId: ${err.message}`);
    }
}


module.exports = {
    getAllClients,
    getClientsFromSettings,
    updateEnableByClientId,
    updateEmailByClientId,
    deleteClientById,
    getClientInfoFlowByEmail, // 新增方法
};
