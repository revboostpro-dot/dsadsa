const { prisma } = require('../config/db');

/**
 * Middleware: Bypass auth and mock an active Admin user
 */
async function requireAuth(req, res, next) {
  try {
    // Look up the first admin user in the database to keep relations intact,
    // otherwise fallback to a static mock object.
    let user = await prisma.user.findFirst({
      where: { role: 'ADMIN', isActive: true },
      select: { id: true, name: true, phone: true, role: true, isActive: true }
    });

    if (!user) {
      user = await prisma.user.findFirst({
        select: { id: true, name: true, phone: true, role: true, isActive: true }
      });
    }

    req.user = user || {
      id: 'mock-admin-id',
      name: 'System Admin',
      phone: '9000000000',
      role: 'ADMIN',
      isActive: true
    };
    
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Middleware: require ADMIN role (always allowed since auth is bypassed)
 */
function requireAdmin(req, res, next) {
  next();
}

module.exports = { requireAuth, requireAdmin };
