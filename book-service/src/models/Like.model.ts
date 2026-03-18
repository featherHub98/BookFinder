import { LikeModel, type ILike } from '../shared/db';
import { Types } from 'mongoose';

// Like Response Type
export interface LikeResponse {
  _id: string;
  userId: string;
  targetId: string;
  targetType: 'recommendation' | 'comment';
  createdAt: Date;
}

// Helper: Transform MongoDB document to response
function toResponse(like: ILike): LikeResponse {
  return {
    _id: like._id.toString(),
    userId: like.userId.toString(),
    targetId: like.targetId.toString(),
    targetType: like.targetType,
    createdAt: like.createdAt,
  };
}

// Like Model - Database Operations
export const LikeModelOps = {
  async toggle(
    userId: string,
    targetId: string,
    targetType: 'recommendation' | 'comment'
  ): Promise<{ liked: boolean; like?: LikeResponse }> {
    const existingLike = await LikeModel.findOne({
      userId: new Types.ObjectId(userId),
      targetId: new Types.ObjectId(targetId),
      targetType,
    });

    if (existingLike) {
      // Unlike
      await LikeModel.findByIdAndDelete(existingLike._id);
      return { liked: false };
    } else {
      // Like
      const like = await LikeModel.create({
        userId: new Types.ObjectId(userId),
        targetId: new Types.ObjectId(targetId),
        targetType,
      });
      return { liked: true, like: toResponse(like) };
    }
  },

  async hasLiked(userId: string, targetId: string, targetType: 'recommendation' | 'comment'): Promise<boolean> {
    const like = await LikeModel.findOne({
      userId: new Types.ObjectId(userId),
      targetId: new Types.ObjectId(targetId),
      targetType,
    });
    return !!like;
  },

  async getLikesForTargets(
    userId: string,
    targets: Array<{ id: string; type: 'recommendation' | 'comment' }>
  ): Promise<Map<string, boolean>> {
    const result = new Map<string, boolean>();
    
    const conditions = targets.map(t => ({
      userId: new Types.ObjectId(userId),
      targetId: new Types.ObjectId(t.id),
      targetType: t.type,
    }));

    const likes = await LikeModel.find({ $or: conditions });

    likes.forEach(like => {
      result.set(like.targetId.toString(), true);
    });

    targets.forEach(t => {
      if (!result.has(t.id)) {
        result.set(t.id, false);
      }
    });

    return result;
  },

  async getCount(targetId: string, targetType: 'recommendation' | 'comment'): Promise<number> {
    return LikeModel.countDocuments({
      targetId: new Types.ObjectId(targetId),
      targetType,
    });
  },

  async getLikers(targetId: string, targetType: 'recommendation' | 'comment', limit: number = 20): Promise<string[]> {
    const likes = await LikeModel.find({
      targetId: new Types.ObjectId(targetId),
      targetType,
    })
      .select('userId')
      .sort({ createdAt: -1 })
      .limit(limit);

    return likes.map(like => like.userId.toString());
  },

  async getUserLikes(
    userId: string,
    targetType?: 'recommendation' | 'comment',
    page: number = 1,
    limit: number = 20
  ): Promise<{ items: LikeResponse[]; total: number; hasMore: boolean }> {
    const skip = (page - 1) * limit;
    const query: Record<string, unknown> = { userId: new Types.ObjectId(userId) };
    if (targetType) {
      query.targetType = targetType;
    }

    const [items, total] = await Promise.all([
      LikeModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      LikeModel.countDocuments(query),
    ]);

    return {
      items: items.map(toResponse),
      total,
      hasMore: skip + items.length < total,
    };
  },

  async deleteForTarget(targetId: string, targetType: 'recommendation' | 'comment'): Promise<void> {
    await LikeModel.deleteMany({
      targetId: new Types.ObjectId(targetId),
      targetType,
    });
  },
};

export default LikeModelOps;
