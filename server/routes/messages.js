const { addMessage, getMessages, markAsRead } = require("../controllers/messageController");
const upload = require("../middleware/multer");
const router = require("express").Router();

router.post("/addmsg/", upload.single("media"), addMessage);
router.post("/getmsg/", getMessages);
router.post("/mark-read", markAsRead);

module.exports = router;
