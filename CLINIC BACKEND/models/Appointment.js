const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  name: String,
  phone: String,
  email: String,
  service: String,
  message: String,
});

module.exports = mongoose.model('Appointment', appointmentSchema);

