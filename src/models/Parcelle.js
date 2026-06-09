const mongoose = require('mongoose');

const parcelleSchema = new mongoose.Schema({
  exploitationId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  idParcelle:  { type: String, required: true, match: /^P\d{2}$/ },
  nom:         { type: String, required: true, trim: true },
  surface_ha:  { type: Number, required: true, min: 0.01 },
  type_sol:    { type: String, enum: ['Argilo-limoneux','Sableux','Argileux','Limoneux','Autre'], required: true },
  culture:     { type: String, default: '' },
  variete:     { type: String, default: '' },
  date_semis:  { type: Date },
  irrigation:  { type: Boolean, default: false },
  gps: {
    lat: { type: Number, min: -90, max: 90 },
    lng: { type: Number, min: -180, max: 180 },
  },
  statut: { type: String, enum: ['Actif','Jachère','Récolté','En préparation'], default: 'En préparation' },
  campagne: { type: String, default: '2025-2026' },
}, { timestamps: true });

parcelleSchema.index({ exploitationId: 1, idParcelle: 1 }, { unique: true });
parcelleSchema.index({ 'gps.lat': 1, 'gps.lng': 1 });

module.exports = mongoose.model('Parcelle', parcelleSchema);