// components/comments/CommentItem.tsx
"use client";

import { Accordion, AccordionItem, Avatar, Input } from "@heroui/react";
import { formatDistanceToNow } from "date-fns";
import Lottie from "lottie-react";
import { useRef, useState } from "react";
import send from "@/public/lottie/send.json";
import {
  ChevronDoubleRightIcon,
  FireIcon,
  HandThumbUpIcon,
} from "@heroicons/react/24/outline";
import { CommentDoc } from "@/lib/models/Comment";
import CommentActions from "./CommentActions";

type Props = {
  comment: CommentDoc;
  onReply: (parentId: string, text: string) => void;
  depth?: number;
  parentUser?: string;
  isHost?: boolean;
  isCommentOwner?: boolean;
  isCommentPinned?: boolean;
  userId?: string;
};

export default function CommentItem({
  comment,
  onReply,
  depth = 0,
  parentUser,
  isHost,
  isCommentOwner,
  isCommentPinned,
  userId,
}: Props) {
  const [replying, setReplying] = useState(false);
  const [replyText, setReplyText] = useState("");
  const lottieRef = useRef<any>(null);

  return (
    <div className={`${depth === 0 ? "pl-3 mt-6" : ""} my-1`}>
      <div className="flex items-start gap-2 bg-concrete">
        <Avatar
          src={comment.commenter.avatar}
          size="md"
          isBordered
          color="primary"
          className="mr-1"
        />

        <div className="flex-1">
          {/* Row 1: header */}
          <div className="flex justify-between items-start">
            <div className="flex flex-col">
              <p className="font-medium text-primary text-sm">
                @{comment.commenter.username}{" "}
                <span className="text-xs tracking-tight font-light ml-1 text-gray-400">
                  {formatDistanceToNow(new Date(comment.timestamp))} ago
                </span>
              </p>
              {/* Row 2: text */}
              <p className="text-xs text-primary mt-1">
                {depth !== 0 && parentUser && (
                  <span className="text-orchid font-extrabold mr-1">
                    @{parentUser}
                  </span>
                )}
                {comment.text}
              </p>
            </div>
            <CommentActions
              comment={comment}
              onEdit={() => console.log("edit", comment._id)}
              onDelete={() => console.log("delete", comment._id)}
              onReport={() => console.log("report", comment._id)}
              isHost={isHost!}
              isCommentOwner={isCommentOwner!}
              isCommentPinned={isCommentPinned!}
            />
          </div>

          {/* Row 3: reactions */}
          <div className="flex flex-row gap-2 mt-2">
            <div className="flex flex-row gap-1 items-center">
              <HandThumbUpIcon width={18} className="text-primary" />
              <span className="text-primary text-sm">{comment.likes}</span>
            </div>
            <div className="flex flex-row gap-1 items-center">
              <FireIcon width={18} className="text-primary" />
              <span className="text-primary text-sm">{comment.sparks}</span>
            </div>
            <button
              className="text-primary text-xs ml-1"
              onClick={() => setReplying(!replying)}
            >
              {replying ? `Cancel` : `Reply`}
            </button>
          </div>
        </div>
      </div>
      {replying && (
        <div className="flex flex-row gap-3 mt-3 justify-center items-center">
          <Input
            value={replyText}
            color="primary"
            variant="underlined"
            onChange={(e) => setReplyText(e.target.value)}
            className="w-full text-primary p-2 text-sm"
            placeholder={`@${comment.commenter.username}`}
          />
          <Lottie
            lottieRef={lottieRef}
            animationData={send}
            onComplete={() => {
              lottieRef.current?.goToAndStop(0, true);
            }}
            loop={false}
            autoplay={false}
            style={{ width: "3rem" }}
            onClick={() => {
              onReply(String(comment._id), replyText);
              setReplyText("");
              setReplying(false);
            }}
          ></Lottie>
        </div>
      )}
      {/* Recursive replies */}
      {comment.replies &&
        comment.replies.length > 0 &&
        (depth < 1 ? (
          <Accordion
            className="ml-3"
            itemClasses={{
              title: "text-primary",
            }}
          >
            <AccordionItem
              key={`replies-${comment._id}`}
              aria-label="Replies"
              title={`• ${comment.replies.length} ${
                comment.replies.length === 1 ? "Reply" : "Replies"
              }`}
              indicator={
                <ChevronDoubleRightIcon
                  width={18}
                  className="text-primary mt-1 transition-transform data-[open=true]:rotate-90"
                />
              }
              classNames={{
                title: "text-primary font-medium text-xs mt-0.5",
                indicator: "hidden",
              }}
              startContent={
                <Avatar
                  src={comment.replies[0].commenter.avatar}
                  size="sm"
                  isBordered
                  color="primary"
                />
              }
            >
              <div className="flex flex-col gap-2">
                {comment.replies.map((reply) => (
                  <CommentItem
                    key={String(reply._id)}
                    comment={reply}
                    onReply={onReply}
                    depth={depth + 1}
                    parentUser={comment.commenter.username}
                    isHost={isHost!}
                    isCommentOwner={String(reply.userId) === String(userId)}
                    isCommentPinned={isCommentPinned!}
                  />
                ))}
              </div>
            </AccordionItem>
          </Accordion>
        ) : (
          <div className="mt-3 space-y-2">
            {comment.replies.map((reply) => (
              <CommentItem
                key={String(reply._id)}
                comment={reply}
                onReply={onReply}
                depth={depth + 1}
                parentUser={comment.commenter.username}
                isHost={isHost!}
                isCommentOwner={String(reply.userId) === String(userId)}
                isCommentPinned={isCommentPinned!}
              />
            ))}
          </div>
        ))}
    </div>
  );
}
