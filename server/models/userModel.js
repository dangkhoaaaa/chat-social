const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    min: 3,
    max: 20,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    max: 50,
  },
  password: {
    type: String,
    required: true,
    min: 8,
  },
  isAvatarImageSet: {
    type: Boolean,
    default: false,
  },
  avatarImage: {
    url: {
      type: String,
      default: "",
    },
    public_id: {
      type: String,
      default: "",
    },
  },
  bio: {
    type: String,
    max: 500,
    default: "",
  },
  coverImage: {
    url: {
      type: String,
      default: "",
    },
    public_id: {
      type: String,
      default: "",
    },
  },
  fullName: {
    type: String,
    max: 100,
    default: "",
  },
  dateOfBirth: {
    type: Date,
  },
  location: {
    type: String,
    max: 100,
    default: "",
  },
  website: {
    type: String,
    max: 200,
    default: "",
  },
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
  }],
  following: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
  }],
  isOnline: {
    type: Boolean,
    default: false,
  },
  lastSeen: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model("Users", userSchema);
