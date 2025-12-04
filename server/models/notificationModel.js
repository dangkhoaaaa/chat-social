const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
    required: true,
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
  },
  type: {
    type: String,
    enum: [
      "friend_request",
      "friend_accepted",
      "post_like",
      "post_comment",
      "post_share",
      "comment_like",
      "comment_reply",
      "story_view",
      "group_invite",
      "group_message",
      "mention",
    ],
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  relatedId: {
    type: mongoose.Schema.Types.ObjectId,
    // Có thể là Post, Comment, Story, Group, etc.
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  readAt: {
    type: Date,
  },
}, {
  timestamps: true,
});

// Index để query nhanh hơn
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model("Notifications", notificationSchema);

