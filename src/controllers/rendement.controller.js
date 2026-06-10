const Rendement = require('../models/Rendement');

const POPULATE = { path: 'parcelle_id', select: 'idParcelle nom' };

exports.getAll = async (req, res, next) => {
  try {
    const filter = { exploitationId: req.user.id };
    if (req.query.campagne) filter.campagne = req.query.campagne;

    const rendements = await Rendement.find(filter)
      .populate(POPULATE)
      .sort({ createdAt: -1 });

    const stats = rendements.reduce((acc, r) => {
      // Prévisionnel (toujours disponible)
      acc.totalProductionPrevue += r.surface_ha * r.rdt_prevu_t_ha;
      acc.totalCAPrevisionnel   += r.surface_ha * r.rdt_prevu_t_ha * r.prix_vente_fcfa_kg * 1000;

      // Réel (seulement si récolté)
      if (r.rdt_reel_t_ha != null) {
        acc.totalProductionT  += r.production_t   || 0;
        acc.totalCA           += r.ca_total        || 0;
        acc.nbRecoltes        += 1;
        acc.sommRdtReel       += r.rdt_reel_t_ha;
      }
      return acc;
    }, {
      totalProductionPrevue: 0, totalCAPrevisionnel: 0,
      totalProductionT: 0, totalCA: 0,
      nbRecoltes: 0, sommRdtReel: 0,
    });

    stats.rendementMoyen = stats.nbRecoltes > 0
      ? parseFloat((stats.sommRdtReel / stats.nbRecoltes).toFixed(2))
      : 0;

    res.json({ success: true, count: rendements.length, stats, data: rendements });
  } catch (err) { next(err); }
};

exports.getOne = async (req, res, next) => {
  try {
    const r = await Rendement.findOne({ _id: req.params.id, exploitationId: req.user.id })
      .populate(POPULATE);
    if (!r) return res.status(404).json({ success: false, message: 'Rendement introuvable' });
    res.json({ success: true, data: r });
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const body = { ...req.body, exploitationId: req.user.id };
    if (body.rdt_reel_t_ha != null) {
      body.production_t = Number(body.surface_ha) * Number(body.rdt_reel_t_ha);
      body.ca_total     = body.production_t * Number(body.prix_vente_fcfa_kg) * 1000;
    }
    const rendement = await Rendement.create(body);
    await rendement.populate(POPULATE);
    res.status(201).json({ success: true, data: rendement });
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const { exploitationId, ...safeBody } = req.body;
    if (safeBody.rdt_reel_t_ha != null) {
      safeBody.production_t = Number(safeBody.surface_ha) * Number(safeBody.rdt_reel_t_ha);
      safeBody.ca_total     = safeBody.production_t * Number(safeBody.prix_vente_fcfa_kg) * 1000;
    }
    const rendement = await Rendement.findOneAndUpdate(
      { _id: req.params.id, exploitationId: req.user.id },
      safeBody,
      { new: true, runValidators: true },
    ).populate(POPULATE);
    if (!rendement) return res.status(404).json({ success: false, message: 'Rendement introuvable' });
    res.json({ success: true, data: rendement });
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    const r = await Rendement.findOneAndDelete({ _id: req.params.id, exploitationId: req.user.id });
    if (!r) return res.status(404).json({ success: false, message: 'Rendement introuvable' });
    res.json({ success: true, message: 'Rendement supprimé' });
  } catch (err) { next(err); }
};
