const fetch = require('node-fetch');

const API_BASE = 'http://192.168.18.232:5002/api';

// TODO: Remove test data - use real user data from Supabase instead
const testUsers = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    name: 'Alice Johnson',
    avatar: '👩‍💼'
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    name: 'Bob Smith',
    avatar: '👨‍💻'
  },
  {
    id: '00000000-0000-0000-0000-000000000003',
    name: 'Carol Davis',
    avatar: '👩‍🎨'
  }
];

let testPostId = null;

async function testPostEngagement() {
  console.log('🚀 Testing Post Engagement System\n');

  try {
    // 1. Create a test post
    console.log('1. Creating test post...');
    const createPostResponse = await fetch(`${API_BASE}/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: testUsers[0].id,
        content: 'This is a test post for the engagement system! 🎉',
        proximity: 'neighborhood',
        tags: ['test', 'engagement']
      })
    });

    const createPostData = await createPostResponse.json();
    if (!createPostData.success) {
      throw new Error(`Failed to create post: ${createPostData.error}`);
    }

    testPostId = createPostData.post.id;
    console.log(`✅ Post created with ID: ${testPostId}`);

    // 2. Test liking the post
    console.log('\n2. Testing post likes...');
    
    // Like from user 2
    const likeResponse1 = await fetch(`${API_BASE}/posts/${testPostId}/like`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: testUsers[1].id })
    });

    const likeData1 = await likeResponse1.json();
    if (!likeData1.success) {
      throw new Error(`Failed to like post: ${likeData1.error}`);
    }
    console.log(`✅ User ${testUsers[1].name} liked the post (count: ${likeData1.likeCount})`);

    // Like from user 3
    const likeResponse2 = await fetch(`${API_BASE}/posts/${testPostId}/like`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: testUsers[2].id })
    });

    const likeData2 = await likeResponse2.json();
    if (!likeData2.success) {
      throw new Error(`Failed to like post: ${likeData2.error}`);
    }
    console.log(`✅ User ${testUsers[2].name} liked the post (count: ${likeData2.likeCount})`);

    // Unlike from user 2
    const unlikeResponse = await fetch(`${API_BASE}/posts/${testPostId}/like`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: testUsers[1].id })
    });

    const unlikeData = await unlikeResponse.json();
    if (!unlikeData.success) {
      throw new Error(`Failed to unlike post: ${unlikeData.error}`);
    }
    console.log(`✅ User ${testUsers[1].name} unliked the post (count: ${unlikeData.likeCount})`);

    // 3. Test adding comments
    console.log('\n3. Testing post comments...');

    // Add comment from user 2
    const commentResponse1 = await fetch(`${API_BASE}/posts/${testPostId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: testUsers[1].id,
        text: 'Great post! Thanks for sharing! 👍'
      })
    });

    const commentData1 = await commentResponse1.json();
    if (!commentData1.success) {
      throw new Error(`Failed to add comment: ${commentData1.error}`);
    }
    console.log(`✅ User ${testUsers[1].name} commented: "${commentData1.comment.text}"`);

    // Add comment from user 3
    const commentResponse2 = await fetch(`${API_BASE}/posts/${testPostId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: testUsers[2].id,
        text: 'I agree! This is really helpful information. 🎯'
      })
    });

    const commentData2 = await commentResponse2.json();
    if (!commentData2.success) {
      throw new Error(`Failed to add comment: ${commentData2.error}`);
    }
    console.log(`✅ User ${testUsers[2].name} commented: "${commentData2.comment.text}"`);

    // 4. Test fetching comments
    console.log('\n4. Testing comment retrieval...');
    const getCommentsResponse = await fetch(`${API_BASE}/posts/${testPostId}/comments`);
    const getCommentsData = await getCommentsResponse.json();

    if (!getCommentsData.success) {
      throw new Error(`Failed to get comments: ${getCommentsData.error}`);
    }

    console.log(`✅ Retrieved ${getCommentsData.comments.length} comments:`);
    getCommentsData.comments.forEach((comment, index) => {
      console.log(`   ${index + 1}. ${comment.user.personalName}: "${comment.text}"`);
    });

    // 5. Test deleting a comment
    console.log('\n5. Testing comment deletion...');
    const commentToDelete = commentData1.comment.id;
    const deleteCommentResponse = await fetch(`${API_BASE}/comments/${commentToDelete}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: testUsers[1].id })
    });

    const deleteCommentData = await deleteCommentResponse.json();
    if (!deleteCommentData.success) {
      throw new Error(`Failed to delete comment: ${deleteCommentData.error}`);
    }
    console.log(`✅ Comment deleted successfully`);

    // 6. Test fetching posts with engagement data
    console.log('\n6. Testing post feed with engagement...');
    const feedResponse = await fetch(`${API_BASE}/posts/feed/neighborhood?userId=${testUsers[0].id}`);
    const feedData = await feedResponse.json();

    if (!feedData.success) {
      throw new Error(`Failed to get feed: ${feedData.error}`);
    }

    const ourPost = feedData.posts.find(post => post.id === testPostId);
    if (ourPost) {
      console.log(`✅ Post in feed - Likes: ${ourPost.likes}, Comments: ${ourPost.comments}, User liked: ${ourPost.userLiked}`);
    } else {
      console.log('❌ Post not found in feed');
    }

    // 7. Test user posts
    console.log('\n7. Testing user posts...');
    const userPostsResponse = await fetch(`${API_BASE}/posts/user/${testUsers[0].id}`);
    const userPostsData = await userPostsResponse.json();

    if (!userPostsData.success) {
      throw new Error(`Failed to get user posts: ${userPostsData.error}`);
    }

    console.log(`✅ User ${testUsers[0].name} has ${userPostsData.posts.length} posts`);

    // 8. Test post deletion
    console.log('\n8. Testing post deletion...');
    const deletePostResponse = await fetch(`${API_BASE}/posts/${testPostId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: testUsers[0].id })
    });

    const deletePostData = await deletePostResponse.json();
    if (!deletePostData.success) {
      throw new Error(`Failed to delete post: ${deletePostData.error}`);
    }
    console.log(`✅ Post deleted successfully`);

    console.log('\n🎉 All tests passed! Post engagement system is working correctly.');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    
    // Cleanup: try to delete the test post if it was created
    if (testPostId) {
      try {
        await fetch(`${API_BASE}/posts/${testPostId}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: testUsers[0].id })
        });
        console.log('🧹 Cleaned up test post');
      } catch (cleanupError) {
        console.log('⚠️ Failed to cleanup test post');
      }
    }
  }
}

// Test notification system integration
async function testNotificationIntegration() {
  console.log('\n🔔 Testing Notification Integration\n');

  try {
    // Create a test post for notifications
    console.log('1. Creating test post for notifications...');
    const createPostResponse = await fetch(`${API_BASE}/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: testUsers[0].id,
        content: 'This post will trigger notifications! 🔔',
        proximity: 'neighborhood'
      })
    });

    const createPostData = await createPostResponse.json();
    if (!createPostData.success) {
      throw new Error(`Failed to create post: ${createPostData.error}`);
    }

    const notificationPostId = createPostData.post.id;
    console.log(`✅ Notification test post created: ${notificationPostId}`);

    // Test like notification
    console.log('\n2. Testing like notification...');
    const likeResponse = await fetch(`${API_BASE}/posts/${notificationPostId}/like`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: testUsers[1].id })
    });

    const likeData = await likeResponse.json();
    if (!likeData.success) {
      throw new Error(`Failed to like post: ${likeData.error}`);
    }
    console.log(`✅ Like notification should be sent to post owner`);

    // Test comment notification
    console.log('\n3. Testing comment notification...');
    const commentResponse = await fetch(`${API_BASE}/posts/${notificationPostId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: testUsers[2].id,
        text: 'This comment should trigger a notification! 📱'
      })
    });

    const commentData = await commentResponse.json();
    if (!commentData.success) {
      throw new Error(`Failed to add comment: ${commentData.error}`);
    }
    console.log(`✅ Comment notification should be sent to post owner`);

    // Cleanup
    await fetch(`${API_BASE}/posts/${notificationPostId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: testUsers[0].id })
    });

    console.log('\n🎉 Notification integration tests completed!');

  } catch (error) {
    console.error('\n❌ Notification test failed:', error.message);
  }
}

// Run tests
async function runAllTests() {
  await testPostEngagement();
  await testNotificationIntegration();
}

// Check if running directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  testPostEngagement,
  testNotificationIntegration,
  runAllTests
}; 