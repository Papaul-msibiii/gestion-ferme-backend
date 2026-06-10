const mongoose = require('mongoose');

const rendementSchema = new mongoose.Schema({
  exploitationId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User',     required: true },
  parcelle_id:        { type: mongoose.Schema.Types.ObjectId, ref: 'Parcelle', required: true },
  culture:            { type: String, required: true },
  surface_ha:         { type: Number, required: true, min: 0.01 },
  rdt_prevu_t_ha:     { type: Number, required: true, min: 0 },
  rdt_reel_t_ha:      { type: Number, min: 0 },
  production_t:       { type: Number },  // calculé : surface × rdt_reel
  prix_vente_fcfa_kg: { type: Number, required: true, min: 0 },
  ca_total:           { type: Number },  // calculé : production_t × prix × 1000
  date_recolte:       { type: Date },
  campagne:           { type: String, default: '2025-2026' },
}, { timestamps: true });

rendementSchema.pre('save', async function () {
  if (this.rdt_reel_t_ha != null) {
    this.production_t = this.surface_ha * this.rdt_reel_t_ha;
    this.ca_total     = this.production_t * this.prix_vente_fcfa_kg * 1000;
  }
});

rendementSchema.index({ exploitationId: 1, campagne: 1 });

module.exports = mongoose.model('Rendement', rendementSchema);
