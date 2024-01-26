const mongoose = require('mongoose');

mongoose.connect("mongodb+srv://admin:admin@cluster0.6t0tidv.mongodb.net/");

const userSchema = {
    username: String,
    password: String,
    firstName: String,
    lastName: String,
}

const User = mongoose.model("User", userSchema);

const AccountSchema = {
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    balance: {
        type: Number,
        required: true
    }
}

const Account = mongoose.model("Account", AccountSchema);

module.exports = {
    User,
    Account
};