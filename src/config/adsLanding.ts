/**
 * Ads Campaign Landing Page – config for /lp/working-professionals
 * AI Course Workshop – edit this to customize content
 */

import { CONTACT } from './marketing';

export const ADS_LANDING = {
  /** Page slug used for analytics (must match route) */
  pageSlug: 'working-professionals',

  /** Badge text */
  badge: '🤖 AI WORKSHOP · LIMITED SEATS · ₹99 ONLY',

  /** Main headline */
  headline: 'Master AI Tools to Land Your Dream Tech Role , Without Quitting Your Job',

  /** Subheadline */
  subheadline: 'Join our live AI workshop to learn Industry-ready AI tools & automation & build in-demand skills in 3 hours - Even If you’re not from a tech background',

  /** Primary CTA button text */
  ctaText: 'Reserve Your Spot Now',

  /** Workshop details */
  workshop: {
    date: '22 February',
    time: '7:00 PM IST',
    language: 'Hinglish',
    recorded: 'Lifetime Recording',
  },

  /** Workshop slots shown under hero image */
  workshopSlots: [
    {
      dateLabel: '14th March Saturday',
      timeLabel: '10 AM to 7 PM IST',
      modeLabel: 'Online',
    },
    {
      dateLabel: '15th March Sunday',
      timeLabel: '10 AM to 7 PM IST',
      modeLabel: 'Online',
    },
  ],

  /** Trust badges */
  trustBadges: [
    '10k+ Attendees',
    '4.8/5 Rating',
    
  ],

  /** Pain points section */
  painPoints: [
    { title: 'No time?', desc: 'Learn smart — 3 hours that fit into your busy schedule.' },
    { title: 'Overwhelmed?', desc: 'No coding needed. Start from zero with AI tools.' },
    { title: 'Fear of tech?', desc: 'We make AI simple, practical, and career-ready.' },
    { title: 'Left behind?', desc: 'Catch up with peers using AI — this is your shortcut.' },
  ],

  /** Module titles */
  modules: [
    'ChatGPT & AI assistants — boost productivity 10x',
    'GitHub Copilot & code generation — write code faster',
    'AI for data analysis — automate reports & dashboards',
    'Prompt engineering — get the best out of every AI tool',
    'Build your first AI-powered project for your portfolio',
  ],
  bonusModule: 'Resume review & placement support',

  /** Transformation bullets */
  transformation: [
    'Your first AI project live on your portfolio.',
    'Recruiters noticing your AI skills on LinkedIn.',
    'Interview calls — because you learned the right tools.',
    "You didn't quit your job.",
    "You didn't spend months in bootcamps.",
    'You simply learned AI the smart way.',
  ],

  /** Mentor section */
  mentor: {
    name: 'Your Mentor',
    title: 'AI & Tech Career Expert',
    bio: 'Years of experience in AI, automation, and upskilling professionals. Helping thousands transition into tech roles without leaving their jobs.',
  },

  /** Offer section */
  offer: {
    price: '₹99',
    originalPrice: '₹2,499',
    disclaimer: 'One session. Zero upsell. Lifetime access to recording.',
  },

  /** Disclaimers */
  disclaimers: [
    'The workshop is non-refundable (no-upsell session).',
    '1-on-1 support not included post-workshop.',
    'Rescheduling available once.',
    'Support during working hours only.',
  ],

  formAction: 'submit',

  /** Urgency / scarcity */
  urgency: '🔥 Only 47 spots left — Register before they\'re gone!',

  /** What you get (included) */
  whatYouGet: [
    '3-hour live workshop',
    'Lifetime access to recording',
    'Hands-on exercises & templates',
    'Prompt cheat sheet (PDF)',
    'Community access for 30 days',
  ],

  /** Who is this for */
  whoIsThisFor: [
    { role: 'Working Professionals', desc: 'Use AI to get more done in less time without quitting your job' },
    { role: 'Students', desc: 'Build AI skills early and stand out for internships, projects and placements' },
    { role: 'Marketers', desc: 'Automate content, ads, and reporting with AI' },
    { role: 'Developers', desc: 'Ship faster with Copilot & AI code tools' },
    { role: 'Managers', desc: 'Summarize meetings, draft docs in seconds' },
    { role: 'Analysts', desc: 'Analyze data, build dashboards 10x faster' },
  ],

  /** Tools we cover */
  toolsCovered: ['ChatGPT', 'GitHub Copilot', 'Claude', 'Notion AI', 'Cursor'],

  /** Testimonials for social proof */
  testimonials: [
    {
      quote: 'Finally understood how to use ChatGPT for work. Landed a better role in 2 months.',
      name: 'Priya S.',
      role: 'Marketing Manager → Product Analyst',
    },
    {
      quote: 'No fluff, no upsell. Just solid AI skills I use every day now.',
      name: 'Rahul M.',
      role: 'Software Engineer',
    },
    {
      quote: 'Wish I had done this sooner. Best ₹999 I spent on upskilling.',
      name: 'Anjali K.',
      role: 'HR Professional',
    },
    {
      quote: 'From zero to building AI workflows. My productivity has 3x\'d.',
      name: 'Vikram R.',
      role: 'Operations Lead',
    },
    {
      quote: 'Clear, practical, no jargon. Exactly what I needed.',
      name: 'Neha P.',
      role: 'Content Writer',
    },
    {
      quote: 'The best ROI on any course I\'ve taken. Now I automate reports in minutes.',
      name: 'Arjun S.',
      role: 'Finance Analyst',
    },
  ],
};

export { CONTACT };
