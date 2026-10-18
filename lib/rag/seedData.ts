import { IngestDocumentInput } from './types';

/**
 * Curated initial multilingual knowledge base covering:
 * - TEQSA Higher Education Standards (Australia)
 * - ASQA RTO Standards
 * - Bachelor of Artificial Intelligence curriculum & prerequisites
 * - Multilingual admission guides (English, Japanese, Chinese, Vietnamese, Thai)
 */
export const SEED_KNOWLEDGE_DOCUMENTS: IngestDocumentInput[] = [
  {
    id: 'kb_teqsa_framework_en',
    title: 'TEQSA Higher Education Standards Framework (Threshold Standards)',
    category: 'Accreditation Standards',
    language: 'en',
    source: 'Tertiary Education Quality and Standards Agency (TEQSA) Act 2011',
    keywords: ['TEQSA', 'threshold standards', 'higher education', 'accreditation', 'AQF', 'governance'],
    content: `The Higher Education Standards Framework (Threshold Standards) 2021 establishes the statutory standards for Australian higher education providers registered with TEQSA.
Key Domains include:
1. Student Participation and Attainment: Transparent admissions, recognition of prior learning (RPL), learning outcomes mapped to the Australian Qualifications Framework (AQF), and fair grievance handling.
2. Learning Environment: Facilities, student support services, wellbeing, and academic integrity policies preventing contract cheating.
3. Teaching: Appropriately qualified academic faculty (at least one AQF level higher than course taught or equivalent professional standing).
4. Research and Research Training (where applicable).
5. Institutional Quality Assurance: Rigorous moderation of assessment, external benchmarking, and academic governance oversight.
6. Governance and Accountability: Independent governing body ensuring financial sustainability, statutory compliance, and educational integrity.`,
  },
  {
    id: 'kb_bachelor_ai_curriculum_en',
    title: 'Bachelor of Artificial Intelligence Degree Architecture & Curriculum',
    category: 'Degree Programs',
    language: 'en',
    source: 'Faculty of Computing & Information Technology Academic Board',
    keywords: ['Bachelor of AI', 'curriculum', 'machine learning', 'deep learning', 'ethics', 'prerequisites', 'units'],
    content: `The Bachelor of Artificial Intelligence (BAI) is an AQF Level 7 undergraduate qualification comprising 24 units of study (144 credit points over 3 years full-time).
Core Areas:
- Year 1: Foundations of Programming (Python), Discrete Mathematics, Linear Algebra & Calculus, Introduction to AI & Data Ethics.
- Year 2: Data Structures & Algorithms, Machine Learning Architectures, Neural Networks & Deep Learning, Database Management & Cloud Vector Systems.
- Year 3: Natural Language Processing & Large Language Models, Computer Vision, Autonomous Systems, and a two-semester Industry Capstone Project.
Admission Requirements: Completion of Australian Year 12 with ATAR 75.0 or international equivalent (e.g., IB Diploma 26, GCE A-Levels minimum CCB). English proficiency: Academic IELTS 6.5 with no band under 6.0 (or TOEFL iBT 79, PTE Academic 58).`,
  },
  {
    id: 'kb_asqa_rto_standards_en',
    title: 'ASQA Standards for Registered Training Organisations (RTOs)',
    category: 'Vocational Compliance',
    language: 'en',
    source: 'Australian Skills Quality Authority (ASQA)',
    keywords: ['ASQA', 'RTO', 'VET', 'competency-based training', 'validation', 'trainer competencies'],
    content: `Standards for RTOs govern vocational education and training in Australia.
Core requirements:
- Standard 1: Responsive training and assessment services. Training packages must be delivered by credentialed trainers holding Certificate IV in Training and Assessment (TAE40116 or TAE40122).
- Assessment Validation: Assessment judgments must be systematically validated across all competency units on a 5-year rolling cycle.
- Standard 2: Quality assurance of operations through systematic stakeholder feedback and continuous improvement registers.
- Standard 5 & 6: Transparent learner agreements, clear refund policies, and accessible complaints and appeals mechanisms.`,
  },
  {
    id: 'kb_international_admissions_ja',
    title: 'オーストラリア高等教育機関 留学生入学要件および認定制度（日本語案内）',
    category: 'Admissions & Visas',
    language: 'ja',
    source: '国際学生アドミッションセンター (International Admissions Desk)',
    keywords: ['留学生', '入学条件', '英語要件', 'IELTS', 'ビザ', 'TEQSA', '学士号'],
    content: `オーストラリアの大学・高等教育機関（TEQSA認定校）への入学には、学歴要件と英語力証明が必須です。
1. 学歴要件：
   日本の高等学校卒業証明書および成績証明書（評定平均3.5以上推奨）、または大学1年次修了、もしくはファウンデーションコースの修了。
2. 英語力証明（出願前2年以内に受験）：
   - IELTS Academic: 総合スコア6.5以上（各バンド6.0以上）
   - TOEFL iBT: 総合79点以上（ライティング21点以上）
   - PTE Academic: 総合58点以上（各スキル50点以上）
3. ビザ（Subclass 500）および留学生保険（OSHC）：
   CRICOS登録コースへの入学許可書（CoE: Confirmation of Enrolment）の発行を受けた後、オーストラリア内務省（Department of Home Affairs）へ学生ビザを申請します。滞在期間全体をカバーする海外留学生健康保険（OSHC）の加入が義務付けられています。`,
  },
  {
    id: 'kb_curriculum_standards_zh',
    title: '澳大利亚高等教育学位架构与学分转换指南（中文版）',
    category: 'Course Architecture',
    language: 'zh',
    source: '学术委员会学分互认与国际合作处',
    keywords: ['学分转换', 'RPL', '前置学习认定', 'AQF', '学士学位', '人工智能', '中英文对照'],
    content: `澳大利亚学历资格框架（AQF）对高等教育学位制定了严格的层级标准：
- AQF 7级为学士学位（Bachelor Degree），标准学制为3年（144学分），注重专业理论基础与前沿实践。
- AQF 8级为荣誉学士学位（Honours）与研究生文凭（Graduate Diploma）。
- AQF 9级为硕士学位（Master Degree）。
先前学习认定（RPL）与学分减免：
申请者若在受认可的中国高校修读同等计算机、数学或工程类课程，可申请最多8门课程（48学分，相当于1年学制）的学分减免。需提交经公证的中英文成绩单、课程大纲（详细包含授课内容、每周学时和考核方式）供系主任委员会审核。`,
  },
  {
    id: 'kb_vietnamese_ai_pathway_vi',
    title: 'Lộ trình Đào tạo Cử nhân Trí tuệ Nhân tạo và Yêu cầu Nhập học (Tiếng Việt)',
    category: 'Degree Programs',
    language: 'vi',
    source: 'Văn phòng Hợp tác Quốc tế & Tuyển sinh Đông Nam Á',
    keywords: ['Cử nhân AI', 'du học Úc', 'điều kiện nhập học', 'IELTS', 'học phí', 'TEQSA'],
    content: `Chương trình Cử nhân Trí tuệ Nhân tạo (Bachelor of Artificial Intelligence) được thiết kế theo chuẩn chất lượng cao nhất của Cơ quan Quản lý Chất lượng và Tiêu chuẩn Giáo dục Đại học Úc (TEQSA).
Điều kiện đầu vào:
- Học lực: Tốt nghiệp Trung học Phổ thông tại Việt Nam với điểm trung bình năm lớp 12 từ 8.0/10 trở lên, hoặc hoàn thành chương trình Dự bị Đại học (Foundation).
- Yêu cầu tiếng Anh: IELTS Học thuật đạt tối thiểu 6.5 (không kỹ năng nào dưới 6.0), hoặc PTE Academic từ 58 trở lên.
- Miễn giảm tín chỉ (RPL): Sinh viên chuyển tiếp từ các trường đại học tại Việt Nam có thể được xét miễn giảm tối đa 8 môn học cơ sở ngành.`,
  },
  {
    id: 'kb_thai_admissions_th',
    title: 'คู่มือการรับสมัครนักศึกษาต่างชาติและหลักสูตรปัญญาประดิษฐ์ (ภาษาไทย)',
    category: 'Admissions & Visas',
    language: 'th',
    source: 'ฝ่ายรับสมัครนักศึกษานานาชาติ มหาวิทยาลัยเครือข่ายออสเตรเลีย',
    keywords: ['สมัครเรียน', 'ออสเตรเลีย', 'ปริญญาตรี AI', 'เกณฑ์ภาษาอังกฤษ', 'IELTS', 'วีซ่านักเรียน'],
    content: `หลักสูตรวิทยาศาสตรบัณฑิต สาขาปัญญาประดิษฐ์ (Bachelor of Artificial Intelligence) ภายใต้การรับรองมาตรฐานสากล TEQSA ของประเทศออสเตรเลีย
เกณฑ์การรับเข้าศึกษา:
1. สำเร็จการศึกษาระดับมัธยมศึกษาปีที่ 6 (ม.6) ด้วยเกรดเฉลี่ยสะสม (GPA) ไม่ต่ำกว่า 3.00 หรือสำเร็จหลักสูตร Foundation Studies
2. ผลสอบวัดระดับภาษาอังกฤษ (อายุไม่เกิน 2 ปี): IELTS Academic 6.5 (ไม่มีพาร์ทใดต่ำกว่า 6.0) หรือ TOEFL iBT 79 หรือ PTE Academic 58
3. ทุนการศึกษา: มีทุนสนับสนุนความเป็นเลิศทางวิชาการ (Academic Excellence Scholarship) สูงสุด 20-30% ของค่าเล่าเรียนสำหรับผู้มีผลการเรียนดีเยี่ยม`,
  },
  {
    id: 'kb_indonesian_admissions_id',
    title: 'Panduan Pendaftaran Mahasiswa Internasional & Program Sarjana AI di Australia (Bahasa Indonesia)',
    category: 'Admissions & Visas',
    language: 'id',
    source: 'Kantor Admisi Mahasiswa Internasional Asia Tenggara',
    keywords: ['Sarjana AI', 'syarat masuk', 'IELTS', 'beasiswa', 'visa pelajar', 'TEQSA', 'Indonesia'],
    content: `Program Sarjana Kecerdasan Buatan (Bachelor of Artificial Intelligence) di Australia terakreditasi resmi oleh TEQSA (AQF Level 7).
Persyaratan Masuk untuk Lulusan Indonesia:
1. Akademik: Ijazah SMA/SMK dengan nilai rata-rata Ujian Sekolah minimal 80%, atau penyelesaian program Foundation Studies/Diploma di institusi terakreditasi.
2. Kemampuan Bahasa Inggris: Sertifikat resmi IELTS Akademik skor minimal 6.5 (tidak ada band di bawah 6.0), TOEFL iBT minimal 79, atau PTE Academic minimal 58.
3. Beasiswa & Pengakuan Pembelajaran Lampau (RPL): Tersedia beasiswa prestasi akademik (International Merit Scholarship) hingga 25% potongan biaya kuliah. Mahasiswa transfer universitas dapat mengajukan transfer kredit hingga maksimal 8 unit mata kuliah dasar.`,
  },
  {
    id: 'kb_malaysian_rpl_pathway_ms',
    title: 'Garis Panduan Pemindahan Kredit RPL dan Syarat Kemasukan Siswazah Australia (Bahasa Melayu)',
    category: 'Course Architecture',
    language: 'ms',
    source: 'Lembaga Akademik & Kerjasama Antarabangsa Malaysia-Australia',
    keywords: ['pemindahan kredit', 'RPL', 'kemasukan', 'Ijazah Sarjana Muda AI', 'STPM', 'Matrikulasi', 'Malaysia'],
    content: `Struktur kelayakan Ijazah Sarjana Muda Kecerdasan Buatan (AQF Tahap 7) mengikut piawaian TEQSA:
Syarat Kemasukan Pelajar Malaysia:
1. Kelayakan Akademik: Sijil Tinggi Persekolahan Malaysia (STPM) dengan minimum 2 Prinsipal gred C, Sijil Matrikulasi KPM dengan PNGK 2.50+, atau Diploma dalam bidang Sains Komputer/IT.
2. Keperluan Bahasa Inggeris: IELTS Akademik 6.5 (tiada komponen di bawah 6.0) atau MUET Band 4.5 ke atas.
3. Pemindahan Kredit (RPL): Pemegang Diploma dari politeknik atau kolej universiti Malaysia yang diiktiraf layak mendapat pengecualian kredit sehingga 1 tahun pengajian (8 unit kursus / 48 mata kredit).`,
  },
  {
    id: 'kb_filipino_admissions_tl',
    title: 'Gabay sa Pagpasok ng mga Mag-aaral at Kursong AI sa Australia (Wikang Filipino)',
    category: 'Admissions & Visas',
    language: 'tl',
    source: 'Tanggapan ng Pandaigdigang Adminsyon sa Timog-Silangang Asya',
    keywords: ['Bachelor of AI', 'pagpasok', 'IELTS', 'Pilipinas', 'kredito', 'AQF', 'TEQSA'],
    content: `Ang Bachelor of Artificial Intelligence (AQF Level 7) ay isang accredited na 3-taong kurso sa Australia na kinikilala ng TEQSA.
Mga Pangangailangan sa Pagpasok para sa mga Mag-aaral mula sa Pilipinas:
1. Akademiko: Pagkumpleto ng K-12 Senior High School Diploma na may pangkalahatang marka na hindi bababa sa 85%, o pagtapos ng hindi bababa sa isang taon ng pag-aaral sa kolehiyo/pamantasan sa Pilipinas.
2. Kahusayan sa Wikang Ingles: Academic IELTS na may pangkalahatang marka na 6.5 (walang sub-score na mas mababa sa 6.0), o katumbas sa TOEFL iBT (79) o PTE Academic (58).
3. Pagkilala sa Nakaraang Pag-aaral (RPL): Ang mga nagtapos ng kaugnay na Associate o Diploma courses ay maaaring mag-aplay para sa credit transfer upang mabawasan ang mga unit na kailangang kunin.`,
  },
  {
    id: 'kb_khmer_admissions_km',
    title: 'សេចក្ដីណែនាំអំពីការចុះឈ្មោះចូលរៀនបរិញ្ញាបត្របញ្ញាសិប្បនិម្មិត (AI) នៅអូស្ត្រាលី (ភាសាខ្មែរ)',
    category: 'Admissions & Visas',
    language: 'km',
    source: 'ការិយាល័យនិស្សិតអន្តរជាតិប្រចាំតំបន់អាស៊ីអាគ្នេយ៍',
    keywords: ['បរិញ្ញាបត្រ AI', 'ការចុះឈ្មោះ', 'IELTS', 'អាហារូបករណ៍', 'កម្ពុជា', 'TEQSA'],
    content: `កម្មវិធីបរិញ្ញាបត្របញ្ញាសិប្បនិម្មិត (Bachelor of Artificial Intelligence) ទទួលបានការទទួលស្គាល់កម្រិត AQF Level 7 ពីស្ថាប័ន TEQSA អូស្ត្រាលី។
លក្ខខណ្ឌតម្រូវសម្រាប់ការចុះឈ្មោះ៖
១. លក្ខខណ្ឌសិក្សា៖ សញ្ញាបត្រមធ្យមសិក្សាទុតិយភូមិ (បាក់ឌុប) និទ្ទេសល្អ ឬការបញ្ចប់វគ្គសិក្សាមូលដ្ឋាន (Foundation Studies) នៅវិទ្យាស្ថានដែលមានការទទួលស្គាល់។
២. កម្រិតភាសាអង់គ្លេស៖ ពិន្ទុ IELTS Academic យ៉ាងតិច ៦.៥ (មិនមានផ្នែកណាមួយក្រោម ៦.០) ឬ TOEFL iBT ៧៩ ឬ PTE ៥៨។
៣. អាហារូបករណ៍៖ មានអាហារូបករណ៍លើកទឹកចិត្តរហូតដល់ ២០-៣០% នៃថ្លៃសិក្សា សម្រាប់និស្សិតឆ្នើម។`,
  }
];
