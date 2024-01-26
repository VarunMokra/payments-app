const express = require("express");

const router = express.Router();

const { Account } = require("../db");
const { authMiddleware } = require("../middleware");
const { default: mongoose } = require("mongoose");

router.get("/balance", authMiddleware, async (req, res) => {
  const account = await Account.findOne({
    userId: req.userId,
  });

  res.status(200).json({
    balance: account.balance,
  });
});

router.post("/transfer", authMiddleware, async (req, res) => {
  const session = await mongoose.startSession();

  session.startTransaction();
  const { to, amount } = req.body;

  const account = await Account.findOne({
    userId: req.userId,
  }).session(session);

  if (account.balance < amount) {
    session.abortTransaction();
    return res.status(400).json({
      message: "Insufficient Balance",
    });
  }

  const toAccount = await Account.findOne({
    userId: to,
  }).session(session);
  if (!toAccount) {
    session.abortTransaction();
    return res.status(400).json({
      message: "Invalid Account",
    });
  }

  await Account.updateOne(
    {
      userId: req.userId,
    },
    {
      $inc: {
        balance: -amount,
      },
    }
  ).session(session);

  await Account.updateOne(
    {
      userId: to,
    },
    {
      $inc: {
        balance: amount,
      },
    }
  ).session(session);

  session.commitTransaction();
  res.status(200).json({
    message: "Transfer Successful"
  });
});
module.exports = router;
