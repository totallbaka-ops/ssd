const cron = require('node-cron');
const Complaint = require('../models/Complaint');
const { sendEscalationEmail } = require('../utils/mailer');
const { sendEscalationNotification } = require('../utils/sms');

/**
 * Escalate complaints that are unresolved for more than 7 days
 */
const escalateUnresolvedComplaints = async () => {
  try {
    console.log('Running escalation job...');

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Find complaints that are forwarded/in_progress for > 7 days and not yet escalated
    const complaintsToEscalate = await Complaint.find({
      status: { $in: ['forwarded', 'in_progress'] },
      forwardedAt: { $lt: sevenDaysAgo },
      'escalation.escalated': false
    }).populate('reporterId', 'mobile maskedMobile name');

    console.log(`Found ${complaintsToEscalate.length} complaints to escalate`);

    for (const complaint of complaintsToEscalate) {
      const daysPending = Math.floor(
        (Date.now() - new Date(complaint.forwardedAt)) / (1000 * 60 * 60 * 24)
      );

      // Mark as escalated
      complaint.escalation = {
        escalated: true,
        level: 1,
        escalatedAt: new Date(),
        reason: `Unresolved for ${daysPending} days`
      };

      complaint.history.push({
        actor: 'system',
        action: 'escalated',
        note: `Auto-escalated after ${daysPending} days without resolution`,
        timestamp: new Date()
      });

      await complaint.save();

      // Send escalation email to admin
      await sendEscalationEmail(complaint, `Unresolved for ${daysPending} days`);

      // Notify user
      await sendEscalationNotification(complaint.reporterId.mobile, complaint.complaintId);

      console.log(`Escalated complaint: ${complaint.complaintId}`);
    }

    console.log('Escalation job completed');
  } catch (error) {
    console.error('Escalation Job Error:', error);
  }
};

/**
 * Schedule the escalation job to run daily at 9 AM
 */
const scheduleEscalationJob = () => {
  // Run at 9:00 AM every day
  cron.schedule('0 9 * * *', escalateUnresolvedComplaints, {
    scheduled: true,
    timezone: 'Asia/Kolkata'
  });

  console.log('Escalation job scheduled: Daily at 9:00 AM IST');
};

module.exports = {
  escalateUnresolvedComplaints,
  scheduleEscalationJob
};