const express = require('express');

const router = express.Router();
const { User, Account } = require("../db");
const jwt = require("jsonwebtoken");
const zod = require('zod');
const JWT_SECRET = require('../config');
const { authMiddleware } = require('../middleware');

const signupSchema = zod.object({
    username: zod.string().email(),
    password: zod.string(),
    firstName: zod.string(),
    lastName: zod.string()
});
const signinSchema = zod.object({
    username: zod.string().email(),
    password: zod.string()
});
const updatedUserSchema = zod.object({
    firstName: zod.string().optional(),
    lastName: zod.string().optional(),
    password: zod.string().optional()
});

//SignUp Route
router.post("/signup",async (req, res)=>{
    const body = req.body;

    const {success} = signupSchema.safeParse(req.body);
    if(!success){
        return res.json({
            message: "Email already taken / Incorrect Inputs/ Something 1"
        })
    }

    const user = await User.findOne({
        username: body.username
    });
    
    if(user && user._id) {
        return res.json({
            message: "Email already taken / Incorrect Inputs/ Something 2"
        })
    }

    const dbUser = await User.create(body);
    await Account.create({
        userId: dbUser._id,
        balance: 1+Math.random() * 10000
    })
    const token = jwt.sign({
        userId: dbUser._id
    }, JWT_SECRET)
    res.json({
        message: "User created Successfully",
        token: token
    });
})

//Signin Route
router.post("/signin", async (req, res)=>{
    const body = req.body;

    const {success} = signinSchema.safeParse(req.body);
    if(!success){
        return res.status(411).json({
            message: "Incorrect Inputs"
        })
    }

    const user = await User.findOne({
        username: body.username,
        password: body.password
    });

    if(user){
        const token = jwt.sign({
            userId: user._id
        }, JWT_SECRET);

        return res.status(200).json({
            message: "Logged in SuccessFully",
            token: token
        })
    }
    return res.status(411).json({
        message: "Error while logging in"
    })
})


//Update User details
router.put("/", authMiddleware, async (req, res) => {
    const body = req.body;

    const {success} = updatedUserSchema.safeParse(body);
    if(!success){
        res.status(411).json({
            message: "Error while updating information"
        })
    }
    await User.updateOne(req.body, {
        id: req.userId
    })

    return res.status(200).json({
        message: "Updated Successfully"
    })
})

//Get users based on filter
router.get("/bulk", async (req, res)=> {
    const filter = req.query.filter || "";

    const users = await User.find({
        $or: [{
            firstName: {
                "$regex": filter
            }
        },{
            lastName: {
                "$regex": filter
            }
        }]
    })

    res.json({
        user: users.map(user => ({
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            _id: user._id
        }))
    })
})
module.exports = router;