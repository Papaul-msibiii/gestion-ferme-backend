const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) return res.status(401).json({ message: 'Non authentifié' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).populate('organizationId', 'nom slug region plan actif');
    if (!req.user) return res.status(401).json({ message: 'Utilisateur introuvable' });
    if (!req.user.actif) return res.status(403).json({ message: 'Compte désactivé' });
    next();
  } catch {
    res.status(401).json({ message: 'Token invalide' });
  }
};

// Restreint l'accès à certains rôles
exports.authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: `Accès refusé — rôle requis : ${roles.join(', ')}` });
  }
  next();
};

// Injecte le filtre organizationId pour les queries des controllers
exports.injectOrgFilter = (req, _res, next) => {
  if (req.user.role === 'platform_admin') {
    // Platform admin peut tout voir — le controller gère le filtre optionnel
    req.orgFilter = {};
  } else {
    req.orgFilter = { organizationId: req.user.organizationId?._id ?? req.user.organizationId };
  }
  next();
};
