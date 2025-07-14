const express = require('express');
const router = express.Router();
const { supabase } = require('../../lib/supabase');
const { getSocketIdByUserId } = require('../socket/handlers');

// Get posts by proximity level
router.get('/feed/:proximity', async (req, res) => {
  try {
    const { proximity } = req.params;
    const { userId } = req.query;
    
    const { data: posts, error } = await supabase
      .from('posts')
      .select(`
        *,
        user:profiles!posts_user_id_fkey(
          id,
          personalName,
          username,
          avatar,
          location
        ),
        likes:post_likes(count),
        comments:post_comments(count),
        userLike:post_likes!inner(user_id)
      `)
      .eq('proximity', proximity)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Transform data to match frontend expectations
    const transformedPosts = posts?.map(post => ({
      id: post.id,
      userId: post.user_id,
      user: post.user,
      content: post.content,
      image: post.image,
      likes: post.likes?.[0]?.count || 0,
      comments: post.comments?.[0]?.count || 0,
      timestamp: post.created_at,
      proximity: post.proximity,
      tags: post.tags || [],
      isAIBot: post.is_ai_bot || false,
      userLiked: post.userLike?.length > 0
    })) || [];

    res.json({
      success: true,
      posts: transformedPosts
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch posts' });
  }
});

// Create a new post
router.post('/', async (req, res) => {
  try {
    const { userId, content, image, proximity = 'neighborhood', tags = [] } = req.body;
    
    if (!userId || !content) {
      return res.status(400).json({ success: false, error: 'User ID and content are required' });
    }

    const { data: post, error } = await supabase
      .from('posts')
      .insert({
        user_id: userId,
        content,
        image: image || null,
        proximity,
        tags,
        is_ai_bot: false
      })
      .select(`
        *,
        user:profiles!posts_user_id_fkey(
          id,
          personalName,
          username,
          avatar,
          location
        )
      `)
      .single();

    if (error) throw error;

    res.json({
      success: true,
      post: {
        id: post.id,
        userId: post.user_id,
        user: post.user,
        content: post.content,
        image: post.image,
        likes: 0,
        comments: 0,
        timestamp: post.created_at,
        proximity: post.proximity,
        tags: post.tags || [],
        isAIBot: post.is_ai_bot || false
      }
    });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ success: false, error: 'Failed to create post' });
  }
});

// Toggle like on a post
router.post('/:postId/like', async (req, res) => {
  try {
    const { postId } = req.params;
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ success: false, error: 'User ID is required' });
    }

    // Check if post exists and get post owner
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('user_id')
      .eq('id', postId)
      .single();

    if (postError || !post) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }

    // Check if user already liked the post
    const { data: existingLike, error: likeError } = await supabase
      .from('post_likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .single();

    if (likeError && likeError.code !== 'PGRST116') throw likeError;

    let liked = false;

    if (existingLike) {
      // Unlike the post
      const { error: deleteError } = await supabase
        .from('post_likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', userId);

      if (deleteError) throw deleteError;
    } else {
      // Like the post
      const { error: insertError } = await supabase
        .from('post_likes')
        .insert({
          post_id: postId,
          user_id: userId
        });

      if (insertError) throw insertError;
      liked = true;

      // Send notification to post owner (if not liking own post)
      if (post.user_id !== userId) {
        const socketId = getSocketIdByUserId(post.user_id);
        if (socketId) {
          // Emit socket notification
          const io = req.app.get('io');
          io.to(socketId).emit('like_post', {
            postId,
            postOwnerId: post.user_id,
            fromUserId: userId
          });
        }
      }
    }

    // Get updated like count
    const { count: likeCount, error: countError } = await supabase
      .from('post_likes')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId);

    if (countError) throw countError;

    res.json({
      success: true,
      liked,
      likeCount: likeCount || 0
    });
  } catch (error) {
    console.error('Error toggling like:', error);
    res.status(500).json({ success: false, error: 'Failed to toggle like' });
  }
});

// Get comments for a post
router.get('/:postId/comments', async (req, res) => {
  try {
    const { postId } = req.params;
    
    const { data: comments, error } = await supabase
      .from('post_comments')
      .select(`
        *,
        user:profiles!post_comments_user_id_fkey(
          id,
          personalName,
          username,
          avatar
        )
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    res.json({
      success: true,
      comments: comments || []
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch comments' });
  }
});

// Add comment to a post
router.post('/:postId/comments', async (req, res) => {
  try {
    const { postId } = req.params;
    const { userId, text } = req.body;
    
    if (!userId || !text) {
      return res.status(400).json({ success: false, error: 'User ID and text are required' });
    }

    // Check if post exists and get post owner
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('user_id')
      .eq('id', postId)
      .single();

    if (postError || !post) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }

    const { data: comment, error } = await supabase
      .from('post_comments')
      .insert({
        post_id: postId,
        user_id: userId,
        text
      })
      .select(`
        *,
        user:profiles!post_comments_user_id_fkey(
          id,
          personalName,
          username,
          avatar
        )
      `)
      .single();

    if (error) throw error;

    // Send notification to post owner (if not commenting on own post)
    if (post.user_id !== userId) {
      const socketId = getSocketIdByUserId(post.user_id);
      if (socketId) {
        // Emit socket notification
        const io = req.app.get('io');
        io.to(socketId).emit('comment_post', {
          postId,
          postOwnerId: post.user_id,
          comment: text,
          fromUserId: userId
        });
      }
    }

    res.json({
      success: true,
      comment
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ success: false, error: 'Failed to add comment' });
  }
});

// Delete a comment
router.delete('/comments/:commentId', async (req, res) => {
  try {
    const { commentId } = req.params;
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ success: false, error: 'User ID is required' });
    }

    // Check if comment exists and user owns it
    const { data: comment, error: commentError } = await supabase
      .from('post_comments')
      .select('user_id')
      .eq('id', commentId)
      .single();

    if (commentError || !comment) {
      return res.status(404).json({ success: false, error: 'Comment not found' });
    }

    if (comment.user_id !== userId) {
      return res.status(403).json({ success: false, error: 'Not authorized to delete this comment' });
    }

    const { error: deleteError } = await supabase
      .from('post_comments')
      .delete()
      .eq('id', commentId);

    if (deleteError) throw deleteError;

    res.json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ success: false, error: 'Failed to delete comment' });
  }
});

// Get user's posts
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const { data: posts, error } = await supabase
      .from('posts')
      .select(`
        *,
        likes:post_likes(count),
        comments:post_comments(count)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Transform data to match frontend expectations
    const transformedPosts = posts?.map(post => ({
      id: post.id,
      content: post.content,
      created_at: post.created_at,
      like_count: post.likes?.[0]?.count || 0,
      comment_count: post.comments?.[0]?.count || 0
    })) || [];

    res.json({
      success: true,
      posts: transformedPosts
    });
  } catch (error) {
    console.error('Error fetching user posts:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch user posts' });
  }
});

// Delete a post
router.delete('/:postId', async (req, res) => {
  try {
    const { postId } = req.params;
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ success: false, error: 'User ID is required' });
    }

    // Check if post exists and user owns it
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('user_id')
      .eq('id', postId)
      .single();

    if (postError || !post) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }

    if (post.user_id !== userId) {
      return res.status(403).json({ success: false, error: 'Not authorized to delete this post' });
    }

    // Delete post (cascade will handle likes and comments)
    const { error: deleteError } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId);

    if (deleteError) throw deleteError;

    res.json({
      success: true,
      message: 'Post deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ success: false, error: 'Failed to delete post' });
  }
});

module.exports = router; 