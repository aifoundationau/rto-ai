export interface CourseProgram {
  id: string; // e.g. 'b-cs'
  code: string; // e.g. 'C2001'
  title: string;
  degreeLevel: 'Undergraduate' | 'Postgraduate' | 'Double Degree';
  faculty: string;
  durationYears: number;
  studyModes: ('Full-time' | 'Part-time' | 'Online' | 'On-campus')[];
  campus: string[];
  intakes: ('February (Semester 1)' | 'July (Semester 2)')[];
  atarRequirement?: number; // e.g. 80.00
  gpaRequirement?: number; // for postgrad e.g. 5.0/7.0
  annualTuitionDomestic: number; // AUD
  annualTuitionInternational: number; // AUD
  overview: string;
  highlights: string[];
  careerOutcomes: string[];
  majors: {
    name: string;
    description: string;
    coreUnits: string[]; // Unit codes
  }[];
  coreUnits: string[]; // Unit codes
  electiveUnits: string[];
}

export const COURSES_DATA: CourseProgram[] = [
  {
    id: 'b-cs',
    code: 'CS100',
    title: 'Bachelor of Computer Science',
    degreeLevel: 'Undergraduate',
    faculty: 'Faculty of Engineering & Computer Science',
    durationYears: 3,
    studyModes: ['Full-time', 'Part-time', 'On-campus'],
    campus: ['Main Campus (Sydney)', 'Innovation Precinct (Melbourne)'],
    intakes: ['February (Semester 1)', 'July (Semester 2)'],
    atarRequirement: 82.50,
    annualTuitionDomestic: 9850,
    annualTuitionInternational: 44500,
    overview: 'The Bachelor of Computer Science is an industry-accredited degree that provides deep theoretical foundations and practical mastery in software engineering, algorithms, artificial intelligence, cloud architectures, and cybersecurity.',
    highlights: [
      'Accredited by the Australian Computer Society (ACS) at the highest Professional level',
      'Industry Capstone project with top tech partners (Google, Atlassian, Canva, Microsoft)',
      'Option for 1-year paid Industry-Based Learning (IBL) placement',
      'Access to high-performance GPU computing clusters and state-of-the-art cybersecurity ranges'
    ],
    careerOutcomes: [
      'Full-Stack Software Engineer',
      'AI & Machine Learning Developer',
      'Systems Architect & DevOps Engineer',
      'Cybersecurity Analyst',
      'Data Scientist / Analytics Consultant'
    ],
    majors: [
      {
        name: 'Artificial Intelligence & Machine Learning',
        description: 'Focus on neural networks, computer vision, natural language processing, and autonomous robotic systems.',
        coreUnits: ['COMP1001', 'COMP2004', 'DATA3001', 'AI5001']
      },
      {
        name: 'Cybersecurity & Cloud Systems',
        description: 'Specialize in offensive/defensive network security, cryptographic protocols, cloud native architecture, and secure software development.',
        coreUnits: ['COMP1001', 'COMP2004', 'CYBR2002']
      },
      {
        name: 'Software Engineering & Distributed Systems',
        description: 'Master large-scale enterprise system design, microservices, continuous delivery, and distributed databases.',
        coreUnits: ['COMP1001', 'COMP2004', 'BUSS2010']
      }
    ],
    coreUnits: ['COMP1001', 'COMP2004', 'CYBR2002', 'DATA3001'],
    electiveUnits: ['AI5001', 'BUSS2010']
  },
  {
    id: 'm-ai',
    code: 'AI700',
    title: 'Master of Artificial Intelligence & Machine Learning',
    degreeLevel: 'Postgraduate',
    faculty: 'Faculty of Engineering & Computer Science',
    durationYears: 2,
    studyModes: ['Full-time', 'Part-time', 'On-campus', 'Online'],
    campus: ['Main Campus (Sydney)', 'Online Global Campus'],
    intakes: ['February (Semester 1)', 'July (Semester 2)'],
    gpaRequirement: 5.0, // on 7-point scale or 65% WAM in STEM
    annualTuitionDomestic: 11200,
    annualTuitionInternational: 48900,
    overview: 'Designed for ambitious professionals and STEM graduates seeking mastery over cutting-edge generative AI, foundation models, reinforcement learning, computer vision, and autonomous agent systems.',
    highlights: [
      'Taught by world-renowned AI researchers and leading industry practitioners',
      'Supervised Master thesis or Enterprise AI Incubator project',
      'Direct pipeline to leading AI research labs and tech venture accelerators'
    ],
    careerOutcomes: [
      'Lead AI Research Scientist',
      'Principal Machine Learning Engineer',
      'Generative AI Solutions Architect',
      'Chief Technology Officer (CTO)',
      'Robotics & Autonomous Systems Lead'
    ],
    majors: [
      {
        name: 'Frontier LLMs & Generative Systems',
        description: 'Focus on transformer scaling, RLHF/DPO alignment, multimodal generative vision, and autonomous agentic workflows.',
        coreUnits: ['AI5001', 'DATA3001', 'COMP2004']
      },
      {
        name: 'Autonomous Robotics & Perception',
        description: 'Focus on 3D computer vision, SLAM, robotic motion planning, and real-time embedded edge AI.',
        coreUnits: ['COMP2004', 'DATA3001']
      }
    ],
    coreUnits: ['AI5001', 'DATA3001', 'COMP2004'],
    electiveUnits: ['CYBR2002', 'BUSS2010']
  },
  {
    id: 'b-ba',
    code: 'BA200',
    title: 'Bachelor of Business & Data Analytics',
    degreeLevel: 'Undergraduate',
    faculty: 'Business School',
    durationYears: 3,
    studyModes: ['Full-time', 'Part-time', 'On-campus', 'Online'],
    campus: ['Main Campus (Sydney)', 'City Executive Center'],
    intakes: ['February (Semester 1)', 'July (Semester 2)'],
    atarRequirement: 78.00,
    annualTuitionDomestic: 8900,
    annualTuitionInternational: 39500,
    overview: 'Combines commercial business acumen, financial modeling, marketing analytics, and data science to prepare graduates for high-impact decision-making in modern global enterprises.',
    highlights: [
      'AACSB and EQUIS internationally accredited business curriculum',
      'Live consulting projects with Fortune 500 companies & financial institutions',
      'Bloomberg Terminal & Financial Trading Lab certification included'
    ],
    careerOutcomes: [
      'Business Analytics Specialist',
      'Management Consultant (Big 4 / Strategy firms)',
      'Financial & Investment Analyst',
      'Digital Product Growth Manager',
      'Supply Chain Optimization Analyst'
    ],
    majors: [
      {
        name: 'Strategic Business Analytics',
        description: 'Data-driven strategy, market analytics, decision science, and predictive customer intelligence.',
        coreUnits: ['BUSS2010', 'DATA3001']
      },
      {
        name: 'FinTech & Quantitative Finance',
        description: 'Algorithmic trading foundations, blockchain in commerce, and quantitative risk modeling.',
        coreUnits: ['BUSS2010', 'COMP1001']
      }
    ],
    coreUnits: ['BUSS2010', 'COMP1001'],
    electiveUnits: ['DATA3001', 'CYBR2002']
  },
  {
    id: 'm-cyber',
    code: 'CY900',
    title: 'Master of Cybersecurity & Threat Intelligence',
    degreeLevel: 'Postgraduate',
    faculty: 'Faculty of Engineering & Computer Science',
    durationYears: 2,
    studyModes: ['Full-time', 'Part-time', 'On-campus', 'Online'],
    campus: ['Main Campus (Sydney)', 'Online Global Campus'],
    intakes: ['February (Semester 1)', 'July (Semester 2)'],
    gpaRequirement: 5.0,
    annualTuitionDomestic: 10800,
    annualTuitionInternational: 47200,
    overview: 'A premium postgraduate qualification addressing critical national security and corporate cyber defense priorities. Includes hands-on cyber range defense, ethical hacking, digital forensics, and governance.',
    highlights: [
      'Hands-on training in our multi-million dollar War Room Cyber Range',
      'Prepares for industry certifications: CISSP, OSCP, CompTIA Security+, CISM',
      'Industry mentorship with National Cyber Security agencies and financial institutions'
    ],
    careerOutcomes: [
      'Chief Information Security Officer (CISO)',
      'Senior Penetration Tester / Red Team Lead',
      'Incident Response & Digital Forensics Specialist',
      'Cloud Security Architect',
      'Cyber Threat Intelligence Consultant'
    ],
    majors: [
      {
        name: 'Offensive Security & Red Teaming',
        description: 'Advanced exploit development, web app exploitation, and automated penetration testing.',
        coreUnits: ['CYBR2002', 'COMP2004']
      },
      {
        name: 'Cyber Governance & Risk Management',
        description: 'ISO 27001 compliance, GDPR/privacy laws, critical infrastructure defense, and executive cyber risk.',
        coreUnits: ['CYBR2002', 'BUSS2010']
      }
    ],
    coreUnits: ['CYBR2002', 'COMP1001', 'COMP2004'],
    electiveUnits: ['DATA3001', 'AI5001']
  }
];
