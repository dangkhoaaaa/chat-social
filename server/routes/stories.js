const {
  createStory,
  getStories,
  getUserStories,
  viewStory,
  deleteStory,
} = require("../controllers/storyController");
const upload = require("../middleware/multer");

const router = require("express").Router();

router.post("/create", upload.single("media"), createStory);
router.get("/feed", getStories);
router.get("/user/:userId", getUserStories);
router.post("/view", viewStory);
router.post("/delete", deleteStory);

module.exports = router;

