// Static support playbook for the Super Admin Support Desk.
// No DB — these are reference cards that suggest an action and a copyable reply.

export type PlaybookAction =
  | "regenerate_diet"
  | "mark_failed"
  | "force_complete"
  | "ask_reupload"
  | "none";

export type PlaybookEntry = {
  id: string;
  title: string;
  cause: string;
  fix: string;
  action: PlaybookAction;
  /**
   * Reply template. Supports placeholders:
   *   {{name}}        — user's full name (or "there" fallback)
   *   {{result_link}} — direct URL to the user's report (admin will paste)
   */
  reply: string;
};

export const PLAYBOOK: PlaybookEntry[] = [
  {
    id: "stuck-processing",
    title: "Stuck on processing > 5 min",
    cause:
      "The first-paint window expired before biomarkers landed. Usually a slow Gemini response or a flaky network on the user's side.",
    fix:
      "Mark this attempt as failed so the orbit screen stops, then ask the user to re-upload (we no longer hold the original image once first-paint runs).",
    action: "mark_failed",
    reply:
      "Hi {{name}}, sorry for the wait — looks like the first attempt didn't go through cleanly on our side. Please open VeriDIA and upload the lab photo one more time; results should appear within 30 seconds. Reply here if it stalls again and I'll jump in.",
  },
  {
    id: "diet-missing",
    title: "Biomarkers OK, diet plan never appeared",
    cause:
      "Biomarkers extracted fine but the diet-plan stage failed or timed out. Safe to re-run — it reads existing biomarkers, no new upload needed.",
    fix: "Tap 'Regenerate diet'. Usually completes in 20–40 seconds.",
    action: "regenerate_diet",
    reply:
      "Hi {{name}}, I've just regenerated your personalised diet plan from our side — give it about 30 seconds, then refresh your report: {{result_link}}. Let me know if anything still looks off.",
  },
  {
    id: "empty-biomarkers",
    title: "Report completed but biomarkers are empty",
    cause:
      "Photo was likely blurry, cropped, or not a lab report. Gemini returned a valid response with no extractable values.",
    fix:
      "No server fix possible — ask the user to re-take the photo in good light, full page in frame.",
    action: "ask_reupload",
    reply:
      "Hi {{name}}, your scan came through but we couldn't read the numbers clearly — usually a lighting or angle issue. Please retake the photo with the full page in frame and good lighting, then upload again. Happy to look at it once you do.",
  },
  {
    id: "failed-status",
    title: "Status = failed",
    cause:
      "Gemini returned an unrecoverable error or our budget timeout tripped. Re-uploading from the user side is the cleanest path.",
    fix: "Confirm the row is marked failed, then send the re-upload reply.",
    action: "ask_reupload",
    reply:
      "Hi {{name}}, that scan didn't process successfully on our side — could you upload the lab photo one more time? It should work on the second try. I'm watching for it.",
  },
  {
    id: "critical-unread",
    title: "Critical alert — needs follow-up",
    cause:
      "Result has critical values flagged. User may not have opened the report or understood the urgency.",
    fix:
      "Don't change the data. Send the urgent reply with a direct link to the report.",
    action: "none",
    reply:
      "Hi {{name}}, your latest VeriDIA report flagged a value that needs prompt medical attention. Please open the report here: {{result_link}} and contact your doctor today. We're not a substitute for clinical advice — please don't wait.",
  },
  {
    id: "manual-recovery",
    title: "Already resolved — clear stuck UI",
    cause:
      "Backend recovered or the user worked around it, but the row is still flagged 'processing' in your dashboard.",
    fix:
      "Force-complete to clear it from the queue. Only use after you've confirmed the user's report actually loaded.",
    action: "force_complete",
    reply:
      "Hi {{name}}, just confirming everything is now showing correctly on your end? Reply 'yes' and I'll close this ticket.",
  },
];

export const fillReply = (
  template: string,
  vars: { name?: string | null; resultLink?: string | null },
) =>
  template
    .replace(/\{\{name\}\}/g, vars.name?.trim() || "there")
    .replace(/\{\{result_link\}\}/g, vars.resultLink || "(link unavailable)");
