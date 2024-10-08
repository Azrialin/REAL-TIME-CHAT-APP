const userModel = require('../models/user.model');

//create new user
const register = async (req, res) => {
    try {
        //check if email already exist or not
        const existingUser = await userModel.findUserByEmail(req.body.useremail);
        if (existingUser) {
            return res.status(400).json({ message: 'Email already in use'});
        }

        //if the email is available, create user
        const newUser = {
            useremail: req.body.useremail,
            password: req.body.password,
        }

        const createdUser = await userModel.createUser(newUser);
        if (!createdUser) {
            return res.status(500).json({ message: 'User creation failed '});
        }

        return res.status(201).json(createdUser);//201 is created status code
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

//find user by email

const getUser = async (req, res) => {
    try {
        const user = await userModel.findUserByEmail(req.body.useremail);
        if (!user) {
            res.status(404).json({ message: 'User not found' });
        }

        //check password
        if (user.password !== req.body.password) {
            return res.status(401).json({ message: 'Invalid password' });
        }
        
        return res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    register,
    getUser
};