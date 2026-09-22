# Cloud Exam System — Remaining Work Checklist

## High priority (affects real usage)
- [ ] Mobile responsiveness — collapsible nav, mobile-friendly tables
- [ ] Confirmation dialogs for destructive actions (delete question, close exam)
- [ ] Toast notifications for save/error feedback
- [ ] Bundle size optimization (code-splitting via dynamic imports)

## Medium priority (rounds out original spec)
- [x] GitHub Actions CI (typecheck + build + lint on push)
- [x] Connect Vercel to GitHub for auto-deploy on push
- [x] README.md (setup, architecture, screenshots placeholder)
- [ ] Question editing (currently add/delete only, no edit)
- [ ] Reorder questions (drag-and-drop or up/down controls)

## Lower priority / V2
- [ ] More question types (true/false, multi-select, short-answer)
- [ ] Question bank (reusable questions across exams)
- [ ] Bulk import (CSV) for questions or students
- [ ] Export results to CSV/PDF
- [ ] Real email notifications (currently in-app only)
- [ ] Dark mode
- [ ] Automated tests (grading logic, RLS policies)
- [ ] Formal security review pass
