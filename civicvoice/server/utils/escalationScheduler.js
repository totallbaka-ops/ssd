const cron = require("node-cron");
const Complaint = require("../models/Complaint");
const nodemailer = require("nodemailer");

// Auto-Escalation Scheduler (Production Mode: every day at midnight)
const scheduleEscalationJob = () => {
  cron.schedule("0 0 * * *", async () => {  // every day at 12 AM
    console.log("🚨 Running daily escalation check...");

    try {
      // Find complaints older than 7 days and still not resolved
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const complaints = await Complaint.find({
        status: { $in: ["forwarded", "in_progress"] },
        updatedAt: { $lte: sevenDaysAgo },
      }).populate("reporter", "mobile email");

      if (!complaints.length) {
        console.log("✅ No complaints eligible for escalation.");
        return;
      }

      for (const complaint of complaints) {
        complaint.status = "escalated";
        complaint.assignedDepartment = "General Administration";
        complaint.lastEscalatedAt = new Date();
        await complaint.save();

        console.log(
          `⚠️ Escalated: ${complaint.complaintId} — ${complaint.issueType} (${complaint.locationText})`
        );

        if (complaint.reporter?.email) {
          await sendEscalationEmail(
            complaint.reporter.email,
            complaint.complaintId,
            complaint.issueType,
            complaint.locationText
          );
        }
      }

      console.log(`🚀 Escalation check complete — ${complaints.length} updated.`);
    } catch (err) {
      console.error("❌ Error during escalation job:", err);
    }
  });
};

// 📧 Helper for email notification
const sendEscalationEmail = async (toEmail, complaintId, issueType, locationText) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"CivicVoice" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: `Your complaint ${complaintId} has been escalated ⚠️`,
      text: `Your ${issueType} complaint at ${locationText} is still unresolved and has been escalated to higher authorities for urgent attention.`,
    };

    await transporter.sendMail(mailOptions);
    console.log(`📩 Escalation email sent to ${toEmail}`);
  } catch (err) {
    console.error("❌ Failed to send escalation email:", err.message);
  }
};

module.exports = scheduleEscalationJob;
