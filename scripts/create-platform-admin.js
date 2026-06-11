/**
 * Script de création du Platform Admin (Tool Djolof)
 * Usage : node scripts/create-platform-admin.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User     = require('../src/models/User');

const ADMIN = {
  nom:      'Super Admin',
  email:    'admin@tooldjolof.com',
  password: 'Admin@2025!',
  role:     'platform_admin',
};

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ MongoDB connecté');

  const existing = await User.findOne({ email: ADMIN.email });
  if (existing) {
    console.log(`⚠️  Un platform_admin existe déjà : ${existing.email} (rôle: ${existing.role})`);
    await mongoose.disconnect();
    return;
  }

  const admin = await User.create({
    nom:            ADMIN.nom,
    email:          ADMIN.email,
    password:       ADMIN.password,
    role:           'platform_admin',
    organizationId: null,
  });

  console.log('\n🎉 Platform Admin créé avec succès !');
  console.log('─────────────────────────────────────');
  console.log(`  Email    : ${admin.email}`);
  console.log(`  Password : ${ADMIN.password}`);
  console.log(`  Rôle     : ${admin.role}`);
  console.log(`  ID       : ${admin._id}`);
  console.log('─────────────────────────────────────');
  console.log('⚠️  Changez le mot de passe en production !');

  await mongoose.disconnect();
}

run().catch(err => {
  console.error('❌ Erreur :', err.message);
  process.exit(1);
});
