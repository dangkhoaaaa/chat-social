const Comment = require("../models/commentModel");
const Post = require("../models/postModel");
const User = require("../models/userModel");
const Notification = require("../models/notificationModel");

// Create comment
module.exports.createComment = async (req, res, next) => {
  try {
    const { postId, authorId, content, parentCommentId } = req.body;

    if (!postId || !authorId || !content) {
      return res.json({ msg: "Missing required fields", status: false });
    }

    const commentData = {
      post: postId,
      author: authorId,
      content: content,
    };

    if (parentCommentId) {
      commentData.parentComment = parentCommentId;
    }

    const comment = await Comment.create(commentData);

    // Add comment to post
    await Post.findByIdAndUpdate(postId, {
      $push: { comments: comment._id },
    });

    // If it's a reply, add to parent comment
    if (parentCommentId) {
      await Comment.findByIdAndUpdate(parentCommentId, {
        $push: { replies: comment._id },
      });
    }

    const populatedComment = await Comment.findById(comment._id)
      .populate("author", "username avatarImage fullName")
      .populate("likes", "username avatarImage");

    // Create notification
    const post = await Post.findById(postId);
    if (post.author.toString() !== authorId) {
      const user = await User.findById(authorId);
      await Notification.create({
        recipient: post.author,
        sender: authorId,
        type: parentCommentId ? "comment_reply" : "post_comment",
        content: parentCommentId
          ? `${user.username} replied to your comment`
          : `${user.username} commented on your post`,
        relatedId: postId,
      });
    }

    return res.json({ status: true, comment: populatedComment });
  } catch (ex) {
    next(ex);
  }
};

// Get comments for a post
module.exports.getComments = async (req, res, next) => {
  try {
    const { postId } = req.params;

    const comments = await Comment.find({
      post: postId,
      parentComment: null, // Only top-level comments
    })
      .populate("author", "username avatarImage fullName")
      .populate("likes", "username avatarImage")
      .populate({
        path: "replies",
        populate: {
          path: "author",
          select: "username avatarImage",
        },
        populate: {
          path: "likes",
          select: "username avatarImage",
        },
      })
      .sort({ createdAt: -1 });

    return res.json({ status: true, comments });
  } catch (ex) {
    next(ex);
  }
};

// Delete comment
module.exports.deleteComment = async (req, res, next) => {
  try {
    const { commentId, userId } = req.body;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.json({ msg: "Comment not found", status: false });
    }

    if (comment.author.toString() !== userId) {
      return res.json({ msg: "Unauthorized", status: false });
    }

    // Remove from post
    await Post.findByIdAndUpdate(comment.post, {
      $pull: { comments: commentId },
    });

    // Remove from parent comment if exists
    if (comment.parentComment) {
      await Comment.findByIdAndUpdate(comment.parentComment, {
        $pull: { replies: commentId },
      });
    }

    // Delete comment and its replies recursively
    await Comment.findByIdAndDelete(commentId);

    return res.json({ status: true, msg: "Comment deleted" });
  } catch (ex) {
    next(ex);
  }
};

// Like/Unlike comment
module.exports.toggleLike = async (req, res, next) => {
  try {
    const { commentId, userId } = req.body;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.json({ msg: "Comment not found", status: false });
    }

    const isLiked = comment.likes.includes(userId);

    if (isLiked) {
      comment.likes = comment.likes.filter(
        (id) => id.toString() !== userId
      );
    } else {
      comment.likes.push(userId);
    }

    await comment.save();

    const updatedComment = await Comment.findById(commentId)
      .populate("likes", "username avatarImage");

    return res.json({ status: true, comment: updatedComment, isLiked: !isLiked });
  } catch (ex) {
    next(ex);
  }
};

