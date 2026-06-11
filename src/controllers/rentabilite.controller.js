const Rendement   = require('../models/Rendement');
const Intrant     = require('../models/Intrant');
const Activite    = require('../models/Activite');
const LigneBudget = require('../models/LigneBudget');

/* GET /rentabilite */
exports.get = async (req, res, next) => {
  try {
    const { campagne } = req.query;
    const eId = req.user.id;

    const base    = { exploitationId: eId };
    const withCmp = campagne ? { ...base, campagne } : base;

    /* ── Données sources ── */
    const [rendements, intrants, activites, budgetLignes] = await Promise.all([
      Rendement.find(withCmp).populate({ path: 'parcelle_id', select: 'idParcelle nom' }),
      Intrant.find(withCmp),
      Activite.find(withCmp),
      LigneBudget.find({ ...withCmp, categorie: 'Charge' }),
    ]);

    /* ── Overhead = charges Budget sans parcelle spécifique ── */
    const overhead = budgetLignes
      .filter((l) => !l.parcelle_id)
      .reduce((s, l) => s + (l.reel_fcfa ?? l.prevu_fcfa), 0);

    /* ── Maps parcelle → coûts ── */
    const intrantMap = {};
    for (const i of intrants) {
      const pid = i.parcelle_id.toString();
      intrantMap[pid] = (intrantMap[pid] || 0) + (i.cout_total ?? 0);
    }
    const moMap = {};
    for (const a of activites) {
      const pid = a.parcelle_id.toString();
      moMap[pid] = (moMap[pid] || 0) + (a.cout_mo ?? 0);
    }

    const surfaceTotale = rendements.reduce((s, r) => s + r.surface_ha, 0);

    /* ── Par culture ── */
    const cultures = rendements.map((r) => {
      const pid = (r.parcelle_id?._id ?? r.parcelle_id).toString();
      const cout_intrants       = intrantMap[pid] ?? 0;
      const cout_mo             = moMap[pid] ?? 0;
      const overhead_prorated   = surfaceTotale > 0
        ? parseFloat((overhead * (r.surface_ha / surfaceTotale)).toFixed(0))
        : 0;
      const charges_totales     = cout_intrants + cout_mo + overhead_prorated;

      const is_previsionnel     = r.rdt_reel_t_ha == null;
      const recette_prevue      = r.surface_ha * r.rdt_prevu_t_ha * r.prix_vente_fcfa_kg * 1000;
      const recette             = r.ca_total ?? recette_prevue;

      const marge_brute         = recette - cout_intrants - cout_mo;
      const marge_nette         = recette - charges_totales;
      const marge_par_ha        = r.surface_ha > 0 ? marge_nette / r.surface_ha : 0;
      const seuil_rentabilite   = r.prix_vente_fcfa_kg > 0
        ? charges_totales / (r.prix_vente_fcfa_kg * 1000)
        : 0;
      const taux_marge          = recette > 0 ? (marge_nette / recette) * 100 : 0;

      let recommandation;
      if (taux_marge > 20)      recommandation = 'Rentable';
      else if (taux_marge > 0)  recommandation = 'Marginal';
      else                      recommandation = 'Déficitaire';

      return {
        culture:           r.culture,
        surface_ha:        r.surface_ha,
        cout_intrants:     parseFloat(cout_intrants.toFixed(0)),
        cout_mo:           parseFloat(cout_mo.toFixed(0)),
        overhead_prorated,
        charges_totales:   parseFloat(charges_totales.toFixed(0)),
        recette:           parseFloat(recette.toFixed(0)),
        is_previsionnel,
        marge_brute:       parseFloat(marge_brute.toFixed(0)),
        marge_nette:       parseFloat(marge_nette.toFixed(0)),
        marge_par_ha:      parseFloat(marge_par_ha.toFixed(0)),
        seuil_rentabilite: parseFloat(seuil_rentabilite.toFixed(2)),
        taux_marge:        parseFloat(taux_marge.toFixed(1)),
        recommandation,
        prix_vente_fcfa_kg: r.prix_vente_fcfa_kg,
        rdt_prevu_t_ha:     r.rdt_prevu_t_ha,
        rdt_reel_t_ha:      r.rdt_reel_t_ha ?? null,
        parcelle:           r.parcelle_id,
      };
    });

    /* ── Stats globales ── */
    const totalCA          = cultures.reduce((s, c) => s + c.recette, 0);
    const totalCharges     = cultures.reduce((s, c) => s + c.charges_totales, 0);
    const totalMargeNette  = totalCA - totalCharges;
    const tauxMargeGlobal  = totalCA > 0 ? parseFloat(((totalMargeNette / totalCA) * 100).toFixed(1)) : 0;
    const nbRentables      = cultures.filter((c) => c.recommandation === 'Rentable').length;
    const nbDeficitaires   = cultures.filter((c) => c.recommandation === 'Déficitaire').length;

    res.json({
      success:  true,
      stats: {
        totalCA:       parseFloat(totalCA.toFixed(0)),
        totalCharges:  parseFloat(totalCharges.toFixed(0)),
        totalMargeNette: parseFloat(totalMargeNette.toFixed(0)),
        tauxMargeGlobal,
        surfaceTotale,
        nbCultures:    cultures.length,
        nbRentables,
        nbDeficitaires,
        overheadTotal: parseFloat(overhead.toFixed(0)),
      },
      data: cultures,
    });
  } catch (err) { next(err); }
};
