const express = require(`express`);
const router = express.Router();
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const { check, validationResult } = require('express-validator');

const User = require('../../models/User');

// @route   POST api/users
// @desc    Register user. Needs name, email, and password
// @access  Public
router.post(
    `/`, [
    check('name','Name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Please enter a password with 6 or more characters').isLength({min:6})
    ], 
    async (req, res) => {
        const errors = validationResult(req);
        if(!errors.isEmpty()) { // if there are errors
            return res.status(400).json({ errors: errors.array() }); // 400 = bad request
        }

        // User sends valid registration information
        const { name, email, password } = req.body;

        try {
            // Check if user exists; return error
            let user = await User.findOne({ email }); // returns a promise, need await

            if(user) {
                // The json is formatted to match the validation error format for consistency
                return res.status(400).json({ errors: [{ msg: 'User already exists'}]});
            }

            // Get users gravatar
            const avatar = gravatar.url(email, {
                s: '200',
                r: 'pg',
                d: 'mm'
            });

            user = new User({ // recycling user var
                name,
                email,
                avatar,
                password
            })

            // Encrypt password using bcrypt
            const salt = await bcrypt.genSalt(10); // returns promise
            user.password = await bcrypt.hash(password, salt); // returns promise
            await user.save() // returns promise; saved to mongodb database

            // Return jsonwebtoken

            res.send('User registered')
        } catch(err) {
            console.error(err.message);
            res.status(500).send('Server error');
        }
});

module.exports = router;