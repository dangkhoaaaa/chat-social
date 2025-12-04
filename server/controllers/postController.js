const Post = require("../models/postModel");
const User = require("../models/userModel");
const Notification = require("../models/notificationModel");
const { uploadFile, deleteFile } = require("../utils/uploadFile");

// Create post
module.exports.createPost = async (req, res, next) => {
  try {
    const { authorId, content, isPublic, location, tags } = req.body;
    const files = req.files || [];

    if (!authorId) {
      return res.json({ msg: "Author ID is required", status: false });
    }

    // Upload media files if any
    const media = [];
    if (files.length > 0) {
      for (const file of files) {
        try {
          const uploadResult = await uploadFile(file, "posts");
          media.push({
            url: uploadResult.url,
            type: file.mimetype.startsWith("image/") ? "image" : "video",
            fileName: uploadResult.fileName,
          });
        } catch (error) {
          console.error("Error uploading file:", error);
        }
      }
    }

    const post = await Post.create({
      author: authorId,
      content: content || "",
      media: media,
      isPublic: isPublic !== undefined ? isPublic : true,
      location: location || "",
      tags: tags ? (Array.isArray(tags) ? tags : [tags]) : [],
    });

    const populatedPost = await Post.findById(post._id)
      .populate("author", "username avatarImage fullName")
      .populate("likes", "username avatarImage")
      .populate("comments");

    return res.json({ status: true, post: populatedPost });
  } catch (ex) {
    next(ex);
  }
};

// Get posts (feed)
module.exports.getPosts = async (req, res, next) => {
  try {
    const { userId, page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get user's friends
    const user = await User.findById(userId);
    const friendIds = user.following || [];

    // Get posts from user and friends, or all public posts
    const posts = await Post.find({
      $or: [
        { author: userId },
        { author: { $in: friendIds }, isPublic: true },
        { isPublic: true },
      ],
    })
      .populate("author", "username avatarImage fullName")
      .populate("likes", "username avatarImage")
      .populate({
        path: "comments",
        populate: {
          path: "author",
          select: "username avatarImage",
        },
        options: { limit: 3, sort: { createdAt: -1 } },
      })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    return res.json({ status: true, posts });
  } catch (ex) {
    next(ex);
  }
};

// Get user's posts
module.exports.getUserPosts = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const posts = await Post.find({ author: userId })
      .populate("author", "username avatarImage fullName")
      .populate("likes", "username avatarImage")
      .populate({
        path: "comments",
        populate: {
          path: "author",
          select: "username avatarImage",
        },
      })
      .sort({ createdAt: -1 });

    return res.json({ status: true, posts });
  } catch (ex) {
    next(ex);
  }
};

// Get single post
module.exports.getPost = async (req, res, next) => {
  try {
    const { postId } = req.params;

    const post = await Post.findById(postId)
      .populate("author", "username avatarImage fullName")
      .populate("likes", "username avatarImage")
      .populate({
        path: "comments",
        populate: {
          path: "author",
          select: "username avatarImage",
        },
        populate: {
          path: "replies",
          populate: {
            path: "author",
            select: "username avatarImage",
          },
        },
      });

    if (!post) {
      return res.json({ msg: "Post not found", status: false });
    }

    return res.json({ status: true, post });
  } catch (ex) {
    next(ex);
  }
};

// Delete post
module.exports.deletePost = async (req, res, next) => {
  try {
    const { postId, userId } = req.body;

    const post = await Post.findById(postId);
    if (!post) {
      return res.json({ msg: "Post not found", status: false });
    }

    if (post.author.toString() !== userId) {
      return res.json({ msg: "Unauthorized", status: false });
    }

    // Delete media files
    if (post.media && post.media.length > 0) {
      for (const mediaItem of post.media) {
        if (mediaItem.fileName) {
          await deleteFile(mediaItem.fileName);
        }
      }
    }

    await Post.findByIdAndDelete(postId);

    return res.json({ status: true, msg: "Post deleted" });
  } catch (ex) {
    next(ex);
  }
};

// Like/Unlike post
module.exports.toggleLike = async (req, res, next) => {
  try {
    const { postId, userId } = req.body;

    const post = await Post.findById(postId);
    if (!post) {
      return res.json({ msg: "Post not found", status: false });
    }

    const isLiked = post.likes.includes(userId);

    if (isLiked) {
      // Unlike
      post.likes = post.likes.filter(
        (id) => id.toString() !== userId
      );
      await post.save();
    } else {
      // Like
      post.likes.push(userId);
      await post.save();

      // Create notification (if not own post)
      if (post.author.toString() !== userId) {
        const user = await User.findById(userId);
        await Notification.create({
          recipient: post.author,
          sender: userId,
          type: "post_like",
          content: `${user.username} liked your post`,
          relatedId: postId,
        });
      }
    }

    const updatedPost = await Post.findById(postId)
      .populate("likes", "username avatarImage");

    return res.json({ status: true, post: updatedPost, isLiked: !isLiked });
  } catch (ex) {
    next(ex);
  }
};

// Share post
module.exports.sharePost = async (req, res, next) => {
  try {
    const { postId, userId } = req.body;

    const post = await Post.findById(postId);
    if (!post) {
      return res.json({ msg: "Post not found", status: false });
    }

    // Check if already shared by this user
    const alreadyShared = post.shares.some(
      (share) => share.userId.toString() === userId
    );

    if (!alreadyShared) {
      post.shares.push({
        userId: userId,
        sharedAt: new Date(),
      });
      post.shareCount += 1;
      await post.save();

      // Create notification
      if (post.author.toString() !== userId) {
        const user = await User.findById(userId);
        await Notification.create({
          recipient: post.author,
          sender: userId,
          type: "post_share",
          content: `${user.username} shared your post`,
          relatedId: postId,
        });
      }
    }

    return res.json({ status: true, post });
  } catch (ex) {
    next(ex);
  }
};

