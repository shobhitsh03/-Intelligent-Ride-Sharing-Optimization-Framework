import jwt from 'jsonwebtoken';

export default function auth(requiredRole) {
  return (req, res, next) => {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'No token' });
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      if (requiredRole) {
        const roles = Array.isArray(decoded.roles) ? decoded.roles : (decoded.role ? [decoded.role] : []);
        if (!roles.includes(requiredRole)) {
          return res.status(403).json({ error: 'Forbidden' });
        }
      }
      next();
    } catch (e) {
      return res.status(401).json({ error: 'Invalid token' });
    }
  };
}
