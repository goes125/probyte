const { Router } = require("express");
const router = Router();
const {
  allUsers,
  editUser,
  del,
  withdrwal,
  address,
  getAddress,
  deposited,
} = require("../controllers/adminController");
const { requireA } = require("../middleware/AdminMiddleware");

// router.use(requireA)
router.post("/all", requireA, allUsers);

router.post("/withdrawal", requireA, withdrwal);

router.post("/deposited", requireA, deposited);

router.post("/editUser", editUser);

router.post("/delete", del);

router.post("/address", address);

router.get("/getAddress", getAddress);

module.exports = router;
