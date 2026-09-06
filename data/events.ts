export interface ProspectiveEvent {
  id: string;
  title: string;
  category: 'Open Day' | 'Campus Tour' | 'Advising Session' | 'Webinar' | 'Workshop';
  description: string;
  startDate: string; // ISO 8601 string or YYYY-MM-DDTHH:mm:ss
  endDate: string;
  location: string;
  isVirtual: boolean;
  meetingLink?: string;
  speakerOrHost: string;
  capacity: number;
  registeredCount: number;
  tags: string[];
  availableSlots?: {
    slotId: string;
    startTime: string;
    endTime: string;
    advisorName: string;
    isBooked: boolean;
  }[];
}

export const EVENTS_DATA: ProspectiveEvent[] = [
  {
    id: 'event-open-day-2026',
    title: 'University Spring Open Day & Campus Discovery 2026',
    category: 'Open Day',
    description: 'Experience campus life firsthand! Meet academic deans, explore robotics and science labs, join guided campus architectural tours, and attend live faculty panels and career networking.',
    startDate: '2026-09-12T09:30:00+10:00',
    endDate: '2026-09-12T16:00:00+10:00',
    location: 'Main University Campus, The Great Hall & Quadrangle, Sydney NSW',
    isVirtual: false,
    speakerOrHost: 'Vice-Chancellor Prof. Mark Sterling & Faculty Deans',
    capacity: 1500,
    registeredCount: 842,
    tags: ['Open Day', 'Undergraduate', 'Postgraduate', 'Campus Tour', 'All Faculties']
  },
  {
    id: 'event-advising-consultation',
    title: '1-on-1 Personalized Admissions & Scholarship Consultation',
    category: 'Advising Session',
    description: 'Book a 30-minute private one-on-one session with our senior university admissions advisors. Discuss degree selection, entry requirements, credit transfers, and scholarship application strategies.',
    startDate: '2026-09-02T10:00:00+10:00',
    endDate: '2026-09-02T17:00:00+10:00',
    location: 'Student Admissions Center (Room 104) OR Online via Google Meet',
    isVirtual: true,
    meetingLink: 'https://meet.google.com/edu-adv-session',
    speakerOrHost: 'Senior Admissions Advisors (Sarah Jenkins, Liam Patel)',
    capacity: 20,
    registeredCount: 8,
    tags: ['Advising', '1-on-1', 'Scholarships', 'Admissions', 'Flexible Slots'],
    availableSlots: [
      { slotId: 'slot-1', startTime: '2026-09-02T10:00:00+10:00', endTime: '2026-09-02T10:30:00+10:00', advisorName: 'Sarah Jenkins (STEM Specialist)', isBooked: false },
      { slotId: 'slot-2', startTime: '2026-09-02T11:00:00+10:00', endTime: '2026-09-02T11:30:00+10:00', advisorName: 'Liam Patel (Business & Arts)', isBooked: false },
      { slotId: 'slot-3', startTime: '2026-09-02T14:00:00+10:00', endTime: '2026-09-02T14:30:00+10:00', advisorName: 'Sarah Jenkins (STEM Specialist)', isBooked: false },
      { slotId: 'slot-4', startTime: '2026-09-02T15:30:00+10:00', endTime: '2026-09-02T16:00:00+10:00', advisorName: 'Liam Patel (International Student Advisor)', isBooked: false }
    ]
  },
  {
    id: 'event-ai-taster-workshop',
    title: 'Computer Science & Generative AI Hands-On Masterclass',
    category: 'Workshop',
    description: 'An interactive 2-hour taster lab session where prospective students build and deploy their first neural network agent in our computer labs, led by leading computer science faculty researchers.',
    startDate: '2026-09-18T14:00:00+10:00',
    endDate: '2026-09-18T16:30:00+10:00',
    location: 'Turing Computer Lab 3, Engineering Precinct',
    isVirtual: false,
    speakerOrHost: 'Prof. Nathan Reed & Dr. Sarah Lin',
    capacity: 60,
    registeredCount: 41,
    tags: ['Tech', 'AI', 'Coding', 'Computer Science', 'Hands-on']
  },
  {
    id: 'event-intl-webinar',
    title: 'International Student Visa, Scholarships & Life in Australia Webinar',
    category: 'Webinar',
    description: 'Essential live briefing for international applicants covering Australian student visa (Subclass 500) compliance, GTE requirements, guaranteed accommodation, cost of living, and scholarship opportunities.',
    startDate: '2026-09-24T18:00:00+10:00',
    endDate: '2026-09-24T19:30:00+10:00',
    location: 'Online Live Stream via Google Meet',
    isVirtual: true,
    meetingLink: 'https://meet.google.com/intl-student-briefing',
    speakerOrHost: 'International Student Recruitment & Visa Compliance Team',
    capacity: 500,
    registeredCount: 310,
    tags: ['International', 'Visa', 'Scholarships', 'Accommodation', 'Webinar']
  },
  {
    id: 'event-campus-tour-sep',
    title: 'Guided Campus & Residential Colleges Twilight Tour',
    category: 'Campus Tour',
    description: 'Walk through historic quads, modern maker spaces, high-tech libraries, and student residential dining halls with current student ambassadors.',
    startDate: '2026-09-28T16:30:00+10:00',
    endDate: '2026-09-28T18:00:00+10:00',
    location: 'Starts at Visitor Information Welcome Pavilion, Main Quad',
    isVirtual: false,
    speakerOrHost: 'Student Ambassador Leaders',
    capacity: 80,
    registeredCount: 52,
    tags: ['Campus Tour', 'Accommodation', 'Student Life']
  }
];
