import React, { useState } from 'react';
import { FlatList, Modal, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useSocial, SocialPost, SocialUser } from '@/context/SocialContext';
import { Avatar } from '@/components/ui/Avatar';

function PostCard({ post, onLike }: { post: SocialPost; onLike: () => void }) {
  const colors = useColors();
  const timeAgo = (iso: string) => {
    const diff = (Date.now() - new Date(iso).getTime()) / 60000;
    if (diff < 60) return `${Math.floor(diff)}m`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h`;
    return `${Math.floor(diff / 1440)}d`;
  };

  return (
    <View style={[styles.postCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.postHeader}>
        <Avatar name={post.authorName} color={post.authorColor} size={38} />
        <View style={styles.postMeta}>
          <Text style={[styles.authorName, { color: colors.foreground }]}>{post.authorName}</Text>
          <Text style={[styles.postTime, { color: colors.mutedForeground }]}>{timeAgo(post.createdAt)}</Text>
        </View>
      </View>
      <Text style={[styles.postContent, { color: colors.foreground }]}>{post.content}</Text>
      <View style={[styles.postActions, { borderTopColor: colors.border }]}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => { onLike(); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}>
          <Feather name={post.liked ? 'heart' : 'heart'} size={18} color={post.liked ? colors.social : colors.mutedForeground} />
          <Text style={[styles.actionCount, { color: post.liked ? colors.social : colors.mutedForeground }]}>{post.likesCount}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn}>
          <Feather name="message-circle" size={18} color={colors.mutedForeground} />
          <Text style={[styles.actionCount, { color: colors.mutedForeground }]}>{post.commentsCount}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn}>
          <Feather name="share" size={18} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function UserCard({ user, onFollow }: { user: SocialUser; onFollow: () => void }) {
  const colors = useColors();
  return (
    <View style={[styles.userCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Avatar name={user.name} color={user.avatarColor} size={46} />
      <View style={styles.userInfo}>
        <Text style={[styles.userName, { color: colors.foreground }]}>{user.name}</Text>
        <Text style={[styles.userBio, { color: colors.mutedForeground }]} numberOfLines={1}>{user.bio}</Text>
        <Text style={[styles.userStats, { color: colors.mutedForeground }]}>{user.followersCount} followers</Text>
      </View>
      <TouchableOpacity onPress={onFollow}
        style={[styles.followBtn, { backgroundColor: user.isFollowing ? colors.muted : colors.social }]}>
        <Text style={[styles.followBtnText, { color: user.isFollowing ? colors.mutedForeground : '#fff' }]}>
          {user.isFollowing ? 'Following' : 'Follow'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

export default function SocialScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { posts, suggestedUsers, profile, addPost, toggleLike, followUser } = useSocial();
  const [tab, setTab] = useState<'feed' | 'discover'>('feed');
  const [showCompose, setShowCompose] = useState(false);
  const [draft, setDraft] = useState('');

  const topPad = Platform.OS === 'web' ? Math.max(insets.top, 67) : insets.top;

  const handlePost = () => {
    if (!draft.trim()) return;
    addPost(draft.trim());
    setDraft('');
    setShowCompose(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const feedPosts = tab === 'feed' ? posts : [];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 16, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => router.back()}>
              <Feather name="arrow-left" size={22} color={colors.foreground} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>Social</Text>
          </View>
          <View style={styles.headerRight}>
            <Avatar name={profile.name} color={colors.social} size={32} />
            <TouchableOpacity style={[styles.composeBtn, { backgroundColor: colors.social }]} onPress={() => setShowCompose(true)}>
              <Feather name="edit-2" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabsRow}>
          {(['feed', 'discover'] as const).map(t => (
            <TouchableOpacity key={t} onPress={() => setTab(t)}
              style={[styles.tabBtn, tab === t && { borderBottomColor: colors.social, borderBottomWidth: 2 }]}>
              <Text style={[styles.tabBtnText, { color: tab === t ? colors.social : colors.mutedForeground }]}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {tab === 'feed' ? (
        <FlatList
          data={posts}
          keyExtractor={p => p.id}
          renderItem={({ item }) => <PostCard post={item} onLike={() => toggleLike(item.id)} />}
          style={styles.list}
          contentContainerStyle={[styles.listContent, { paddingBottom: Platform.OS === 'web' ? 80 : 100 }]}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <FlatList
          data={suggestedUsers}
          keyExtractor={u => u.id}
          renderItem={({ item }) => <UserCard user={item} onFollow={() => followUser(item.id)} />}
          style={styles.list}
          contentContainerStyle={[styles.listContent, { paddingBottom: Platform.OS === 'web' ? 80 : 100 }]}
          ListHeaderComponent={<Text style={[styles.discoverHeader, { color: colors.mutedForeground }]}>People you might know</Text>}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Compose modal */}
      <Modal visible={showCompose} transparent animationType="slide" onRequestClose={() => setShowCompose(false)}>
        <View style={styles.composeOverlay}>
          <View style={[styles.composeModal, { backgroundColor: colors.card }]}>
            <View style={styles.composeHeader}>
              <TouchableOpacity onPress={() => setShowCompose(false)}>
                <Text style={[styles.composeCancel, { color: colors.mutedForeground }]}>Cancel</Text>
              </TouchableOpacity>
              <Text style={[styles.composeTitle, { color: colors.foreground }]}>New Post</Text>
              <TouchableOpacity onPress={handlePost} disabled={!draft.trim()}
                style={[styles.postBtn, { backgroundColor: draft.trim() ? colors.social : colors.muted }]}>
                <Text style={[styles.postBtnText, { color: draft.trim() ? '#fff' : colors.mutedForeground }]}>Post</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.composeBody}>
              <Avatar name={profile.name} color={colors.social} size={40} />
              <TextInput
                style={[styles.composeInput, { color: colors.foreground }]}
                placeholder="What's on your mind?"
                placeholderTextColor={colors.mutedForeground}
                value={draft}
                onChangeText={setDraft}
                multiline
                autoFocus
                textAlignVertical="top"
              />
            </View>
            <Text style={[styles.charCount, { color: colors.mutedForeground }]}>{draft.length}/280</Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 0, borderBottomWidth: StyleSheet.hairlineWidth },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerTitle: { fontSize: 28, fontFamily: 'Inter_700Bold', letterSpacing: -0.5 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  composeBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  tabsRow: { flexDirection: 'row' },
  tabBtn: { paddingVertical: 12, paddingHorizontal: 20, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  list: { flex: 1 },
  listContent: { padding: 16 },
  postCard: { borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, marginBottom: 12, overflow: 'hidden' },
  postHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, paddingBottom: 10 },
  postMeta: {},
  authorName: { fontSize: 14, fontFamily: 'Inter_600SemiBold', marginBottom: 1 },
  postTime: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  postContent: { fontSize: 15, fontFamily: 'Inter_400Regular', lineHeight: 22, paddingHorizontal: 14, paddingBottom: 14 },
  postActions: { flexDirection: 'row', paddingHorizontal: 14, paddingVertical: 10, borderTopWidth: StyleSheet.hairlineWidth, gap: 20 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionCount: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  userCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, marginBottom: 10 },
  userInfo: { flex: 1 },
  userName: { fontSize: 15, fontFamily: 'Inter_600SemiBold', marginBottom: 2 },
  userBio: { fontSize: 12, fontFamily: 'Inter_400Regular', marginBottom: 2 },
  userStats: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  followBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  followBtnText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  discoverHeader: { fontSize: 13, fontFamily: 'Inter_500Medium', marginBottom: 12 },
  composeOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  composeModal: { borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingTop: 16, maxHeight: '80%' },
  composeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(128,128,128,0.2)' },
  composeCancel: { fontSize: 16, fontFamily: 'Inter_400Regular' },
  composeTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  postBtn: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20 },
  postBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  composeBody: { flexDirection: 'row', gap: 12, padding: 20, paddingBottom: 8 },
  composeInput: { flex: 1, fontSize: 16, fontFamily: 'Inter_400Regular', lineHeight: 24, minHeight: 120 },
  charCount: { textAlign: 'right', paddingHorizontal: 20, paddingBottom: 20, fontSize: 12, fontFamily: 'Inter_400Regular' },
});
