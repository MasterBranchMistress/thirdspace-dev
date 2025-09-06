// components/comments/CommentItem.tsx
"use client";

import {
  Accordion,
  AccordionItem,
  Avatar,
  Badge,
  Button,
  Form,
  Input,
} from "@heroui/react";
import { formatDistanceToNow } from "date-fns";
import Lottie from "lottie-react";
import { useEffect, useMemo, useRef, useState } from "react";
import send from "@/public/lottie/send.json";
import {
  ChevronDoubleRightIcon,
  FireIcon,
  HandThumbUpIcon,
} from "@heroicons/react/24/outline";
import { StarIcon } from "@heroicons/react/24/solid";
import { CommentDoc } from "@/lib/models/Comment";
import CommentActions from "./CommentActions";
import { useToast } from "@/app/providers/ToastProvider";
import { useRouter } from "next/navigation";

type Props = {
  comment: CommentDoc;
  onReply: (parentId: string, text: string) => void;
  depth?: number;
  parentUser?: string;
  isHost?: boolean;
  eventHost?: string;
  hostId?: string;
  eventId?: string;
  isHostCommenting?: boolean;
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
  hostId,
  eventId,
  eventHost,
  isHostCommenting,
  isCommentOwner,
  isCommentPinned,
  userId,
}: Props) {
  const [replying, setReplying] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [isDeleted, setIsDeleted] = useState(comment.deleted ?? false);
  const [isEditing, setIsEditing] = useState(false);
  const [commentPinned, setCommentPinned] = useState(comment.pinned);
  const [textToInsertOnEdit, setTextToInsertOnEdit] = useState(comment.text);
  const lottieRef = useRef<any>(null);
  const { notify } = useToast();
  const router = useRouter();

  console.log("Event: ", eventId);

  const deleteComment = async (commentId: string) => {
    try {
      const res = await fetch(`/api/events/${eventId}/delete-comment`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commentId,
        }),
      });
      if (res.ok) {
        setIsDeleted(true);
        notify(
          "Comment Deleted 🚮",
          "Orbiters will no longer be able to see this comment."
        );
      } else {
        setIsDeleted(false);
      }
    } catch (err) {
      setIsDeleted(false);
      return err;
    }
  };

  const editComment = async (commentId: string) => {
    const oldText = comment.text;
    try {
      const res = await fetch(`/api/events/${eventId}/edit-comment`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commentId,
          text: textToInsertOnEdit,
        }),
      });
      if (res.ok) {
        comment.text = textToInsertOnEdit;
        comment.editedAt = new Date();
        setIsEditing(false);
        setTextToInsertOnEdit("");
      } else {
        comment.text = oldText;
      }
    } catch (err: any) {
      comment.text = oldText;
      notify("Unable to edit comment 😢", err);
      return err;
    }
  };

  const pinComment = async (commentId: string) => {
    try {
      const res = await fetch(`/api/events/${eventId}/handle-comment-pin`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commentId,
        }),
      });
      if (res.ok) {
        setCommentPinned(true);
        window.location.reload();
      }
    } catch (err) {
      setCommentPinned(false);
      notify("Couldn't pin comment 😬", err as any);
      return err;
    }
  };

  //so default value only renders on first try.
  // here we use a useEffect to reseed the hook with our current edit state
  //so react knows whats going on
  useEffect(() => {
    isCommentPinned ? setCommentPinned(false) : setCommentPinned(true);
    if (isEditing) {
      setTextToInsertOnEdit(comment.text);
    }
  }, [isEditing, comment.text, isCommentPinned]);

  const commentIsDirty = textToInsertOnEdit.trim() !== comment.text.trim();

  return (
    <div className={`${depth === 0 ? "pl-3 mt-6" : ""} my-1 `}>
      {/* badge here */}
      <div className={`flex items-start gap-2 bg-concrete`}>
        <Badge
          isInvisible={isHostCommenting ? false : true}
          content={<StarIcon width={9} />}
          classNames={{
            badge: "text-concrete bg-primary p-0.5 border-concrete mt-1",
          }}
          placement="top-left"
        >
          <Avatar
            src={comment.commenter.avatar}
            size="md"
            isBordered
            color="primary"
            className="mr-1"
            onClick={() =>
              router.push(`/dashboard/profile/${comment.commenter.userId}`)
            }
          />
        </Badge>
        <div className="flex-1">
          {/* Row 1: header */}
          <div className={`flex justify-between items-start`}>
            <div className="flex flex-col">
              <p className="font-medium text-primary text-sm">
                @{comment.commenter.username}{" "}
                <span className="text-xs tracking-tight font-light ml-1 text-gray-400">
                  {formatDistanceToNow(new Date(comment.timestamp))} ago
                </span>
              </p>
              {/* Row 2: text */}
              <div className="text-xs text-primary mt-1">
                {depth !== 0 && parentUser && (
                  <span className="text-orchid font-extrabold mr-1">
                    @{parentUser}
                  </span>
                )}
                {isDeleted ? (
                  <span className="italic text-gray-400">
                    This comment was deleted
                  </span>
                ) : !isEditing ? (
                  <p>
                    {comment.text}{" "}
                    {comment.editedAt && (
                      <span className="italic text-gray-400">(edited)</span>
                    )}
                  </p>
                ) : (
                  <>
                    <Form
                      className="mt-1"
                      onSubmit={(e) => {
                        e.preventDefault();
                        editComment(String(comment._id));
                      }}
                    >
                      <div className="flex flex-1 flex-row gap-3 items-center justify-center">
                        <Input
                          variant="underlined"
                          color="primary"
                          defaultValue={textToInsertOnEdit}
                          value={textToInsertOnEdit}
                          onValueChange={setTextToInsertOnEdit}
                          classNames={{
                            input: "text-sm ",
                            innerWrapper: "p-0",
                          }}
                        ></Input>

                        <button
                          disabled={!commentIsDirty}
                          onClick={(e) => {
                            e.preventDefault();
                            editComment(String(comment._id));
                          }}
                          className={`transition-opacity ${!commentIsDirty ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                          <Lottie
                            lottieRef={lottieRef}
                            animationData={send}
                            onComplete={() => {
                              lottieRef.current?.goToAndStop(0, true);
                            }}
                            loop={false}
                            autoplay={false}
                            style={{ width: "2.4rem" }}
                          />
                        </button>
                      </div>
                    </Form>
                  </>
                )}
              </div>
            </div>
            {!isDeleted ? (
              <CommentActions
                comment={comment}
                editing={isEditing}
                onPressCancelEdit={() => setIsEditing(false)}
                onPressEdit={() => setIsEditing(true)}
                onDelete={() => deleteComment(String(comment._id))}
                onPin={() => {
                  !commentPinned
                    ? setCommentPinned(true)
                    : setCommentPinned(false);
                  pinComment(String(comment._id));
                }}
                isHost={isHost!}
                isCommentOwner={isCommentOwner!}
                isCommentPinned={commentPinned!}
              />
            ) : null}
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
              hidden={comment.deleted}
              className="text-primary text-xs ml-1"
              onClick={() => setReplying(!replying)}
            >
              {replying ? `Cancel` : `Reply`}
            </button>
            {commentPinned === true && (
              <div className="flex flex-row gap-2 items-center justify-center">
                <h1 className="text-xs text-gray-400 tracking-tight italic">
                  Pinned by {eventHost} 📌
                </h1>
              </div>
            )}
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
                <Badge
                  isInvisible={isHostCommenting ? false : true}
                  content={<StarIcon width={9} />}
                  classNames={{
                    badge:
                      "text-concrete bg-primary p-0.5 border-concrete mr-1 mt-1",
                  }}
                  placement="top-left"
                >
                  <Avatar
                    src={comment.replies[0].commenter.avatar}
                    size="sm"
                    isBordered
                    color="primary"
                  />
                </Badge>
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
                    isHostCommenting={String(reply.userId) === String(hostId)}
                    isHost={isHost!}
                    eventId={eventId}
                    eventHost={eventHost}
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
                eventId={eventId}
                eventHost={eventHost}
                isCommentOwner={String(reply.userId) === String(userId)}
                isCommentPinned={isCommentPinned!}
              />
            ))}
          </div>
        ))}
    </div>
  );
}
