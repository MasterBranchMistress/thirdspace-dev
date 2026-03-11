import { ObjectId } from "mongodb";

export interface UserStatusDoc {
  _id: ObjectId;
  userId: ObjectId;
  sourceId: string;
  content: string;
  createdAt: Date;
  attachments?: string[];
  orbiters?: ObjectId[];
  reposts?: ObjectId[];
  promoted?: boolean;
}

export interface StatusViewStatDoc {
  sourceId: string; // id of the post
  viewerId: ObjectId;
  ownerId: ObjectId; // the userId of the status author (optional but useful) grab tags from author
  //and sugggest simlar events and hosts
}
