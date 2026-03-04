

# Onboarding Logo Fix, Comprehensive Tests, and Documentation Update

## 1. Enlarge Apex AI Logo on Onboarding Welcome Screen

In `src/components/OnboardingWizard.tsx` line 241, change `h-12` to `h-24 w-24 object-contain` so the logo is prominently visible on the welcome step.

## 2. Comprehensive Test Suite

Create new test files covering the major untested areas of the application. All tests use vitest + @testing-library/react with mocked Supabase.

### New Test Files

**`src/components/__tests__/OnboardingWizard.test.tsx`**
- Renders step indicator with 4 steps
- Shows welcome screen with "Welcome to Apex AI" heading
- Navigates to step 2 on "Get Started" click
- Shows company name, industry, and use case fields on step 2
- Shows skill pack cards on step 3
- Auto-selects packs based on use case
- Shows upload area on step 4
- Shows "Skip this step" on step 4

**`src/components/__tests__/Dashboard.test.tsx`**
- Renders stat cards (Total Runs, Tokens Used, Knowledge Base, Scheduled Tasks)
- Renders Recent Activity section
- Shows Quick Start banner when localStorage flag is set
- Dismisses Quick Start banner on click

**`src/components/__tests__/JobDetail.test.tsx`**
- Renders loading state
- Shows job details when loaded
- Shows feedback section for completed jobs (ThumbsUp/ThumbsDown buttons)
- Disables feedback buttons after rating is set
- Shows textarea on thumbs-down click

**`src/components/__tests__/Settings.test.tsx`**
- Renders Settings page with tabs
- Shows Usage & Billing tab content
- Renders appearance theme options

**`src/components/__tests__/AppLayout.test.tsx`**
- Renders sidebar navigation
- Shows onboarding wizard when onboardingComplete is false

**`src/components/__tests__/Department.test.tsx`**
- Renders department heading
- Shows skill cards
- Renders quality badges when stats available

After creating all tests, execute them and log results. Any failures become remediation items in the plan.

## 3. Update Help Center Content

Add/update help sections in `src/pages/Help.tsx`:

- **New section: "Onboarding & Setup"** — describes the 4-step wizard (welcome, team info, skill packs, document upload)
- **New section: "Usage & Billing"** — describes the stat cards, usage trend chart, activity table, and token budget warnings in Settings
- **New section: "Output Quality Feedback"** — describes thumbs up/down on job results, quality badges on skill cards
- **Update "Settings" section** — add mention of Usage & Billing tab, user invitations
- **Update "Dashboard / Overview" section** — mention the Quick Start banner after onboarding

## 4. Update Telegram Bot

Update `supabase/functions/telegram-bot/index.ts`:

- Update `/help` command text to mention new features: onboarding wizard (web-only), usage tracking, output feedback
- Update `/start` welcome message to mention feedback and usage tracking
- Add a `/usage` command that queries `usage_events` for the current month and returns a summary (jobs run, tokens used, estimated cost) — simple text response

## Files Affected

| File | Action |
|---|---|
| `src/components/OnboardingWizard.tsx` | Edit: enlarge logo |
| `src/components/__tests__/OnboardingWizard.test.tsx` | Create |
| `src/components/__tests__/Dashboard.test.tsx` | Create |
| `src/components/__tests__/JobDetail.test.tsx` | Create |
| `src/components/__tests__/Settings.test.tsx` | Create |
| `src/components/__tests__/AppLayout.test.tsx` | Create |
| `src/components/__tests__/Department.test.tsx` | Create |
| `src/pages/Help.tsx` | Edit: add 3 new sections, update 2 existing |
| `supabase/functions/telegram-bot/index.ts` | Edit: update help/start text, add /usage command |

