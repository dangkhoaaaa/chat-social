const {
  login,
  register,
  getAllUsers,
  setAvatar,
  logOut,
  updateProfile,
  getProfile,
  toggleFollow,
} = require("../controllers/userController");

const router = require("express").Router();

router.post("/login", login);
router.post("/register", register);
router.get("/allusers/:id", getAllUsers);
router.post("/setavatar/:id", setAvatar);
router.get("/logout/:id", logOut);
router.post("/profile/:id", updateProfile);
router.get("/profile/:id", getProfile);
router.post("/follow", toggleFollow);

module.exports = router;
