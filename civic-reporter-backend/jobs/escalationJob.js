const cron = require("node-cron");
const Issue = require("../models/Issue");
const sendEmail = require("../config/mailer");

// Runs every 30 minutes.
// Any "isEmergency" issue still "pending" for more than ESCALATION_HOURS gets flagged isEscalated = true.
const ESCALATION_HOURS = 2;

const startEscalationJob = () => {
  cron.schedule("*/30 * * * *", async () => {
    try {
      const cutoff = new Date(Date.now() - ESCALATION_HOURS * 60 * 60 * 1000);

      const overdueIssues = await Issue.find({
        isEmergency: true,
        status: "pending",
        isEscalated: false,
        createdAt: { $lte: cutoff },
      });

      for (const issue of overdueIssues) {
        issue.isEscalated = true;
        issue.statusHistory.push({
          status: "pending",
          note: `Auto-escalated: unresolved for over ${ESCALATION_HOURS} hours`,
        });
        await issue.save();

        sendEmail(
          process.env.EMAIL_USER, // replace with senior officer's email in production
          `ESCALATED: ${issue.title}`,
          `Emergency issue "${issue.title}" has been pending for over ${ESCALATION_HOURS} hours and needs urgent attention.`
        );

        console.log(`Escalated issue: ${issue._id} - ${issue.title}`);
      }

      if (overdueIssues.length > 0) {
        console.log(`Escalation job: ${overdueIssues.length} issue(s) escalated`);
      }
    } catch (err) {
      console.error("Escalation job failed:", err.message);
    }
  });

  console.log("Escalation cron job scheduled (runs every 30 minutes)");
};

module.exports = startEscalationJob;
