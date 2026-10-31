import { SampleScenario } from "../types/index.js";

export const SAMPLE_SCENARIOS: SampleScenario[] = [
  {
    id: "job-offer-verification",
    title: "Senior Engineer Job Offer Verification",
    badge: "Featured Scenario",
    description: "Evaluates an employment package across offer letter, recruiter email, and employee handbook. Uncovers equity cliff contradictions and missing clawback terms.",
    question: "Should I accept this Senior Staff Engineer offer at NovaScale Systems? What critical terms or risks need immediate verification before signing?",
    sources: [
      {
        title: "Official Offer Letter Summary (NovaScale)",
        kind: "text",
        publishedDate: "2025-02-14",
        dateStatus: "found",
        text: `NOVASCALE SYSTEMS INC. — FORMAL OFFER OF EMPLOYMENT
Date: February 14, 2025
Candidate: Alex Vance | Role: Senior Staff Infrastructure Engineer

Compensation Structure:
- Base Salary: $195,000 USD annualized, paid semi-monthly.
- Target Annual Incentive: Up to 15% of base salary, contingent upon corporate ARR milestones.
- Equity Grant: 40,000 Restricted Stock Units (RSUs) subject to Board of Directors approval.
- Start Date: April 1, 2025.
- Employment Type: Full-time, Exempt, At-Will employment.

Governing Terms:
This offer is contingent upon satisfactory completion of background verification and execution of NovaScale's Proprietary Information and Inventions Agreement (PIIA). Benefits are provided in accordance with active company policy schedules.`,
      },
      {
        title: "Recruiter Email & Benefits FAQ (NovaScale Recruiting)",
        kind: "text",
        publishedDate: "2023-11-20",
        dateStatus: "possibly_outdated",
        text: `From: talent-team@novascale-careers.net
Subject: NovaScale Benefits & Equity Q&A (2023 Remote Hiring FAQ)
Date: November 20, 2023

Hi Alex!
Excited to share more color on our equity and perks:
1. Equity Vesting: Unlike old tech firms, NovaScale offers monthly vesting starting from your first 30 days—no 1-year cliff waiting period!
2. Remote Stipend: Every remote employee receives a $2,000 annual home-office equipment budget, reimbursed automatically through payroll in Q1.
3. Healthcare: 100% of medical, dental, and vision premiums are covered for employees and all dependents.
4. Flexible Time Off: Unlimited PTO with a suggested minimum of 20 days off per calendar year.`,
      },
      {
        title: "Employee Handbook Excerpt (NovaScale Legal & People Ops)",
        kind: "text",
        publishedDate: "2024-09-01",
        dateStatus: "found",
        text: `NOVASCALE EMPLOYEE HANDBOOK (REVISED SEPTEMBER 2024)
SECTION 4.2 — EQUITY INCENTIVE PLAN & VESTING SCHEDULE:
All Restricted Stock Unit (RSU) and Option grants under the 2022 Equity Incentive Plan adhere strictly to a standard four-year (48 month) vesting schedule with a mandatory twelve (12) month cliff. No equity shall vest or be issuable prior to the completion of twelve continuous months of active full-time service.

SECTION 6.1 — POST-TERMINATION RESTRICTIVE COVENANTS:
Employee agrees that for a period of twelve (12) months following termination of employment for any reason, Employee shall not directly or indirectly engage in, perform services for, or consult with any enterprise operating in the cloud infrastructure orchestration space within North America.

SECTION 8.4 — REMOTE REIMBURSEMENT POLICY UPDATE:
Effective January 1, 2024, the discretionary annual home-office stipend has been discontinued. Reasonable hardware requests must be ordered exclusively through central IT inventory.`,
      },
    ],
  },
  {
    id: "stem-scholarship",
    title: "Postgraduate STEM Fellowship Verification",
    badge: "Scholarship",
    description: "Reviews grant criteria across portal announcements, applicant guidelines, and student forum notes. Catches missing renewal GPA thresholds and conflicting document rules.",
    question: "Is this graduate fellowship viable to cover my 2-year Master's degree in Applied Data Science, or are there hidden disqualifiers?",
    sources: [
      {
        title: "Department of Higher Education Portal Announcement",
        kind: "text",
        publishedDate: "2024-03-01",
        dateStatus: "found",
        text: `STATE FELLOWSHIP FOR ADVANCED COMPUTATIONAL STUDIES (CYCLE 2024-2026)
Award Details:
- Annual Tuition Grant: Up to $22,500 per academic year.
- Monthly Living Allowance: $1,800/month disbursed during fall and spring terms.
- Eligibility: Open to U.S. citizens and permanent residents accepted into an accredited graduate program in Computer Science, Data Science, or Electrical Engineering.
- Application Deadline: June 15, 2024.
- Mandatory Application Dossier:
  1. Official undergraduate transcripts.
  2. Exactly two (2) academic recommendation letters submitted electronically by department faculty.
  3. Statement of Research Intent (max 1,500 words).`,
      },
      {
        title: "Fellowship Printable Applicant Guide PDF",
        kind: "text",
        publishedDate: "2023-08-15",
        dateStatus: "possibly_outdated",
        text: `FELLOWSHIP PROGRAM GUIDE & CONDITIONS (PUBLISHED AUGUST 2023)
Application Requirements:
- Candidates must provide three (3) letters of recommendation in sealed institutional envelopes: two from academic faculty and one from an industry employer or research lab supervisor.
- Discontinuation of Funding:
If a fellow fails to maintain Satisfactory Academic Progress (SAP) as defined by their enrolled institution, tuition disbursement will be suspended.
- Summer Term Note:
Disbursements occur strictly over nine (9) academic months (September through May). No stipend or tuition support is provided during summer sessions.`,
      },
    ],
  },
  {
    id: "bootcamp-admission",
    title: "Coding Bootcamp Job Guarantee Review",
    badge: "Education Contract",
    description: "Audits a fast-track engineering program's marketing page against its legal terms of service. Identifies restrictive job search stipulations and omitted refund timelines.",
    question: "Can I rely on the 100% Tuition Refund Job Guarantee for this Full-Stack AI Engineer bootcamp?",
    sources: [
      {
        title: "NextGen Academy Marketing Brochure & Web Overview",
        kind: "text",
        publishedDate: "2025-01-10",
        dateStatus: "found",
        text: `NEXTGEN ACADEMY — 24-WEEK FULL-STACK AI IMMERSION
Tuition: $16,500 upfront or $0 upfront with our Income Share Agreement (ISA).
THE NEXTGEN PROMISE:
"Launch your tech career with 100% confidence. If you do not land a qualifying software engineering job within 90 days of graduation, your entire tuition is refunded. 94% of our 2024 graduates secured full-time offers averaging $92,000."`,
      },
      {
        title: "NextGen Enrollment Agreement & Guarantee Terms (Fine Print)",
        kind: "text",
        publishedDate: "2024-11-01",
        dateStatus: "found",
        text: `ENROLLMENT AGREEMENT RIDER — JOB GUARANTEE QUALIFICATION CRITERIA
1. Job Search Window: The qualifying job search period is one hundred and eighty (180) days following certified program graduation, not 90 days.
2. Mandatory Job Search Compliance:
To preserve refund eligibility, Graduate must:
  a. Submit a minimum of thirty (30) verified external job applications per week in designated metropolitan hubs (San Francisco, New York, Seattle).
  b. Attend at least five (5) in-person networking events per calendar month.
  c. Accept ANY software, QA testing, technical support, or IT offer with an annualized compensation of $45,000 or greater.
  d. Refusal of any offer above $45,000 immediately voids the refund guarantee.
3. Excluded Employment: Freelance, 1099 contract, and part-time software work count toward successful placement and terminate guarantee rights.`,
      },
    ],
  },
];
