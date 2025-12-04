const {
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  getFriendRequests,
  getFriends,
  removeFriend,
  searchUsers,
} = require("../controllers/friendshipController");

const router = require("express").Router();

router.post("/send-request", sendFriendRequest);
router.post("/accept-request", acceptFriendRequest);
router.post("/reject-request", rejectFriendRequest);
router.get("/requests/:userId", getFriendRequests);
router.get("/friends/:userId", getFriends);
router.post("/remove", removeFriend);
router.get("/search", searchUsers);

module.exports = router;

