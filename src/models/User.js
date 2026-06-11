const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  nom:         { type: String, required: true, trim: true },
  email:       { type: String, required: true, unique: true, lowercase: true },
  password:    { type: String, required: true, minlength: 6, select: false },
  exploitation: { type: String, default: 'Mon exploitation' },
  region:      { type: String, default: 'Saloum' },
  role:        { type: String, enum: ['agriculteur','consultant','admin'], default: 'agriculteur' },
  actif:            { type: Boolean, default: true },
  resetToken:       { type: String, select: false },
  resetTokenExpiry: { type: Date,   select: false },
}, { timestamps: true });

// Hash password avant sauvegarde (Mongoose 9 : pas de callback next avec async)
userSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

// Méthode de vérification du mot de passe
userSchema.methods.verifierPassword = async function(candidat) {
  return bcrypt.compare(candidat, this.password);
};

module.exports = mongoose.model('User', userSchema);