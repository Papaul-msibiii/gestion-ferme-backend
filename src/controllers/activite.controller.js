const Activite = require('../models/Activite');

const POPULATE = { path: 'parcelle_id', select: 'idParcelle nom' };

exports.getAll = async (req, res, next) => {
  try {
    const filter = { exploitationId: req.user.id };
    if (req.query.parcelle_id)  filter.parcelle_id   = req.query.parcelle_id;
    if (req.query.type_activite) filter.type_activite = req.query.type_activite;
    if (req.query.campagne)      filter.campagne      = req.query.campagne;
    if (req.query.date_debut || req.query.date_fin) {
      filter.date = {};
      if (req.query.date_debut) filter.date.$gte = new Date(req.query.date_debut);
      if (req.query.date_fin)   filter.date.$lte = new Date(req.query.date_fin);
    }

    const activites = await Activite.find(filter)
      .populate(POPULATE)
      .sort({ date: -1, createdAt: -1 });

    const stats = activites.reduce((acc, a) => {
      acc.totalHeures        += a.duree_heures  || 0;
      acc.totalCoutMO        += a.cout_mo       || 0;
      acc.totalOuvriersJours += (a.duree_heures || 0) * (a.nb_ouvriers || 0);
      return acc;
    }, { totalHeures: 0, totalCoutMO: 0, totalOuvriersJours: 0 });

    res.json({ success: true, count: activites.length, stats, data: activites });
  } catch (err) { next(err); }
};

exports.getOne = async (req, res, next) => {
  try {
    const a = await Activite.findOne({ _id: req.params.id, exploitationId: req.user.id })
      .populate(POPULATE);
    if (!a) return res.status(404).json({ success: false, message: 'Activité introuvable' });
    res.json({ success: true, data: a });
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const body = { ...req.body, exploitationId: req.user.id };
    body.cout_mo = (Number(body.duree_heures) || 0)
                 * (Number(body.nb_ouvriers)   || 0)
                 * (Number(body.taux_horaire_fcfa) || 0);

    const activite = await Activite.create(body);
    await activite.populate(POPULATE);
    res.status(201).json({ success: true, data: activite });
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const { exploitationId, ...safeBody } = req.body;
    safeBody.cout_mo = (Number(safeBody.duree_heures) || 0)
                     * (Number(safeBody.nb_ouvriers)   || 0)
                     * (Number(safeBody.taux_horaire_fcfa) || 0);

    const activite = await Activite.findOneAndUpdate(
      { _id: req.params.id, exploitationId: req.user.id },
      safeBody,
      { new: true, runValidators: true },
    ).populate(POPULATE);

    if (!activite) return res.status(404).json({ success: false, message: 'Activité introuvable' });
    res.json({ success: true, data: activite });
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    const a = await Activite.findOneAndDelete({ _id: req.params.id, exploitationId: req.user.id });
    if (!a) return res.status(404).json({ success: false, message: 'Activité introuvable' });
    res.json({ success: true, message: 'Activité supprimée' });
  } catch (err) { next(err); }
};
