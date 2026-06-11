require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();

// Middlewares globaux
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/v1/auth',       require('./routes/auth.routes'));
app.use('/api/v1/parcelles',  require('./routes/parcelle.routes'));
app.use('/api/v1/intrants',   require('./routes/intrant.routes'));
app.use('/api/v1/activites',  require('./routes/activite.routes'));
app.use('/api/v1/rendements', require('./routes/rendement.routes'));
app.use('/api/v1/stocks',     require('./routes/stock.routes'));
app.use('/api/v1/budget',     require('./routes/budget.routes'));
app.use('/api/v1/gantt',      require('./routes/gantt.routes'));
app.use('/api/v1/meteo',      require('./routes/meteo.routes'));
app.use('/api/v1/rentabilite', require('./routes/rentabilite.routes'));
// app.use('/api/v1/rapport',    require('./routes/rapport.routes'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', app: 'GESTION FERME API' }));

// 404
app.use((req, res) => res.status(404).json({ message: 'Route introuvable' }));

// Gestion erreurs globale
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Erreur serveur interne',
  });
});

module.exports = app;