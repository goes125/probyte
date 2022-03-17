const { Router } = require("express");
const router = Router();
const authController = require("../controllers/authController");

router.post("/signup", authController.signup);

router.post("/login", authController.login);

router.post("/user", authController.user);

router.post("/forgot-password/:log", authController.sendPassword);

router.post("/withdraw", authController.withdraw);

router.post("/deposit", authController.deposit);
router.post("/wapprove", authController.wapprove);

router.post("/wdecline", authController.wdecline);

router.post("/approve", authController.approve);

router.post("/decline", authController.decline);

router.post("/changePassword", authController.changePassword);

router.post("/profile", authController.profile);

router.get("/logout", authController.logout);

module.exports = router;
