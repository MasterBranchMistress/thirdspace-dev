import { Schema, model, models, Types } from "mongoose";
import { ObjectId } from "mongodb";
import { EVENT_STATUSES, REF } from "../constants";

export interface EventDoc {
  _id?: ObjectId;
  title: string;
  description: string;
  date: Date;
  startTime?: string;
  location?: {
    name?: string;
    lat?: number;
    lng?: number;
  };
  host: ObjectId;
  attendees: ObjectId[];
  tags?: string[];
  messages?: {
    user: ObjectId;
    text: string;
    timestamp: Date;
  }[];
  status?: string;
  createdAt?: Date;
  updatedAt?: Date;
  banned?: ObjectId[];
  public?: boolean;
  recurring?: boolean;
  recurrenceRule?: "daily" | "weekly" | "monthly";
  recurrenceEndDate?: Date;
  recurringParentEventId?: ObjectId;
  budgetInfo?: {
    estimatedCost: number;
    currency?: string;
    notes?: string;
  };
}

const MessageSchema = new Schema(
  {
    user: { type: Types.ObjectId, ref: REF._USER, required: true },
    text: { type: String, required: true },
    timestamp: { type: Date, default: Date.now() },
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
    public: { type: Boolean, ref: REF._EVENT },
    recurring: { type: Boolean, ref: REF._EVENT },
    reccurenceRule: { type: String },
    recurrenceEndDate: { type: Date },
    recurringParentEventId: { type: ObjectId, ref: REF._EVENT, required: true },
    budgetInfo: {
      estimatedCost: { type: Number, default: 0 },
      currency: { type: String, default: "USD" },
      notes: { type: String },
    },
  },
  { timestamps: true }
);

export default models.Event || model("Event", EventSchema);
