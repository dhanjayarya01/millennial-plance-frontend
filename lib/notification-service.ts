export const notificationService = {
  async sendSseNotification(title: string, description: string, urgency: "green" | "yellow" | "red") {
    try {
      const res = await fetch("/api/notifications/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, urgency }),
      });
      return await res.json();
    } catch (e) {
      console.error("SSE notification error:", e);
      return { success: false };
    }
  },

  async sendEmail(to: string, subject: string, html: string) {
    try {
      const res = await fetch("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, subject, html }),
      });
      return await res.json();
    } catch (e) {
      console.error("Email sending error:", e);
      return { success: false };
    }
  }
};
