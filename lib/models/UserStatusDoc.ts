import { ObjectId } from "mongodb";

export interface UserStatusDoc {
  _id: ObjectId;
  userId: string;
  content: string;
  createdAt: Date;
  attachments?: string[];
}
