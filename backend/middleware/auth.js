const jwt = require('jsonwebtoken');

const auth = function (req, res, next) {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'Нет токена, доступ запрещён' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ message: 'Недействительный токен' });
  }
};

module.exports = auth;
module.exports.protect = auth;
