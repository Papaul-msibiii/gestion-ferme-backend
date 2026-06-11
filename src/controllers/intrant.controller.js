const Intrant = require('../models/Intrant');

exports.getAll = async (req, res, next) => {
  try {
    const filter = { ...req.orgFilter };
    if (req.query.parcelle_id) filter.parcelle_id = req.query.parcelle_id;
    if (req.query.type)        filter.type        = req.query.type;
    if (req.query.campagne)    filter.campagne     = req.query.campagne;

    const intrants = await Intrant.find(filter)
      .populate({ path: 'parcelle_id', select: 'idParcelle nom' })
      .sort({ date_achat: -1, createdAt: -1 });

    const totaux = intrants.reduce((acc, i) => {
      const t = i.cout_total || 0;
      acc[i.type] = (acc[i.type] || 0) + t;
      acc.total   = (acc.total   || 0) + t;
      return acc;
    }, {});

    res.json({ success: true, count: intrants.length, totaux, data: intrants });
  } catch (err) { next(err); }
};

exports.getOne = async (req, res, next) => {
  try {
    const i = await Intrant.findOne({ _id: req.params.id, ...req.orgFilter })
      .populate({ path: 'parcelle_id', select: 'idParcelle nom' });
    if (!i) return res.status(404).json({ success: false, message: 'Intrant introuvable' });
    res.json({ success: true, data: i });
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const intrant = await Intrant.create({ ...req.body, ...req.orgFilter });
    await intrant.populate({ path: 'parcelle_id', select: 'idParcelle nom' });
    res.status(201).json({ success: true, data: intrant });
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const { organizationId, ...safeBody } = req.body;
    if (safeBody.quantite != null && safeBody.prix_unitaire != null) {
      safeBody.cout_total = Number(safeBody.quantite) * Number(safeBody.prix_unitaire);
    }
    if (safeBody.date_traitement && safeBody.dar_jours) {
      const d = new Date(safeBody.date_traitement);
      d.setDate(d.getDate() + Number(safeBody.dar_jours));
      safeBody.date_recolte_ok = d;
    }
    const intrant = await Intrant.findOneAndUpdate(
      { _id: req.params.id, ...req.orgFilter },
      safeBody,
      { new: true, runValidators: true }
    ).populate({ path: 'parcelle_id', select: 'idParcelle nom' });

    if (!intrant) return res.status(404).json({ success: false, message: 'Intrant introuvable' });
    res.json({ success: true, data: intrant });
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    const i = await Intrant.findOneAndDelete({ _id: req.params.id, ...req.orgFilter });
    if (!i) return res.status(404).json({ success: false, message: 'Intrant introuvable' });
    res.json({ success: true, message: 'Intrant supprimé' });
  } catch (err) { next(err); }
};
