const mongoose = require('mongoose');

const meteoSchema = new mongoose.Schema({
  organizationId:       { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  semaine:              { type: Date, required: true },   // date du lundi de la semaine
  pluie_mm:             { type: Number, required: true, min: 0, default: 0 },
  temp_max_c:           { type: Number },
  temp_min_c:           { type: Number },
  etp_mm:               { type: Number, required: true, min: 0, default: 0 },
  irrigation_prevue_mm: { type: Number, min: 0, default: 0 },
  observations:         { type: String, trim: true },
}, { timestamps: true });

// Unicité : une seule entrée par semaine par exploitation
meteoSchema.index({ organizationId: 1, semaine: 1 }, { unique: true });

// Virtual déficit hydrique
meteoSchema.virtual('deficit_hydrique').get(function () {
  return parseFloat((this.etp_mm - this.pluie_mm).toFixed(2));
});

meteoSchema.set('toJSON',   { virtuals: true });
meteoSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Meteo', meteoSchema);
