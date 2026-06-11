const jwt = require('jsonwebtoken');
const User = require('../models/User');

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, {
  expiresIn: process.env.JWT_EXPIRES_IN,
});

exports.register = async (req, res, next) => {
  try {
    const { nom, email, password, exploitation, region } = req.body;
    const user = await User.create({ nom, email, password, exploitation, region });
    const token = signToken(user._id);
    res.status(201).json({ success: true, token, data: { id: user._id, nom: user.nom, email: user.email } });
  } catch (err) { next(err); }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.verifierPassword(password))) {
      return res.status(401).json({ success: false, message: 'Email ou mot de passe incorrect' });
    }
    const token = signToken(user._id);
    res.json({ success: true, token, data: { id: user._id, nom: user.nom, exploitation: user.exploitation } });
  } catch (err) { next(err); }
};

exports.me = async (req, res) => {
  res.json({ success: true, data: req.user });
};

/* POST /auth/forgot-password */
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email?.toLowerCase() })
      .select('+resetToken +resetTokenExpiry');

    if (!user) {
      // Ne pas révéler si l'email existe
      return res.json({ success: true, message: 'Si ce compte existe, un code a été généré.' });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetToken       = code;
    user.resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 heure
    await user.save({ validateBeforeSave: false });

    console.log(`[Tool Djolof] Code de réinitialisation pour ${email}: ${code}`);

    res.json({
      success: true,
      message: 'Code de réinitialisation généré.',
      code,   // À remplacer par envoi email en production
    });
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