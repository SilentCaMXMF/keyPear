const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const fileUpload = require('express-fileupload');
const passport = require('passport');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const oauthRoutes = require('./routes/oauth');
const filesRoutes = require('./routes/files');
const foldersRoutes = require('./routes/folders');
const sharesRoutes = require('./routes/shares');
const chunksRoutes = require('./routes/chunks');
const logsRoutes = require('./routes/logs');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:4321' }));
app.use(helmet());
app.use(morgan('combined'));
app.use(express.json());
app.use(fileUpload({ useTempFiles: true, tempFileDir: '/tmp/' }));
app.use(passport.initialize());

app.use('/api/auth', authRoutes);
app.use('/api/auth/oauth', oauthRoutes);
app.use('/api/files', filesRoutes);
app.use('/api/files/chunks', chunksRoutes);
app.use('/api/folders', foldersRoutes);
app.use('/api/shares', sharesRoutes);
app.use('/api/logs', logsRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
