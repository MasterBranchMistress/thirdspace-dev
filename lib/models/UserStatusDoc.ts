import { ObjectId } from "mongodb";

export interface UserStatusDoc {
  _id: ObjectId;
  userId: ObjectId;
  content: string;
  createdAt: Date;
  attachments?: string[];
}
