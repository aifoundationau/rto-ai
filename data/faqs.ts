export interface FAQItem {
  id: string;
  category: 'Admissions' | 'Fees & Scholarships' | 'Courses & Study' | 'International' | 'Campus Life' | 'Applications';
  question: string;
  answer: string;
  keywords: string[];
  relatedLinks?: { title: string; action: string }[];
}

export const FAQS_DATA: FAQItem[] = [
  {
    id: 'faq-1',
    category: 'Admissions',
    question: 'What are the general admission requirements for undergraduate degrees?',
    answer: 'Undergraduate admission generally requires successful completion of high school (Australian Year 12 or international equivalent such as IB, A-Levels, or US High School Diploma) meeting the minimum ATAR or score requirement for your chosen degree. Certain degrees (like Computer Science and Engineering) also require Mathematics prerequisites.',
    keywords: ['admission', 'requirements', 'atar', 'undergraduate', 'entry criteria', 'high school', 'prerequisites'],
    relatedLinks: [
      { title: 'Explore Degree Programs', action: 'browse_courses' },
      { title: 'Start Application Form', action: 'start_application' }
    ]
  },
  {
    id: 'faq-2',
    category: 'Admissions',
    question: 'What are the application deadlines for Semester 1 and Semester 2?',
    answer: 'Semester 1 (February intake) applications close on January 15 for international students and January 31 for domestic students. Semester 2 (July intake) applications close on June 15 for international students and June 30 for domestic students. Late applications may be considered subject to seat availability.',
    keywords: ['deadline', 'dates', 'intake', 'semester 1', 'semester 2', 'february', 'july', 'cutoff'],
    relatedLinks: [
      { title: 'Book an Admissions Consultation', action: 'book_consultation' }
    ]
  },
  {
    id: 'faq-3',
    category: 'Fees & Scholarships',
    question: 'What scholarships are available for new and prospective students?',
    answer: 'We offer a wide range of merit-based and equity scholarships, including the Vice-Chancellor’s Academic Excellence Award (up to $10,000/year), the Women in STEM Scholarship ($7,500/year), and the International Student Future Leader Grant (25% tuition fee reduction). Most scholarship applications are automatically assessed upon course application submission.',
    keywords: ['scholarships', 'funding', 'grants', 'financial aid', 'excellence award', 'women in stem', 'discount'],
    relatedLinks: [
      { title: 'Check Scholarship Eligibility', action: 'ask_scholarships' }
    ]
  },
  {
    id: 'faq-4',
    category: 'Fees & Scholarships',
    question: 'How do tuition fees and Commonwealth Supported Places (CSP) work?',
    answer: 'Eligible domestic undergraduate students receive a Commonwealth Supported Place (CSP), where the government subsidizes part of the tuition and students pay the Student Contribution Amount (which can be deferred via HECS-HELP loan). International tuition fees vary from $34,000 to $48,000 AUD per year depending on the faculty.',
    keywords: ['tuition', 'fees', 'csp', 'hecs', 'help loan', 'cost', 'domestic fees', 'international fees'],
  },
  {
    id: 'faq-5',
    category: 'International',
    question: 'What English language proficiency tests are accepted?',
    answer: 'We accept IELTS Academic (minimum overall 6.5 with no band less than 6.0 for most programs; 7.0 for health and law degrees), TOEFL iBT (minimum overall 79 with writing 21), PTE Academic (minimum 58), and Cambridge C1 Advanced. Results must be valid within 2 years of course commencement.',
    keywords: ['english', 'ielts', 'toefl', 'pte', 'language requirement', 'international', 'cambridge'],
  },
  {
    id: 'faq-6',
    category: 'International',
    question: 'Can international students work while studying on a student visa?',
    answer: 'Yes! Australian student visa holders (Subclass 500) are permitted to work up to 48 hours per fortnight during teaching semesters and unlimited hours during official university breaks and holiday periods.',
    keywords: ['visa', 'work rights', 'subclass 500', 'working hours', 'international student job'],
  },
  {
    id: 'faq-7',
    category: 'Campus Life',
    question: 'What student accommodation options are available on campus?',
    answer: 'We offer on-campus residential colleges (catered and self-catered apartments), university-managed student village residences, and off-campus homestay / private rental support. Accommodation packages include high-speed Wi-Fi, utilities, 24/7 security, gym access, and social programs.',
    keywords: ['accommodation', 'housing', 'dorm', 'residence', 'campus living', 'living costs'],
  },
  {
    id: 'faq-8',
    category: 'Applications',
    question: 'How do I apply, and what documents are required?',
    answer: 'You can apply directly through this AI Assistant or our Admissions Portal! Required documents include: 1) Certified copies of academic transcripts/certificates, 2) Proof of identity/passport, 3) English proficiency certificate (if applicable), and 4) A 500-word Statement of Purpose explaining your study goals.',
    keywords: ['how to apply', 'documents', 'transcripts', 'passport', 'sop', 'statement of purpose', 'apply now'],
    relatedLinks: [
      { title: 'Start My Application Now', action: 'start_application' }
    ]
  },
  {
    id: 'faq-9',
    category: 'Courses & Study',
    question: 'Can I transfer credits (RPL) from previous university studies or diplomas?',
    answer: 'Yes, Recognition of Prior Learning (RPL) and credit transfers are available for courses completed at accredited higher education institutions or vocational colleges (TAFE). You can submit your official syllabus and transcript for credit assessment during or after the application stage.',
    keywords: ['credit transfer', 'rpl', 'prior learning', 'exemptions', 'advanced standing', 'tafe'],
  },
  {
    id: 'faq-10',
    category: 'Courses & Study',
    question: 'What is the difference between Full-time and Part-time study?',
    answer: 'Full-time study typically involves 4 units (24 credit points) per semester, requiring approximately 35-40 hours per week of study, lectures, and lab work. Part-time study is 1-2 units (6-12 credit points) per semester. International student visa holders are generally required to maintain a full-time study load.',
    keywords: ['study load', 'full-time', 'part-time', 'credit points', 'hours per week'],
  }
];
