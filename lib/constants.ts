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
  _USER_STATUS_VIEWS: "user_status_views",
  _USER_EVENT_VIEWS: "user_event_views",
  _USER_EVENT_SPARKS: "user_event_sparks",
  _USER_STATUS_SPARKS: "user_status_sparks",
  _EVENT_COMMENTS: "event_comments",
  _STATUS_COMMENTS: "status_comments",
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
  _USER_FOLLOWED: "user_followed",
};

// Example: user providers
export const AUTH_PROVIDERS = {
  _LOCAL: "local",
  _GOOGLE: "google",
  _FACEBOOK: "facebook",
  _X: "x",
};

export const TEST_IDS = {
  _HOST_ID: new ObjectId("68a4c873c77c9f916056fd95"),
  _OTHER_IDS: [
    new ObjectId("68a4cefdf0d16c85e722a6e7"),
    new ObjectId("68a64061789bcc236a7c4b52"),
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

export const STATUS_CONSTANT = {
  _THROTTLE_MINUTES: 2,
};

export const MEDIA_VIEW_HEIGHT = {
  _STANDARD: "h-[60vh]",
  _COMMENT_SECTION: "h-[100vh]",
};

export const FOUNDER_WELCOME_POST = {
  _WELCOME_VIDEO_URL: "/videos/welcome.mp4",
  _FOUNDER_GREETING:
    "Hey, welcome to ThirdSpace. I’m Jimmie! glad you’re here. Check out the Solar System for events and the Space Station for people nearby. Also, don't forget to finish cusomizing your profile so we can connect you with the right people. Have fun!",
};

export const KARMA_CAPS = {
  LATE_CANCEL: -3,
  NO_SHOW: -5,
  HOSTED_EVENT_DAILY: 10,
  ATTENDED_EVENT_DAILY: 5,
  COMMENT_DAILY: 3,
  SPARK_RECEIVED_DAILY: 5,
  SPARK_GIVEN_DAILY: 10,
  STATUS_POST_DAILY: 3,
  MAX_DAILY_KARMA: 25,
};

export const USER_RANKING = {
  DRIFTER: "drifter",
  EXPLORER: "explorer",
  NAVIGATOR: "navigator",
  CONNECTOR: "connector",
  PIONEER: "pioneer",
  LUMINARY: "luminary",
} as const;

export type UserRanking = (typeof USER_RANKING)[keyof typeof USER_RANKING];

export const TUTORIALS = {
  _TUTORIAL_MEDIA_POST: "tutorial_media_post_seen",
};
