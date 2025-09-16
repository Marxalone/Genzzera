require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const passport = require('passport');
const cors = require('cors');

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));

app.use(bodyParser.json());
app.use(cookieParser());
app.use(passport.initialize());

// Connect mongoose
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(()=> console.log('Mongo connected'))
  .catch(err=> { console.error('Mongo connection error', err); process.exit(1); });

const authRoutes = require('./routes/auth');

// Mount API under /api/auth and OAuth endpoints under /auth
app.use('/api/auth', authRoutes);

// The OAuth endpoints in authRoutes use routes like /auth/google and /auth/google/callback.
// If your authRoutes file defines those routes with router.get('/auth/google'...), you should mount authRoutes at root:
app.use('/', authRoutes);

// Serve frontend only for quick local dev
app.use(express.static('frontend'));

const PORT = process.env.PORT || 4000;
app.listen(PORT, ()=> console.log(`Server running on ${PORT}`));