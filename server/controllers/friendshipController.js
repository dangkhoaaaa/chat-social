const Friendship = require("../models/friendshipModel");
const User = require("../models/userModel");
const Notification = require("../models/notificationModel");

// Send friend request
module.exports.sendFriendRequest = async (req, res, next) => {
  try {
    const { requesterId, recipientId } = req.body;

    if (requesterId === recipientId) {
      return res.json({ msg: "Cannot send friend request to yourself", status: false });
    }

    // Check if friendship already exists
    const existingFriendship = await Friendship.findOne({
      $or: [
        { requester: requesterId, recipient: recipientId },
        { requester: recipientId, recipient: requesterId },
      ],
    });

    if (existingFriendship) {
      if (existingFriendship.status === "accepted") {
        return res.json({ msg: "Already friends", status: false });
      }
      if (existingFriendship.status === "pending") {
        return res.json({ msg: "Friend request already sent", status: false });
      }
      if (existingFriendship.status === "blocked") {
        return res.json({ msg: "User is blocked", status: false });
      }
    }

    // Create new friendship
    const friendship = await Friendship.create({
      requester: requesterId,
      recipient: recipientId,
      status: "pending",
    });

    // Create notification
    const requester = await User.findById(requesterId);
    await Notification.create({
      recipient: recipientId,
      sender: requesterId,
      type: "friend_request",
      content: `${requester.username} sent you a friend request`,
    });

    return res.json({ status: true, friendship });
  } catch (ex) {
    next(ex);
  }
};

// Accept friend request
module.exports.acceptFriendRequest = async (req, res, next) => {
  try {
    const { friendshipId, userId } = req.body;

    const friendship = await Friendship.findById(friendshipId);
    if (!friendship) {
      return res.json({ msg: "Friendship not found", status: false });
    }

    if (friendship.recipient.toString() !== userId) {
      return res.json({ msg: "Unauthorized", status: false });
    }

    friendship.status = "accepted";
    await friendship.save();

    // Update user's friends lists
    await User.findByIdAndUpdate(friendship.requester, {
      $addToSet: { following: friendship.recipient },
    });
    await User.findByIdAndUpdate(friendship.recipient, {
      $addToSet: { following: friendship.requester },
    });

    // Create notification
    const recipient = await User.findById(friendship.recipient);
    await Notification.create({
      recipient: friendship.requester,
      sender: friendship.recipient,
      type: "friend_accepted",
      content: `${recipient.username} accepted your friend request`,
    });

    return res.json({ status: true, friendship });
  } catch (ex) {
    next(ex);
  }
};

// Reject friend request
module.exports.rejectFriendRequest = async (req, res, next) => {
  try {
    const { friendshipId, userId } = req.body;

    const friendship = await Friendship.findById(friendshipId);
    if (!friendship) {
      return res.json({ msg: "Friendship not found", status: false });
    }

    if (friendship.recipient.toString() !== userId) {
      return res.json({ msg: "Unauthorized", status: false });
    }

    friendship.status = "rejected";
    await friendship.save();

    return res.json({ status: true, msg: "Friend request rejected" });
  } catch (ex) {
    next(ex);
  }
};

// Get friend requests (pending requests received)
module.exports.getFriendRequests = async (req, res, next) => {
  try {
    const userId = req.params.userId;

    const requests = await Friendship.find({
      recipient: userId,
      status: "pending",
    })
      .populate("requester", "username avatarImage email fullName")
      .sort({ createdAt: -1 });

    return res.json({ status: true, requests });
  } catch (ex) {
    next(ex);
  }
};

// Get friends list
module.exports.getFriends = async (req, res, next) => {
  try {
    const userId = req.params.userId;

    const friendships = await Friendship.find({
      $or: [
        { requester: userId, status: "accepted" },
        { recipient: userId, status: "accepted" },
      ],
    })
      .populate("requester", "username avatarImage email fullName isOnline lastSeen")
      .populate("recipient", "username avatarImage email fullName isOnline lastSeen")
      .sort({ updatedAt: -1 });

    const friends = friendships.map((friendship) => {
      if (friendship.requester._id.toString() === userId) {
        return friendship.recipient;
      }
      return friendship.requester;
    });

    return res.json({ status: true, friends });
  } catch (ex) {
    next(ex);
  }
};

// Remove friend
module.exports.removeFriend = async (req, res, next) => {
  try {
    const { friendshipId, userId } = req.body;

    const friendship = await Friendship.findById(friendshipId);
    if (!friendship) {
      return res.json({ msg: "Friendship not found", status: false });
    }

    if (
      friendship.requester.toString() !== userId &&
      friendship.recipient.toString() !== userId
    ) {
      return res.json({ msg: "Unauthorized", status: false });
    }

    // Remove from user's following lists
    await User.findByIdAndUpdate(friendship.requester, {
      $pull: { following: friendship.recipient },
    });
    await User.findByIdAndUpdate(friendship.recipient, {
      $pull: { following: friendship.requester },
    });

    await Friendship.findByIdAndDelete(friendshipId);

    return res.json({ status: true, msg: "Friend removed" });
  } catch (ex) {
    next(ex);
  }
};

// Search users (for adding friends)
module.exports.searchUsers = async (req, res, next) => {
  try {
    const { query, userId } = req.query;

    if (!query || query.length < 2) {
      return res.json({ status: true, users: [] });
    }

    const users = await User.find({
      _id: { $ne: userId },
      $or: [
        { username: { $regex: query, $options: "i" } },
        { fullName: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } },
      ],
    })
      .select("username avatarImage email fullName")
      .limit(20);

    // Check friendship status for each user
    const usersWithStatus = await Promise.all(
      users.map(async (user) => {
        const friendship = await Friendship.findOne({
          $or: [
            { requester: userId, recipient: user._id },
            { requester: user._id, recipient: userId },
          ],
        });

        return {
          ...user.toObject(),
          friendshipStatus: friendship ? friendship.status : null,
        };
      })
    );

    return res.json({ status: true, users: usersWithStatus });
  } catch (ex) {
    next(ex);
  }
};

