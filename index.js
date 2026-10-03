const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const mongoose = require('mongoose');

const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

mongoose.connect(process.env.MONGO_URI);

app.use(cors());
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Schemas
const userSchema = new mongoose.Schema({
  username: String
});

const exerciseSchema = new mongoose.Schema({
  userId: String,
  description: String,
  duration: Number,
  date: String
});

const User = mongoose.model('User', userSchema);
const Exercise = mongoose.model('Exercise', exerciseSchema);

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

// POST - create new user
app.post('/api/users', async (req, res) => {
  try {
    const user = new User({ username: req.body.username });
    await user.save();
    res.json({ username: user.username, _id: user._id });
  } catch (err) {
    res.json({ error: err.message });
  }
});

// GET - get all users
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find({}, 'username _id');
    res.json(users);
  } catch (err) {
    res.json({ error: err.message });
  }
});

// POST - add an exercise 
app.post('/api/users/:_id/exercises', async (req, res) => {
  try {
    const user = await User.findById(req.params._id);
    if (!user) return res.json({ error: 'User not found' });

    const date = req.body.date
      ? new Date(req.body.date).toDateString()
      : new Date().toDateString();

    const exercise = new Exercise({
      userId: user._id,
      description: req.body.description,
      duration: parseInt(req.body.duration),
      date: date
    });

    await exercise.save();

    res.json({
      username: user.username,
      description: exercise.description,
      duration: exercise.duration,
      date: exercise.date,
      _id: user._id
    });
  } catch (err) {
    res.json({ error: err.message });
  }
});

// GET - get exercise log
app.get('/api/users/:_id/logs', async (req, res) => {
  try {
    const user = await User.findById(req.params._id);
    if (!user) return res.json({ error: 'User not found' });

    let filter = { userId: req.params._id };

    let exercises = await Exercise.find(filter);

    if (req.query.from || req.query.to) {
      let fromDate = req.query.from ? new Date(req.query.from) : new Date(0);
      let toDate = req.query.to ? new Date(req.query.to) : new Date();

      exercises = exercises.filter(e => {
        const eDate = new Date(e.date);
        return eDate >= fromDate && eDate <= toDate;
      });
    }

    if (req.query.limit) {
      exercises = exercises.slice(0, parseInt(req.query.limit));
    }

    res.json({
      username: user.username,
      count: exercises.length,
      _id: user._id,
      log: exercises.map(e => ({
        description: e.description,
        duration: e.duration,
        date: e.date
      }))
    });
  } catch (err) {
    res.json({ error: err.message });
  }
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});