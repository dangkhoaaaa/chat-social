const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const authRoutes = require("./routes/auth");
const messageRoutes = require("./routes/messages");
const app = express();
const socket = require("socket.io");
require("dotenv").config();

app.use(cors());
app.use(express.json());

mongoose
  .connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("DB Connetion Successfull");
  })
  .catch((err) => {
    console.log("DB Fall"+err.message);
  });

app.get("/ping", (_req, res) => {
  return res.json({ msg: "Ping Successful" });
});

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/friendships", require("./routes/friendships"));
app.use("/api/posts", require("./routes/posts"));
app.use("/api/comments", require("./routes/comments"));
app.use("/api/stories", require("./routes/stories"));
app.use("/api/groups", require("./routes/groups"));
app.use("/api/notifications", require("./routes/notifications"));

const server = app.listen(process.env.PORT, () =>
  console.log(`Server started on ${process.env.PORT}`)
);
const io = socket(server, {
  cors: {
    origin: ["http://localhost:3000", "https://chat-social-dk.vercel.app"],
    credentials: true,
  },
});

global.onlineUsers = new Map();
global.typingUsers = new Map(); // Thêm map để theo dõi người dùng đang gõ
function logOnlineUsers() {
  console.log("Current online users:" + new Date().toLocaleTimeString());
  for (const [userId, socketId] of onlineUsers.entries()) {
    console.log(`User ID: ${userId}, Socket ID: ${socketId}`);
  }
}
function emitOnlineStatus() {
 // const onlineStatus = {};
  for (const [userId, socketId] of onlineUsers.entries()) {
   // onlineStatus[userId] = true;
    io.emit("user-status-change", { userId, isOnline: true });
  }
  //io.emit("user-status-change", onlineStatus);

}
io.on("connection", (socket) => {
  global.chatSocket = socket;

  socket.on("add-user", (userId) => {
    onlineUsers.set(userId, socket.id);
    emitOnlineStatus();
    logOnlineUsers();
  });

  // Chat messages
  socket.on("send-msg", (data) => {
    const sendUserSocket = onlineUsers.get(data.to);
    if (sendUserSocket) {
      socket.to(sendUserSocket).emit("msg-recieve", data.msg);
    }
    // Also emit to group if groupId exists
    if (data.groupId) {
      socket.to(data.groupId).emit("group-msg-recieve", data.msg);
    }
  });

  socket.on("typing", ({ userId, receiverId, isTyping, groupId }) => {
    if (groupId) {
      // Group typing
      socket.to(groupId).emit("group-typing", { userId, isTyping });
    } else {
      // Private chat typing
      const receiverSocket = onlineUsers.get(receiverId);
      if (receiverSocket) {
        socket.to(receiverSocket).emit("user-typing", { userId, isTyping });
      }
    }

    if (isTyping) {
      typingUsers.set(userId, receiverId || groupId);
    } else {
      typingUsers.delete(userId);
    }
  });

  // Join group room
  socket.on("join-group", (groupId) => {
    socket.join(groupId);
  });

  socket.on("leave-group", (groupId) => {
    socket.leave(groupId);
  });

  // Post events
  socket.on("post-created", (post) => {
    socket.broadcast.emit("new-post", post);
  });

  socket.on("post-liked", ({ postId, userId, isLiked }) => {
    socket.broadcast.emit("post-like-update", { postId, userId, isLiked });
  });

  socket.on("post-shared", ({ postId, userId }) => {
    socket.broadcast.emit("post-share-update", { postId, userId });
  });

  // Comment events
  socket.on("comment-created", ({ postId, comment }) => {
    socket.broadcast.emit("new-comment", { postId, comment });
  });

  socket.on("comment-liked", ({ commentId, userId, isLiked }) => {
    socket.broadcast.emit("comment-like-update", { commentId, userId, isLiked });
  });

  // Story events
  socket.on("story-created", (story) => {
    socket.broadcast.emit("new-story", story);
  });

  socket.on("story-viewed", ({ storyId, userId }) => {
    socket.broadcast.emit("story-view-update", { storyId, userId });
  });

  // Friend request events
  socket.on("friend-request-sent", ({ recipientId, request }) => {
    const recipientSocket = onlineUsers.get(recipientId);
    if (recipientSocket) {
      socket.to(recipientSocket).emit("new-friend-request", request);
    }
  });

  socket.on("friend-request-accepted", ({ requesterId, friendship }) => {
    const requesterSocket = onlineUsers.get(requesterId);
    if (requesterSocket) {
      socket.to(requesterSocket).emit("friend-request-accepted", friendship);
    }
  });

  // Notification events
  socket.on("notification-created", ({ recipientId, notification }) => {
    const recipientSocket = onlineUsers.get(recipientId);
    if (recipientSocket) {
      socket.to(recipientSocket).emit("new-notification", notification);
    }
  });

  // Group events
  socket.on("group-created", (group) => {
    socket.broadcast.emit("new-group", group);
  });

  socket.on("group-member-added", ({ groupId, member }) => {
    socket.to(groupId).emit("group-member-update", { groupId, member, action: "added" });
  });

  socket.on("group-member-removed", ({ groupId, memberId }) => {
    socket.to(groupId).emit("group-member-update", { groupId, memberId, action: "removed" });
  });

  socket.on("disconnect", () => {
    let disconnectedUserId;
    for (const [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        disconnectedUserId = userId;
        break;
      }
    }
    if (disconnectedUserId) {
      onlineUsers.delete(disconnectedUserId);
      emitOnlineStatus();
      logOnlineUsers();
    }
  });
});
