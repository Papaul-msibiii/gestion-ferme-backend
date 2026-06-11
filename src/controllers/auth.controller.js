const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Organization = require('../models/Organization');

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, {
  expiresIn: process.env.JWT_EXPIRES_IN,
});

const formatUser = (user) => ({
  id:             user._id,
  nom:            user.nom,
  email:          user.email,
  role:           user.role,
  organizationId: user.organizationId,
  organization:   user.organizationId ?? null,
});

/* POST /auth/register
   Crée une Organization + l'utilisateur org_admin en une transaction */
exports.register = async (req, res, next) => {
  try {
    const { nom, email, password, nomOrganisation, region } = req.body;

    if (!nomOrganisation) {
      return res.status(400).json({ success: false, message: 'Le nom de l\'organisation est requis.' });
    }

    // Créer l'organisation en premier (proprietaire sera mis à jour après)
    const org = new Organization({ nom: nomOrganisation, region: region ?? 'Saloum', proprietaire: new (require('mongoose').Types.ObjectId)() });
    await org.save();

    // Créer l'utilisateur
    const user = await User.create({
      nom, email, password,
      role: 'org_admin',
      organizationId: org._id,
    });

    // Mettre à jour le propriétaire
    org.proprietaire = user._id;
    await org.save();

    const token = signToken(user._id);
    res.status(201).json({ success: true, token, data: formatUser(user) });
  } catch (err) { next(err); }
};

/* POST /auth/login */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email })
      .select('+password')
      .populate('organizationId', 'nom slug region plan actif');

    if (!user || !(await user.verifierPassword(password))) {
      return res.status(401).json({ success: false, message: 'Email ou mot de passe incorrect' });
    }
    if (!user.actif) {
      return res.status(403).json({ success: false, message: 'Compte désactivé' });
    }

    const token = signToken(user._id);
    res.json({ success: true, token, data: formatUser(user) });
  } catch (err) { next(err); }
};

/* GET /auth/me */
exports.me = async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate('organizationId', 'nom slug region plan actif');
  res.json({ success: true, data: formatUser(user) });
};

/* POST /auth/forgot-password */
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email?.toLowerCase() })
      .select('+resetToken +resetTokenExpiry');

    if (!user) {
      return res.json({ success: true, message: 'Si ce compte existe, un code a été généré.' });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetToken       = code;
    user.resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000);
    await user.save({ validateBeforeSave: false });

    console.log(`[Tool Djolof] Code reset pour ${email}: ${code}`);

    res.json({ success: true, message: 'Code de réinitialisation généré.', code });
  } catch (err) { next(err); }
};

/* POST /auth/reset-password */
exports.resetPassword = async (req, res, next) => {
  try {
    const { email, code, password } = req.body;

    if (!email || !code || !password) {
      return res.status(400).json({ success: false, message: 'Tous les champs sont requis.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Minimum 6 caractères.' });
    }

    const user = await User.findOne({
      email:            email.toLowerCase(),
      resetToken:       code,
      resetTokenExpiry: { $gt: Date.now() },
    }).select('+password +resetToken +resetTokenExpiry');

    if (!user) {
      return res.status(400).json({ success: false, message: 'Code invalide ou expiré.' });
    }

    user.password         = password;
    user.resetToken       = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();

    res.json({ success: true, message: 'Mot de passe réinitialisé avec succès.' });
  } catch (err) { next(err); }
};
