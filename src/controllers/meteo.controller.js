const Meteo = require('../models/Meteo');

/* Normalise une date au lundi de sa semaine */
function toLundi(dateStr) {
  const d = new Date(dateStr);
  const day = d.getUTCDay(); // 0=dim, 1=lun …
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function computeStats(semaines) {
  const n = semaines.length;
  if (n === 0) return { cumulPluie: 0, cumulETP: 0, cumulIrrigation: 0, deficitTotal: 0, bilan: 0, nbSemaines: 0 };

  const cumulPluie      = semaines.reduce((s, m) => s + m.pluie_mm, 0);
  const cumulETP        = semaines.reduce((s, m) => s + m.etp_mm, 0);
  const cumulIrrigation = semaines.reduce((s, m) => s + (m.irrigation_prevue_mm ?? 0), 0);
  const deficitTotal    = parseFloat((cumulETP - cumulPluie).toFixed(2));
  const bilan           = parseFloat((cumulPluie + cumulIrrigation - cumulETP).toFixed(2));

  return { cumulPluie, cumulETP, cumulIrrigation, deficitTotal, bilan, nbSemaines: n };
}

/* GET /meteo */
exports.getAll = async (req, res, next) => {
  try {
    const semaines = await Meteo.find({ exploitationId: req.user.id }).sort({ semaine: -1 });
    res.json({ success: true, count: semaines.length, stats: computeStats(semaines), data: semaines });
  } catch (err) { next(err); }
};

/* POST /meteo */
exports.create = async (req, res, next) => {
  try {
    const lundi = toLundi(req.body.semaine);
    const entry = await Meteo.create({ ...req.body, semaine: lundi, exploitationId: req.user.id });
    res.status(201).json({ success: true, data: entry });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: 'Une entrée existe déjà pour cette semaine.' });
    }
    next(err);
  }
};

/* PUT /meteo/:id */
exports.update = async (req, res, next) => {
  try {
    const { exploitationId, ...safeBody } = req.body;
    if (safeBody.semaine) safeBody.semaine = toLundi(safeBody.semaine);
    const entry = await Meteo.findOneAndUpdate(
      { _id: req.params.id, exploitationId: req.user.id },
      safeBody, { new: true, runValidators: true },
    );
    if (!entry) return res.status(404).json({ success: false, message: 'Entrée introuvable' });
    res.json({ success: true, data: entry });
  } catch (err) { next(err); }
};

/* DELETE /meteo/:id */
exports.remove = async (req, res, next) => {
  try {
    const entry = await Meteo.findOneAndDelete({ _id: req.params.id, exploitationId: req.user.id });
    if (!entry) return res.status(404).json({ success: false, message: 'Entrée introuvable' });
    res.json({ success: true, data: null });
  } catch (err) { next(err); }
};
