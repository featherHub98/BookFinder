import { CommentModel, UserModel, type IComment } from '../shared/db';
import { Types } from 'mongoose';

// Comment Response Type
export interface CommentResponse {
  _id: string;
  userId: string;
  recommendationId: string;
  parentId: string | null;
  content: string;
  isEdited: boolean;
  likesCount: number;
  createdAt: Date;
  updatedAt: Date;
  user?: {
    _id: string;
    name: string | null;
    avatar: string | null;
  };
  replies?: CommentResponse[];
}

// Helper: Transform MongoDB document to response
async function toResponse(comment: IComment): Promise<CommentResponse> {
  const user = await UserModel.findById(comment.userId).select('name avatar');
  
  return {
    _id: comment._id.toString(),
    userId: comment.userId.toString(),
    recommendationId: comment.recommendationId.toString(),
    parentId: comment.parentId?.toString() || null,
    content: comment.content,
    isEdited: comment.isEdited,
    likesCount: comment.likesCount,
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
    user: user ? {
      _id: user._id.toString(),
      name: user.name,
      avatar: user.avatar,
    } : undefined,
  };
}

// Comment Model - Database Operations
export const CommentModelOps = {
  async create(
    userId: string,
    recommendationId: string,
    content: string,
    parentId?: string
  ): Promise<CommentResponse> {
    const comment = await CommentModel.create({
      userId: new Types.ObjectId(userId),
      recommendationId: new Types.ObjectId(recommendationId),
      content,
      parentId: parentId ? new Types.ObjectId(parentId) : null,
    });
    return toResponse(comment);
  },

  async findById(id: string): Promise<CommentResponse | null> {
    const comment = await CommentModel.findById(id);
    return comment ? toResponse(comment) : null;
  },

  async getByRecommendation(
    recommendationId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ items: CommentResponse[]; total: number; hasMore: boolean }> {
    const skip = (page - 1) * limit;

    // Get top-level comments only
    const [items, total] = await Promise.all([
      CommentModel.find({
        recommendationId: new Types.ObjectId(recommendationId),
        parentId: null,
      })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      CommentModel.countDocuments({
        recommendationId: new Types.ObjectId(recommendationId),
        parentId: null,
      }),
    ]);

    const responses = await Promise.all(items.map(toResponse));

    // Get replies for each comment
    const commentsWithReplies = await Promise.all(
      responses.map(async (comment) => {
        const replies = await CommentModel.find({
          parentId: new Types.ObjectId(comment._id),
        })
          .sort({ createdAt: 1 })
          .limit(5);

        const replyResponses = await Promise.all(replies.map(toResponse));
        return { ...comment, replies: replyResponses };
      })
    );

    return {
      items: commentsWithReplies,
      total,
      hasMore: skip + items.length < total,
    };
  },

  async getReplies(
    parentId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ items: CommentResponse[]; total: number; hasMore: boolean }> {
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      CommentModel.find({ parentId: new Types.ObjectId(parentId) })
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(limit),
      CommentModel.countDocuments({ parentId: new Types.ObjectId(parentId) }),
    ]);

    const responses = await Promise.all(items.map(toResponse));

    return {
      items: responses,
      total,
      hasMore: skip + items.length < total,
    };
  },

  async update(id: string, userId: string, content: string): Promise<CommentResponse | null> {
    const comment = await CommentModel.findOneAndUpdate(
      { _id: new Types.ObjectId(id), userId: new Types.ObjectId(userId) },
      { content, isEdited: true },
      { new: true }
    );
    return comment ? toResponse(comment) : null;
  },

  async delete(id: string, userId: string): Promise<boolean> {
    const result = await CommentModel.findOneAndDelete({
      _id: new Types.ObjectId(id),
      userId: new Types.ObjectId(userId),
    });
    return !!result;
  },

  async incrementLikes(id: string): Promise<void> {
    await CommentModel.findByIdAndUpdate(id, { $inc: { likesCount: 1 } });
  },

  async decrementLikes(id: string): Promise<void> {
    await CommentModel.findByIdAndUpdate(id, { $inc: { likesCount: -1 } });
  },

  async getUserComments(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ items: CommentResponse[]; total: number; hasMore: boolean }> {
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      CommentModel.find({ userId: new Types.ObjectId(userId) })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      CommentModel.countDocuments({ userId: new Types.ObjectId(userId) }),
    ]);

    const responses = await Promise.all(items.map(toResponse));

    return {
      items: responses,
      total,
      hasMore: skip + items.length < total,
    };
  },

  async getCount(recommendationId: string): Promise<number> {
    return CommentModel.countDocuments({
      recommendationId: new Types.ObjectId(recommendationId),
    });
  },
};

export default CommentModelOps;
