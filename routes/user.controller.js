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
            //TODO:目前註冊/登入成功只會直接轉頁，後面要加session去紀錄使用者，不然註冊/登入沒意義
            res.redirect('/home');
        } else {
            // Respond with 400 Bad Request if user creation failed due to bad input data
            return res.status(400).json({ message: 'User creation failed due to invalid data' });
        }
    } catch (error) {
        // Log the error and respond with 500 Internal Server Error
        console.error('Registration error:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
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