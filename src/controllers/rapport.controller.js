const User           = require('../models/User');
const Parcelle       = require('../models/Parcelle');
const Intrant        = require('../models/Intrant');
const Activite       = require('../models/Activite');
const Rendement      = require('../models/Rendement');
const Stock          = require('../models/Stock');
const MouvementStock = require('../models/MouvementStock');
const LigneBudget    = require('../models/LigneBudget');
const Meteo          = require('../models/Meteo');
const TacheGantt     = require('../models/TacheGantt');

/* GET /rapport?campagne=2025-2026 */
exports.get = async (req, res, next) => {
  try {
    const { campagne } = req.query;
    const eId     = req.user.id;
    const base    = { exploitationId: eId };
    const withCmp = campagne ? { ...base, campagne } : base;

    /* ── Filtre dates Météo selon la campagne (ex: "2025-2026" → entre 01/2025 et 12/2026) ── */
    let meteoFilter = { ...base };
    if (campagne) {
      const parts = campagne.split('-');
      const yearStart = parseInt(parts[0], 10);
      const yearEnd   = parts[1] ? parseInt(parts[1], 10) : yearStart + 1;
      if (!isNaN(yearStart) && !isNaN(yearEnd)) {
        meteoFilter.semaine = {
          $gte: new Date(`${yearStart}-01-01`),
          $lte: new Date(`${yearEnd}-12-31`),
        };
      }
    }

    /* ── Requêtes parallèles ── */
    const [user, parcelles, intrants, activites, rendements, stocks, budgetLignes, meteos, taches] =
      await Promise.all([
        User.findById(eId).select('nom exploitation region email'),
        Parcelle.find(withCmp).sort({ idParcelle: 1 }),
        Intrant.find(withCmp),
        Activite.find(withCmp),
        Rendement.find(withCmp).populate({ path: 'parcelle_id', select: 'idParcelle nom' }),
        Stock.find(base),                              // pas de campagne sur le modèle Stock
        LigneBudget.find(withCmp),
        Meteo.find(meteoFilter).sort({ semaine: -1 }), // filtré par année de campagne
        TacheGantt.find(withCmp),
      ]);

    /* ── Stocks enrichis via agrégation ── */
    const stockAgg = await MouvementStock.aggregate([
      { $match: { stock_id: { $in: stocks.map((s) => s._id) } } },
      {
        $group: {
          _id:   { stock_id: '$stock_id', type: '$type' },
          total: { $sum: '$quantite' },
        },
      },
    ]);
    const stocksEnriched = stocks.map((s) => {
      const rows = stockAgg.filter((a) => a._id.stock_id.toString() === s._id.toString());
      const entrees      = rows.find((a) => a._id.type === 'Entrée')?.total ?? 0;
      const sorties      = rows.find((a) => a._id.type === 'Sortie')?.total ?? 0;
      const stock_actuel = s.stock_initial + entrees - sorties;
      const statut       = stock_actuel <= 0 ? 'RUPTURE' : stock_actuel <= s.seuil_alerte ? 'ALERTE' : 'OK';
      return { produit: s.produit, categorie: s.categorie, unite: s.unite, seuil_alerte: s.seuil_alerte, stock_actuel, statut };
    });
    const alertesStock = stocksEnriched.filter((s) => s.statut !== 'OK');

    /* ── Parcelles ── */
    const surfaceTotale = parcelles.reduce((s, p) => s + p.surface_ha, 0);
    const cultures      = [...new Set(parcelles.map((p) => p.culture).filter(Boolean))];

    /* ── Intrants ── */
    const TYPES_I = ['Semence', 'Engrais', 'Phytosanitaire'];
    const coutIntrantsTotal = intrants.reduce((s, i) => s + (i.cout_total ?? 0), 0);
    const intrantsByType    = TYPES_I.map((t) => ({
      type:  t,
      count: intrants.filter((i) => i.type === t).length,
      cout:  intrants.filter((i) => i.type === t).reduce((s, i) => s + (i.cout_total ?? 0), 0),
    }));

    /* ── Phyto DAR en attente ── */
    const phytoEnAttente = intrants.filter((i) => {
      if (i.type !== 'Phytosanitaire' || !i.dar_jours || !i.date_traitement) return false;
      const ok = i.date_recolte_ok
        ? new Date(i.date_recolte_ok)
        : (() => { const d = new Date(i.date_traitement); d.setDate(d.getDate() + i.dar_jours); return d; })();
      return new Date() < ok;
    });

    /* ── Activités ── */
    const coutMOTotal       = activites.reduce((s, a) => s + (a.cout_mo ?? 0), 0);
    const dureeHeuresTotal  = activites.reduce((s, a) => s + (a.duree_heures ?? 0), 0);

    /* ── Rendements ── */
    const rendAvecReel    = rendements.filter((r) => r.rdt_reel_t_ha != null);
    const productionTotale = rendAvecReel.reduce((s, r) => s + (r.production_t ?? 0), 0);
    const caTotal          = rendAvecReel.reduce((s, r) => s + (r.ca_total ?? 0), 0);
    const rdtMoyen         = rendAvecReel.length
      ? rendAvecReel.reduce((s, r) => s + r.rdt_reel_t_ha, 0) / rendAvecReel.length
      : 0;

    /* ── Budget ── */
    const charges             = budgetLignes.filter((l) => l.categorie === 'Charge');
    const produits            = budgetLignes.filter((l) => l.categorie === 'Produit');
    const totalChargesPrevu   = charges.reduce((s, l) => s + l.prevu_fcfa, 0);
    const totalProduitsPrevu  = produits.reduce((s, l) => s + l.prevu_fcfa, 0);
    const totalChargesReel    = charges.reduce((s, l)  => s + (l.reel_fcfa ?? l.prevu_fcfa), 0);
    const totalProduitsReel   = produits.reduce((s, l) => s + (l.reel_fcfa ?? l.prevu_fcfa), 0);
    const margeNetteBudget    = totalProduitsReel - totalChargesReel;
    const tauxMargeBudget     = totalProduitsReel > 0 ? (margeNetteBudget / totalProduitsReel) * 100 : 0;

    /* ── Planning ── */
    const nbTerminees    = taches.filter((t) => t.statut === 'Terminé').length;
    const tauxRealisation = taches.length > 0 ? (nbTerminees / taches.length) * 100 : 0;

    /* ── Météo ── */
    const cumulPluie      = meteos.reduce((s, m) => s + m.pluie_mm, 0);
    const cumulETP        = meteos.reduce((s, m) => s + m.etp_mm, 0);
    const cumulIrrigation = meteos.reduce((s, m) => s + (m.irrigation_prevue_mm ?? 0), 0);
    const bilanHydrique   = parseFloat((cumulPluie + cumulIrrigation - cumulETP).toFixed(1));

    res.json({
      success:    true,
      genereLe:   new Date().toISOString(),
      campagne:   campagne ?? '—',
      exploitation: {
        nom:         user.nom,
        exploitation: user.exploitation,
        region:      user.region,
        email:       user.email,
      },
      parcelles: {
        count: parcelles.length, surfaceTotale, cultures,
        list:  parcelles.map((p) => ({
          idParcelle: p.idParcelle, nom: p.nom,
          surface_ha: p.surface_ha, culture: p.culture,
          variete: p.variete, statut: p.statut, campagne: p.campagne,
        })),
      },
      intrants: { total: intrants.length, coutTotal: coutIntrantsTotal, byType: intrantsByType },
      activites: { total: activites.length, coutMOTotal, dureeHeuresTotal },
      rendements: {
        total: rendements.length,
        avecReel: rendAvecReel.length,
        productionTotale: parseFloat(productionTotale.toFixed(2)),
        caTotal:   parseFloat(caTotal.toFixed(0)),
        rdtMoyen:  parseFloat(rdtMoyen.toFixed(2)),
        list:      rendements.map((r) => ({
          culture:     r.culture,
          surface_ha:  r.surface_ha,
          rdt_prevu:   r.rdt_prevu_t_ha,
          rdt_reel:    r.rdt_reel_t_ha ?? null,
          production_t: r.production_t ?? null,
          ca_total:    r.ca_total ?? null,
          parcelle:    r.parcelle_id,
        })),
      },
      budget: {
        totalChargesPrevu, totalProduitsPrevu,
        totalChargesReel,  totalProduitsReel,
        margeNette:  parseFloat(margeNetteBudget.toFixed(0)),
        tauxMarge:   parseFloat(tauxMargeBudget.toFixed(1)),
        nbLignes:    budgetLignes.length,
      },
      stocks: {
        total:   stocks.length,
        alertes: alertesStock.length,
        list:    stocksEnriched,
      },
      planning: {
        total:     taches.length,
        terminees: nbTerminees,
        enCours:   taches.filter((t) => t.statut === 'En cours').length,
        planifie:  taches.filter((t) => t.statut === 'Planifié').length,
        tauxRealisation: parseFloat(tauxRealisation.toFixed(1)),
      },
      meteo: {
        nbSemaines: meteos.length,
        cumulPluie, cumulETP, cumulIrrigation, bilanHydrique,
      },
      phyto: {
        total:        intrants.filter((i) => i.type === 'Phytosanitaire').length,
        darEnAttente: phytoEnAttente.length,
        alertes:      phytoEnAttente.map((i) => ({
          produit:         i.produit,
          matiere_active:  i.matiere_active,
          date_traitement: i.date_traitement,
          dar_jours:       i.dar_jours,
          date_recolte_ok: i.date_recolte_ok,
        })),
      },
    });
  } catch (err) { next(err); }
};
