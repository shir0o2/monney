const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/finance_app', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

module.exports = mongoose.connection;