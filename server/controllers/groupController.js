const Group = require("../models/groupModel");
const User = require("../models/userModel");
const Notification = require("../models/notificationModel");
const { uploadBase64, deleteFile } = require("../utils/uploadFile");

// Create group
module.exports.createGroup = async (req, res, next) => {
  try {
    const { creatorId, name, description, isPublic, avatar, coverImage } = req.body;

    if (!creatorId || !name) {
      return res.json({ msg: "Creator ID and name are required", status: false });
    }

    let avatarUrl = "";
    let coverImageUrl = "";

    // Upload avatar if provided
    if (avatar) {
      try {
        const uploadResult = await uploadBase64(avatar, "groups/avatars", "image/jpeg");
        avatarUrl = uploadResult.url;
      } catch (error) {
        console.error("Error uploading avatar:", error);
      }
    }

    // Upload cover image if provided
    if (coverImage) {
      try {
        const uploadResult = await uploadBase64(coverImage, "groups/covers", "image/jpeg");
        coverImageUrl = uploadResult.url;
      } catch (error) {
        console.error("Error uploading cover:", error);
      }
    }

    const group = await Group.create({
      name,
      description: description || "",
      creator: creatorId,
      admins: [creatorId],
      members: [
        {
          userId: creatorId,
          role: "admin",
        },
      ],
      avatar: avatarUrl,
      coverImage: coverImageUrl,
      isPublic: isPublic !== undefined ? isPublic : true,
    });

    const populatedGroup = await Group.findById(group._id)
      .populate("creator", "username avatarImage fullName")
      .populate("admins", "username avatarImage")
      .populate("members.userId", "username avatarImage fullName");

    return res.json({ status: true, group: populatedGroup });
  } catch (ex) {
    next(ex);
  }
};

// Get groups (public or user's groups)
module.exports.getGroups = async (req, res, next) => {
  try {
    const { userId } = req.query;

    const groups = await Group.find({
      $or: [
        { isPublic: true },
        { "members.userId": userId },
      ],
    })
      .populate("creator", "username avatarImage")
      .populate("admins", "username avatarImage")
      .populate("members.userId", "username avatarImage")
      .sort({ createdAt: -1 });

    return res.json({ status: true, groups });
  } catch (ex) {
    next(ex);
  }
};

// Get user's groups
module.exports.getUserGroups = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const groups = await Group.find({
      "members.userId": userId,
    })
      .populate("creator", "username avatarImage")
      .populate("admins", "username avatarImage")
      .populate("members.userId", "username avatarImage")
      .sort({ createdAt: -1 });

    return res.json({ status: true, groups });
  } catch (ex) {
    next(ex);
  }
};

// Get single group
module.exports.getGroup = async (req, res, next) => {
  try {
    const { groupId } = req.params;

    const group = await Group.findById(groupId)
      .populate("creator", "username avatarImage fullName")
      .populate("admins", "username avatarImage fullName")
      .populate("members.userId", "username avatarImage fullName");

    if (!group) {
      return res.json({ msg: "Group not found", status: false });
    }

    return res.json({ status: true, group });
  } catch (ex) {
    next(ex);
  }
};

// Join group
module.exports.joinGroup = async (req, res, next) => {
  try {
    const { groupId, userId } = req.body;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.json({ msg: "Group not found", status: false });
    }

    // Check if already a member
    const isMember = group.members.some(
      (member) => member.userId.toString() === userId
    );

    if (isMember) {
      return res.json({ msg: "Already a member", status: false });
    }

    // Check max members
    if (group.members.length >= group.maxMembers) {
      return res.json({ msg: "Group is full", status: false });
    }

    group.members.push({
      userId: userId,
      role: "member",
    });

    await group.save();

    // Create notification for group admins
    const user = await User.findById(userId);
    group.admins.forEach(async (adminId) => {
      if (adminId.toString() !== userId) {
        await Notification.create({
          recipient: adminId,
          sender: userId,
          type: "group_invite",
          content: `${user.username} joined ${group.name}`,
          relatedId: groupId,
        });
      }
    });

    const populatedGroup = await Group.findById(groupId)
      .populate("members.userId", "username avatarImage");

    return res.json({ status: true, group: populatedGroup });
  } catch (ex) {
    next(ex);
  }
};

// Leave group
module.exports.leaveGroup = async (req, res, next) => {
  try {
    const { groupId, userId } = req.body;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.json({ msg: "Group not found", status: false });
    }

    // Can't leave if creator
    if (group.creator.toString() === userId) {
      return res.json({ msg: "Creator cannot leave group", status: false });
    }

    group.members = group.members.filter(
      (member) => member.userId.toString() !== userId
    );

    // Remove from admins if admin
    group.admins = group.admins.filter(
      (adminId) => adminId.toString() !== userId
    );

    await group.save();

    return res.json({ status: true, msg: "Left group successfully" });
  } catch (ex) {
    next(ex);
  }
};

// Add admin
module.exports.addAdmin = async (req, res, next) => {
  try {
    const { groupId, userId, newAdminId } = req.body;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.json({ msg: "Group not found", status: false });
    }

    // Check if requester is admin
    const isAdmin = group.admins.some(
      (adminId) => adminId.toString() === userId
    );

    if (!isAdmin) {
      return res.json({ msg: "Unauthorized", status: false });
    }

    // Check if already admin
    if (group.admins.includes(newAdminId)) {
      return res.json({ msg: "Already an admin", status: false });
    }

    group.admins.push(newAdminId);

    // Update member role
    const member = group.members.find(
      (m) => m.userId.toString() === newAdminId
    );
    if (member) {
      member.role = "admin";
    }

    await group.save();

    return res.json({ status: true, group });
  } catch (ex) {
    next(ex);
  }
};

// Remove member
module.exports.removeMember = async (req, res, next) => {
  try {
    const { groupId, userId, memberId } = req.body;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.json({ msg: "Group not found", status: false });
    }

    // Check if requester is admin
    const isAdmin = group.admins.some(
      (adminId) => adminId.toString() === userId
    );

    if (!isAdmin) {
      return res.json({ msg: "Unauthorized", status: false });
    }

    // Can't remove creator
    if (group.creator.toString() === memberId) {
      return res.json({ msg: "Cannot remove creator", status: false });
    }

    group.members = group.members.filter(
      (member) => member.userId.toString() !== memberId
    );

    group.admins = group.admins.filter(
      (adminId) => adminId.toString() !== memberId
    );

    await group.save();

    return res.json({ status: true, msg: "Member removed" });
  } catch (ex) {
    next(ex);
  }
};

// Update group
module.exports.updateGroup = async (req, res, next) => {
  try {
    const { groupId, userId, name, description, isPublic, avatar, coverImage } = req.body;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.json({ msg: "Group not found", status: false });
    }

    // Check if requester is admin
    const isAdmin = group.admins.some(
      (adminId) => adminId.toString() === userId
    );

    if (!isAdmin) {
      return res.json({ msg: "Unauthorized", status: false });
    }

    if (name) group.name = name;
    if (description !== undefined) group.description = description;
    if (isPublic !== undefined) group.isPublic = isPublic;

    // Update avatar if provided
    if (avatar) {
      try {
        const uploadResult = await uploadBase64(avatar, "groups/avatars", "image/jpeg");
        if (group.avatar) {
          // Delete old avatar
          const oldFileName = group.avatar.split("/").pop();
          await deleteFile(`groups/avatars/${oldFileName}`);
        }
        group.avatar = uploadResult.url;
      } catch (error) {
        console.error("Error uploading avatar:", error);
      }
    }

    // Update cover image if provided
    if (coverImage) {
      try {
        const uploadResult = await uploadBase64(coverImage, "groups/covers", "image/jpeg");
        if (group.coverImage) {
          // Delete old cover
          const oldFileName = group.coverImage.split("/").pop();
          await deleteFile(`groups/covers/${oldFileName}`);
        }
        group.coverImage = uploadResult.url;
      } catch (error) {
        console.error("Error uploading cover:", error);
      }
    }

    await group.save();

    const populatedGroup = await Group.findById(groupId)
      .populate("creator", "username avatarImage")
      .populate("admins", "username avatarImage")
      .populate("members.userId", "username avatarImage");

    return res.json({ status: true, group: populatedGroup });
  } catch (ex) {
    next(ex);
  }
};

// Delete group
module.exports.deleteGroup = async (req, res, next) => {
  try {
    const { groupId, userId } = req.body;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.json({ msg: "Group not found", status: false });
    }

    // Only creator can delete
    if (group.creator.toString() !== userId) {
      return res.json({ msg: "Unauthorized", status: false });
    }

    // Delete avatar and cover if exist
    if (group.avatar) {
      const fileName = group.avatar.split("/").pop();
      await deleteFile(`groups/avatars/${fileName}`);
    }
    if (group.coverImage) {
      const fileName = group.coverImage.split("/").pop();
      await deleteFile(`groups/covers/${fileName}`);
    }

    await Group.findByIdAndDelete(groupId);

    return res.json({ status: true, msg: "Group deleted" });
  } catch (ex) {
    next(ex);
  }
};

