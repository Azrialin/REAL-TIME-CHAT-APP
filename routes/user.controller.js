const userModel = require('../models/user.model');

//create new user
const register = async (req, res) => {
    try {
        const newUser = await userModel.createUser(req.body);
        res.status(201).json(newUser);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

//find user by email

const getUser = async (req, res) => {
    try {
        const user = await userModel.findUserByEmail(req.params.useremail);
        if (user) {
            res.status(200).json(user);
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