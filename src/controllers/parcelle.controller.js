const Parcelle = require('../models/Parcelle');

exports.getAll = async (req, res, next) => {
  try {
    const parcelles = await Parcelle.find({ exploitationId: req.user.id })
      .sort({ idParcelle: 1 });
    const surfaceTotale = parcelles.reduce((acc, p) => acc + p.surface_ha, 0);
    res.json({ success: true, count: parcelles.length, surfaceTotale, data: parcelles });
  } catch (err) { next(err); }
};

exports.getOne = async (req, res, next) => {
  try {
    const p = await Parcelle.findOne({ _id: req.params.id, exploitationId: req.user.id });
    if (!p) return res.status(404).json({ success: false, message: 'Parcelle introuvable' });
    res.json({ success: true, data: p });
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const parcelle = await Parcelle.create({ ...req.body, exploitationId: req.user.id });
    res.status(201).json({ success: true, data: parcelle });
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const p = await Parcelle.findOneAndUpdate(
      { _id: req.params.id, exploitationId: req.user.id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!p) return res.status(404).json({ success: false, message: 'Parcelle introuvable' });
    res.json({ success: true, data: p });
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    const p = await Parcelle.findOneAndDelete({ _id: req.params.id, exploitationId: req.user.id });
    if (!p) return res.status(404).json({ success: false, message: 'Parcelle introuvable' });
    res.json({ success: true, message: 'Parcelle supprimée' });
  } catch (err) { next(err); }
};