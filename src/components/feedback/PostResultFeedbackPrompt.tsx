import { useEffect, useState } from "react";
import { FeedbackSheet } from "./FeedbackSheet";
import {
  isPromptDismissedForever,
  markPromptDismissedForever,
  markPromptShown,
  wasPromptShownRecently,
} from "@/hooks/useFeedback";

interface Props {
  resultId: string;
  /** When true, opens immediately bypassing the dwell timer + cooldown (used for ?fb=1 from email). */
  forceOpen?: boolean;
}

/**
 * After a user has dwelled on their result for ~45 seconds, gently open the
 * full feedback sheet (one-time per result). Complements InlineRatingPrompt
 * which captures a 1-tap star rating earlier on the page.
 */
export const PostResultFeedbackPrompt = ({ resultId, forceOpen }: Props) => {
  const [open, setOpen] = useState(false);
  const promptKey = `post-result-deep-${resultId}`;

  useEffect(() => {
    if (forceOpen) {
      setOpen(true);
      markPromptDismissedForever(promptKey);
      return;
    }
    if (isPromptDismissedForever(promptKey)) return;
    if (wasPromptShownRecently(promptKey)) return;

    const t = window.setTimeout(() => {
      setOpen(true);
      markPromptShown(promptKey);
      markPromptDismissedForever(promptKey);
    }, 45_000);
    return () => window.clearTimeout(t);
  }, [promptKey, forceOpen]);

  return (
    <FeedbackSheet
      open={open}
      onOpenChange={setOpen}
      defaultCategory="suggestion"
      resultId={resultId}
      contextNote="After reading report"
    />
  );
};
