import { models, model, Schema, Types } from "mongoose";
import { ObjectId } from "mongodb";
import { EVENT_STATUSES, REF, USER_RANKING } from "../constants";

export interface Availability {
  day: string;
  times: { start: string; end: string }[]; // array of time ranges
}

interface Notification {
  _id: ObjectId;
  message: string;
  eventId?: ObjectId;
  read?: boolean;
  type:
    | "canceled"
    | "removed"
    | "updated"
    | "received_friend_request"
    | "accepted_friend_request"
    | "blocked_user_joined_event"
    | "user_left_event";
  timestamp: Date;
}

export interface UserDoc {
  _id?: ObjectId;
  name: string;
  username: string;
  usernameLastChangedAt: Date;
  email: string;
  passwordHash: string;
  avatar?: string;
  interests?: string[];
  bio?: string;
  favoriteLocations?: string[];
  availibility?: Availability[];
  provider?: string;
  friends?: ObjectId[];
  blocked?: ObjectId[];
  pendingFriendRequests?: ObjectId[];
  createdAt?: Date;
  updatedAt?: Date;
  notifications: Notification[];
  isAdmin?: boolean;
  karmaScore?: number; // starts at 100
  qualityBadge?: "bronze" | "silver" | "gold" | "platinum";
  eventsAttended?: number;
  eventsHosted?: number;
  lastMinuteCancels?: number;
  tags?: string[];
  location?: string;
  lang?: string; //for later features
}

const fullWeek = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const SlotSchema = {
  start: { type: String, required: true },
  end: { type: String, required: true },
};

const AvailabilitySchema = {
  day: {
    type: String,
    enum: fullWeek,
    required: true,
  },
  slots: {
    type: [SlotSchema],
    required: true,
  },
};

const NotificationSchema = new Schema(
  {
    message: { type: String, required: true },
    eventId: { type: Types.ObjectId, ref: REF._EVENT },
    type: {
      type: String,
      enum: [
        EVENT_STATUSES._CANCELED,
        EVENT_STATUSES._REMOVED,
        EVENT_STATUSES._UPDATED,
        EVENT_STATUSES._RECEIVED_FRIEND_REQUEST,
        EVENT_STATUSES._ACCEPTED_FRIEND_REQUEST,
        EVENT_STATUSES._BLOCKED_USER_JOINED_EVENT,
        EVENT_STATUSES._USER_LEFT_EVENT,
      ],
      required: true,
    },
    read: { type: Boolean },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: true }
);

const UserSchema = new Schema(
  {
    name: { type: String, required: true },
    username: { type: String, required: true },
    usernameLastChangedAt: { type: Date },
    email: { type: String, required: true },
    passwordHash: { type: String, required: true },
    avatar: { type: String, required: false }, //TODO: figure out bug with IMAGE Type
    interests: [{ type: String }],
    bio: { type: String },
    favoriteLocations: [{ type: String }],
    availibility: [AvailabilitySchema],
    provider: { type: String },
    friends: [{ type: Types.ObjectId, ref: REF._USER }],
    blocked: [{ type: Types.ObjectId, ref: REF._USER }],
    pendingFriendRequests: [{ type: Types.ObjectId, ref: REF._USER }],
    phoneNumber: { type: String, required: false },
    notifications: [NotificationSchema],
    isAdmin: { type: ObjectId, ref: REF._USER },
    karmaScore: { type: Number, default: 100 },
    qualityBadge: {
      type: String,
      enum: [
        USER_RANKING._BRONZE,
        USER_RANKING._SILVER,
        USER_RANKING._GOLD,
        USER_RANKING._PLATINUM,
      ],
      default: USER_RANKING._BRONZE,
    },
    eventsAttended: { type: Number, default: 0 },
    eventsHosted: { type: Number, default: 0 },
    lastMinuteCancels: { type: Number, default: 0 },
    tags: [{ type: String, ref: REF._USER }],
    location: { type: String },
    lang: { type: String },
  },
  { timestamps: true }
);

export default models.User || model(REF._USER, UserSchema);
