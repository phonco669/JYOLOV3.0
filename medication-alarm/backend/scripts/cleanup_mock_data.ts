import db from '../src/config/database';

const run = () => {
  const mockUserWhere = "openid LIKE 'mock_openid_%'";

  db.serialize(() => {
    console.log('Starting cleanup of mock/dev data...');

    // 1. 清空所有订阅任务，避免测试时代码残留触发真实推送
    db.run('DELETE FROM subscriptions', (err) => {
      if (err) {
        console.error('Failed to clear subscriptions:', err.message);
      } else {
        console.log('Cleared all rows from subscriptions');
      }
    });

    // 2. 删除与 mock_openid 用户关联的数据
    const tables = ['records', 'plans', 'todos', 'follow_ups', 'body_states', 'medications'];
    tables.forEach((table) => {
      const sql = `DELETE FROM ${table} WHERE user_id IN (SELECT id FROM users WHERE ${mockUserWhere})`;
      db.run(sql, (err) => {
        if (err) {
          console.error(`Failed to clear ${table} for mock users:`, err.message);
        } else {
          console.log(`Cleared ${table} rows for mock users`);
        }
      });
    });

    // 3. 删除 mock_openid_* 用户本身
    db.run(`DELETE FROM users WHERE ${mockUserWhere}`, (err) => {
      if (err) {
        console.error('Failed to delete mock users:', err.message);
      } else {
        console.log('Deleted mock_openid_* users');
      }
    });
  });
};

run();

