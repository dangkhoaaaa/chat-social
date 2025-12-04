const mongoose = require("mongoose");

const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    max: 100,
  },
  description: {
    type: String,
    max: 500,
    default: "",
  },
  avatar: {
    type: String,
    default: "",
  },
  coverImage: {
    type: String,
    default: "",
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
    required: true,
  },
  admins: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
  }],
  members: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    role: {
      type: String,
      enum: ["member", "admin"],
      default: "member",
    },
  }],
  isPublic: {
    type: Boolean,
    default: true,
  },
  maxMembers: {
    type: Number,
    default: 1000,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model("Groups", groupSchema);

