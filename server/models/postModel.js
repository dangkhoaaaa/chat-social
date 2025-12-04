const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
    required: true,
  },
  content: {
    type: String,
    max: 5000,
    default: "",
  },
  media: [{
    url: { type: String, required: true },
    type: { type: String, enum: ["image", "video"], required: true },
    fileName: { type: String, default: "" },
  }],
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
  }],
  comments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Comments",
  }],
  shares: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
    },
    sharedAt: {
      type: Date,
      default: Date.now,
    },
  }],
  shareCount: {
    type: Number,
    default: 0,
  },
  isPublic: {
    type: Boolean,
    default: true,
  },
  tags: [{
    type: String,
  }],
  location: {
    type: String,
    default: "",
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model("Posts", postSchema);

