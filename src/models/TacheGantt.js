const mongoose = require('mongoose');

const tacheGanttSchema = new mongoose.Schema({
  exploitationId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  campagne:       { type: String, required: true, default: '2025-2026' },
  activite:       { type: String, required: true, trim: true },
  parcelle_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'Parcelle' },
  date_debut:     { type: Date, required: true },
  date_fin:       { type: Date, required: true },
  responsable:    { type: String, trim: true },
  statut:         { type: String, enum: ['Planifié', 'En cours', 'Terminé'], default: 'Planifié' },
  couleur:        { type: String },
}, { timestamps: true });

module.exports = mongoose.model('TacheGantt', tacheGanttSchema);
