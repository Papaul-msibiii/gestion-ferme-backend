const mongoose = require('mongoose');

const mouvementSchema = new mongoose.Schema({
  stock_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'Stock', required: true },
  date:        { type: Date, required: true },
  type:        { type: String, enum: ['Entrée', 'Sortie'], required: true },
  quantite:    { type: Number, required: true, min: 0.01 },
  motif:       { type: String, trim: true },
  parcelle_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Parcelle' },
}, { timestamps: true });

module.exports = mongoose.model('MouvementStock', mouvementSchema);
