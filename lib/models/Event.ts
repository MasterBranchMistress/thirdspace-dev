import { Schema, model, models, Types } from "mongoose";
import { ObjectId } from "mongodb";
import { EVENT_STATUSES, REF } from "../constants";
import { FeedItemType } from "@/types/user-feed";
import { UserDoc } from "./User";

type Attachment = {
  url: string;
  type?: "image" | "video" | undefined;
  thumbNail?: string;
};

type EventDonation = {
  userId: ObjectId;
  amount: number;
  currency: string; // "USD" (default now, extensible later)
  timestamp: Date;
  refunded?: boolean; // in case you need to track clawbacks
};

export interface EventDoc {
  coverImage?: string;
  _id?: ObjectId;
  type?: FeedItemType;
  title: string;
  description: string;
  eventId?: ObjectId;
  date: Date;
  startTime?: string;
  location?: {
    address?: string;
    name?: string;
    lat?: number;
    lng?: number;
    geo?: {
      type: string;
      coordinates: number[];
    };
  };
  host: ObjectId;
  attendees: ObjectId[];
  tags?: string[];
  comments?: {
    userId: ObjectId;
    commenter: {
      avatar?: string;
      username: string;
      firstName: string;
      lastName: string;
    };
    text: string;
    timestamp: Date;
    replies: string[];
  }[];
  status?: string;
  createdAt?: Date;
  updatedAt?: Date;
  banned?: ObjectId[];
  attachments?: Attachment[];
  public?: boolean;
  recurring?: boolean;
  recurrenceRule?: "none" | "daily" | "weekly" | "monthly";
  recurrenceEndDate?: Date;
  recurringParentEventId?: ObjectId;
  budgetInfo?: {
    estimatedCost: number;
    currency?: string;
    notes?: string;
  };
  donations?: EventDonation[];
  timestamp: Date;
  orbiters?: ObjectId[];
}

const MessageSchema = new Schema(
  {
    user: { type: Types.ObjectId, ref: REF._USER, required: true },
    text: { type: String, required: true },
    timestamp: { type: Date, default: Date.now() },
  },
  { _id: false }
);

const AttachmentSchema = new Schema(
  {
    url: { type: String, required: true },
    type: { type: String, enum: ["image", "video"], default: "image" },
    thumbNail: { type: String },
  },
  { _id: false }
);

const EventSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    date: { type: Date, required: true },
    startTime: { type: String, required: true },
    location: {
      name: { type: String },
      lat: { type: Number },
      lng: { type: Number },
    },
    host: { type: Types.ObjectId, ref: REF._USER, required: true },
    attendees: [{ type: Types.ObjectId, ref: REF._USER }],
    status: {
      type: String,
      enum: [
        EVENT_STATUSES._ACTIVE,
        EVENT_STATUSES._CANCELED,
        EVENT_STATUSES._COMPLETED,
        EVENT_STATUSES._REMOVED,
        EVENT_STATUSES._UPDATED,
      ],
      default: EVENT_STATUSES._ACTIVE,
    },
    tags: [{ type: String }],
    messages: [MessageSchema],
    banned: [{ type: Types.ObjectId, ref: REF._USER }],
    public: { type: Boolean, default: true },
    attachments: [AttachmentSchema],
    recurring: { type: Boolean, default: false },
    recurrenceRule: {
      type: String,
      enum: ["none", "daily", "weekly", "monthly"],
      default: "none",
    },
    recurrenceEndDate: { type: Date },
    recurringParentEventId: { type: ObjectId, ref: REF._EVENT },

    budgetInfo: {
      estimatedCost: { type: Number, default: 0 },
      currency: { type: String, default: "USD" },
      notes: { type: String },
    },
    orbiters: [{ type: ObjectId, ref: REF._USER }],
  },
  { timestamps: true }
);

export default models.Event || model("Event", EventSchema);
