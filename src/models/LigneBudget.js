const mongoose = require('mongoose');

const ligneBudgetSchema = new mongoose.Schema({
  exploitationId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  campagne:       { type: String, required: true, default: '2025-2026' },
  parcelle_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'Parcelle' },
  poste:          { type: String, required: true, trim: true },
  categorie:      { type: String, enum: ['Charge', 'Produit'], required: true },
  prevu_fcfa:     { type: Number, required: true, min: 0 },
  reel_fcfa:      { type: Number, min: 0 },
  financement:    { type: String, enum: ['Fonds propres', 'CNCAS', 'FONGIP', 'Autre'] },
  observations:   { type: String, trim: true },
}, { timestamps: true });

// Champ virtuel écart calculé
ligneBudgetSchema.virtual('ecart').get(function () {
  if (this.reel_fcfa == null) return null;
  return this.reel_fcfa - this.prevu_fcfa;
});

ligneBudgetSchema.set('toJSON',   { virtuals: true });
ligneBudgetSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('LigneBudget', ligneBudgetSchema);
