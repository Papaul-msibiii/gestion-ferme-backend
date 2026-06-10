const LigneBudget = require('../models/LigneBudget');

/* ── helper stats ── */
function computeStats(lignes) {
  const charges = lignes.filter((l) => l.categorie === 'Charge');
  const produits = lignes.filter((l) => l.categorie === 'Produit');

  const totalChargesPrevu   = charges.reduce((s, l) => s + l.prevu_fcfa, 0);
  const totalProduitsPrevu  = produits.reduce((s, l) => s + l.prevu_fcfa, 0);
  const soldeProvisionnel   = totalProduitsPrevu - totalChargesPrevu;

  const chargesAvecReel  = charges.filter((l) => l.reel_fcfa != null);
  const produitsAvecReel = produits.filter((l) => l.reel_fcfa != null);

  const totalChargesReel  = chargesAvecReel.reduce((s, l)  => s + (l.reel_fcfa ?? 0), 0);
  const totalProduitsReel = produitsAvecReel.reduce((s, l) => s + (l.reel_fcfa ?? 0), 0);
  const soldeReel         = totalProduitsReel - totalChargesReel;

  const tauxCharges  = totalChargesPrevu  > 0 ? (totalChargesReel  / totalChargesPrevu)  * 100 : null;
  const tauxProduits = totalProduitsPrevu > 0 ? (totalProduitsReel / totalProduitsPrevu) * 100 : null;

  return {
    totalChargesPrevu, totalProduitsPrevu, soldeProvisionnel,
    totalChargesReel,  totalProduitsReel,  soldeReel,
    tauxCharges, tauxProduits,
    nbLignes: lignes.length,
    nbAvecReel: lignes.filter((l) => l.reel_fcfa != null).length,
  };
}

/* GET /budget */
exports.getAll = async (req, res, next) => {
  try {
    const { campagne } = req.query;
    const filter = { exploitationId: req.user.id };
    if (campagne) filter.campagne = campagne;

    const lignes = await LigneBudget.find(filter)
      .populate({ path: 'parcelle_id', select: 'idParcelle nom' })
      .sort({ categorie: 1, poste: 1 });

    res.json({ success: true, count: lignes.length, stats: computeStats(lignes), data: lignes });
  } catch (err) { next(err); }
};

/* POST /budget */
exports.create = async (req, res, next) => {
  try {
    const ligne = await LigneBudget.create({ ...req.body, exploitationId: req.user.id });
    await ligne.populate({ path: 'parcelle_id', select: 'idParcelle nom' });
    res.status(201).json({ success: true, data: ligne });
  } catch (err) { next(err); }
};

/* PUT /budget/:id */
exports.update = async (req, res, next) => {
  try {
    const { exploitationId, ...safeBody } = req.body;
    const ligne = await LigneBudget.findOneAndUpdate(
      { _id: req.params.id, exploitationId: req.user.id },
      safeBody, { new: true, runValidators: true },
    ).populate({ path: 'parcelle_id', select: 'idParcelle nom' });
    if (!ligne) return res.status(404).json({ success: false, message: 'Ligne introuvable' });
    res.json({ success: true, data: ligne });
  } catch (err) { next(err); }
};

/* DELETE /budget/:id */
exports.remove = async (req, res, next) => {
  try {
    const ligne = await LigneBudget.findOneAndDelete({ _id: req.params.id, exploitationId: req.user.id });
    if (!ligne) return res.status(404).json({ success: false, message: 'Ligne introuvable' });
    res.json({ success: true, data: null });
  } catch (err) { next(err); }
};
