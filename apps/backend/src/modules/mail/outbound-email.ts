export type OutboundAttachment = {
  filename: string;
  content: string;
};

export type OutboundEmail = {
  to: string;
  replyTo: string;
  subject: string;
  text: string;
  attachment: OutboundAttachment;
};
