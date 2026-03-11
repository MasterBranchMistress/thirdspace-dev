// award Karma helper — SERVER-SIDE ONLY

import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { DBS, COLLECTIONS } from "@/lib/constants";
import { getUserRanking } from "./getRanking";

type KarmaAction = "comment" | "status";

type AwardKarmaResult = {
  awarded: number;
  reason: "OK" | "USER_NOT_FOUND" | "GLOBAL_CAP_REACHED" | "ACTION_CAP_REACHED";
  dailyEarned: number;
  globalRemaining: number;
  actionCount: number;
};

const DAILY_KARMA_MAX = 10;

const KARMA_RULES: Record<KarmaAction, { reward: number; dailyMax: number }> = {
  comment: { reward: 1, dailyMax: 3 },
  status: { reward: 2, dailyMax: 2 },
};

export async function awardKarma(
  userId: string,
  action: KarmaAction,
): Promise<AwardKarmaResult> {
  const client = await clientPromise;
  const db = client.db(DBS._THIRDSPACE);
  const users = db.collection(COLLECTIONS._USERS);

  if (!ObjectId.isValid(userId)) {
    return {
      awarded: 0,
      reason: "USER_NOT_FOUND",
      dailyEarned: 0,
      globalRemaining: DAILY_KARMA_MAX,
      actionCount: 0,
    };
  }

  const today = new Date().toISOString().slice(0, 10);
  const user = await users.findOne({ _id: new ObjectId(userId) });

  if (!user) {
    return {
      awarded: 0,
      reason: "USER_NOT_FOUND",
      dailyEarned: 0,
      globalRemaining: DAILY_KARMA_MAX,
      actionCount: 0,
    };
  }

  const sameDay = user.dailyKarma?.date === today;

  const dailyEarned = sameDay ? (user.dailyKarma?.earned ?? 0) : 0;
  const commentCount = sameDay ? (user.dailyKarma?.comments ?? 0) : 0;
  const statusCount = sameDay ? (user.dailyKarma?.statuses ?? 0) : 0;

  const globalRemaining = Math.max(0, DAILY_KARMA_MAX - dailyEarned);
  if (globalRemaining <= 0) {
    return {
      awarded: 0,
      reason: "GLOBAL_CAP_REACHED",
      dailyEarned,
      globalRemaining: 0,
      actionCount: action === "comment" ? commentCount : statusCount,
    };
  }

  const rule = KARMA_RULES[action];
  const actionCount = action === "comment" ? commentCount : statusCount;

  if (actionCount >= rule.dailyMax) {
    return {
      awarded: 0,
      reason: "ACTION_CAP_REACHED",
      dailyEarned,
      globalRemaining,
      actionCount,
    };
  }

  const awarded = Math.min(rule.reward, globalRemaining);

  const inc: Record<string, number> = {
    karmaScore: awarded,
    "dailyKarma.earned": awarded,
  };

  if (action === "comment") {
    inc["dailyKarma.comments"] = 1;
  } else if (action === "status") {
    inc["dailyKarma.statuses"] = 1;
  }

  await users.updateOne(
    { _id: user._id },
    {
      $set: {
        "dailyKarma.date": today,
      },
      $inc: inc,
    },
  );

  return {
    awarded,
    reason: "OK",
    dailyEarned: dailyEarned + awarded,
    globalRemaining: globalRemaining - awarded,
    actionCount: actionCount + 1,
  };
}
