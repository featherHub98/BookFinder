import { FollowModel, UserModel, RecommendationModel, type IFollow } from '../shared/db';
import { Types } from 'mongoose';

// Follow Response Type
export interface FollowResponse {
  _id: string;
  followerId: string;
  followingId: string;
  createdAt: Date;
}

export interface UserWithFollowInfo {
  _id: string;
  name: string | null;
  avatar: string | null;
  bio: string | null;
  followersCount: number;
  followingCount: number;
  recommendationsCount: number;
  isFollowing?: boolean;
}

// Helper: Transform MongoDB document to response
function toResponse(follow: IFollow): FollowResponse {
  return {
    _id: follow._id.toString(),
    followerId: follow.followerId.toString(),
    followingId: follow.followingId.toString(),
    createdAt: follow.createdAt,
  };
}

// Follow Model - Database Operations
export const FollowModelOps = {
  async toggle(followerId: string, followingId: string): Promise<{ followed: boolean; follow?: FollowResponse }> {
    if (followerId === followingId) {
      throw new Error('Cannot follow yourself');
    }

    const existingFollow = await FollowModel.findOne({
      followerId: new Types.ObjectId(followerId),
      followingId: new Types.ObjectId(followingId),
    });

    if (existingFollow) {
      // Unfollow
      await FollowModel.findByIdAndDelete(existingFollow._id);
      
      // Update counters
      await UserModel.findByIdAndUpdate(followerId, { $inc: { followingCount: -1 } });
      await UserModel.findByIdAndUpdate(followingId, { $inc: { followersCount: -1 } });
      
      return { followed: false };
    } else {
      // Follow
      const follow = await FollowModel.create({
        followerId: new Types.ObjectId(followerId),
        followingId: new Types.ObjectId(followingId),
      });
      
      // Update counters
      await UserModel.findByIdAndUpdate(followerId, { $inc: { followingCount: 1 } });
      await UserModel.findByIdAndUpdate(followingId, { $inc: { followersCount: 1 } });
      
      return { followed: true, follow: toResponse(follow) };
    }
  },

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const follow = await FollowModel.findOne({
      followerId: new Types.ObjectId(followerId),
      followingId: new Types.ObjectId(followingId),
    });
    return !!follow;
  },

  async getFollowers(
    userId: string,
    currentUserId?: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ items: UserWithFollowInfo[]; total: number; hasMore: boolean }> {
    const skip = (page - 1) * limit;

    const [follows, total] = await Promise.all([
      FollowModel.find({ followingId: new Types.ObjectId(userId) })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      FollowModel.countDocuments({ followingId: new Types.ObjectId(userId) }),
    ]);

    const followerIds = follows.map(f => f.followerId);
    const users = await UserModel.find({ _id: { $in: followerIds } })
      .select('name avatar bio followersCount followingCount recommendationsCount');

    // Get real-time recommendations count for each user
    // Use explicit ObjectId conversion to ensure matching
    const recCountPromises = followerIds.map(id => 
      RecommendationModel.countDocuments({ userId: new Types.ObjectId(id.toString()) })
    );
    const recCounts = await Promise.all(recCountPromises);
    const recCountMap = new Map(followerIds.map((id, idx) => [id.toString(), recCounts[idx]]));
    
    console.log('[getFollowers] Follower IDs:', followerIds.map(id => id.toString()));
    console.log('[getFollowers] Rec counts:', recCounts);

    // Check if current user follows these followers
    let followingSet = new Set<string>();
    if (currentUserId) {
      const following = await FollowModel.find({
        followerId: new Types.ObjectId(currentUserId),
        followingId: { $in: followerIds },
      });
      followingSet = new Set(following.map(f => f.followingId.toString()));
    }

    const items: UserWithFollowInfo[] = users.map(user => ({
      _id: user._id.toString(),
      name: user.name,
      avatar: user.avatar,
      bio: user.bio,
      followersCount: user.followersCount,
      followingCount: user.followingCount,
      recommendationsCount: recCountMap.get(user._id.toString()) || 0,
      isFollowing: followingSet.has(user._id.toString()),
    }));

    return { items, total, hasMore: skip + follows.length < total };
  },

  async getFollowing(
    userId: string,
    currentUserId?: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ items: UserWithFollowInfo[]; total: number; hasMore: boolean }> {
    const skip = (page - 1) * limit;

    const [follows, total] = await Promise.all([
      FollowModel.find({ followerId: new Types.ObjectId(userId) })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      FollowModel.countDocuments({ followerId: new Types.ObjectId(userId) }),
    ]);

    const followingIds = follows.map(f => f.followingId);
    const users = await UserModel.find({ _id: { $in: followingIds } })
      .select('name avatar bio followersCount followingCount recommendationsCount');

    // Get real-time recommendations count for each user
    // Use explicit ObjectId conversion to ensure matching
    const recCountPromises = followingIds.map(id => 
      RecommendationModel.countDocuments({ userId: new Types.ObjectId(id.toString()) })
    );
    const recCounts = await Promise.all(recCountPromises);
    const recCountMap = new Map(followingIds.map((id, idx) => [id.toString(), recCounts[idx]]));
    
    console.log('[getFollowing] Following IDs:', followingIds.map(id => id.toString()));
    console.log('[getFollowing] Rec counts:', recCounts);

    // Check if current user follows these users
    let followingSet = new Set<string>();
    if (currentUserId) {
      const following = await FollowModel.find({
        followerId: new Types.ObjectId(currentUserId),
        followingId: { $in: followingIds },
      });
      followingSet = new Set(following.map(f => f.followingId.toString()));
    }

    const items: UserWithFollowInfo[] = users.map(user => ({
      _id: user._id.toString(),
      name: user.name,
      avatar: user.avatar,
      bio: user.bio,
      followersCount: user.followersCount,
      followingCount: user.followingCount,
      recommendationsCount: recCountMap.get(user._id.toString()) || 0,
      isFollowing: followingSet.has(user._id.toString()),
    }));

    return { items, total, hasMore: skip + follows.length < total };
  },

  async getCounts(userId: string): Promise<{ followers: number; following: number }> {
    const [followers, following] = await Promise.all([
      FollowModel.countDocuments({ followingId: new Types.ObjectId(userId) }),
      FollowModel.countDocuments({ followerId: new Types.ObjectId(userId) }),
    ]);
    return { followers, following };
  },

  async getSuggested(
    userId: string,
    limit: number = 5
  ): Promise<UserWithFollowInfo[]> {
    // Get users that current user is following
    const following = await FollowModel.find({
      followerId: new Types.ObjectId(userId),
    }).select('followingId');

    const excludeIds = [new Types.ObjectId(userId), ...following.map(f => f.followingId)];

    // Get users with most recommendations (simplified algorithm)
    const users = await UserModel.find({
      _id: { $nin: excludeIds },
      recommendationsCount: { $gt: 0 },
    })
      .sort({ recommendationsCount: -1 })
      .limit(limit)
      .select('name avatar bio followersCount followingCount recommendationsCount');

    return users.map(user => ({
      _id: user._id.toString(),
      name: user.name,
      avatar: user.avatar,
      bio: user.bio,
      followersCount: user.followersCount,
      followingCount: user.followingCount,
      recommendationsCount: user.recommendationsCount,
      isFollowing: false,
    }));
  },
};

export default FollowModelOps;
