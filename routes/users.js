// routes/users.js - 使用者相關路由
const express = require('express');
const router = express.Router();

// 模擬使用者資料 (實際應用中應該使用資料庫)
const users = [
  { id: 1, name: '張三', email: 'zhangsan@example.com' },
  { id: 2, name: '李四', email: 'lisi@example.com' }
];

/* GET 獲取所有使用者 */
router.get('/', (req, res) => {
  res.json(users);
});

/* GET 獲取單個使用者 */
router.get('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const user = users.find(u => u.id === id);
  
  if (user) {
    res.json(user);
  } else {
    res.status(404).json({ message: `未找到ID為${id}的使用者` });
  }
});

/* POST 創建新使用者 */
router.post('/', (req, res) => {
  const { name, email } = req.body;
  
  // 簡單驗證
  if (!name || !email) {
    return res.status(400).json({ message: '姓名和郵箱為必填項' });
  }
  
  // 創建新使用者 (在實際應用中，應該存入資料庫)
  const newUser = {
    id: users.length + 1,
    name,
    email
  };
  
  users.push(newUser);
  res.status(201).json(newUser);
});

/* PUT 更新使用者 */
router.put('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const { name, email } = req.body;
  
  // 查找使用者
  const userIndex = users.findIndex(u => u.id === id);
  
  if (userIndex === -1) {
    return res.status(404).json({ message: `未找到ID為${id}的使用者` });
  }
  
  // 更新使用者資訊
  users[userIndex] = {
    ...users[userIndex],
    ...(name && { name }),
    ...(email && { email })
  };
  
  res.json(users[userIndex]);
});

/* DELETE 刪除使用者 */
router.delete('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const userIndex = users.findIndex(u => u.id === id);
  
  if (userIndex === -1) {
    return res.status(404).json({ message: `未找到ID為${id}的使用者` });
  }
  
  const deletedUser = users.splice(userIndex, 1)[0];
  res.json({ message: '使用者已刪除', user: deletedUser });
});

module.exports = router;