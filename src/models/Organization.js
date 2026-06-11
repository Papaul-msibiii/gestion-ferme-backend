const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema({
  nom:         { type: String, required: true, trim: true },
  slug:        { type: String, unique: true, lowercase: true, trim: true },
  region:      { type: String, default: 'Saloum' },
  plan:        { type: String, enum: ['free', 'pro', 'enterprise'], default: 'free' },
  actif:       { type: Boolean, default: true },
  proprietaire: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

// Génère un slug unique à partir du nom
organizationSchema.pre('validate', async function () {
  if (!this.slug) {
    const base = this.nom
      .toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    const count = await mongoose.model('Organization').countDocuments({ slug: new RegExp(`^${base}(-\\d+)?$`) });
    this.slug = count === 0 ? base : `${base}-${count}`;
  }
});

module.exports = mongoose.model('Organization', organizationSchema);
