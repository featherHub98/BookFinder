import { UserPreferencesModel, type IUserPreferences } from '../shared/db';
import { Types } from 'mongoose';

// UserPreferences Response Type
export interface UserPreferencesResponse {
  _id: string;
  userId: string;
  favoriteGenres: string[];
  favoriteAuthors: string[];
  preferredLanguages: string[];
  readingGoals: {
    booksPerYear: number;
    currentYear: number;
    booksReadThisYear: number;
  };
  notificationSettings: {
    newFollower: boolean;
    newComment: boolean;
    newLike: boolean;
    recommendations: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Helper: Transform MongoDB document to response
function toResponse(prefs: IUserPreferences): UserPreferencesResponse {
  return {
    _id: prefs._id.toString(),
    userId: prefs.userId.toString(),
    favoriteGenres: prefs.favoriteGenres,
    favoriteAuthors: prefs.favoriteAuthors,
    preferredLanguages: prefs.preferredLanguages,
    readingGoals: prefs.readingGoals,
    notificationSettings: prefs.notificationSettings,
    createdAt: prefs.createdAt,
    updatedAt: prefs.updatedAt,
  };
}

// UserPreferences Model - Database Operations
export const UserPreferencesModelOps = {
  async getOrCreate(userId: string): Promise<UserPreferencesResponse> {
    let prefs = await UserPreferencesModel.findOne({
      userId: new Types.ObjectId(userId),
    });

    if (!prefs) {
      prefs = await UserPreferencesModel.create({
        userId: new Types.ObjectId(userId),
      });
    }

    return toResponse(prefs);
  },

  async update(
    userId: string,
    data: Partial<{
      favoriteGenres: string[];
      favoriteAuthors: string[];
      preferredLanguages: string[];
      readingGoals: Partial<{
        booksPerYear: number;
        currentYear: number;
        booksReadThisYear: number;
      }>;
      notificationSettings: Partial<{
        newFollower: boolean;
        newComment: boolean;
        newLike: boolean;
        recommendations: boolean;
      }>;
    }>
  ): Promise<UserPreferencesResponse | null> {
    const updateData: Record<string, unknown> = {};

    if (data.favoriteGenres) updateData.favoriteGenres = data.favoriteGenres;
    if (data.favoriteAuthors) updateData.favoriteAuthors = data.favoriteAuthors;
    if (data.preferredLanguages) updateData.preferredLanguages = data.preferredLanguages;
    if (data.readingGoals) {
      updateData['readingGoals.booksPerYear'] = data.readingGoals.booksPerYear;
      updateData['readingGoals.currentYear'] = data.readingGoals.currentYear;
      updateData['readingGoals.booksReadThisYear'] = data.readingGoals.booksReadThisYear;
    }
    if (data.notificationSettings) {
      Object.entries(data.notificationSettings).forEach(([key, value]) => {
        updateData[`notificationSettings.${key}`] = value;
      });
    }

    const prefs = await UserPreferencesModel.findOneAndUpdate(
      { userId: new Types.ObjectId(userId) },
      { $set: updateData },
      { new: true, upsert: true }
    );

    return prefs ? toResponse(prefs) : null;
  },

  async incrementBooksRead(userId: string): Promise<void> {
    const currentYear = new Date().getFullYear();
    await UserPreferencesModel.findOneAndUpdate(
      { userId: new Types.ObjectId(userId), 'readingGoals.currentYear': currentYear },
      { $inc: { 'readingGoals.booksReadThisYear': 1 } }
    );

    // If year changed, reset counter
    await UserPreferencesModel.findOneAndUpdate(
      { userId: new Types.ObjectId(userId), 'readingGoals.currentYear': { $ne: currentYear } },
      { 
        $set: { 
          'readingGoals.currentYear': currentYear, 
          'readingGoals.booksReadThisYear': 1 
        } 
      }
    );
  },

  async addFavoriteGenre(userId: string, genre: string): Promise<void> {
    await UserPreferencesModel.findOneAndUpdate(
      { userId: new Types.ObjectId(userId) },
      { $addToSet: { favoriteGenres: genre } },
      { upsert: true }
    );
  },

  async removeFavoriteGenre(userId: string, genre: string): Promise<void> {
    await UserPreferencesModel.findOneAndUpdate(
      { userId: new Types.ObjectId(userId) },
      { $pull: { favoriteGenres: genre } }
    );
  },

  async addFavoriteAuthor(userId: string, author: string): Promise<void> {
    await UserPreferencesModel.findOneAndUpdate(
      { userId: new Types.ObjectId(userId) },
      { $addToSet: { favoriteAuthors: author } },
      { upsert: true }
    );
  },

  async getUsersWithSimilarGenres(
    userId: string,
    genres: string[],
    limit: number = 10
  ): Promise<string[]> {
    const prefs = await UserPreferencesModel.find({
      userId: { $ne: new Types.ObjectId(userId) },
      favoriteGenres: { $in: genres },
    })
      .select('userId')
      .limit(limit);

    return prefs.map(p => p.userId.toString());
  },
};

export default UserPreferencesModelOps;
