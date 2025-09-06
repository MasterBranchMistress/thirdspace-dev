import { ObjectId } from "mongodb";

// /models/Comment.ts
export interface CommentDoc {
  _id: ObjectId;
  eventId: ObjectId; // which event this belongs to
  userId: ObjectId;
  commenter: {
    userId: string;
    avatar?: string;
    username: string;
    firstName: string;
    lastName: string;
  };
  replies?: CommentDoc[];
  text: string;
  timestamp: Date;
  parentCommentId?: ObjectId; // null for root comments, else reference parent
  likes?: number;
  sparks?: number;
  deleted?: boolean;
  deletedAt?: Date;
  editedAt?: Date | null;
  pinned?: boolean;
  pinnedAt?: Date | null;
}
