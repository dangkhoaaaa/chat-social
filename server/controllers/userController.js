const User = require("../models/userModel");
const bcrypt = require("bcrypt");
const { uploadBase64, deleteFile } = require("../utils/uploadFile");

module.exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user)
      return res.json({ msg: "Incorrect Username or Password", status: false });
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid)
      return res.json({ msg: "Incorrect Username or Password", status: false });
    delete user.password;
    return res.json({ status: true, user });
  } catch (ex) {
    next(ex);
  }
};

module.exports.register = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    const usernameCheck = await User.findOne({ username });
    if (usernameCheck)
      return res.json({ msg: "Username already used", status: false });
    const emailCheck = await User.findOne({ email });
    if (emailCheck)
      return res.json({ msg: "Email already used", status: false });
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      email,
      username,
      password: hashedPassword,
    });
    delete user.password;
    return res.json({ status: true, user });
  } catch (ex) {
    next(ex);
  }
};

module.exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find({ _id: { $ne: req.params.id } }).select([
      "email",
      "username",
      "avatarImage",
      "_id",
    ]);
    return res.json(users);
  } catch (ex) {
    next(ex);
  }
};

module.exports.setAvatar = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const avatarImage = req.body.image;

    // If base64 image, upload to Cloudinary
    let avatarUrl = avatarImage;
    let avatarPublicId = "";
    if (avatarImage && avatarImage.startsWith("data:image")) {
      try {
        const user = await User.findById(userId);
        if (user.avatarImage && user.avatarImage.public_id) {
          await deleteFile(user.avatarImage.public_id);
        }
        const uploadResult = await uploadBase64(avatarImage, "avatars");
        avatarUrl = uploadResult.url;
        avatarPublicId = uploadResult.fileName;
      } catch (error) {
        console.error("Error uploading avatar:", error);
        return res.json({ msg: "Error uploading avatar", status: false });
      }
    }

    const userData = await User.findByIdAndUpdate(
      userId,
      {
        isAvatarImageSet: true,
        avatarImage: {
          url: avatarUrl,
          public_id: avatarPublicId,
        },
      },
      { new: true }
    ).select("-password");

    return res.json({
      isSet: userData.isAvatarImageSet,
      image: userData.avatarImage.url,
      user: userData,
    });
  } catch (ex) {
    next(ex);
  }
};

// Update profile
module.exports.updateProfile = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const { fullName, bio, location, website, dateOfBirth, coverImage } = req.body;

    const updateData = {};
    if (fullName !== undefined) updateData.fullName = fullName;
    if (bio !== undefined) updateData.bio = bio;
    if (location !== undefined) updateData.location = location;
    if (website !== undefined) updateData.website = website;
    if (dateOfBirth !== undefined) updateData.dateOfBirth = dateOfBirth;

    // Upload cover image if provided
    if (coverImage && coverImage.startsWith("data:image")) {
      try {
        const user = await User.findById(userId);
        // Delete old cover if exists
        if (user.coverImage && user.coverImage.public_id) {
          await deleteFile(user.coverImage.public_id);
        }
        const uploadResult = await uploadBase64(coverImage, "covers");
        updateData.coverImage = {
          url: uploadResult.url,
          public_id: uploadResult.fileName,
        };
      } catch (error) {
        console.error("Error uploading cover:", error);
        return res.json({ msg: "Error uploading cover image", status: false });
      }
    }

    const userData = await User.findByIdAndUpdate(userId, updateData, { new: true }).select("-password");

    return res.json({ status: true, user: userData });
  } catch (ex) {
    next(ex);
  }
};

// Get user profile
module.exports.getProfile = async (req, res, next) => {
  try {
    const userId = req.params.id;

    const user = await User.findById(userId)
      .select("-password")
      .populate("followers", "username avatarImage fullName")
      .populate("following", "username avatarImage fullName");

    if (!user) {
      return res.json({ msg: "User not found", status: false });
    }

    return res.json({ status: true, user });
  } catch (ex) {
    next(ex);
  }
};

// Follow/Unfollow user
module.exports.toggleFollow = async (req, res, next) => {
  try {
    const { userId, targetUserId } = req.body;

    if (userId === targetUserId) {
      return res.json({ msg: "Cannot follow yourself", status: false });
    }

    const user = await User.findById(userId);
    const targetUser = await User.findById(targetUserId);

    if (!user || !targetUser) {
      return res.json({ msg: "User not found", status: false });
    }

    const isFollowing = user.following.includes(targetUserId);

    if (isFollowing) {
      // Unfollow
      user.following = user.following.filter(
        (id) => id.toString() !== targetUserId
      );
      targetUser.followers = targetUser.followers.filter(
        (id) => id.toString() !== userId
      );
    } else {
      // Follow
      user.following.push(targetUserId);
      targetUser.followers.push(userId);
    }

    await user.save();
    await targetUser.save();

    return res.json({ status: true, isFollowing: !isFollowing });
  } catch (ex) {
    next(ex);
  }
};

module.exports.logOut = (req, res, next) => {
  try {
    if (!req.params.id) return res.json({ msg: "User id is required " });
    onlineUsers.delete(req.params.id);
    return res.status(200).send();
  } catch (ex) {
    next(ex);
  }
};
