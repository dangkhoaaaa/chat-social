const mongoose = require("mongoose");

const storySchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
    required: true,
  },
  media: {
    url: { type: String, required: true },
    type: { type: String, enum: ["image", "video"], required: true },
  },
  views: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
    },
    viewedAt: {
      type: Date,
      default: Date.now,
    },
  }],
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Index để tự động xóa stories đã hết hạn
storySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("Stories", storySchema);

