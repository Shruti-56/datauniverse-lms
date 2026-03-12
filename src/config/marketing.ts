/**
 * Marketing site content – edit these to match your institute.
 * For phone/WhatsApp/email, you can use env vars in production (e.g. VITE_CONTACT_PHONE).
 */

export const INSTITUTE_NAME = import.meta.env.VITE_INSTITUTE_NAME || "DataUniverse";

export const CONTACT = {
  phone: "+91 8830944055",
  whatsapp: "918830944055", 
  email: "datauniverseonline@gmail.com",
  address:
    "203, Roongta Business Centre, Govind Nagar, Nashik, Maharashtra",
  mapEmbedUrl:
    "https://www.google.com/maps?q=Roongta+Business+Centre+Nashik&output=embed",
};
export const HERO = {
  headline: "DataUniverse\nBecome AI & Data Ready for Tomorrow’s Jobs",
  subheadline:
  "From Beginner to Job-Ready in 3–6 Months | Learn Skills That Companies Actually Hire For\nInternships • Certifications • Career Support",  ctaBookDemo: true,
  ctaApplyNow: true,
  ctaDownloadBrochure: true,
};

export const STATS = [
  { value: "95%", label: "Placement rate" },
  { value: "1000+", label: "Students trained" },
  { value: "5+", label: "Years of experience" },
  { value: "200+", label: "Hiring partners" },
];

export const COURSES = [
  {
    title: "Data Science & Analytics",
    duration: "6 months",
    fees: "₹ 45,000",
    tools: ["Python", "SQL", "Tableau", "ML"],
    outcomes: "Data Analyst, Business Analyst",
    demoClass: true,
  },
  {
    title: "Data Engineering",
    duration: "4 months",
    fees: "₹ 55,000",
    tools: ["Spark", "AWS", "ETL", "SQL"],
    outcomes: "Data Engineer, DE roles",
    demoClass: true,
  },
  {
    title: "Business Analytics",
    duration: "3 months",
    fees: "₹ 35,000",
    tools: ["Excel", "Power BI", "SQL"],
    outcomes: "Analytics Consultant",
    demoClass: true,
  },
];

export const INSTITUTE_STORY = {
  mission: "Our Mission is simple yet impactful:To equip learners with the most in-demand data skills through practical, hands-on training aligned with real-world industry needs.",
  vision: "To become a trusted global leader in data and AI education by empowering learners with future-ready skills, innovative thinking, and real-world expertise.",
  yearsExperience: 5,
  achievements: ["ISO certified", "Industry partnerships", "Placement guarantee program"],
  certifications: ["Recognized by XYZ", "Partner with ABC"],
  affiliations: ["Industry body A", "University tie-up B"],
};

export const FACULTY = [
  { name: "Amit Dandagavhal", role: "Senior Data Engineer", bio: "Ex-IBM" },
  { name: "Shraddha Kulkarni", role: "Data Scientist", bio: "Accenture  8+ years of experience" },
  { name: "Amit Dandagavhal", role: "Data Expert", bio: "One ECM(Dubai) 12+ yrs" },
];

export const PLACEMENTS = {
  companies: [
    "Deloitte",
    "ZS Associates",
    "Wipro",
    "HCL Technologies",
    "Tech Mahindra",
    "Accenture",
    "Fractal Analytics",
    "PwC",
    "Infosys",
    "TCS",
    "Amazon"
  ],
  avgPackage: "₹ 8–12 LPA",
  internshipStat: "80% interns converted to FTE",
};

/**
 * Student placement / success story videos.
 * Use embedUrl for YouTube/Vimeo embed (e.g. https://www.youtube.com/embed/VIDEO_ID).
 * Use url as fallback link (e.g. https://www.youtube.com/watch?v=VIDEO_ID).
 */
export const PLACEMENT_VIDEOS: { id: string; title: string; embedUrl?: string; url?: string }[] = [
  { id: "1", title: "Placement story – Data Analyst at Tech Co", embedUrl: "", url: "" },
  { id: "2", title: "How I switched to analytics", embedUrl: "", url: "" },
  { id: "3", title: "From fresher to placed in 6 months", embedUrl: "", url: "" },
];

/**
 * Marketing / institute info videos (about the institute, campus, courses, etc.).
 */
export const MARKETING_VIDEOS: { id: string; title: string; description?: string; embedUrl?: string; url?: string }[] = [
  { id: "1", title: "Welcome to our institute", description: "A quick overview of our campus and programs.", embedUrl: "", url: "" },
  { id: "2", title: "Why choose us", description: "Hear from our faculty and students.", embedUrl: "", url: "" },
  { id: "3", title: "Course preview – Data Science", embedUrl: "", url: "" },
];

export const TESTIMONIALS = [
  { name: "Student Name", role: "Data Analyst at Tech Co", text: "The course structure and placement support helped me switch to analytics.", rating: 5 },
  { name: "Another Student", role: "Business Analyst", text: "Best investment for my career. Faculty and LMS are top-notch.", rating: 5 },
  { name: "Parent Name", role: "Parent", text: "My son got placed within 2 months of completion. Thank you!", rating: 5 },
];

export const GOOGLE_REVIEW_STATS = { rating: 4.8, count: 120 };
