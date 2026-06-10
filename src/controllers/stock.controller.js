const Stock         = require('../models/Stock');
const MouvementStock = require('../models/MouvementStock');
const mongoose      = require('mongoose');

/* ── helper : calcule entrees/sorties/stock_actuel/statut ── */
async function enrichStock(stock) {
  const agg = await MouvementStock.aggregate([
    { $match: { stock_id: stock._id } },
    {
      $group: {
        _id:     '$type',
        total:   { $sum: '$quantite' },
      },
    },
  ]);
  const entrees = agg.find((a) => a._id === 'Entrée')?.total ?? 0;
  const sorties = agg.find((a) => a._id === 'Sortie')?.total ?? 0;
  const stock_actuel = stock.stock_initial + entrees - sorties;
  let statut = 'OK';
  if (stock_actuel <= 0)                    statut = 'RUPTURE';
  else if (stock_actuel <= stock.seuil_alerte) statut = 'ALERTE';

  return { ...stock.toObject(), entrees, sorties, stock_actuel, statut };
}

/* GET /stocks */
exports.getAll = async (req, res, next) => {
  try {
    const stocks = await Stock.find({ exploitationId: req.user.id }).sort({ categorie: 1, produit: 1 });
    const enriched = await Promise.all(stocks.map(enrichStock));
    const alertes  = enriched.filter((s) => s.statut === 'ALERTE' || s.statut === 'RUPTURE').length;
    res.json({ success: true, count: enriched.length, alertes, data: enriched });
  } catch (err) { next(err); }
};

/* GET /stocks/:id */
exports.getOne = async (req, res, next) => {
  try {
    const stock = await Stock.findOne({ _id: req.params.id, exploitationId: req.user.id });
    if (!stock) return res.status(404).json({ success: false, message: 'Stock introuvable' });
    const enriched = await enrichStock(stock);
    res.json({ success: true, data: enriched });
  } catch (err) { next(err); }
};

/* POST /stocks */
exports.create = async (req, res, next) => {
  try {
    const stock = await Stock.create({ ...req.body, exploitationId: req.user.id });
    const enriched = await enrichStock(stock);
    res.status(201).json({ success: true, data: enriched });
  } catch (err) { next(err); }
};

/* PUT /stocks/:id */
exports.update = async (req, res, next) => {
  try {
    const { exploitationId, ...safeBody } = req.body;
    const stock = await Stock.findOneAndUpdate(
      { _id: req.params.id, exploitationId: req.user.id },
      safeBody, { new: true, runValidators: true },
    );
    if (!stock) return res.status(404).json({ success: false, message: 'Stock introuvable' });
    const enriched = await enrichStock(stock);
    res.json({ success: true, data: enriched });
  } catch (err) { next(err); }
};

/* DELETE /stocks/:id */
exports.remove = async (req, res, next) => {
  try {
    const stock = await Stock.findOneAndDelete({ _id: req.params.id, exploitationId: req.user.id });
    if (!stock) return res.status(404).json({ success: false, message: 'Stock introuvable' });
    await MouvementStock.deleteMany({ stock_id: req.params.id });
    res.json({ success: true, data: null });
  } catch (err) { next(err); }
};

/* ── Mouvements ──────────────────────────────────────────── */

/* GET /stocks/:id/mouvements */
exports.getMouvements = async (req, res, next) => {
  try {
    const stock = await Stock.findOne({ _id: req.params.id, exploitationId: req.user.id });
    if (!stock) return res.status(404).json({ success: false, message: 'Stock introuvable' });
    const mouvements = await MouvementStock.find({ stock_id: req.params.id })
      .populate({ path: 'parcelle_id', select: 'idParcelle nom' })
      .sort({ date: -1 });
    res.json({ success: true, count: mouvements.length, data: mouvements });
  } catch (err) { next(err); }
};

/* POST /stocks/:id/mouvements */
exports.addMouvement = async (req, res, next) => {
  try {
    const stock = await Stock.findOne({ _id: req.params.id, exploitationId: req.user.id });
    if (!stock) return res.status(404).json({ success: false, message: 'Stock introuvable' });
    const mouvement = await MouvementStock.create({ ...req.body, stock_id: req.params.id });
    await mouvement.populate({ path: 'parcelle_id', select: 'idParcelle nom' });
    const enriched = await enrichStock(stock);
    res.status(201).json({ success: true, data: mouvement, stock: enriched });
  } catch (err) { next(err); }
};

/* DELETE /stocks/mouvements/:mid */
exports.deleteMouvement = async (req, res, next) => {
  try {
    const mouvement = await MouvementStock.findById(req.params.mid);
    if (!mouvement) return res.status(404).json({ success: false, message: 'Mouvement introuvable' });
    const stock = await Stock.findOne({ _id: mouvement.stock_id, exploitationId: req.user.id });
    if (!stock) return res.status(403).json({ success: false, message: 'Accès refusé' });
    await mouvement.deleteOne();
    res.json({ success: true, data: null });
  } catch (err) { next(err); }
};
