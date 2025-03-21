const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const User = require('../Schemas/userSchema');
const Post = require('../Schemas/postSchema');
const { accessCheckJWT } = require('../middleware/middleware');


router.use(accessCheckJWT); 

router.get('/:id', async(req, res) =>{
    try {
        // Message managment
        const {message} = req.cookies || null;
        res.clearCookie('message');

        // Manage id param format 
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            res.cookie('message', 'User doesnt exist', { maxAge: 6000, httpOnly: true });
            return res.redirect('/');
        }

        // Verified user access only to his own account
        if (req.user.id !== id) {
            res.cookie('message', 'You do not have access to this account', { maxAge: 6000, httpOnly: true });
            return res.redirect('/');
        }

        // Find User & Existence Check
        const currentUser = await User.findOne({id: req.params.id});
        if (!currentUser) {
            res.cookie('message', 'Invalid User', { maxAge: 6000, httpOnly: true });
            return res.redirect('/');
        }
        res.status(200).render('user', { currentUser, message });
        
    }catch (error) {
        return res.status(500).json({ message: error.message}); // error handling 
    } 
});

router.patch('/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            res.cookie('message', 'User doesnt exist', { maxAge: 6000, httpOnly: true });
            return res.redirect('/');
        }

        if (req.user.id !== id) {
            res.cookie('message', 'You do not have access to this account', { maxAge: 6000, httpOnly: true });
            return res.redirect('/');
        }

        let currentUser = await User.findOne({ id });
        if (!currentUser) {
            res.cookie('message', 'Invalid User', { maxAge: 6000, httpOnly: true });
            return res.redirect('/');
        }

        const { username, displayName, email } = req.body;

        // Safely update fields
        const updateFields = {};
        if (username) updateFields.username = username.trim();
        if (displayName) updateFields.displayName = displayName.trim();
        if (email) updateFields.email = email.trim().toLowerCase();

        currentUser = await User.findOneAndUpdate({ id }, updateFields, { new: true });

        res.cookie('message', 'User updated successfully', { maxAge: 6000, httpOnly: true });
        return res.redirect(`/user/${id}`);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});


router.delete('/:id', async(req, res) =>{
    try {
        // Message managment
        const {message} = req.cookies || null;

        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            res.cookie('message', 'User doesnt exist', { maxAge: 6000, httpOnly: true });
            return res.redirect('/');
        }


        // Verified user access only to his own account
        if (req.user.id !== id) {
            res.cookie('message', 'You do not have access to this account', { maxAge: 6000, httpOnly: true });
            return res.redirect('/');
        }

        // Find User & Existence Check
        await User.findOneAndDelete({id: req.params.id});
        
        res.redirect('/');
        
    }catch (error) {
        res.cookie('message', (error.message), { maxAge: 6000, httpOnly: true });
        return res.redirect(`/user/${req.params.id}`);  // error handling 
    } 
});


/////////////////////////////////////////////////////////////////

router.get('/:id/posts', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        res.cookie('message', 'User doesn\'t exist', { maxAge: 6000, httpOnly: true });
        return res.redirect('/');
      }
  
      if (req.user.id !== id) {
        res.cookie('message', 'Unauthorized access', { maxAge: 6000, httpOnly: true });
        return res.redirect('/');
      }
  
      const currentUser = await User.findOne({ id });
      if (!currentUser) {
        res.cookie('message', 'Invalid User', { maxAge: 6000, httpOnly: true });
        return res.redirect('/');
      }
  
      const posts = await Post.find({ createdBy: currentUser._id });
  
      res.render('home', { currentUser, posts, message: req.cookies.message || null });
  
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // GET - Render form for creating a new post
  router.get('/:id/posts/new', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id) || req.user.id !== id) {
        res.cookie('message', 'Unauthorized access', { maxAge: 6000, httpOnly: true });
        return res.redirect('/');
      }
  
      const currentUser = await User.findOne({ id });
      if (!currentUser) {
        res.cookie('message', 'Invalid User', { maxAge: 6000, httpOnly: true });
        return res.redirect('/');
      }
  
      res.render('newPost', { currentUser, message: req.cookies.message || null });
  
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // POST - Handle submission of new post
  router.post('/:id/posts', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id) || req.user.id !== id) {
        res.cookie('message', 'Unauthorized access', { maxAge: 6000, httpOnly: true });
        return res.redirect('/');
      }
  
      const currentUser = await User.findOne({ id });
      if (!currentUser) {
        res.cookie('message', 'Invalid User', { maxAge: 6000, httpOnly: true });
        return res.redirect('/');
      }
  
      const {
        title,
        description,
        date,
        latitude,
        longitude,
        participants,
        accessGroups,
        picture
      } = req.body;
  
      const participantUsernames = participants?.match(/@\w+/g)?.map(u => u.replace('@', '')) || [];
      const participantUsers = await User.find({ username: { $in: participantUsernames } });
      const participantsArray = participantUsers.map(user => user._id);
  
      const accessGroupsArray = accessGroups
        ? accessGroups.split(',').map(group => group.trim())
        : [];
  
      const post = new Post({
        title: title.trim(),
        description: description.trim(),
        date: new Date(date),
        location: {
          type: 'Point',
          coordinates: [parseFloat(longitude), parseFloat(latitude)]
        },
        participants: participantsArray,
        accessGroups: accessGroupsArray,
        picture: picture || '',
        createdBy: currentUser._id
      });
  
      await post.save();
  
      res.cookie('message', 'Post created successfully', { maxAge: 6000, httpOnly: true });
      res.redirect(`/user/${id}/posts`);
  
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  
  module.exports = router;