const mongoose = require('mongoose');
//email Regex validation 
const emailRegex = /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/
//define schema using mongoos
const userSchema = new mongoose.Schema({
    useremail: {
        type: String,
        required: true,
        unique: true,
        match: emailRegex
    },
    password: {
        type: String,
        required: true
    }
});
//create user model and export
module.exports = mongoose.model('User', userSchema);