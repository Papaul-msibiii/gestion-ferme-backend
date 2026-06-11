const mongoose = require('mongoose');

const stockSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  produit:        { type: String, required: true },
  categorie:      { type: String, enum: ['Semence','Engrais','Phyto','Récolte'], required: true },
  unite:          { type: String, required: true },
  stock_initial:  { type: Number, default: 0, min: 0 },
  seuil_alerte:   { type: Number, default: 0, min: 0 },
  campagne:       { type: String, default: '2025-2026' },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Virtuals calculés dynamiquement depuis les mouvements
stockSchema.virtual('mouvements', {
  ref: 'MouvementStock',
  localField: '_id',
  foreignField: 'stock_id',
});

module.exports = mongoose.model('Stock', stockSchema);