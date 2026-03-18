import { ShareModel, type IShare } from '../shared/db';
import { Types } from 'mongoose';

// Share Response Type
export interface ShareResponse {
  _id: string;
  userId: string;
  recommendationId: string;
  platform: 'internal' | 'twitter' | 'facebook' | 'linkedin' | 'copy_link';
  message: string | null;
  createdAt: Date;
}

// Helper: Transform MongoDB document to response
function toResponse(share: IShare): ShareResponse {
  return {
    _id: share._id.toString(),
    userId: share.userId.toString(),
    recommendationId: share.recommendationId.toString(),
    platform: share.platform,
    message: share.message,
    createdAt: share.createdAt,
  };
}

// Share Model - Database Operations
export const ShareModelOps = {
  async create(
    userId: string,
    recommendationId: string,
    platform: 'internal' | 'twitter' | 'facebook' | 'linkedin' | 'copy_link',
    message?: string
  ): Promise<ShareResponse> {
    const share = await ShareModel.create({
      userId: new Types.ObjectId(userId),
      recommendationId: new Types.ObjectId(recommendationId),
      platform,
      message: message || null,
    });
    return toResponse(share);
  },

  async getByRecommendation(
    recommendationId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ items: ShareResponse[]; total: number; hasMore: boolean }> {
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      ShareModel.find({ recommendationId: new Types.ObjectId(recommendationId) })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      ShareModel.countDocuments({ recommendationId: new Types.ObjectId(recommendationId) }),
    ]);

    return {
      items: items.map(toResponse),
      total,
      hasMore: skip + items.length < total,
    };
  },

  async getCount(recommendationId: string): Promise<number> {
    return ShareModel.countDocuments({
      recommendationId: new Types.ObjectId(recommendationId),
    });
  },

  async getCountByPlatform(recommendationId: string): Promise<Record<string, number>> {
    const result = await ShareModel.aggregate([
      { $match: { recommendationId: new Types.ObjectId(recommendationId) } },
      { $group: { _id: '$platform', count: { $sum: 1 } } },
    ]);

    const counts: Record<string, number> = {
      internal: 0,
      twitter: 0,
      facebook: 0,
      linkedin: 0,
      copy_link: 0,
    };

    result.forEach(item => {
      counts[item._id] = item.count;
    });

    return counts;
  },

  async getUserShares(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ items: ShareResponse[]; total: number; hasMore: boolean }> {
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      ShareModel.find({ userId: new Types.ObjectId(userId) })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      ShareModel.countDocuments({ userId: new Types.ObjectId(userId) }),
    ]);

    return {
      items: items.map(toResponse),
      total,
      hasMore: skip + items.length < total,
    };
  },

  async hasSharedInternally(userId: string, recommendationId: string): Promise<boolean> {
    const share = await ShareModel.findOne({
      userId: new Types.ObjectId(userId),
      recommendationId: new Types.ObjectId(recommendationId),
      platform: 'internal',
    });
    return !!share;
  },
};

export default ShareModelOps;
