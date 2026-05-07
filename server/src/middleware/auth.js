import jwt from 'jsonwebtoken';

export default function auth(requiredRole) {
  return (req, res, next) => {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    console.log('Auth middleware - Token present:', !!token);
    console.log('Auth middleware - Header:', header.substring(0, 20) + '...');
    console.log('Auth middleware - Required role:', requiredRole);

    if (!token) return res.status(401).json({ error: 'No token' });
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Auth middleware - Decoded user:', decoded);
      req.user = decoded;
      if (requiredRole) {
        const roles = Array.isArray(decoded.roles) ? decoded.roles : (decoded.role ? [decoded.role] : []);
        console.log('Auth middleware - User roles:', roles);
        if (!roles.includes(requiredRole)) {
          console.log('Auth middleware - Role check failed');
          return res.status(403).json({ error: 'Forbidden' });
        }
      }
      next();
    } catch (e) {
      console.error('Auth middleware - Token verification error:', e.message);
      return res.status(401).json({ error: 'Invalid token' });
    }
  };
}
