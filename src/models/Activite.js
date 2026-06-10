const mongoose = require('mongoose');

const activiteSchema = new mongoose.Schema({
  exploitationId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User',     required: true },
  parcelle_id:      { type: mongoose.Schema.Types.ObjectId, ref: 'Parcelle', required: true },
  date:             { type: Date, required: true },
  type_activite:    {
    type: String,
    enum: [
      'Labour', 'Semis', 'Sarclage', 'Désherbage', 'Buttage',
      'Fertilisation', 'Traitement', 'Irrigation', 'Paillage',
      'Tuteurage', 'Récolte', 'Post-récolte', 'Autre',
    ],
    required: true,
  },
  description:      { type: String },
  duree_heures:     { type: Number, required: true, min: 0 },
  nb_ouvriers:      { type: Number, required: true, min: 1 },
  taux_horaire_fcfa:{ type: Number, required: true, min: 0 },
  cout_mo:          { type: Number },   // calculé : duree × nb_ouvriers × taux
  materiel:         { type: String },
  observations:     { type: String },
  responsable:      { type: String },
  campagne:         { type: String, default: '2025-2026' },
}, { timestamps: true });

activiteSchema.pre('save', async function () {
  this.cout_mo = this.duree_heures * this.nb_ouvriers * this.taux_horaire_fcfa;
});

activiteSchema.index({ exploitationId: 1, date: -1 });

module.exports = mongoose.model('Activite', activiteSchema);
