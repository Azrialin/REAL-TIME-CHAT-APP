const User = require('./user.mongo');

const createUser = async (userData) => {
    const user = new User(userData);
    return await user.save();
};

const findUserByEmail = async (useremail) => {
    return await User.findOne({useremail});
};

module.exports = {
    createUser,
    findUserByEmail,
}