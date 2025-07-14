import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { X, Send, Trash2 } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { getApiUrl } from '../../lib/config';

interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  text: string;
  created_at: string;
  user: {
    id: string;
    personalName: string;
    username: string;
    avatar: string;
  };
}

interface CommentsModalProps {
  visible: boolean;
  postId: string;
  onClose: () => void;
  onCommentAdded?: (comment: Comment) => void;
}

export const CommentsModal: React.FC<CommentsModalProps> = ({
  visible,
  postId,
  onClose,
  onCommentAdded,
}) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const inputRef = useRef<TextInput>(null);

  // Load comments
  const loadComments = async (refresh = false) => {
    if (!postId) return;

    try {
      setLoading(!refresh);
      setRefreshing(refresh);

      const response = await fetch(`${getApiUrl()}/posts/${postId}/comments`);
      const data = await response.json();

      if (data.success) {
        setComments(data.comments || []);
      } else {
        console.error('Failed to load comments:', data.error);
      }
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Add new comment
  const handleAddComment = async () => {
    if (!user || !newComment.trim()) return;

    try {
      setSubmitting(true);

      const response = await fetch(`${getApiUrl()}/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          text: newComment.trim(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        setComments(prev => [data.comment, ...prev]);
        setNewComment('');
        onCommentAdded?.(data.comment);
        inputRef.current?.blur();
      } else {
        Alert.alert('Error', 'Failed to add comment');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      Alert.alert('Error', 'Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete comment
  const handleDeleteComment = async (commentId: string) => {
    if (!user) return;

    Alert.alert(
      'Delete Comment',
      'Are you sure you want to delete this comment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`${getApiUrl()}/comments/${commentId}`, {
                method: 'DELETE',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  userId: user.id,
                }),
              });

              const data = await response.json();

              if (data.success) {
                setComments(prev => prev.filter(comment => comment.id !== commentId));
              } else {
                Alert.alert('Error', 'Failed to delete comment');
              }
            } catch (error) {
              console.error('Error deleting comment:', error);
              Alert.alert('Error', 'Failed to delete comment');
            }
          },
        },
      ]
    );
  };

  // Format timestamp
  const formatTime = (timestamp: string) => {
    const now = new Date();
    const commentTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - commentTime.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  // Load comments when modal opens
  useEffect(() => {
    if (visible && postId) {
      loadComments();
    }
  }, [visible, postId]);

  // Render comment item
  const renderComment = ({ item }: { item: Comment }) => {
    const isOwnComment = user?.id === item.user_id;

    return (
      <View style={styles.commentItem}>
        <View style={styles.commentHeader}>
          <View style={styles.commentUser}>
            <Text style={styles.commentAvatar}>{item.user.avatar}</Text>
            <View style={styles.commentUserInfo}>
              <Text style={[styles.commentUserName, { color: theme.colors.text.primary }]}>
                {item.user.personalName || item.user.username}
              </Text>
              <Text style={[styles.commentTime, { color: theme.colors.text.tertiary }]}>
                {formatTime(item.created_at)}
              </Text>
            </View>
          </View>
          {isOwnComment && (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDeleteComment(item.id)}
            >
              <Trash2 size={16} color={theme.colors.status.error} />
            </TouchableOpacity>
          )}
        </View>
        <Text style={[styles.commentText, { color: theme.colors.text.secondary }]}>
          {item.text}
        </Text>
      </View>
    );
  };

  // Render empty state
  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={[styles.emptyText, { color: theme.colors.text.tertiary }]}>
        No comments yet. Be the first to comment!
      </Text>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: theme.colors.neural.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.colors.glass.border }]}>
          <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>
            Comments ({comments.length})
          </Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
        </View>

        {/* Comments List */}
        <FlatList
          data={comments}
          renderItem={renderComment}
          keyExtractor={(item) => item.id}
          style={styles.commentsList}
          contentContainerStyle={styles.commentsContent}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={() => loadComments(true)}
          ListEmptyComponent={loading ? null : renderEmpty}
          inverted
        />

        {/* Loading indicator */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.neural.primary} />
          </View>
        )}

        {/* Comment Input */}
        <View style={[styles.inputContainer, { backgroundColor: theme.colors.glass.primary }]}>
          <TextInput
            ref={inputRef}
            style={[styles.input, { 
              color: theme.colors.text.primary,
              backgroundColor: theme.colors.glass.secondary,
            }]}
            placeholder="Add a comment..."
            placeholderTextColor={theme.colors.text.tertiary}
            value={newComment}
            onChangeText={setNewComment}
            multiline
            maxLength={500}
            editable={!submitting}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              {
                backgroundColor: newComment.trim() && !submitting
                  ? theme.colors.neural.primary
                  : theme.colors.glass.secondary,
              },
            ]}
            onPress={handleAddComment}
            disabled={!newComment.trim() || submitting}
          >
            {submitting ? (
              <ActivityIndicator size={16} color={theme.colors.text.inverse} />
            ) : (
              <Send size={16} color={theme.colors.text.inverse} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  commentsList: {
    flex: 1,
  },
  commentsContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  commentItem: {
    marginBottom: 16,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  commentUser: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  commentAvatar: {
    fontSize: 24,
    marginRight: 8,
  },
  commentUserInfo: {
    flex: 1,
  },
  commentUserName: {
    fontSize: 14,
    fontWeight: '600',
  },
  commentTime: {
    fontSize: 12,
  },
  deleteButton: {
    padding: 4,
  },
  commentText: {
    fontSize: 14,
    lineHeight: 20,
    marginLeft: 32,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  loadingContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -20,
    marginTop: -20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    fontSize: 14,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 