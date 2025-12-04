const {
  createGroup,
  getGroups,
  getUserGroups,
  getGroup,
  joinGroup,
  leaveGroup,
  addAdmin,
  removeMember,
  updateGroup,
  deleteGroup,
} = require("../controllers/groupController");

const router = require("express").Router();

router.post("/create", createGroup);
router.get("/", getGroups);
router.get("/user/:userId", getUserGroups);
router.get("/:groupId", getGroup);
router.post("/join", joinGroup);
router.post("/leave", leaveGroup);
router.post("/add-admin", addAdmin);
router.post("/remove-member", removeMember);
router.post("/update", updateGroup);
router.post("/delete", deleteGroup);

module.exports = router;

