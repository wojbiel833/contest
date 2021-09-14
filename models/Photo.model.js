const mongoose = require("mongoose");

const photoSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    maxlength: { $lte: 25 },
  },
  author: {
    type: String,
    required: true,
    maxlength: { $lte: 50 },
  },
  email: { type: String, required: true },
  src: { type: String, required: true },
  votes: { type: Number, required: true },
});

module.exports = mongoose.model("Photo", photoSchema);
