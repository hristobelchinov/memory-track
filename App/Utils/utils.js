const User = require('../Schemas/userSchema');
const Post = require('../Schemas/postSchema');

async function fetchUserAndPosts(userId) {
  const currentUser = await User.findOne({ id: userId });
  if (!currentUser) {
    return { error: 'Invalid User' };
  }

  const posts = await Post.find({ createdBy: currentUser._id });

  return { currentUser, posts };
}

module.exports = { fetchUserAndPosts };