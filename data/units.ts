export interface AssessmentItem {
  name: string;
  weight: number; // e.g. 20 for 20%
  type: 'Assignment' | 'Project' | 'Quiz' | 'Midterm' | 'Final Exam' | 'Lab Practical' | 'Presentation';
  description: string;
  dueWeek: number | string;
}

export interface UnitDetail {
  code: string; // e.g. COMP1001
  title: string;
  faculty: string;
  level: 'Undergraduate' | 'Postgraduate';
  creditPoints: number; // e.g. 6
  semestersOffered: ('Semester 1' | 'Semester 2' | 'Summer Intensive')[];
  deliveryMode: 'On-Campus' | 'Online' | 'Blended';
  coordinator: {
    name: string;
    email: string;
    office: string;
  };
  overview: string;
  learningOutcomes: string[];
  prerequisites: string[]; // Unit codes or description
  corequisites?: string[];
  topics: {
    week: number;
    title: string;
    summary: string;
  }[];
  assessments: AssessmentItem[];
  prescribedResources: string[];
}

export const UNITS_DATA: UnitDetail[] = [
  {
    code: 'COMP1001',
    title: 'Introduction to Programming & Algorithms',
    faculty: 'Faculty of Engineering & Computer Science',
    level: 'Undergraduate',
    creditPoints: 6,
    semestersOffered: ['Semester 1', 'Semester 2'],
    deliveryMode: 'Blended',
    coordinator: {
      name: 'Dr. Sarah Lin',
      email: 's.lin@university.edu.au',
      office: 'Engineering Building E4, Room 312'
    },
    overview: 'This unit introduces fundamental concepts of procedural and object-oriented programming, algorithmic problem solving, control structures, data abstraction, and software debugging using Python and C++.',
    learningOutcomes: [
      'Design, implement, and debug structured algorithms to solve complex computational problems.',
      'Apply core object-oriented principles including encapsulation, inheritance, and polymorphism.',
      'Analyze algorithmic time and space complexity using Big-O notation.',
      'Write clean, modular, and well-tested code following industry coding conventions.'
    ],
    prerequisites: ['None (Assumed knowledge: High School Mathematics)'],
    topics: [
      { week: 1, title: 'Variables, Types, and Control Flow', summary: 'Introduction to computational thinking, memory models, conditionals, and loops.' },
      { week: 2, title: 'Functions, Scoping & Modular Design', summary: 'Function signatures, recursion, and namespace management.' },
      { week: 3, title: 'Linear Data Structures', summary: 'Lists, tuples, dictionaries, and dynamic array allocation.' },
      { week: 4, title: 'Object-Oriented Programming (OOP)', summary: 'Classes, methods, constructors, and encapsulation.' },
      { week: 5, title: 'Inheritance & Polymorphism', summary: 'Abstract classes, interfaces, and code reusability.' },
      { week: 6, title: 'Algorithm Complexity & Sorting', summary: 'Big-O notation, Bubble, Selection, Merge, and Quick Sort.' },
      { week: 7, title: 'File I/O & Exception Handling', summary: 'Persistent storage, JSON serialization, and robust error management.' },
      { week: 8, title: 'Basic Graph & Tree Traversal', summary: 'Binary search trees, Depth-First Search (DFS), and Breadth-First Search (BFS).' },
      { week: 9, title: 'Unit Testing & Test-Driven Development', summary: 'Writing automated test suites using PyTest / GoogleTest.' },
      { week: 10, title: 'Memory Management & Pointers', summary: 'Stack vs Heap memory, pointer arithmetic in C++.' },
      { week: 11, title: 'Software Engineering Best Practices', summary: 'Git version control, code review standards, and continuous integration.' },
      { week: 12, title: 'Industry Project Capstone & Review', summary: 'Demonstration of final software application capstone and exam preparation.' }
    ],
    assessments: [
      { name: 'Weekly Lab Exercises & Coding Drills', weight: 15, type: 'Lab Practical', description: 'Weekly programming tasks evaluated by autograders.', dueWeek: 'Weeks 2-11' },
      { name: 'Mid-Semester Diagnostic Quiz', weight: 15, type: 'Quiz', description: 'Online multiple-choice and short coding logic exam.', dueWeek: 'Week 6' },
      { name: 'Major Programming Project (Roguelike Game / CLI App)', weight: 30, type: 'Project', description: 'Comprehensive multi-module object-oriented application with automated test coverage.', dueWeek: 'Week 10' },
      { name: 'Final Comprehensive Exam', weight: 40, type: 'Final Exam', description: 'Written & hands-on practical algorithm exam covering full semester curriculum.', dueWeek: 'Exam Period' }
    ],
    prescribedResources: [
      'Starting Out with Python (5th Edition) - Tony Gaddis',
      'Interactive Python & Algorithm Visualizer (University Online Portal)'
    ]
  },
  {
    code: 'COMP2004',
    title: 'Data Structures and Algorithms',
    faculty: 'Faculty of Engineering & Computer Science',
    level: 'Undergraduate',
    creditPoints: 6,
    semestersOffered: ['Semester 1', 'Semester 2'],
    deliveryMode: 'On-Campus',
    coordinator: {
      name: 'Prof. Marcus Vance',
      email: 'm.vance@university.edu.au',
      office: 'Alan Turing Building, Suite 402'
    },
    overview: 'A deep dive into advanced data structures and algorithm design techniques. Topics include balanced search trees, heaps, graph algorithms, dynamic programming, greedy algorithms, and NP-completeness.',
    learningOutcomes: [
      'Select and implement optimal data structures for large-scale data storage and retrieval.',
      'Design efficient graph algorithms for pathfinding, spanning trees, and network flow.',
      'Apply dynamic programming and divide-and-conquer paradigms to combinatorial optimization problems.',
      'Formally prove algorithm correctness and rigorous asymptotic complexity bounds.'
    ],
    prerequisites: ['COMP1001 (or equivalent introductory programming experience)'],
    topics: [
      { week: 1, title: 'Asymptotic Analysis & Master Theorem', summary: 'Recurrence relations, formal proofs, and best/average/worst case bounds.' },
      { week: 2, title: 'Self-Balancing Binary Search Trees', summary: 'AVL Trees, Red-Black Trees, and 2-3-4 Tree rotations.' },
      { week: 3, title: 'Priority Queues & Binary/Fibonacci Heaps', summary: 'Heapify operations, Dijkstra acceleration, and priority queue applications.' },
      { week: 4, title: 'Advanced Hashing & Hash Tables', summary: 'Universal hashing, Robin Hood hashing, Cuckoo hashing, and collision strategies.' },
      { week: 5, title: 'Graph Algorithms: Shortest Paths', summary: 'Dijkstra, Bellman-Ford, and Floyd-Warshall shortest path algorithms.' },
      { week: 6, title: 'Minimum Spanning Trees & Disjoint Sets', summary: 'Kruskal and Prim algorithms with Union-Find disjoint sets.' },
      { week: 7, title: 'Divide and Conquer Strategies', summary: 'Closest pair of points, Fast Fourier Transform (FFT) concepts.' },
      { week: 8, title: 'Dynamic Programming: Classic Optimization', summary: 'Knapsack, Longest Common Subsequence (LCS), and Matrix Chain Multiplication.' },
      { week: 9, title: 'Greedy Algorithms & Matroids', summary: 'Huffman coding, interval scheduling, and greedy choice property.' },
      { week: 10, title: 'Network Flow & Maximum Bipartite Matching', summary: 'Ford-Fulkerson, Edmonds-Karp, and Min-Cut Max-Flow theorem.' },
      { week: 11, title: 'Intractability & NP-Completeness', summary: 'P vs NP, polynomial-time reductions, SAT, Clique, and TSP.' },
      { week: 12, title: 'Approximation & Randomized Algorithms', summary: 'Vertex cover approximation, Monte Carlo, and Las Vegas algorithms.' }
    ],
    assessments: [
      { name: 'Algorithm Problem Sets (3 x 5%)', weight: 15, type: 'Assignment', description: 'Mathematical proofs and asymptotic analysis exercises.', dueWeek: 'Weeks 3, 7, 10' },
      { name: 'High-Performance Graph Engine Assignment', weight: 25, type: 'Project', description: 'C++ or Java implementation of optimized graph pathfinding on real-world road networks.', dueWeek: 'Week 9' },
      { name: 'Midterm Theory Examination', weight: 20, type: 'Midterm', description: 'In-person invigilated written exam on tree structures and hashing.', dueWeek: 'Week 6' },
      { name: 'Final Examination', weight: 40, type: 'Final Exam', description: 'Comprehensive written paper covering graph theory, DP, and NP-completeness.', dueWeek: 'Exam Period' }
    ],
    prescribedResources: [
      'Introduction to Algorithms (4th Edition) - Cormen, Leiserson, Rivest, and Stein (CLRS)',
      'Algorithms (4th Edition) - Robert Sedgewick and Kevin Wayne'
    ]
  },
  {
    code: 'DATA3001',
    title: 'Applied Machine Learning & Predictive Analytics',
    faculty: 'Faculty of Science & Data Systems',
    level: 'Undergraduate',
    creditPoints: 6,
    semestersOffered: ['Semester 1'],
    deliveryMode: 'Blended',
    coordinator: {
      name: 'Dr. Elena Rostova',
      email: 'e.rostova@university.edu.au',
      office: 'Data Science Hub, Level 2'
    },
    overview: 'Explores supervised and unsupervised statistical learning algorithms, deep neural network architectures, model evaluation methodologies, feature engineering pipelines, and MLOps deployment.',
    learningOutcomes: [
      'Formulate real-world challenges as supervised or unsupervised machine learning pipelines.',
      'Train, tune, and evaluate models using Scikit-Learn, PyTorch, and Cross-Validation.',
      'Diagnose underfitting, overfitting, variance/bias tradeoffs, and data leakage.',
      'Deploy and serve machine learning inference APIs using containerized microservices.'
    ],
    prerequisites: ['COMP2004 or MATH2001 (Linear Algebra & Probability)'],
    topics: [
      { week: 1, title: 'ML Pipeline & Exploratory Data Analysis', summary: 'Feature preprocessing, normalization, imputation, and PCA.' },
      { week: 2, title: 'Regression & Regularization', summary: 'Linear, Ridge, Lasso, and ElasticNet regression.' },
      { week: 3, title: 'Classification & Decision Boundaries', summary: 'Logistic regression, Support Vector Machines (SVM), and Kernel tricks.' },
      { week: 4, title: 'Tree-based Ensembles', summary: 'Decision Trees, Random Forests, XGBoost, and LightGBM.' },
      { week: 5, title: 'Unsupervised Learning & Clustering', summary: 'K-Means, DBSCAN, Gaussian Mixture Models, and t-SNE.' },
      { week: 6, title: 'Introduction to Deep Learning', summary: 'Perceptrons, Backpropagation, Activation functions, and PyTorch tensors.' },
      { week: 7, title: 'Convolutional Neural Networks (CNNs)', summary: 'Image filtering, pooling, ResNet architectures, and Transfer Learning.' },
      { week: 8, title: 'Sequence Models & Transformers', summary: 'RNNs, LSTMs, Attention mechanisms, and BERT/GPT architectures.' },
      { week: 9, title: 'Model Interpretability & Fairness', summary: 'SHAP values, LIME, algorithmic bias auditing, and ethics.' },
      { week: 10, title: 'MLOps, Model Registry & Versioning', summary: 'MLflow, DVC, tracking experiments, and data pipelines.' },
      { week: 11, title: 'Inference API & Container Deployment', summary: 'FastAPI model wrappers, Dockerization, and latency optimization.' },
      { week: 12, title: 'Industry Kaggle Challenge Presentation', summary: 'Final model showcase and competitive benchmarking.' }
    ],
    assessments: [
      { name: 'Feature Engineering & Tabular Modeling Task', weight: 20, type: 'Assignment', description: 'End-to-end predictive modeling notebook on financial risk dataset.', dueWeek: 'Week 5' },
      { name: 'Deep Learning Vision / NLP Kaggle Challenge', weight: 35, type: 'Project', description: 'Team project training PyTorch models with leaderboard evaluation.', dueWeek: 'Week 10' },
      { name: 'Model Deployment & MLOps Practical Lab', weight: 15, type: 'Lab Practical', description: 'Deploying a low-latency model server with unit tests and Docker.', dueWeek: 'Week 11' },
      { name: 'Final Comprehensive Exam', weight: 30, type: 'Final Exam', description: 'Theoretical derivations, loss optimization, and system design questions.', dueWeek: 'Exam Period' }
    ],
    prescribedResources: [
      'Pattern Recognition and Machine Learning - Christopher Bishop',
      'Hands-On Machine Learning with Scikit-Learn, Keras, and TensorFlow - Aurélien Géron'
    ]
  },
  {
    code: 'CYBR2002',
    title: 'Cybersecurity Fundamentals & Network Defense',
    faculty: 'Faculty of Engineering & Computer Science',
    level: 'Undergraduate',
    creditPoints: 6,
    semestersOffered: ['Semester 2'],
    deliveryMode: 'On-Campus',
    coordinator: {
      name: 'Assoc. Prof. Kenneth Zhao',
      email: 'k.zhao@university.edu.au',
      office: 'Cyber Range Complex, Room G18'
    },
    overview: 'Covers core tenets of information security (CIA triad), cryptography (AES, RSA, ECC, TLS), offensive penetration testing methodology, threat modeling, and incident response.',
    learningOutcomes: [
      'Explain and apply cryptographic primitives to secure data in transit and at rest.',
      'Identify web application vulnerabilities (OWASP Top 10) and implement remediation.',
      'Perform network packet analysis, intrusion detection, and firewall rule configuration.',
      'Formulate incident response playbooks and forensic investigation workflows.'
    ],
    prerequisites: ['COMP1001 or equivalent networking foundation'],
    topics: [
      { week: 1, title: 'Security Architecture & CIA Triad', summary: 'Authentication, Authorization, Threat vectors, and zero-trust concepts.' },
      { week: 2, title: 'Symmetric & Asymmetric Cryptography', summary: 'AES-256, RSA, Elliptic Curve Cryptography, and Diffie-Hellman.' },
      { week: 3, title: 'Public Key Infrastructure (PKI) & TLS', summary: 'Certificates, X.509, HTTPS handshake, and certificate authorities.' },
      { week: 4, title: 'Network Security Protocols & Firewalls', summary: 'TCP/IP vulnerabilities, IPsec, VPNs, and iptables.' },
      { week: 5, title: 'Packet Analysis & Wireshark Labs', summary: 'Deep packet inspection, MITM attacks, and ARP poisoning.' },
      { week: 6, title: 'Web Application Security & OWASP Top 10', summary: 'SQL Injection, XSS, CSRF, SSRF, and authentication bypasses.' },
      { week: 7, title: 'Identity & Access Management (IAM)', summary: 'OAuth 2.0, OpenID Connect, SAML, and Multi-Factor Authentication.' },
      { week: 8, title: 'Vulnerability Assessment & Penetration Testing', summary: 'Reconnaissance, Nmap, Metasploit, and ethical hacking guidelines.' },
      { week: 9, title: 'Security Information & Event Management (SIEM)', summary: 'Splunk, log correlation, anomaly detection, and IDS/IPS.' },
      { week: 10, title: 'Digital Forensics & Memory Analysis', summary: 'Disk imaging, Volatility framework, and artifact timeline reconstruction.' },
      { week: 11, title: 'Cloud Security & DevSecOps', summary: 'AWS/GCP security groups, container scanning, and CI/CD secret management.' },
      { week: 12, title: 'Capture The Flag (CTF) Cyber Defense War Game', summary: 'Live attack and defense simulation on isolated cyber range.' }
    ],
    assessments: [
      { name: 'Hands-on Cryptography & Wireshark Lab Report', weight: 20, type: 'Assignment', description: 'Decrypting network captures and implementing custom crypto wrappers.', dueWeek: 'Week 4' },
      { name: 'Web Application Penetration Test Audit', weight: 30, type: 'Project', description: 'Security audit and remediation report on a vulnerable web service.', dueWeek: 'Week 8' },
      { name: 'Live Capture-the-Flag (CTF) Defense Challenge', weight: 20, type: 'Lab Practical', description: 'Timed cyber range competition solving offensive and defensive challenges.', dueWeek: 'Week 11' },
      { name: 'Final Theory Exam', weight: 30, type: 'Final Exam', description: 'Invigilated assessment on network protocols, IAM, and forensic methods.', dueWeek: 'Exam Period' }
    ],
    prescribedResources: [
      'Network Security Essentials: Applications and Standards - William Stallings',
      'The Web Application Hacker\'s Handbook - Dafydd Stuttard & Marcus Pinto'
    ]
  },
  {
    code: 'AI5001',
    title: 'Foundations of Generative AI & Large Language Models',
    faculty: 'Faculty of Engineering & Computer Science',
    level: 'Postgraduate',
    creditPoints: 6,
    semestersOffered: ['Semester 1', 'Semester 2'],
    deliveryMode: 'Blended',
    coordinator: {
      name: 'Prof. Nathan Reed',
      email: 'n.reed@university.edu.au',
      office: 'Center for AI Research, Level 5'
    },
    overview: 'A postgraduate frontier unit covering the architecture, fine-tuning, inference optimization, prompt engineering, agentic orchestration, and safety alignment of Modern Large Language Models (LLMs) and Multimodal Generative Systems.',
    learningOutcomes: [
      'Master transformer architecture components: Multi-Head Attention, RoPE, KV-Caching, and FlashAttention.',
      'Implement Parameter-Efficient Fine-Tuning (PEFT, LoRA, QLoRA) on custom domain datasets.',
      'Architect production Agentic workflows utilizing tool calling, ReAct loops, and Retrieval-Augmented Generation (RAG).',
      'Evaluate model hallucinations, alignment protocols (RLHF, DPO), and safety red-teaming.'
    ],
    prerequisites: ['Bachelor degree in STEM / Computer Science or DATA3001 with strong Python/PyTorch proficiency'],
    topics: [
      { week: 1, title: 'Evolution of NLP & Transformer Architecture', summary: 'Self-attention, Positional encodings, Encoder-Decoder vs Decoder-Only models.' },
      { week: 2, title: 'Tokenization & Pre-training Dynamics', summary: 'BPE tokenizers, compute-optimal scaling laws, and pre-training datasets.' },
      { week: 3, title: 'Inference Mechanics & Hardware Optimization', summary: 'KV-cache, PagedAttention, Speculative Decoding, and Quantization (GPTQ, AWQ, GGUF).' },
      { week: 4, title: 'Retrieval-Augmented Generation (RAG) Architecture', summary: 'Vector databases, dense embeddings, hybrid search, and semantic rerankers.' },
      { week: 5, title: 'Fine-Tuning: SFT, LoRA & QLoRA', summary: 'Adapters, low-rank decomposition, instruction tuning datasets, and memory budgets.' },
      { week: 6, title: 'Reinforcement Learning from Human Feedback (RLHF & DPO)', summary: 'Reward models, PPO, Direct Preference Optimization, and refusal training.' },
      { week: 7, title: 'Autonomous AI Agents & Tool Calling', summary: 'ReAct, Function calling, multi-agent frameworks, plan-and-execute workflows.' },
      { week: 8, title: 'Multimodal Generative Models', summary: 'Vision-Language models (CLIP, LLaVA), Diffusion models, and audio generation.' },
      { week: 9, title: 'Model Evaluation & Benchmarking', summary: 'MMLU, GSM8k, MT-Bench, LLM-as-a-Judge, and automated evaluation pipelines.' },
      { week: 10, title: 'Safety, Jailbreaks & Red-Teaming', summary: 'Prompt injection defense, guardrails, watermarking, and alignment safety.' },
      { week: 11, title: 'Production LLM Application Engineering', summary: 'Streaming responses, rate limiting, semantic caching, observability, and tracing.' },
      { week: 12, title: 'Capstone Showcase: Autonomous Enterprise Agent', summary: 'Live demonstrations of student-built generative AI applications.' }
    ],
    assessments: [
      { name: 'Modular RAG Engine with Semantic Search', weight: 25, type: 'Project', description: 'Build an enterprise RAG system with custom chunking, re-ranking, and citation tracking.', dueWeek: 'Week 5' },
      { name: 'LoRA / QLoRA Domain Adaptation Notebook', weight: 25, type: 'Assignment', description: 'Fine-tune an open-source LLM for a specialized domain with benchmark validation.', dueWeek: 'Week 8' },
      { name: 'Capstone Agentic Application Project', weight: 40, type: 'Project', description: 'End-to-end interactive multi-agent system solving complex real-world workflow.', dueWeek: 'Week 11' },
      { name: 'Research Paper Critique & Oral Presentation', weight: 10, type: 'Presentation', description: '15-minute presentation dissecting a recent frontier LLM research paper.', dueWeek: 'Week 12' }
    ],
    prescribedResources: [
      'Speech and Language Processing (3rd Edition draft) - Dan Jurafsky and James H. Martin',
      'Deep Learning - Ian Goodfellow, Yoshua Bengio, and Aaron Courville'
    ]
  },
  {
    code: 'BUSS2010',
    title: 'Business Analytics & Decision Science',
    faculty: 'Business School',
    level: 'Undergraduate',
    creditPoints: 6,
    semestersOffered: ['Semester 1', 'Semester 2'],
    deliveryMode: 'Blended',
    coordinator: {
      name: 'Dr. Chloe Kensington',
      email: 'c.kensington@university.edu.au',
      office: 'Business School Tower, Level 8'
    },
    overview: 'Equips future business leaders with quantitative decision-making tools, interactive dashboard design (Power BI/Tableau), statistical hypothesis testing, and prescriptive optimization models.',
    learningOutcomes: [
      'Translate complex organizational questions into structured analytical frameworks.',
      'Construct executive dashboards and interactive visual analytics for stakeholders.',
      'Apply linear programming and sensitivity analysis to resource allocation problems.',
      'Communicate data-driven strategic recommendations with clarity and rigor.'
    ],
    prerequisites: ['None (Assumed knowledge: Basic Mathematics or Statistics)'],
    topics: [
      { week: 1, title: 'Data-Driven Strategy & KPI Architecture', summary: 'Frameworks for business metrics, OKRs, and value driver trees.' },
      { week: 2, title: 'Exploratory Data Analysis in Excel & SQL', summary: 'Relational querying, aggregation, window functions, and pivot modeling.' },
      { week: 3, title: 'Data Visualization & Storytelling', summary: 'Visual perception principles, dashboard layout, and chart selection.' },
      { week: 4, title: 'Interactive BI Dashboards (Power BI / Tableau)', summary: 'DAX expressions, star schema modeling, and interactive filtering.' },
      { week: 5, title: 'Probability Distributions & Risk Analysis', summary: 'Monte Carlo simulations for financial forecasting and risk exposure.' },
      { week: 6, title: 'Hypothesis Testing & A/B Experimentation', summary: 'Two-sample t-tests, ANOVA, sample size calculations, and p-value interpretation.' },
      { week: 7, title: 'Regression for Market Forecasting', summary: 'Demand forecasting, price elasticity modeling, and multi-variable regression.' },
      { week: 8, title: 'Optimization & Linear Programming', summary: 'Solver modeling, supply chain routing, and capital budgeting optimization.' },
      { week: 9, title: 'Customer Segmentation & RFM Analysis', summary: 'Cohort retention analysis, churn prediction, and customer lifetime value (CLV).' },
      { week: 10, title: 'Supply Chain & Inventory Analytics', summary: 'Economic Order Quantity (EOQ), reorder points, and safety stock calculations.' },
      { week: 11, title: 'Ethics, Privacy & Data Governance', summary: 'GDPR, privacy compliance, data bias, and ethical decision boundaries.' },
      { week: 12, title: 'Executive Board Presentation & Case Study', summary: 'Final consulting pitch to industry judges.' }
    ],
    assessments: [
      { name: 'Executive BI Dashboard & SQL Analytics Portfolio', weight: 25, type: 'Project', description: 'Interactive dashboard analyzing multi-year retail sales performance.', dueWeek: 'Week 5' },
      { name: 'Optimization & Business Case Report', weight: 25, type: 'Assignment', description: 'Linear programming solver model solving a manufacturing supply constraint.', dueWeek: 'Week 9' },
      { name: 'Group Consulting Pitch & Strategy Slide Deck', weight: 20, type: 'Presentation', description: '10-minute live consulting presentation recommending pricing strategies.', dueWeek: 'Week 11' },
      { name: 'Final Examination', weight: 30, type: 'Final Exam', description: 'Case study exam applying quantitative decision analysis to a business scenario.', dueWeek: 'Exam Period' }
    ],
    prescribedResources: [
      'Business Analytics: Communicating with Data - Sanjiv Jaggia & Alison Kelly',
      'Storytelling with Data: A Data Visualization Guide for Business Professionals - Cole Nussbaumer Knaflic'
    ]
  }
];
