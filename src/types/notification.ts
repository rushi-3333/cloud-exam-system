export type NotificationType =
  | 'exam_published'
  | 'exam_starting_soon'
  | 'exam_closed'
  | 'result_available'
  | 'new_registration'
  | 'exam_submission'
  | 'system_event';

export interface AppNotification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  read_at: string | null;
  created_at: string;
}
