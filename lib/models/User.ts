import { models, model, Schema, Types } from "mongoose";
import { ObjectId } from "mongodb";
import { EVENT_STATUSES, REF, USER_RANKING } from "../constants";
import { Attachment } from "@/types/user-feed";

export type UserStatusDoc = {
  _id: ObjectId;
  userId: ObjectId;
  content: string;
  createdAt: Date;
  attachments: string[];
};

export interface Availability {
  day: string;
  times: { start: string; end: string }[]; // array of time ranges
}

interface Notification {
  _id: ObjectId;
  message: string;
  actorId?: ObjectId;
  eventId?: ObjectId;
  avatar?: string;
  read?: boolean;
  type:
    | "canceled"
    | "removed"
    | "updated"
    | "received_friend_request"
    | "accepted_friend_request"
    | "blocked_user_joined_event"
    | "user_left_event"
    | "user_joined_event";
  timestamp: Date;
}

export interface Avatar {
  key: string;
  fileName: string;
  fileType: string;
  size?: number;
  width?: number;
  height?: number;
  url?: string;
  publicUrl?: string;
}

type VisibilityLevel = "off" | "friends" | "followers" | "public";

export interface UserDoc {
  statusAttachments: (string | Attachment)[] | undefined;
  status: string | undefined;
  _id?: ObjectId;
  firstName: string;
  lastName: string;
  username: string;
  usernameLastChangedAt: Date;
  email: string;
  passwordHash: string;
  avatar?: string;
  avatarMetaData?: Avatar;
  interests?: string[];
  bio?: string;
  favoriteLocations?: string[];
  availibility?: Availability[];
  provider?: string;
  friends?: ObjectId[];
  blocked?: ObjectId[];
  pendingFriendRequestsIncoming?: ObjectId[];
  pendingFriendRequestsOutgoing?: ObjectId[];
  createdAt?: Date;
  updatedAt?: Date;
  bioLastUpdatedAt?: Date;
  avatarLastUpdatedAt?: Date;
  locationLastUpdatedAt?: Date;
  statusLastUpdatedAt?: Date;
  tagsLastupdatedAt?: Date;
  joinedEventDate?: Date;
  acceptedFriendDate?: Date;
  addedEventDate?: Date;
  notifications: Notification[];
  isAdmin?: boolean;
  karmaScore?: number;
  qualityBadge?: "bronze" | "silver" | "gold" | "platinum";
  eventsAttended?: number;
  eventsHosted?: number;
  lastMinuteCancels?: number;
  tags?: string[];
  location?: {
    name: string;
    lat?: number;
    lng?: number;
    geo?: { type: "Point"; coordinates: [number, number] };
  };
  shareLocation?: boolean;
  shareJoinedEvents?: boolean;
  shareHostedEvents?: boolean;
  visibility?: VisibilityLevel;
  lang?: string;
  followers?: ObjectId[];
  following?: ObjectId[];
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
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    username: { type: String, required: true },
    usernameLastChangedAt: { type: Date },
    bioLastUpdatedAt: { type: Date },
    avatarLastUpdatedAt: { type: Date },
    locationLastUpdatedAt: { type: Date },
    statusLastUpdatedAt: { type: Date },
    tagsLastupdatedAt: { type: Date },
    joinedEventDate: { type: Date },
    addedEventDate: { type: Date },
    acceptedFriendDate: { type: Date },
    email: { type: String, required: true },
    passwordHash: { type: String, required: true },
    avatar: { type: String, required: false },
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
    followers: { type: ObjectId, ref: REF._USER },
    following: { type: ObjectId, ref: REF._USER },
    status: { type: String, required: false },
  },
  { timestamps: true }
);

export default models.User || model(REF._USER, UserSchema);
