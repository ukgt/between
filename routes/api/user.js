const express = require("express");
const router = express.Router();

// User Model
const User = require("../../models/Users");

// GET route for api/user
// GET all Users
//Authentication here???
router.get('/', (req, res) => {
     User.find()
          .then(user => res.json(user))
     
});

//POST api/user
//CReate a Post
router.post("/", (req, res) => {
 const newUser = new User({
      name: req.body.name
 });
newUser.save().then(user => res.json(user));

});

// //DELETE api/user/:id
// //DELETE a User
// router.delete("/:id", (req, res) => {
//  User.findById(req.params.id)
//  .then(item => item.remove().then(() => res.json({success: true})))
//  .catch(err => res.status(404).json({ success: false}))
//  });


module.exports = router;