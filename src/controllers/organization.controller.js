const Organization = require('../models/Organization');
const User = require('../models/User');

/* GET /org/me — Infos de l'organisation courante */
exports.getMyOrg = async (req, res, next) => {
  try {
    const org = await Organization.findById(req.user.organizationId).populate('proprietaire', 'nom email');
    if (!org) return res.status(404).json({ success: false, message: 'Organisation introuvable' });
    res.json({ success: true, data: org });
  } catch (err) { next(err); }
};

/* PATCH /org/me — Mise à jour de l'organisation (org_admin uniquement) */
exports.updateMyOrg = async (req, res, next) => {
  try {
    const { nom, region } = req.body;
    const org = await Organization.findByIdAndUpdate(
      req.user.organizationId,
      { nom, region },
      { new: true, runValidators: true }
    );
    if (!org) return res.status(404).json({ success: false, message: 'Organisation introuvable' });
    res.json({ success: true, data: org });
  } catch (err) { next(err); }
};

/* GET /org/members — Liste des membres */
exports.getMembers = async (req, res, next) => {
  try {
    const members = await User.find({ organizationId: req.user.organizationId, actif: true })
      .select('nom email role createdAt');
    res.json({ success: true, data: members });
  } catch (err) { next(err); }
};

/* POST /org/members/invite — Inviter un membre (crée le compte) */
exports.inviteMember = async (req, res, next) => {
  try {
    const { nom, email, password, role } = req.body;

    const allowedRoles = ['manager', 'worker'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ success: false, message: `Rôle invalide. Valeurs acceptées : ${allowedRoles.join(', ')}` });
    }

    const existing = await User.findOne({ email: email?.toLowerCase() });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Un compte avec cet email existe déjà.' });
    }

    const member = await User.create({
      nom, email, password,
      role,
      organizationId: req.user.organizationId,
    });

    res.status(201).json({
      success: true,
      data: { id: member._id, nom: member.nom, email: member.email, role: member.role },
    });
  } catch (err) { next(err); }
};

/* PATCH /org/members/:id/role — Changer le rôle d'un membre */
exports.updateMemberRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    const allowedRoles = ['manager', 'worker'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ success: false, message: `Rôle invalide. Valeurs acceptées : ${allowedRoles.join(', ')}` });
    }

    const member = await User.findOneAndUpdate(
      { _id: req.params.id, organizationId: req.user.organizationId },
      { role },
      { new: true }
    ).select('nom email role');

    if (!member) return res.status(404).json({ success: false, message: 'Membre introuvable' });
    res.json({ success: true, data: member });
  } catch (err) { next(err); }
};

/* DELETE /org/members/:id — Désactiver un membre */
exports.removeMember = async (req, res, next) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Vous ne pouvez pas vous supprimer vous-même.' });
    }

    const member = await User.findOneAndUpdate(
      { _id: req.params.id, organizationId: req.user.organizationId },
      { actif: false },
      { new: true }
    ).select('nom email');

    if (!member) return res.status(404).json({ success: false, message: 'Membre introuvable' });
    res.json({ success: true, message: `${member.nom} a été désactivé.` });
  } catch (err) { next(err); }
};

/* ── Platform Admin only ──────────────────────────────────────── */

/* GET /org — Toutes les organisations (platform_admin) */
exports.getAllOrgs = async (req, res, next) => {
  try {
    const orgs = await Organization.find().populate('proprietaire', 'nom email').sort('-createdAt');
    res.json({ success: true, data: orgs });
  } catch (err) { next(err); }
};

/* PATCH /org/:id/toggle — Activer / désactiver une org (platform_admin) */
exports.toggleOrg = async (req, res, next) => {
  try {
    const org = await Organization.findById(req.params.id);
    if (!org) return res.status(404).json({ success: false, message: 'Organisation introuvable' });
    org.actif = !org.actif;
    await org.save();
    res.json({ success: true, data: org });
  } catch (err) { next(err); }
};
