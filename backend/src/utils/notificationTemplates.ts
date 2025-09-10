export const NotificationTemplates = {
  borrow_request: {
    created: (data: { resource_name?: string; requester_name?: string; start_date?: Date; end_date?: Date }) => ({
      title: "New Borrow Request",
      message: `${data.requester_name || "Someone"} requested to borrow ${data.resource_name || "your item"}${data.start_date && data.end_date ? ` from ${new Date(data.start_date).toLocaleDateString()} to ${new Date(data.end_date).toLocaleDateString()}` : ""}.`,
    }),
    approved: (data: { resource_name?: string; owner_name?: string }) => ({
      title: "Request Approved",
      message: `${data.owner_name || "The owner"} approved your request for ${data.resource_name || "the item"}.`,
    }),
    rejected: (data: { resource_name?: string; owner_name?: string; response_message?: string }) => ({
      title: "Request Rejected",
      message: `${data.owner_name || "The owner"} rejected your request for ${data.resource_name || "the item"}${data.response_message ? `: "${data.response_message}"` : "."}`,
    }),
    cancelled: (data: { resource_name?: string; requester_name?: string }) => ({
      title: "Request Cancelled",
      message: `${data.requester_name || "The requester"} cancelled the request for ${data.resource_name || "the item"}.`,
    }),
    overdue: (data: { resource_name?: string; due_date?: Date; days_overdue?: number }) => ({
      title: "Item Overdue",
      message: `Your borrowed item ${data.resource_name || ""} is overdue${data.days_overdue ? ` by ${data.days_overdue} day(s)` : ""}. Please return it as soon as possible.`,
    }),
  },
  review: {
    received: (data: { rating?: number }) => ({
      title: "New Review",
      message: data.rating ? `You received a ${data.rating}-star review.` : "You received a new review.",
    }),
    response: () => ({
      title: "Review Response",
      message: "Someone responded to your review.",
    }),
  },
  chat: {
    message: (data: { preview?: string }) => ({
      title: "New Message",
      message: data.preview ? `${data.preview.substring(0, 100)}${data.preview.length > 100 ? "..." : ""}` : "You have a new message.",
    }),
  },
  system: {
    announcement: (data: { title?: string; message?: string }) => ({
      title: data.title || "System Announcement",
      message: data.message || "",
    }),
  },
} as const;

export type TemplateCategory = keyof typeof NotificationTemplates;

