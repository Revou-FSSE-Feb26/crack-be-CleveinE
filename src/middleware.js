import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'carchery-development-secret';

export function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ message: 'Authentication required' });
  try {
    req.user = jwt.verify(header.slice(7), JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: 'Session expired' });
  }
}

export const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) return res.status(403).json({ message: 'You do not have permission to perform this action' });
  next();
};

export const requireFields = (...fields) => (req, res, next) => {
  if (fields.every(field => req.body[field] !== undefined && req.body[field] !== '')) return next();
  res.status(400).json({ message: `Required fields: ${fields.join(', ')}` });
};

export const tokenFor = user => jwt.sign({ id: user.id, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '2h' });
