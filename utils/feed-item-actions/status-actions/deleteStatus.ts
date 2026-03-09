import { useToast } from "@/app/providers/ToastProvider";
import { deleteStatus } from "../status-item-actions/deleteStatus";
import { useFeed } from "@/app/context/UserFeedContext";

export const handleDeletePost = async (
  setOpenStatusId: (statusId?: string | null) => void,
  statusId?: string,
) => {
  const { notify } = useToast();
  const feed = useFeed();
  const closeStatus = () => {
    setOpenStatusId(null);
  };
  try {
    if (!statusId) return;
    await deleteStatus(statusId);
    notify("Your post has been deleted ❌", "");
    closeStatus();
    feed.removeItemByStatusId(statusId);
  } catch (e) {
    return e as Error;
  }
};
