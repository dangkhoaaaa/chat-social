const Story = require("../models/storyModel");
const User = require("../models/userModel");
const Notification = require("../models/notificationModel");
const { uploadFile, deleteFile } = require("../utils/uploadFile");

// Create story
module.exports.createStory = async (req, res, next) => {
  try {
    const { authorId } = req.body;
    const file = req.file;

    if (!authorId) {
      return res.json({ msg: "Author ID is required", status: false });
    }

    if (!file) {
      return res.json({ msg: "Media file is required", status: false });
    }

    // Upload media file
    const uploadResult = await uploadFile(file, "stories");
    const mediaType = file.mimetype.startsWith("image/") ? "image" : "video";

    const story = await Story.create({
      author: authorId,
      media: {
        url: uploadResult.url,
        type: mediaType,
      },
    });

    const populatedStory = await Story.findById(story._id)
      .populate("author", "username avatarImage fullName");

    return res.json({ status: true, story: populatedStory });
  } catch (ex) {
    next(ex);
  }
};

// Get stories (feed)
module.exports.getStories = async (req, res, next) => {
  try {
    const { userId } = req.query;

    // Get user's friends
    const user = await User.findById(userId);
    const friendIds = user.following || [];

    // Get active stories from user and friends
    const stories = await Story.find({
      author: { $in: [userId, ...friendIds] },
      isActive: true,
      expiresAt: { $gt: new Date() },
    })
      .populate("author", "username avatarImage fullName")
      .sort({ createdAt: -1 });

    // Group stories by author
    const storiesByAuthor = {};
    stories.forEach((story) => {
      const authorId = story.author._id.toString();
      if (!storiesByAuthor[authorId]) {
        storiesByAuthor[authorId] = {
          author: story.author,
          stories: [],
        };
      }
      storiesByAuthor[authorId].stories.push(story);
    });

    return res.json({
      status: true,
      stories: Object.values(storiesByAuthor),
    });
  } catch (ex) {
    next(ex);
  }
};

// Get user's stories
module.exports.getUserStories = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const stories = await Story.find({
      author: userId,
      isActive: true,
      expiresAt: { $gt: new Date() },
    })
      .populate("author", "username avatarImage fullName")
      .sort({ createdAt: -1 });

    return res.json({ status: true, stories });
  } catch (ex) {
    next(ex);
  }
};

// View story (add to views)
module.exports.viewStory = async (req, res, next) => {
  try {
    const { storyId, userId } = req.body;

    const story = await Story.findById(storyId);
    if (!story) {
      return res.json({ msg: "Story not found", status: false });
    }

    // Check if already viewed
    const alreadyViewed = story.views.some(
      (view) => view.userId.toString() === userId
    );

    if (!alreadyViewed) {
      story.views.push({
        userId: userId,
        viewedAt: new Date(),
      });
      await story.save();

      // Create notification if not own story
      if (story.author.toString() !== userId) {
        const user = await User.findById(userId);
        await Notification.create({
          recipient: story.author,
          sender: userId,
          type: "story_view",
          content: `${user.username} viewed your story`,
          relatedId: storyId,
        });
      }
    }

    return res.json({ status: true, story });
  } catch (ex) {
    next(ex);
  }
};

// Delete story
module.exports.deleteStory = async (req, res, next) => {
  try {
    const { storyId, userId } = req.body;

    const story = await Story.findById(storyId);
    if (!story) {
      return res.json({ msg: "Story not found", status: false });
    }

    if (story.author.toString() !== userId) {
      return res.json({ msg: "Unauthorized", status: false });
    }

    // Delete media file
    if (story.media && story.media.url) {
      // Extract fileName from URL if possible
      const urlParts = story.media.url.split("/");
      const fileName = urlParts[urlParts.length - 1];
      if (fileName) {
        await deleteFile(`stories/${fileName}`);
      }
    }

    story.isActive = false;
    await story.save();

    return res.json({ status: true, msg: "Story deleted" });
  } catch (ex) {
    next(ex);
  }
};

