const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema({
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Posts",
    required: true,
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
    required: true,
  },
  content: {
    type: String,
    required: true,
    max: 1000,
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
  }],
  replies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Comments",
  }],
  parentComment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Comments",
    default: null,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model("Comments", commentSchema);

