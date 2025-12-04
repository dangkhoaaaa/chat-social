const Messages = require("../models/messageModel");
const { uploadFile } = require("../utils/uploadFile");

module.exports.getMessages = async (req, res, next) => {
  try {
    const { from, to, groupId } = req.body;

    let query = {};
    if (groupId) {
      query = { groupId: groupId };
    } else {
      query = {
        users: {
          $all: [from, to],
        },
        groupId: null,
      };
    }

    const messages = await Messages.find(query)
      .populate("sender", "username avatarImage fullName")
      .sort({ createdAt: 1 });

    const projectedMessages = messages.map((msg) => {
      return {
        _id: msg._id,
        fromSelf: msg.sender._id.toString() === from,
        message: msg.message.text,
        messageType: msg.messageType,
        media: msg.media,
        sender: {
          _id: msg.sender._id,
          username: msg.sender.username,
          avatarImage: msg.sender.avatarImage,
          fullName: msg.sender.fullName,
        },
        createdAt: msg.createdAt,
        isRead: msg.isRead,
      };
    });
    res.json(projectedMessages);
  } catch (ex) {
    next(ex);
  }
};

module.exports.addMessage = async (req, res, next) => {
  try {
    const { from, to, message, messageType = "text", groupId } = req.body;
    const file = req.file;

    let mediaData = {};
    if (file && (messageType === "image" || messageType === "video")) {
      try {
        const uploadResult = await uploadFile(file, "messages");
        mediaData = {
          url: uploadResult.url,
          fileName: uploadResult.fileName,
          fileType: uploadResult.fileType,
          fileSize: uploadResult.fileSize,
        };
      } catch (error) {
        console.error("Error uploading media:", error);
        return res.json({ msg: "Error uploading media", status: false });
      }
    }

    const messageData = {
      message: { text: message || "" },
      messageType: messageType,
      users: groupId ? [] : [from, to],
      sender: from,
      groupId: groupId || null,
    };

    if (Object.keys(mediaData).length > 0) {
      messageData.media = mediaData;
    }

    const data = await Messages.create(messageData);

    if (data) {
      const populatedMessage = await Messages.findById(data._id)
        .populate("sender", "username avatarImage fullName");
      return res.json({ msg: "Message added successfully.", message: populatedMessage });
    } else {
      return res.json({ msg: "Failed to add message to the database" });
    }
  } catch (ex) {
    next(ex);
  }
};

// Mark messages as read
module.exports.markAsRead = async (req, res, next) => {
  try {
    const { messageIds, userId } = req.body;

    await Messages.updateMany(
      { _id: { $in: messageIds } },
      {
        $set: { isRead: true },
        $push: {
          readBy: {
            userId: userId,
            readAt: new Date(),
          },
        },
      }
    );

    return res.json({ status: true, msg: "Messages marked as read" });
  } catch (ex) {
    next(ex);
  }
};
