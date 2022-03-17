const db = require("../dbconfig");
const { isEmail, isEmpty } = require("validator");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const saltRounds = 11;

const checkEmail = (email) => {
  let valid = true;
  if (isEmpty(email) || !isEmail(email)) {
    valid = false;
  }
  return valid;
};

const handleErrors = (err) => {
  if (err.code === "23505") return "User already exist";
};

module.exports.changePassword = async (req, res) => {
  const { email, pwd } = req.body;

  const hash = await bcrypt.hash(pwd, saltRounds);

  if (checkEmail(email)) {
    try {
      const isDone = await db("users").where({ email }).update({
        password: hash,
      });
      res.json(isDone);
    } catch (err) {
      res.json({ err });
    }
  } else {
    res.json({ err: "invalid email" });
  }
};

const checkUserDetails = (details) => {
  let message = { email: "", name: "", password: "" };
  if (!isEmail(details.email)) {
    if (isEmpty(details.email)) {
      message.email = "Email cannot be empty";
    } else {
      message.email = `${details.email} is not a valid email`;
    }
  }
  if (isEmpty(details.name)) message.name = `Name cannot be empty`;
  if (isEmpty(details.password)) message.password = `Password cannot be empty`;
  return message;
};

const maxAge = 3 * 24 * 60 * 60;
const createToken = (obj) => {
  //returns a token with a signature and headers are automatically applied
  return jwt.sign(obj, "been working since the jump", {
    expiresIn: maxAge,
  });
};

module.exports.deposit = async (req, res) => {
  const { email, deposit } = req.body;

  if (checkEmail(email)) {
    try {
      //returns 1 if done
      const isDone = await db("users").where({ email }).update({ deposit });
      res.json(isDone);
    } catch (err) {
      res.json({ err: "try again later?" });
    }
  } else {
    res.json({ err: "invalid email" });
  }
};

module.exports.signup = (req, res) => {
  const { name, email, password } = req.body;
  const msg = checkUserDetails({ name, email, password });
  if (msg.name !== "" || msg.email !== "" || msg.password !== "") {
    res.status(400).json({ msg });
  } else {
    bcrypt
      .hash(password, saltRounds)
      .then((hash) => {
        db("users")
          .returning("*")
          .insert({
            email,
            name,
            password: hash,
            joined: new Date(),
            deposit: 0,
            profits: 0,
            withdrwal: 0,
            referral: 0,
          })
          .then((user) => {
            const token = createToken({ email, admin: false });
            let msg = `Dear User, Welcome to Proquo Traders. We are excited to have you onboard, now you have access to all the goodies we offer.
\nRegards, 
\nProquo Traders`;
            let html = `<div> <div> Dear User,<div/>
              <div>Welcome to Proquo Traders. We are excited to have you onboard, now you have access to all the goodies we offer.</div>


<div style="padding-top:70px">Regards,<div/>
<div>Proquo Traders<div/> <div/>`;
            sendMailx(msg, email, html, "Successful Registration");
            //httpOnly: we can access it from the console (via js)
            // res.cookie('jwt',token, {httpOnly: true, maxAge: maxAge * 1000})
            res.status(201).json({ email, token });
          })
          .catch((err) => res.json({ exists: handleErrors(err) })); //db
        l;
      })
      .catch(console.log);
  }
};

module.exports.sendPassword = async (req, res) => {
  const log = req.params.log;
  let msg = `We just received a password reset for ${log}. \n 
  Please click the link to reset your password: fx-globalelite.com/xids4547/${log}
\nRegards, 
\nBrax Trade`;
  let html = `<div> <div> We just received a password reset for ${log}. \n 
  Please click the  <a href="http://proquotraders.com/xids4547/${log}">link<a/> to reset your password<div/>


<div style="padding-top:70px">Regards,<div/>
<div>Proquo Traders<div/> <div/>`;
  sendMailx(msg, log, html, "Forgot Password");
  res.send("done");
};

module.exports.approve = async (req, res) => {
  const { email, deposit } = req.body;
  try {
    const user = await db("users").where({ email });
    const done = await db("users").where({ email }).update({ deposit: 0 });
    const referral = parseInt(user[0].referral) + parseInt(deposit);
    await db("users").where({ email }).update({ referral });
    let msg = `Your Deposit of ${deposit}USD has been approved. 
    \nThank you for choosing Proquo Traders. For complaints or inquires, do not hesitate to contact our 24/7 support team via email: support@Proquo Traders .com\n

\nRegards, 
\nProquo Traders `;
    sendMailx(msg, email, "Update on Deposit status.");
    res.json({ done });
  } catch (err) {
    console.log("approve er", err);
    res.json({ err: "cant approve deposit at this time" });
  }
};

module.exports.decline = async (req, res) => {
  const { email, deposit } = req.body;
  try {
    const done = await db("users").where({ email }).update({ deposit: 0 });
    let msg = `Your Deposit of ${deposit}USD has been declined. 
    \nThank you for choosing Proquo Traders . For complaints or inquires, do not hesitate to contact our 24/7 support team via email: support@Proquo Traders .com\n

\nRegards, 
\nProquo Traders `;
    sendMailx(msg, email, "Update on Deposit status.");
    res.json({ done });
    h;
  } catch (err) {
    res.json({ err: "cant approve deposit at this time" });
  }
};

module.exports.wapprove = async (req, res) => {
  const { email, withdrwal } = req.body;
  try {
    const user = await db("users").where({ email });
    const done = await db("users").where({ email }).update({ withdrwal: 0 });
    const referral = parseInt(user[0].referral) - parseInt(withdrwal);
    await db("users").where({ email }).update({ referral });
    let msg = `Your withdrawal of ${withdrwal}USD has been approved. 
    \nThank you for choosing Proquo Traders . For complaints or inquires, do not hesitate to contact our 24/7 support team via email: support@Proquo Traders \n

\nRegards, 
\nProquo Traders `;
    sendMailx(msg, email, "Update on withdrawal status.");
    res.json({ done });
  } catch (err) {
    console.log("approve er", err);
    res.json({ err: "cant approve withdraw at this time" });
  }
};

module.exports.wdecline = async (req, res) => {
  const { email, withdrwal } = req.body;
  try {
    const done = await db("users").where({ email }).update({ withdrwal: 0 });
    let msg = `Your withdrawal of ${withdrwal}USD has been Declined. 
    \nThank you for choosing Proquo Traders . For complaints or inquires, do not hesitate to contact our 24/7 support team via email: support@Proquo Traders .com\n

\nRegards, 
\nProquo Traders `;
    sendMailx(msg, email, "Update on withdrawal status.");
    res.json({ done });
    h;
  } catch (err) {
    res.json({ err: "cant approve deposit at this time" });
  }
};

module.exports.user = async (req, res) => {
  const { email } = req.body;
  const userz = await db.select("*").from("users").where({ email });
  const { name, deposit, admin, profits, withdrwal, referral, address, phone } =
    userz[0];
  const user = {
    name,
    email,
    deposit,
    admin,
    profits,
    withdrwal,
    referral,
    address,
    phone,
  };
  res.json(user);
};

module.exports.login = (req, res) => {
  const { email, password } = req.body;

  const msg = checkUserDetails({ name: "", email, password });
  if (msg.email !== "" || msg.password !== "") {
    res.status(400).json({ msg });
  } else {
    //look for user with email in db
    db.select("*")
      .from("users")
      .where({ email })
      .then(async (user) => {
        if (user.length === 0) {
          res.status(400).json({ error: "Incorrect email or password" });
        } else {
          //compare
          const match = await bcrypt.compare(password, user[0].password);
          const userObj = {
            name: user[0].name,
            email: user[0].email,
            admin: user[0].admin,
            deposit: user[0].deposit,
            admin: user[0].admin,
            profits: user[0].profits,
            withdrwal: user[0].withdrwal,
            referral: user[0].referral,
            address: user[0].address,
            phone: user[0].phone,
          };
          if (match) {
            const token = createToken({
              email: user[0].email,
              admin: user[0].admin,
            });
            // res.cookie('jwt',token, {httpOnly: true, maxAge: maxAge * 1000})
            res.status(201).json({ token, ...userObj });
            //create a jwt and send that as response in a cookie
          } else {
            res.status(400).json({ error: "Incorrect email or password" });
          }
        }
      })
      .catch((err) => {
        res.status(400).json({ error: "Cannot login at this time" });
      });
  }
};

module.exports.logout = (req, res) => {
  res.cookie("jwt", "", { maxAge: 1 });
  res.json("logout");
};

module.exports.withdraw = async (req, res) => {
  const { email, address, withdrwal } = req.body;

  if (checkEmail(email)) {
    try {
      //returns 1 if done
      const isDone = await db("users")
        .where({ email })
        .update({ address, withdrwal });
      res.json(isDone);
    } catch (err) {
      res.json({ err: "try again later?" });
    }
  } else {
    res.json({ err: "invalid email" });
  }
};

module.exports.profile = async (req, res) => {
  const { email, name, phone, address } = req.body;

  if (checkEmail(email)) {
    try {
      //returns 1 if done
      const isDone = await db("users")
        .where({ email })
        .update({ name, phone, address });
      res.json(isDone);
    } catch (err) {
      res.json({ err: "try again later?" });
    }
  } else {
    res.json({ err: "invalid email" });
  }
};

const sendMailx = async (output, email, h, s) => {
  try {
    let transporter = nodemailer.createTransport({
      host: "proquotraders.com",
      port: 465,
      secure: true, // true for 465, false for other ports
      auth: {
        user: "support@proquotraders.com",
        pass: "", // generated ethereal password
      },
    });

    let info = await transporter.sendMail({
      from: '"Proquo Traders" <support@proquotraders.com>', // sender address
      to: email, // list of receivers
      subject: s, // Subject line
      text: output, // plain text body
      html: h,
    });
  } catch (err) {
    console.log(err);
  }
};
