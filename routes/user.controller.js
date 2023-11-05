const userModel = require('../models/user.model');

//create new user
const register = async (req, res) => {
    try {
        //check if email already exist or not
        const existingUser = await userModel.findUserByEmail(req.body.useremail);
        if (existingUser) {
            // redirect back to /login and send error message
            return res.redirect('/login?errorMessage=Email already in use');
        }

        //if the email is available, create user
        const newUser = {
            useremail: req.body.useremail,
            password: req.body.password,
        }
        const createdUser = await userModel.createUser(newUser);
        if (createdUser) {
            //TODO:後面要加session去紀錄使用者，不然登入沒意義

            res.status(201).json(createdUser);//201 is created status code
        } else {
            res.status(500).json({ message: 'User creation failed '});
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

//find user by email

const getUser = async (req, res) => {
    try {
        const user = await userModel.findUserByEmail(req.body.useremail);
        if (user) {
            //check password
            if (user.password === req.body.password) {
                res.status(200).json(user);
            } else {
                res.status(401).json({ message: 'Invalid password' });
            }
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    register,
    getUser
};