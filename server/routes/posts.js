const {
  createPost,
  getPosts,
  getUserPosts,
  getPost,
  deletePost,
  toggleLike,
  sharePost,
} = require("../controllers/postController");
const upload = require("../middleware/multer");

const router = require("express").Router();

router.post("/create", upload.array("media", 10), createPost);
router.get("/feed", getPosts);
router.get("/user/:userId", getUserPosts);
router.get("/:postId", getPost);
router.post("/delete", deletePost);
router.post("/like", toggleLike);
router.post("/share", sharePost);

module.exports = router;

