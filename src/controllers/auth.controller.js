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