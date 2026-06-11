const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  nom:            { type: String, required: true, trim: true },
  email:          { type: String, required: true, unique: true, lowercase: true },
  password:       { type: String, required: true, minlength: 6, select: false },
  role:           {
    type: String,
    enum: ['platform_admin', 'org_admin', 'manager', 'worker'],
    default: 'org_admin',
  },
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', default: null },
  actif:            { type: Boolean, default: true },
  resetToken:       { type: String, select: false },
  resetTokenExpiry: { type: Date,   select: false },
}, { timestamps: true });

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.verifierPassword = async function (candidat) {
  return bcrypt.compare(candidat, this.password);
};

module.exports = mongoose.model('User', userSchema);
