const express = require('express');
const router = express.Router();

// In-memory storage for groups
const groups = new Map();
const groupMembers = new Map();
const groupPosts = new Map();
const userGroups = new Map();

// Get all groups
router.get('/', (req, res) => {
  try {
    const { proximity = 'neighborhood', category, isPrivate } = req.query;
    
    let allGroups = Array.from(groups.values())
      .filter(group => group.proximity === proximity);
    
    // Filter by privacy if specified
    if (isPrivate !== undefined) {
      allGroups = allGroups.filter(group => group.isPrivate === (isPrivate === 'true'));
    }
    
    // Filter by category if provided
    if (category) {
      allGroups = allGroups.filter(group => group.category === category);
    }
    
    // Add member count to each group
    allGroups = allGroups.map(group => {
      const members = groupMembers.get(group.id) || [];
      return {
        ...group,
        memberCount: members.length
      };
    });
    
    allGroups = allGroups.sort((a, b) => b.memberCount - a.memberCount);
    
    res.json({
      success: true,
      groups: allGroups
    });
  } catch (error) {
    console.error('Error fetching groups:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch groups' });
  }
});

// Create a new group
router.post('/', (req, res) => {
  try {
    const {
      userId,
      name,
      description,
      category,
      isPrivate = false,
      proximity = 'neighborhood',
      tags = [],
      rules = [],
      coverImage
    } = req.body;
    
    if (!userId || !name || !description || !category) {
      return res.status(400).json({ 
        success: false, 
        error: 'User ID, name, description, and category are required' 
      });
    }
    
    const groupId = `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newGroup = {
      id: groupId,
      userId, // creator
      name,
      description,
      category,
      isPrivate,
      proximity,
      tags,
      rules,
      coverImage,
      memberCount: 1, // creator is first member
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    groups.set(groupId, newGroup);
    
    // Add creator as first member
    groupMembers.set(groupId, [{
      userId,
      role: 'admin',
      joinedAt: new Date().toISOString()
    }]);
    
    // Add to user's groups
    if (!userGroups.has(userId)) {
      userGroups.set(userId, []);
    }
    userGroups.get(userId).push(groupId);
    
    // Initialize empty posts for this group
    groupPosts.set(groupId, []);
    
    res.json({
      success: true,
      group: newGroup
    });
  } catch (error) {
    console.error('Error creating group:', error);
    res.status(500).json({ success: false, error: 'Failed to create group' });
  }
});

// Get group details
router.get('/:groupId', (req, res) => {
  try {
    const { groupId } = req.params;
    const { userId } = req.query;
    
    if (!groups.has(groupId)) {
      return res.status(404).json({ success: false, error: 'Group not found' });
    }
    
    const group = groups.get(groupId);
    const members = groupMembers.get(groupId) || [];
    const posts = groupPosts.get(groupId) || [];
    
    // Check if user is member (for private groups)
    const isMember = members.some(member => member.userId === userId);
    const isCreator = group.userId === userId;
    
    if (group.isPrivate && !isMember && !isCreator) {
      return res.status(403).json({ success: false, error: 'Access denied to private group' });
    }
    
    const groupDetails = {
      ...group,
      members: group.isPrivate ? members : members.slice(0, 10), // Show limited members for public groups
      memberCount: members.length,
      posts: posts.slice(0, 5), // Show recent posts
      isMember,
      isCreator
    };
    
    res.json({
      success: true,
      group: groupDetails
    });
  } catch (error) {
    console.error('Error fetching group:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch group' });
  }
});

// Join a group
router.post('/:groupId/join', (req, res) => {
  try {
    const { groupId } = req.params;
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ success: false, error: 'User ID is required' });
    }
    
    if (!groups.has(groupId)) {
      return res.status(404).json({ success: false, error: 'Group not found' });
    }
    
    const group = groups.get(groupId);
    const members = groupMembers.get(groupId) || [];
    
    // Check if user is already a member
    const isAlreadyMember = members.some(member => member.userId === userId);
    if (isAlreadyMember) {
      return res.status(400).json({ success: false, error: 'Already a member of this group' });
    }
    
    // Add user as member
    members.push({
      userId,
      role: 'member',
      joinedAt: new Date().toISOString()
    });
    
    groupMembers.set(groupId, members);
    
    // Add to user's groups
    if (!userGroups.has(userId)) {
      userGroups.set(userId, []);
    }
    userGroups.get(userId).push(groupId);
    
    // Update group member count
    group.memberCount = members.length;
    group.updatedAt = new Date().toISOString();
    groups.set(groupId, group);
    
    res.json({
      success: true,
      message: 'Successfully joined group'
    });
  } catch (error) {
    console.error('Error joining group:', error);
    res.status(500).json({ success: false, error: 'Failed to join group' });
  }
});

// Leave a group
router.post('/:groupId/leave', (req, res) => {
  try {
    const { groupId } = req.params;
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ success: false, error: 'User ID is required' });
    }
    
    if (!groups.has(groupId)) {
      return res.status(404).json({ success: false, error: 'Group not found' });
    }
    
    const group = groups.get(groupId);
    const members = groupMembers.get(groupId) || [];
    
    // Check if user is a member
    const memberIndex = members.findIndex(member => member.userId === userId);
    if (memberIndex === -1) {
      return res.status(400).json({ success: false, error: 'Not a member of this group' });
    }
    
    // Check if user is the creator
    if (group.userId === userId) {
      return res.status(400).json({ success: false, error: 'Creator cannot leave the group' });
    }
    
    // Remove user from members
    members.splice(memberIndex, 1);
    groupMembers.set(groupId, members);
    
    // Remove from user's groups
    const userGroupIds = userGroups.get(userId) || [];
    const updatedUserGroups = userGroupIds.filter(id => id !== groupId);
    userGroups.set(userId, updatedUserGroups);
    
    // Update group member count
    group.memberCount = members.length;
    group.updatedAt = new Date().toISOString();
    groups.set(groupId, group);
    
    res.json({
      success: true,
      message: 'Successfully left group'
    });
  } catch (error) {
    console.error('Error leaving group:', error);
    res.status(500).json({ success: false, error: 'Failed to leave group' });
  }
});

// Create a post in a group
router.post('/:groupId/posts', (req, res) => {
  try {
    const { groupId } = req.params;
    const { userId, content, image } = req.body;
    
    if (!userId || !content) {
      return res.status(400).json({ success: false, error: 'User ID and content are required' });
    }
    
    if (!groups.has(groupId)) {
      return res.status(404).json({ success: false, error: 'Group not found' });
    }
    
    const members = groupMembers.get(groupId) || [];
    const isMember = members.some(member => member.userId === userId);
    const group = groups.get(groupId);
    const isCreator = group.userId === userId;
    
    if (!isMember && !isCreator) {
      return res.status(403).json({ success: false, error: 'Must be a member to post in this group' });
    }
    
    const postId = `group_post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newPost = {
      id: postId,
      groupId,
      userId,
      content,
      image: image || null,
      likes: 0,
      comments: 0,
      timestamp: new Date().toISOString()
    };
    
    const posts = groupPosts.get(groupId) || [];
    posts.push(newPost);
    groupPosts.set(groupId, posts);
    
    res.json({
      success: true,
      post: newPost
    });
  } catch (error) {
    console.error('Error creating group post:', error);
    res.status(500).json({ success: false, error: 'Failed to create group post' });
  }
});

// Get group posts
router.get('/:groupId/posts', (req, res) => {
  try {
    const { groupId } = req.params;
    const { userId } = req.query;
    
    if (!groups.has(groupId)) {
      return res.status(404).json({ success: false, error: 'Group not found' });
    }
    
    const group = groups.get(groupId);
    const members = groupMembers.get(groupId) || [];
    const posts = groupPosts.get(groupId) || [];
    
    // Check access for private groups
    const isMember = members.some(member => member.userId === userId);
    const isCreator = group.userId === userId;
    
    if (group.isPrivate && !isMember && !isCreator) {
      return res.status(403).json({ success: false, error: 'Access denied to private group posts' });
    }
    
    const sortedPosts = posts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    res.json({
      success: true,
      posts: sortedPosts
    });
  } catch (error) {
    console.error('Error fetching group posts:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch group posts' });
  }
});

// Get user's groups
router.get('/user/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    
    const userGroupIds = userGroups.get(userId) || [];
    const userGroupsList = userGroupIds
      .map(groupId => groups.get(groupId))
      .filter(group => group)
      .map(group => {
        const members = groupMembers.get(group.id) || [];
        return {
          ...group,
          memberCount: members.length
        };
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    res.json({
      success: true,
      groups: userGroupsList
    });
  } catch (error) {
    console.error('Error fetching user groups:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch user groups' });
  }
});

// Update a group
router.put('/:groupId', (req, res) => {
  try {
    const { groupId } = req.params;
    const { userId, ...updates } = req.body;
    
    if (!userId) {
      return res.status(400).json({ success: false, error: 'User ID is required' });
    }
    
    const group = groups.get(groupId);
    if (!group) {
      return res.status(404).json({ success: false, error: 'Group not found' });
    }
    
    if (group.userId !== userId) {
      return res.status(403).json({ success: false, error: 'Not authorized to update this group' });
    }
    
    const updatedGroup = {
      ...group,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    groups.set(groupId, updatedGroup);
    
    res.json({
      success: true,
      group: updatedGroup
    });
  } catch (error) {
    console.error('Error updating group:', error);
    res.status(500).json({ success: false, error: 'Failed to update group' });
  }
});

// Get group categories
router.get('/categories', (req, res) => {
  try {
    const categories = [
      { id: 'general', name: 'General', emoji: '🏠' },
      { id: 'events', name: 'Events', emoji: '🎉' },
      { id: 'business', name: 'Business', emoji: '💼' },
      { id: 'social', name: 'Social', emoji: '🤝' },
      { id: 'support', name: 'Support', emoji: '🤗' },
      { id: 'hobbies', name: 'Hobbies', emoji: '🎨' },
      { id: 'fitness', name: 'Fitness', emoji: '💪' },
      { id: 'food', name: 'Food & Dining', emoji: '🍕' },
      { id: 'pets', name: 'Pets', emoji: '🐕' },
      { id: 'parenting', name: 'Parenting', emoji: '👶' }
    ];
    
    res.json({
      success: true,
      categories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch categories' });
  }
});

module.exports = router; 