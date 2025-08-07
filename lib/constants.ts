import { ObjectId } from "mongodb";

// Mongo collection names
export const DBS = {
  _THIRDSPACE: "thirdspace",
};
export const COLLECTIONS = {
  _USERS: "users",
  _EVENTS: "events",
  _USER_FEED: "user_feed",
  _EVENT_FEED: "event_feed",
  _USER_STATUSES: "user_statuses",
};

// event statuses
export const EVENT_STATUSES = {
  _ACTIVE: "active",
  _CANCELED: "canceled",
  _COMPLETED: "completed",
  _REMOVED: "removed",
  _UPDATED: "updated",
  _RECEIVED_FRIEND_REQUEST: "received_friend_request",
  _ACCEPTED_FRIEND_REQUEST: "accepted_friend_request",
  _BLOCKED_USER_JOINED_EVENT: "blocked_user_joined_event",
  _USER_LEFT_EVENT: "user_left_event",
};

export const USER_RANKING = {
  _BRONZE: "bronze",
  _SILVER: "silver",
  _GOLD: "gold",
  _PLATINUM: "platinum",
  _ADMIN: "admin",
};

// Example: user providers
export const AUTH_PROVIDERS = {
  _LOCAL: "local",
  _GOOGLE: "google",
  _FACEBOOK: "facebook",
  _X: "x",
};

export const TEST_IDS = {
  _HOST_ID: new ObjectId("68858a6c2a9706bb46e708ab"),
  _OTHER_IDS: [
    new ObjectId("68858a7e2a9706bb46e708ac"),
    new ObjectId("68858a802a9706bb46e708ad"),
    new ObjectId("688648132a9706bb46e708b4"),
    new ObjectId("688654782a9706bb46e708bd"),
    new ObjectId("6886d8faa4b15a3b7a5095a6"),
  ],
};

//ref for models
export const REF = {
  _EVENT: "Event",
  _USER: "User",
  _FEED: "Feed",
};

export const FEED_BUTTON_DROPDOWN_OPTIONS = {
  items: [
    {
      key: "report",
      label: "Report",
    },
    {
      key: "hide",
      label: "Hide",
    },
    {
      key: "block",
      label: "Block User",
    },
    {
      key: "delete",
      label: "Delete file",
    },
  ],
};
