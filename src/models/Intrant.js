const mongoose = require('mongoose');

const intrantSchema = new mongoose.Schema({
  exploitationId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  parcelle_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'Parcelle', required: true },
  type:           { type: String, enum: ['Semence','Engrais','Phytosanitaire'], required: true },
  produit:        { type: String, required: true },
  // Semences
  variete_certifiee: { type: Boolean },
  // Engrais
  formulation:    { type: String },
  mode_application: { type: String },
  // Phytosanitaires
  matiere_active: { type: String },
  type_phyto:     { type: String, enum: ['Herbicide','Fongicide','Insecticide','Autre'] },
  cible:          { type: String },
  dar_jours:      { type: Number, min: 0 },
  date_traitement: { type: Date },
  date_recolte_ok: { type: Date },  // calculé : date_traitement + dar_jours
  // Commun
  dose_par_ha:    { type: Number, min: 0 },
  surface_ha:     { type: Number, min: 0 },
  quantite:       { type: Number, required: true, min: 0 },
  unite:          { type: String, required: true },
  prix_unitaire:  { type: Number, required: true, min: 0 },
  cout_total:     { type: Number }, // calculé
  fournisseur:    { type: String },
  date_achat:     { type: Date },
  campagne:       { type: String, default: '2025-2026' },
}, { timestamps: true });

// Calcul automatique avant sauvegarde
intrantSchema.pre('save', async function() {
  this.cout_total = this.quantite * this.prix_unitaire;
  if (this.date_traitement && this.dar_jours) {
    const d = new Date(this.date_traitement);
    d.setDate(d.getDate() + this.dar_jours);
    this.date_recolte_ok = d;
  }
});

module.exports = mongoose.model('Intrant', intrantSchema);