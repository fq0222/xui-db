const { exec } = require('child_process');

/**
 * 执行 shell 命令 x-ui restart
 * @returns {Promise<string>} 返回命令执行的结果
 */
function restartXUI() {
    return new Promise((resolve, reject) => {
        exec('x-ui restart', (error, stdout, stderr) => {
            if (error) {
                reject(`执行失败: ${error.message}`);
                return;
            }
            if (stderr) {
                reject(`命令错误输出: ${stderr}`);
                return;
            }
            resolve(stdout.trim());
        });
    });
}

// 导出模块
module.exports = {
    restartXUI
};
