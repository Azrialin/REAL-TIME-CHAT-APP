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
            return res.redirect('/home');
        }

        // Redirect to the registration page with an error message
        return res.redirect('/login?errorMessage=User creation failed');
    } catch (error) {
        console.error('Registration error:', error);
        // Redirect to the registration page with an error message
        return res.redirect('/login?errorMessage=An error occurred, please try again');
    }
};

//find user by email

const getUser = async (req, res) => {
    try {
        const user = await userModel.findUserByEmail(req.body.useremail);
        if (!user) {
            // if useremail are not correct redirect to home route with errorMessage
            return res.redirect('/login?errorMessage=User not found');
        }

        //check password
        if (user.password !== req.body.password) {
            //if password are not correct redirect to home route with errorMessage
            return res.redirect('/login?errorMessage=Invalid password');
        }
        
        //if useremail & password are correct redirect to home route
        return res.redirect('/home');
    } catch (error) {
        console.error('Login error:', error);
        return res.redirect('/login?errorMessage=An error occurred, please try again');
    }
};

module.exports = {
    register,
    getUser
};