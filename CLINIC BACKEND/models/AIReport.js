const mongoose = require("mongoose");

const aiReportSchema = new mongoose.Schema({

  image: String,

  report: String,

  createdAt: {
    type: Date,
    default: Date.now
  }

});

module.exports =
  mongoose.model(
    "AIReport",
    aiReportSchema
  );