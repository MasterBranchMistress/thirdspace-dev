import { ObjectId } from "mongodb";

export interface UserStatusDoc {
  _id: ObjectId;
  userId: ObjectId;
  sourceId: string;
  content: string;
  createdAt: Date;
  attachments?: string[];
}
