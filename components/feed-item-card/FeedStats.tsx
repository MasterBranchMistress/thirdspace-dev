type SparkMetaProps = {
  hasSparked?: boolean;
  friendPreviewText?: string;
};

export default function SparkMeta({
  hasSparked,
  friendPreviewText,
}: SparkMetaProps) {
  if (!hasSparked && !friendPreviewText) return null;

  return (
    <div className="mt-3 min-h-[16px] text-xs text-gray-400">
      <span className="flex items-center gap-2">
        {hasSparked ? "You sparked this" : friendPreviewText}
      </span>
    </div>
  );
}
