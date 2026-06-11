const TacheGantt = require('../models/TacheGantt');

function computeStats(taches) {
  const total    = taches.length;
  const termines = taches.filter((t) => t.statut === 'Terminé').length;
  const enCours  = taches.filter((t) => t.statut === 'En cours').length;
  const planifie = taches.filter((t) => t.statut === 'Planifié').length;
  const tauxRealisation = total > 0 ? Math.round((termines / total) * 100) : 0;

  const today = new Date();
  const prochaines = taches
    .filter((t) => t.statut !== 'Terminé' && new Date(t.date_debut) >= today)
    .sort((a, b) => new Date(a.date_debut) - new Date(b.date_debut))
    .slice(0, 3);

  return { total, termines, enCours, planifie, tauxRealisation, prochaines };
}

/* GET /gantt */
exports.getAll = async (req, res, next) => {
  try {
    const { campagne } = req.query;
    const filter = { ...req.orgFilter };
    if (campagne) filter.campagne = campagne;

    const taches = await TacheGantt.find(filter)
      .populate({ path: 'parcelle_id', select: 'idParcelle nom' })
      .sort({ date_debut: 1 });

    res.json({ success: true, count: taches.length, stats: computeStats(taches), data: taches });
  } catch (err) { next(err); }
};

/* POST /gantt */
exports.create = async (req, res, next) => {
  try {
    const tache = await TacheGantt.create({ ...req.body, ...req.orgFilter });
    await tache.populate({ path: 'parcelle_id', select: 'idParcelle nom' });
    res.status(201).json({ success: true, data: tache });
  } catch (err) { next(err); }
};

/* PUT /gantt/:id */
exports.update = async (req, res, next) => {
  try {
    const { organizationId, ...safeBody } = req.body;
    const tache = await TacheGantt.findOneAndUpdate(
      { _id: req.params.id, ...req.orgFilter },
      safeBody, { new: true, runValidators: true },
    ).populate({ path: 'parcelle_id', select: 'idParcelle nom' });
    if (!tache) return res.status(404).json({ success: false, message: 'Tâche introuvable' });
    res.json({ success: true, data: tache });
  } catch (err) { next(err); }
};

/* DELETE /gantt/:id */
exports.remove = async (req, res, next) => {
  try {
    const tache = await TacheGantt.findOneAndDelete({ _id: req.params.id, ...req.orgFilter });
    if (!tache) return res.status(404).json({ success: false, message: 'Tâche introuvable' });
    res.json({ success: true, data: null });
  } catch (err) { next(err); }
};
