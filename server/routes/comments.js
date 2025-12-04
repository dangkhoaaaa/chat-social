const {
  createComment,
  getComments,
  deleteComment,
  toggleLike,
} = require("../controllers/commentController");

const router = require("express").Router();

router.post("/create", createComment);
router.get("/post/:postId", getComments);
router.post("/delete", deleteComment);
router.post("/like", toggleLike);

module.exports = router;

