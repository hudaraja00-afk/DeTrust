# Software Requirements Specification (SRS)
## DeTrust: Decentralized Trust & Capability Scoring System for Freelancers

**Institution:** COMSATS University, Islamabad, Pakistan
**Session:** Bachelor of Science in Computer Science (2022-2026)

**Authors:**
* Haseeb Ahmad Khalil (CIIT/FA22-BCS-027/ISB)
* Noor-Ul-Huda (CIIT/FA22-BCS-081/ISB)

**Supervisor:** Dr. Tehsin Kanwal

---

## Executive Summary

The freelance marketplace ecosystem is fraught with challenges that undermine trust and efficiency for both clients and freelancers. Centralized platforms impose high commission fees, create significant payment delays, and utilize opaque reputation systems that are often biased against new talent. This "cold-start" problem effectively excludes skilled newcomers who lack a platform-specific work history, while lengthy and often unfair dispute resolution processes further erode confidence.

To address these systemic issues, **DeTrust** is developed. It is a decentralized web application that provides a transparent, secure, and equitable solution. The system is built on blockchain technology, utilizing smart contracts to automate payment escrow and release, which guarantees timely compensation and drastically reduces transaction fees.

DeTrust introduces a transparent, mathematical trust scoring system for both freelancers and clients, ensuring all reputation metrics are auditable and tamper-proof. To solve the newcomer problem, it integrates an AI-powered capability prediction system that analyzes a user's skills and portfolio to provide an instant credibility score. By recording all agreements, feedback, and dispute outcomes on the blockchain, DeTrust establishes a meritocratic marketplace where verified talent and fair processes are the cornerstones of success.

---

## Abstract

This project was created to resolve the systemic issues of high fees, payment insecurity, and biased reputation systems that plague the current freelance marketplace ecosystem. Current centralized platforms like Upwork and Fiverr charge exorbitant commissions, with 58% of freelancers reporting payment delays or non-payment. Their proprietary scoring algorithms and opaque dispute resolution processes create significant barriers for new talent and can lead to unfair outcomes. 

The proposed project aims to solve the "cold-start problem" that prevents new freelancers from securing work and addresses the financial risk both parties face due to insecure payment handling and prolonged disputes. It also targets the lack of transparency and portability in current reputation systems, which locks users into a single platform. The project fills the gap for a unified freelance platform that combines automated smart-contract escrow, transparent on-chain reputation, and an AI-driven solution to instantly assess newcomer capability. 

The system aims to eliminate cold-start barriers for new users through AI-powered capability assessment and guarantee universal payment security with automated escrow smart contracts. Furthermore, it will deliver auditable, transparent trust scores for both clients and freelancers and ensure fair dispute outcomes via decentralized community arbitration. As a final product, DeTrust creates a sustainable, transparent, and meritocratic marketplace where talent, not platform algorithms, drives success for all participants.

---

## Acknowledgement

All praise is to Almighty Allah who bestowed upon us a minute portion of His boundless knowledge by virtue of which we were able to accomplish this challenging task.

We are greatly indebted to our project supervisor Dr. Tehsin Kanwal. Without her personal supervision, advice and valuable guidance, completion of this project would have been doubtful. We are grateful to them for their encouragement and continual help during this work.

And we are also thankful to our parents and family who have been a constant source of encouragement for us and brought us with the values of honesty & hard work.

---

## Abbreviations

| Abbreviation | Definition |
| :--- | :--- |
| **SRS** | Software Require Specification |
| **AI** | Artificial Intelligence |
| **API** | Application Programming Interface |
| **DApp** | Decentralized Application |
| **IPFS** | InterPlanetary File System |
| **ML** | Machine Learning |
| **UI** | User Interface |
| **UX** | User Experience |
| **REL** | Reliability |
| **USE** | Usability |
| **PERF** | Performance |
| **SEC** | Security |
| **MAIN** | Maintainability |
| **SI** | Software Interface |
| **CI** | Communication Interface |

---

# Chapter 1: Introduction and Problem Definition

This chapter provides an overview of the DeTrust project. It outlines the project's vision, defines the problems within the current freelance ecosystem, presents the proposed solution and objectives, and details the project's scope, limitations, and core modules.

### 1.1 Overview of the Project
DeTrust is a decentralized web application designed to overcome systemic inefficiencies and trust deficits prevalent in current freelance platforms. The project is a web-based information system that incorporates problem-solving through artificial intelligence and blockchain technology. Users, including freelancers and clients, authenticate via crypto wallets to create profiles and interact within the marketplace. The system leverages blockchain-based smart contracts to secure payments in escrow, ensuring funds are released only upon job completion or a binding arbitration decision. All transactions, reviews, and dispute records are stored immutably on the blockchain, fostering transparency and reducing fraud. To address the challenges faced by newcomers, DeTrust provides an instant capability assessment using AI-powered profile analysis, creating a fair and meritocratic ecosystem.

### 1.2 Vision Statement
For freelancers and clients who require a transparent, reliable, and equitable digital marketplace to collaborate effectively, Who currently struggle with the systemic inefficiencies of centralized platforms, including opaque commission fees, persistent payment delays, biased reputation systems that create entry barriers (the "cold-start problem"), and slow, often unfair, dispute resolution processes, The DeTrust Is a fully decentralized, blockchain-powered freelance marketplace That fundamentally redefines trust and capability by securing all payments through automated smart contract escrows, recording feedback as immutable on-chain records, and providing an instant, objective capability assessment for newcomers via an AI-powered analysis of their skills and portfolio. It delivers a progressive and fully transparent trust score for all participants, ensuring that reputation is earned through verifiable performance. Unlike existing centralized platforms such as Upwork and Fiverr, which operate as opaque intermediaries that control user data, dictate high fees, and foster an environment of uncertainty, our product empowers its users by combining automated financial security, auditable reputation scoring, and community-driven arbitration. This creates a truly meritocratic ecosystem where verified talent and fair, transparent processes drive sustainable success and foster long-term professional relationships.

### 1.3 Problem Statement
Current freelance marketplaces are hindered by persistent issues that limit fairness, trust, and efficiency. New freelancers face the "cold-start problem," where a lack of reviews prevents them from securing jobs, as platform algorithms favor established workers. Centralized platforms impose high fees; for instance, Upwork charges a sliding commission of up to 15% [3], while Fiverr deducts a flat 20% from freelancer earnings [4]. Payment insecurity is a major risk, with 58% of freelancers reporting delayed or missing payments, and 40% waiting over 30 days for their compensation [5]. Dispute resolution processes are often slow and opaque; on platforms like Upwork, resolving a dispute can involve multiple stages and paid arbitration, extending timelines significantly [6, 7]. Finally, platform-specific reputation systems are proprietary, preventing freelancers from transferring their hard-earned credibility to other platforms, which creates vendor lock-in [1]. These combined problems of newcomer exclusion, high fees, payment delays, opaque scoring, and lengthy disputes erode trust for all participants.

### 1.4 Problem Solution
DeTrust addresses the core problems of the freelance industry by leveraging blockchain technology and artificial intelligence. To counter high fees and payment delays, the system uses blockchain-based smart contracts that automatically hold client funds in escrow and release them upon completion, reducing transaction fees to just 1–3%. All feedback is stored on-chain via cryptographic hashing, creating portable and tamper-proof reputation records that cannot be altered. To solve the "cold-start problem," a machine learning model analyzes new freelancers' profiles based on skills, certifications, and projects to generate an objective credibility score, allowing them to compete fairly from day one. Finally, dispute resolution is decentralized and unbiased, with juror selection and voting weighted by reputation, ensuring fair outcomes are reached within days instead of weeks.

### 1.5 Objectives of the Proposed System
* **BO-1:** Secure client payments in escrow, releasing funds only upon client approval or verified arbitration.
* **BO-2:** Store feedback immutably on-chain to prevent review alteration.
* **BO-3:** Automate fair dispute resolution through decentralized, reputation-weighted voting.
* **BO-4:** Implement an initial rule-based trust score (weighted-average of ratings, completion rate, dispute rate) for transparency.
* **BO-5:** Use a transparent, rule-based trust scoring system for both freelancers and clients.
* **BO-6:** Provide instant capability assessment for new users via AI-powered profile analysis and lightweight microtask verification to reduce cold-start risk.
* **BO-7:** Deliver real-time dashboards showing trust scores, AI capability predictions, and historical trends.
* **BO-8:** Deliver real-time, event-driven notifications and wallet-linked messaging to keep participants informed and responsive.

### 1.6 Scope
DeTrust is a decentralized web application (DApp) designed to be accessed via Ethereum-compatible wallets like MetaMask on Layer-2 networks to ensure low fees and fast transactions. The platform's scope includes functionalities for clients to post detailed job listings and for freelancers to browse, filter, and submit proposals for those jobs. A core feature is the smart contract-based payment system, which locks funds in escrow and automates their release upon mutual agreement or the conclusion of an arbitration process. The system will establish trust through transparent, rule-based scoring models for both freelancers and clients. For new users, an AI capability module will analyze profile signals and use microtasks to generate an initial credibility score, effectively solving the cold-start problem. The scope also includes a complete dispute resolution system where evidence is stored on IPFS and juror voting is enforced by smart contracts. Finally, users will have access to real-time dashboards to track their trust scores, earnings, and project history, ensuring a fair and efficient freelance ecosystem.

#### 1.6.1 Limitations/Constraints
* **LI-1:** The platform only supports Ethereum-compatible wallets and networks.
* **LI-2:** The accuracy of the machine learning-based scoring depends on the volume and quality of available historical data.
* **LI-3:** AI capability predictions for new users require sufficiently detailed profiles to be reliable.
* **LI-4:** Storing data directly on-chain incurs gas costs; therefore, large file uploads (like dispute evidence) will use IPFS.
* **LI-5:** The speed of dispute resolution may be affected by the availability of community jurors.

### 1.7 Modules

#### 1.7.1 Module 1: Client & Freelancer Web App
* **FE-1:** Wallet-based login and authentication (e.g., MetaMask, WalletConnect integration).
* **FE-2:** User role selection (Client or Freelancer) during onboarding.
* **FE-3:** Profile creation and editing.
* **FE-4:** User dashboard displaying active jobs, proposals, notifications, and token balance.

#### 1.7.2 Module 2: Smart Contract Job Board
* **FE-1:** Functionality for clients to post detailed job listings (description, budget, deadlines, required skills).
* **FE-2:** Interface for freelancers to browse, search, and filter job listings and submit proposals.
* **FE-3:** Smart contract logic for locking client payments into escrow upon job agreement and releasing funds upon verified completion and approval.
* **FE-4:** Clear visual tracking of job status (e.g., Open, In Progress, Awaiting Approval, Completed, In Dispute) driven by smart contract events.

#### 1.7.3 Module 3: Review & Feedback System
* **FE-1:** Interface for clients to submit ratings and textual comments for completed jobs.
* **FE-2:** Interface for freelancers to submit a "Job Clarity" rating for the client after job completion.
* **FE-3:** Smart contract integration to store hashes of feedback content immutably on the blockchain (content stored on IPFS).
* **FE-4:** Public display of aggregated ratings and individual reviews on user profiles.
* **FE-5:** Mechanism to view feedback history for specific jobs.

#### 1.7.4 Module 4: Trust Scoring Module
* **FE-1:** Collect performance data for freelancers (average ratings, completion rates, dispute outcomes) and clients (payment punctuality, job clarity ratings, cancellation rate, dispute behavior).
* **FE-2:** Compute a rule-based trust score for freelancers.
* **FE-3:** Compute a rule-based trust score for clients.
* **FE-4:** Display real-time trust scores and historical trends on user dashboards.

#### 1.7.5 Module 5: Dispute Resolution
* **FE-1:** Interface to launch a dispute case with evidence upload to IPFS.
* **FE-2:** System for selecting jurors based on their reputation scores.
* **FE-3:** A voting smart contract to record juror decisions and automatically execute the result.

#### 1.7.6 Module 6: AI Capability Prediction System
* **FE-1:** Extract and process user profile data such as skills, certifications, projects, and education.
* **FE-2:** Implement microtask and skill verification tests.
* **FE-3:** Run a classification model to assign an initial capability level (Beginner/Intermediate/Expert) to new users.
* **FE-4:** Display the initial AI-generated capability score on the user's dashboard.

#### 1.7.7 Module 7: Admin Dashboard
* **FE-1:** Interface to view key platform analytics and statistics (e.g., number of users, active jobs, dispute rates).
* **FE-2:** Functionality to configure smart contract parameters.
* **FE-3:** Tools to monitor disputes and flagged accounts for manual review if necessary.

#### 1.7.8 Module 8: Notification and Communication System
* **FE-1:** Real-time notification system for job updates, payments, and disputes.
* **FE-2:** In-platform messaging system between clients and freelancers.
* **FE-3:** Email notification integration for critical events.
* **FE-4:** Push notification support for web apps.

### 1.8 Related System Analysis/Literature Review

#### 1.8.1 Literature Review
Existing literature on online labor platforms highlights significant challenges related to algorithmic fairness and entry barriers for new participants. Research has identified the "cold-start problem," where new freelancers without a reputation struggle to attract clients, as recommendation algorithms inherently favor those with an established history [1]. Furthermore, studies from institutions like the Kellogg School of Management have pointed to algorithmic bias in gig economy platforms, where opaque, proprietary systems can perpetuate inequalities in job distribution [2]. Many existing systems are centralized, leading to a lack of transparency in how reputations are calculated, and disputes are handled. Our project addresses these gaps by introducing a decentralized architecture where reputation is recorded immutably on a blockchain, ensuring it is both transparent and tamper-proof. Additionally, we directly tackle the cold-start problem by integrating an AI-driven capability assessment model to provide new users with an objective, verifiable measure of their skills from the outset.

#### 1.8.2 Related System Analysis

**Table 1: Related System Analysis with proposed project solution**

| Application | Key Features & Weaknesses | DeTrust Solution |
| :--- | :--- | :--- |
| **Upwork** | - Centralized reputation system.<br>- 10–20% service fees reduce freelancer earnings.<br>- Dispute resolution relies on Upwork mediation, which can be opaque and time-consuming. | - On-chain, tamper-proof feedback stored via smart contracts.<br>- Automated escrow with conditional release eliminates hidden fees.<br>- Decentralized arbitration with transparent, reputation-weighted voting. |
| **Fiverr** | - Gig-based fixed-price model limits complex project scope.<br>- 20% seller commission plus buyer service. | - Flexible milestone-based payments via smart contracts.<br>- Lower transaction overhead with minimal on-chain fees.<br>- AI-driven capability prediction prevents fake profiles and ensures valid skill assessment. |
| **Freelancer.com** | - Tiered milestone escrow with additional arbitration fees (5% or $5 minimum).<br>- Centralized dispute resolution charges extra for escalation.<br>- Reputation metrics are proprietary and opaque. | - Smart contract escrow without extra arbitration charges.<br>- Immutable review hashing and free community-driven dispute handling.<br>- Dual-phase trust scoring: AI for newcomers. |

### 1.9 Tools and Technologies

**Table 2: Tools and Technologies for Proposed Project**

| Tools And Technologies | Version | Rationale |
| :--- | :--- | :--- |
| **IDE** | VS Code | Code development |
| **Smart Contracts (Solidity)** | x.x.x | Contract logic |
| **Blockchain Network** | Ethereum Testnet/Polygon/local | Low-cost testing and deployment |
| **Frontend Framework** | React.js/Next.js | Responsive UI |
| **Backend** | Node.js + Express | API services |
| **ML Framework** | TensorFlow or scikit-learn | AI capability prediction |
| **Database** | IPFS/Postgres | Storage |
| **Design** | Figma | Mockup and UI design |

### 1.10 Project Contribution
The DeTrust system introduces several key technical and conceptual contributions to the freelance marketplace ecosystem:

* **AI-Powered Newcomer Assessment:** The system directly addresses the "cold-start problem" by using an AI model to analyze a new user's profile and skills, providing an instant and objective capability score. This allows new talent to compete on merit rather than being excluded due to a lack of platform-specific history.
* **Decentralized and Transparent Trust Scoring:** Unlike the opaque, proprietary algorithms of existing platforms, DeTrust implements a transparent, rule-based mathematical formula for calculating trust scores for both freelancers and clients. All data feeding into this score is derived from on-chain actions, ensuring it is auditable and fair.
* **Automated Financial Security via Smart Contracts:** By using smart contract-based escrow, the system automates payment security, eliminating the risks of delayed or non-payment that plague the industry. This "trustless" mechanism significantly reduces the need for intermediaries and lowers transaction fees.
* **Immutable and Portable Reputation:** All feedback, project completions, and dispute outcomes are recorded on the blockchain. This creates a tamper-proof, permanent record of a user's reputation that is owned by the user and is inherently portable.
* **Fair and Efficient Community-Driven Arbitration:** The project introduces a decentralized dispute resolution system where reputation-weighted community jurors vote on outcomes. This removes the potential for platform bias and dramatically speeds up the resolution process compared to traditional, centralized mediation.

**Contribution Impact:** By integrating AI and blockchain technology, the DeTrust system transforms the conventional freelance platform from a centralized, opaque intermediary into a decentralized, transparent, and meritocratic ecosystem. These contributions significantly improve efficiency through automated escrow, enhance fairness via auditable trust scoring and community arbitration, and boost user confidence by providing immutable reputation records. This holistic approach creates a more sustainable and equitable environment for both freelancers and clients compared to traditional freelance solutions.

### 1.11 Relevance to Course Modules
The development of the DeTrust project aligns with and applies knowledge from several core Computer Science courses:

* **Software Engineering:** The project follows the complete Software Development Life Cycle (SDLC), from requirement analysis and system design (as documented here) to development, testing, and deployment.
* **Web Application Development:** The frontend will be built using modern frameworks like React.js/Next.js, and the backend services will be developed with Node.js, directly applying principles of web technologies.
* **Artificial Intelligence:** This project involves creating a predictive model for freelancer capability using frameworks like TensorFlow or scikit-learn, which is a direct application of machine learning concepts.
* **Database Systems:** The project requires a hybrid data storage approach, utilizing a traditional database like Postgres for off-chain data and a decentralized storage solution like IPFS for large files and evidence.
* **Blockchain and Distributed Systems:** The core of the project relies on developing and deploying Solidity smart contracts on an Ethereum-compatible network, demonstrating a practical understanding of decentralized application architecture and principles.

---

# Chapter 2: Requirement Analysis

This chapter outlines the detailed requirements for the DeTrust system. It begins by identifying the different user classes and their characteristics, followed by a Use Case Diagram to visualize their interactions with the system. The chapter then specifies the functional and non-functional requirements, which will guide the design, development, and testing phases of the project.

### 2.1 User Classes and Characteristics
The DeTrust platform is designed to serve several distinct user classes, each with specific roles, permissions, and interactions within the decentralized ecosystem.

**Table 3: User Classes and Characteristics**

| User Class | Characteristics |
| :--- | :--- |
| **Freelancer** | The primary user who seeks job opportunities. Freelancers will create detailed profiles showcasing their skills, experience, and portfolio. They are expected to have a basic understanding of cryptocurrency wallets (e.g., MetaMask) for authentication and receiving payments. Their main goal is to secure work, build a verifiable on-chain reputation, and receive timely payments without high intermediary fees. |
| **Client** | A user or organization seeking to hire talent for specific projects. Clients post job listings, review proposals from freelancers, and fund projects via smart contract escrows. They require a transparent system to assess a freelancer's trustworthiness and capability, especially for newcomers. Their primary motivation is to find skilled professionals and ensure project funds are secure until work is satisfactorily completed. |
| **System Administrator** | A technical user responsible for monitoring the platform's health, managing smart contract parameters (e.g., platform fees, juror selection criteria), and overseeing the dispute resolution system. The Administrator does not interfere with individual contracts but ensures the underlying infrastructure operates smoothly and securely. |

### 2.1.1 Use case Diagram

![Figure 1 Use case Diagram](path/to/use_case_diagram.png)
*Figure 1: Use case Diagram*

### 2.1.2 Requirement Identifying Technique
To ensure comprehensive coverage of all system requirements, a dual-technique approach is adopted:

**a) Mockup-Based Requirement Analysis:** For all user-facing interactions, this technique will be used. User interface (UI) mockups for key screens of the DApp will be designed using Figma. Functional requirements will then be derived directly from the interactive elements (buttons, forms, dashboards) on each screen.

**Table 4: Mockup-Based Requirement Analysis Overview**

| Mockup ID | Screen Name | Primary Functional Focus |
| :--- | :--- | :--- |
| **Module 1** | **Client & Freelancer Web App** | |
| M-A1 | Main Sign-In Page | Provides dual entry points: Web3 wallet connection and traditional email login. |
| M-A2 | Email Sign-Up Page | Form for creating an account with email, password, and terms agreement. |
| M-A3 | Email Sign-In Page | Standard form for email/password authentication. |
| M-A4 | Forgot Password Flow | Screens for entering email, confirming a reset link, and setting a new password. |
| M-A5 | 2FA Setup & Verification | QR code display for authenticator app setup and a verification code input screen. |
| M-C1 | Landing Page | Hero section, "How it Works," features, and testimonials. |
| M-C2 | User Onboarding | Simple, full-screen selection for "I'm a Client" or "I'm a Freelancer." |
| M-C3 | Freelancer Profile Creation/Editing | A comprehensive form for users to build their identity (name, bio, skills, portfolio). |
| M-C3.1 | Client Profile Creation/Editing | A form for clients to build their identity (company name, logo, description). |
| M-C4 | Client Dashboard | An overview of active jobs, proposals received, total spending, and recent activity. |
| M-C5 | Freelancer Dashboard | An overview of active projects, submitted proposals, total earnings, and recent activity. |
| M-P1 | Freelancer Public Profile & Analytics | The public-facing view of a user's profile, showcasing trust score, AI capability, reviews. |
| M-P1.1 | Client Public Profile & Analytics | The public-facing view of a client's profile, showcasing trust score, hire rate, reviews. |
| **Module 2** | **Smart Contract Job Board** | |
| M-J1 | Job Posting Form | A clean, multi-step form for clients to create a job listing. |
| M-J2 | Job Board | The main job browsing interface with search and filter capabilities. |
| M-J3 | Job Details Page | A detailed view of a single job, including project description, client history, and trust score. |
| M-J4 | Proposal Submission Form | A modal or page for freelancers to write their proposal and set their fee. |
| M-J5 | Active Project Management | The central workspace for an ongoing project, featuring milestones, deliverables, and chat. |
| M-J6 | Submit Work/Milestone | A form for freelancers to upload files and formally submit work for approval. |
| **Module 3** | **Review & Feedback System** | |
| M-J7 | Review & Feedback Form | A simple modal for both parties to leave a rating (1-5 stars) and a comment. |
| **Module 5** | **Dispute Resolution** | |
| M-P2 | Dispute Initiation Form | A guided form to open a dispute, state the reason, and upload initial evidence. |
| M-P3 | Dispute Voting Page | A neutral interface for jurors to review evidence from both parties and cast their vote. |
| **Module 6** | **AI Capability Prediction System** | |
| M-P4 | AI Capability Score Display | Displays the AI-generated score on the freelancer's profile/dashboard. |
| M-P5 | Skill Verification Hub | A dashboard page for freelancers listing their skills with verification status. |
| M-P6 | Skill Verification Test | An interface for a short, skill-based test (e.g., quiz, coding challenge). |
| M-P7 | Test Results Page | A clear screen showing the outcome of the skill verification test. |
| **Module 7** | **Admin Dashboard** | |
| M-S1 | Admin Dashboard | A data-rich dashboard for administrators showing platform health and key metrics. |
| **Module 8** | **Notification and Communication System** | |
| M-S2 | In-App Messaging | A real-time chat interface for direct communication between clients and freelancers. |
| M-S3 | Notification Center | A dropdown list showing recent, unread notifications, triggered by a bell icon. |
| M-S4 | Notification Settings Page | A settings page with toggles for managing in-app and email notification preferences. |

**b) Event-Response Tables:** For backend and blockchain-level processes that do not have a direct UI, this technique is employed to define system behaviors triggered by events such as smart contract execution or AI model processing.

**Table 5: Event-Response Tables**

| Event | System State | Response | Event Frequency | Data Elements Required | System State (After Event) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Client funds escrow** | Job proposal accepted; contract created on backend. | 1. System prompts clients to sign transaction to deploy smart contract.<br>2. Smart contract locks funds from client's wallet into escrow. | Once per contract | Client wallet address, Freelancer wallet address, Payment amount, Contract terms | Contract active; Funds in escrow; Freelancer notified to begin work. |
| **Freelancer completes milestone** | Contract active; milestone deadline approaching. | 1. System receives work submission from freelancer.<br>2. Notifies client to review submitted work. | Per milestone | Contract ID, Milestone ID, Link to work (IPFS hash) | Milestone marked "Submitted"; Awaiting client approval. |
| **Client approves payment** | Milestone work submitted. | 1. Client signs transaction to release funds.<br>2. Smart contract transfers milestone payment from escrow to freelancer's wallet.<br>3. Deducts platform fee. | Per milestone approval | Contract ID, Milestone ID, Client's signature | Funds transferred; Milestone marked "Completed." |
| **Trust score is recalculated** | Contract completed and feedback submitted by both parties. | 1. Backend service retrieves new rating, completion status, and dispute outcome.<br>2. Recalculates trust score for both users based on the weighted formula. | After each completed contract | User ID, old score, new rating, completion rate, dispute history | User's trust score updated in the database and displayed on their profile. |
| **Dispute period expires** | Dispute initiated; evidence submitted by both parties. | 1. System locks the contract.<br>2. Selects qualified jurors based on reputation score via a smart contract function.<br>3. Notifies selected jurors to vote. | Once per dispute | Contract ID, list of potential jurors, trust score threshold | Jurors selected; Voting period begins. |
| **AI capability scan requested** | New freelancer profile created or significantly updated. | 1. Backend service scrapes and processes profile data (skills, portfolio, certifications).<br>2. Feeds data into the ML classification model.<br>3. Stores and returns the capability score. | On-demand by freelancer | User ID, profile data (text, links), skill list | AI capability score is generated and stored; displayed on freelancer's profile. |
| **Skill microtask passed** | Freelancer completes and submits a skill verification test. | 1. System auto-grades the test.<br>2. If passed, updates the skill's status to "Verified" in the database. | Per skill test attempt | User ID, Skill ID, Test results | Skill status is "Verified"; AI score may be positively impacted. |

---

### 2.2 Functional Requirements

#### Module 1: Client & Freelancer Web App

**Mockup: M-A1 — Main Sign-In Page**
![Figure 2 Mockup: M-A1 — Main Sign-In Page](path/to/M-A1.png)

**Table 6: Functional Requirements Derived from Mockup: M-A1**

| Feature (derived from UI) | Functional Requirement (FR-ID: Statement) | Business Rule |
| :--- | :--- | :--- |
| Wallet Connection | **FR-A1.1:** The system shall provide a "Connect Wallet" button to initiate a connection with the user's browser-based Ethereum wallet. | Wallet connection is the primary and recommended authentication method. |
| Email Login Option | **FR-A1.2:** The system shall provide a "Sign in with Email" option for users who prefer traditional authentication. | This option will be visually secondary to the wallet connection. |

**Mockup: M-A2 — Email Sign-Up Page**
![Figure 3 Mockup: M-A2 — Email Sign-Up Page](path/to/M-A2.png)

**Table 7: Functional Requirements Derived from Mockup: M-A2**

| Feature (derived from UI) | Functional Requirement (FR-ID: Statement) | Business Rule |
| :--- | :--- | :--- |
| Registration Form | **FR-A2.1:** The system shall provide fields for a new user to enter their full name, email address, and create a password. | The email must be in a valid format and unique within the system. |
| Password Strength | **FR-A2.2:** The system shall enforce password complexity rules and provide real-time feedback on password strength. | Password must be at least 12 characters and include uppercase, lowercase, a number, and a special character. |
| Terms Agreement | **FR-A2.3:** The system requires users to agree to the Terms of Service and Privacy Policy via a checkbox before creating an account. | The "Sign Up" button remains disabled until the checkbox is ticked. |

**Mockup: M-A3 — Email Sign-In Page**
![Figure 4 Mockup: M-A3 — Email Sign-In Page](path/to/M-A3.png)

**Table 8: Functional Requirements Derived from Mockup: M-A3**

| Feature (derived from UI) | Functional Requirement (FR-ID: Statement) | Business Rule |
| :--- | :--- | :--- |
| User Authentication | **FR-A3.1:** The system shall authenticate users by validating their provided email and password against stored records. | Authentication is case-sensitive for the password field. |
| Failed Login Handling | **FR-A3.2:** The system shall display an error message for invalid credentials. | After 5 failed login attempts, the account will be temporarily locked for 15 minutes. |

**Mockup: M-A4 — Forgot Password Flow**
![Figure 5 Mockup: M-A4 — Forgot Password Flow](path/to/M-A4.png)

**Table 9: Functional Requirements Derived from Mockup: M-A4**

| Feature (derived from UI) | Functional Requirement (FR-ID: Statement) | Business Rule |
| :--- | :--- | :--- |
| Recovery Initiation | **FR-A4.1:** The system shall allow a user to initiate password recovery by entering their registered email address. | An email will only be sent if the address exists in the system. |
| Secure Reset Link | **FR-A4.2:** The system shall email a unique, single-use link to the user for resetting their password. | The password reset link must expire 60 minutes after being issued. |
| New Password Form | **FR-A4.3:** The system shall provide a secure form for the user to enter and confirm a new password. | The new password cannot be the same as the user's last three passwords. |

**Mockup: M-A5 — 2FA Setup & Verification**
![Figure 6 Mockup: M-A5 — 2FA Setup & Verification](path/to/M-A5.png)

**Table 10: Functional Requirements Derived from Mockup: M-A5**

| Feature (derived from UI) | Functional Requirement (FR-ID: Statement) | Business Rule |
| :--- | :--- | :--- |
| 2FA Setup | **FR-A5.1:** The system shall display a QR code and a secret key for the user to set up 2FA with an authenticator app (e.g., Google Authenticator). | This option is only available for email-based accounts. |
| 2FA Verification | **FR-A5.2:** The system shall require users with 2FA enabled to enter a 6-digit code from their authenticator app during login. | 2FA is mandatory for any user performing actions valued over $1,000 in a single transaction. |

**Mockup: M-C2 — User Onboarding**
![Figure 7 Mockup: M-C2 — User Onboarding](path/to/M-C2.png)

**Table 11: Functional Requirements Derived from Mockup: M-C2**

| Feature (derived from UI) | Functional Requirement (FR-ID: Statement) | Business Rule |
| :--- | :--- | :--- |
| Role Selection | **FR-C2.1:** The system shall present new users with a clear choice to identify as either "I'm a Client" or "I'm a Freelancer". | This selection tailors the initial dashboard view and onboarding tips. Users can use both roles later. |

**Mockup: M-C3 — Freelancer Profile Creation/Editing**
![Figure 8 Mockup: M-C3 — Freelancer Profile Creation/Editing](path/to/M-C3.png)

**Table 12: Functional Requirements Derived from Mockup: M-C3**

| Feature (derived from UI) | Functional Requirement (FR-ID: Statement) | Business Rule |
| :--- | :--- | :--- |
| Comprehensive Profile Form | **FR-C3.1:** The system shall provide a form with fields for name, professional title, biography, skills, and links to external portfolios (e.g., GitHub). | A profile must be at least 70% complete before a freelancer can submit proposals. |
| Skill Tagging | **FR-C3.2:** The system shall allow users to add relevant skills from a predefined list or create new ones. | Users can add a maximum of 15 skills to their profile. |

**Mockup: M-C5 — Freelancer Dashboard**
![Figure 9 Mockup: M-C5 — Freelancer Dashboard](path/to/M-C5.png)

**Table 13: Functional Requirements Derived from Mockup: M-C5**

| Feature (derived from UI) | Functional Requirement (FR-ID: Statement) | Business Rule |
| :--- | :--- | :--- |
| Data Widgets | **FR-C5.1:** The system shall display key metrics for freelancers, including active projects, submitted proposals, and total earnings. | Earnings can be filtered by date range (e.g., Last 30 Days, All Time). |
| Proposal Status | **FR-C5.2:** The system shall display a list of submitted proposals with their current status (e.g., Submitted, Viewed, Accepted, Declined). | N/A |

**Mockup: M-C3.1 — Client Profile Creation/Editing**
![Figure 10 Mockup: M-C3.1 — Client Profile Creation/Editing](path/to/M-C3.1.png)

**Table 14: Functional Requirements Derived from Mockup M-C3.1**

| Feature (derived from UI) | Functional Requirement (FR-ID: Statement) | Business Rule |
| :--- | :--- | :--- |
| Corporate Identity Form | **FR-C3.3:** The system shall provide a form for clients with fields for company name, company logo, a brief description, and official website. | A client profile must have a company name before a job can be posted. |
| Hiring History Display | **FR-C3.4:** The system shall automatically populate and display hiring statistics on the client's profile, including total spend, number of jobs posted, and hire rate. | This data is generated from on-chain activity and cannot be manually edited by the client. |
| Payment Method Status | **FR-C3.5:** The system shall display a "Verified Payment Method" badge on the client profile once they have successfully connected their wallet and funded at least one project. | The badge is automatically applied and cannot be manually added. |

**Mockup: M-C4 — Client Dashboard**
![Figure 11 Mockup: M-C4 — Client Dashboard](path/to/M-C4.png)

**Table 15: Functional Requirements Derived from Mockup: M-C4**

| Feature (derived from UI) | Functional Requirement (FR-ID: Statement) | Business Rule |
| :--- | :--- | :--- |
| Data Widgets | **FR-C4.1:** The system shall display key metrics for clients, including the number of active jobs, total proposals received, and total amount spent. | Data displayed must be updated in near real-time (latency < 1 minute). |
| Recent Activity | **FR-C4.2:** The system shall show a feed of recent activities, such as new proposals received or milestones approved. | The feed displays the 10 most recent activities. |

**Mockup: M-P1 — Freelancer Public Profile & Analytics**
![Figure 12 Mockup: M-P1 — Public Profile & Analytics](path/to/M-P1.png)

**Table 16: Functional Requirements Derived from Mockup: M-P1**

| Feature (derived from UI) | Functional Requirement (FR-ID: Statement) | Business Rule |
| :--- | :--- | :--- |
| Reputation Display | **FR-P1.1:** The system shall prominently display the user's Trust Score, AI Capability Score (for freelancers), and average star rating. | Users cannot hide their primary reputation scores. |
| Work History | **FR-P1.2:** The system shall list the user's completed projects, including project title, client/freelancer, and feedback received. | Users can choose to hide the budget of completed projects. |

**Mockup: M-P1.1 — Client Public Profile & Analytics**
![Figure 13 Mockup: M-P1.1 — Client Public Profile & Analytics](path/to/M-P1.1.png)

**Table 17: Functional Requirements Derived from Mockup M-P1.1**

| Feature (derived from UI) | Functional Requirement (FR-ID: Statement) | Business Rule |
| :--- | :--- | :--- |
| Reputation Display | **FR-P1.3:** The system shall prominently display the client's Trust Score and their average star rating as rated by freelancers. | The AI Capability Score is exclusive to freelancers and will not be displayed on a client's profile. |
| Hiring Analytics | **FR-P1.4:** The system shall display key hiring metrics, including the total number of jobs posted, the overall hire rate, and the total amount spent on the platform. | These statistics provide transparency for freelancers and cannot be hidden by the client. |
| Review History | **FR-P1.5:** The system shall display a list of completed jobs with the feedback and ratings left by the freelancers for that client. | The client's own feedback left for freelancers is visible on the respective freelancer's profile. |

#### Module 2: Smart Contract Job Board

**Mockup: M-J1 — Job Posting Form**
![Figure 14 Mockup: M-J1 — Job Posting Form](path/to/M-J1.png)

**Table 18: Functional Requirements Derived from Mockup: M-J1**

| Feature (derived from UI) | Functional Requirement (FR-ID: Statement) | Business Rule |
| :--- | :--- | :--- |
| Job Creation Form | **FR-J1.1:** The system shall provide a multi-step form for clients to enter job details, including title, description, category, and required skills. | The job description must contain a minimum of 100 characters. |
| Budget & Deadline | **FR-J1.2:** The system shall allow the client to set a project budget (fixed price or hourly) and a delivery deadline. | The budget must be specified in a supported stablecoin (e.g., USDC). |

**Mockup: M-J2 — Job Board**
![Figure 15 Mockup: M-J2 — Job Board](path/to/M-J2.png)

**Table 19: Functional Requirements Derived from Mockup: M-J2**

| Feature (derived from UI) | Functional Requirement (FR-ID: Statement) | Business Rule |
| :--- | :--- | :--- |
| Search and Filter | **FR-J2.1:** The system shall provide a search bar and advanced filters (e.g., by skill, budget range, client rating) for freelancers to find jobs. | Search results can be sorted by "Newest" or "Best Match". |
| Job Listings | **FR-J2.2:** The system shall display a list of jobs, with each entry showing the job title, budget, and required skills at a glance. | N/A |

**Mockup: M-J3 — Job Details Page**
![Figure 16 Mockup: M-J3 — Job Details Page](path/to/M-J3.png)

**Table 20: Functional Requirements Derived from Mockup: M-J3**

| Feature (derived from UI) | Functional Requirement (FR-ID: Statement) | Business Rule |
| :--- | :--- | :--- |
| Detailed View | **FR-J3.1:** The system shall display the full job description, client's work history, average rating, and total jobs posted. | The page must also show the number of proposals already submitted for the job. |
| Apply Button | **FR-J3.2:** The system shall provide a clear call-to-action button for freelancers to submit a proposal. | The button is disabled if the freelancer has already applied for the job. |

**Mockup: M-J4 — Proposal Submission Form**
![Figure 17 Mockup: M-J4 — Proposal Submission Form](path/to/M-J4.png)

**Table 21: Functional Requirements Derived from Mockup: M-J4**

| Feature (derived from UI) | Functional Requirement (FR-ID: Statement) | Business Rule |
| :--- | :--- | :--- |
| Proposal Form | **FR-J4.1:** The system shall provide a text editor for freelancers to write their cover letter and outline their approach. | The proposal must contain a minimum of 50 words. |
| Fee Submission | **FR-J4.2:** The system shall allow the freelancer to specify their proposed fee, which breaks down the total amount into the platform fee and their final earnings. | The proposed fee cannot be lower than the platform's minimum project value. |

**Mockup: M-J5 — Active Project Management**
![Figure 18 Mockup: M-J5 — Active Project Management](path/to/M-J5.png)

**Table 22: Functional Requirements Derived from Mockup: M-J5**

| Feature (derived from UI) | Functional Requirement (FR-ID: Statement) | Business Rule |
| :--- | :--- | :--- |
| Milestone Tracking | **FR-J5.1:** The system shall display a list of project milestones with their status (e.g., To Do, In Progress, Awaiting Approval, Complete). | Milestones must be funded in escrow before work on them can begin. |
| Deliverable Upload | **FR-J5.2:** The system shall provide an interface for freelancers to upload and submit deliverables for each milestone. | All uploaded files are stored on IPFS. |

**Mockup: M-J6 — Submit Work/Milestone**
![Figure 19 Mockup: M-J6 — Submit Work/Milestone](path/to/M-J6.png)

**Table 23: Functional Requirements Derived from Mockup: M-J6**

| Feature (derived from UI) | Functional Requirement (FR-ID: Statement) | Business Rule |
| :--- | :--- | :--- |
| Submission Form | **FR-J6.1:** The system shall provide a modal for freelancers to add comments and attach files when submitting a milestone for approval. | A milestone can only be submitted if it is currently "In Progress". |
| Client Notification | **FR-J6.2:** Upon submission, the system shall send an in-app and email notification to the client to review the work. | The client has 7 days to review and approve/request revisions. If no action is taken, the milestone is auto-approved. |

#### Module 3: Review & Feedback System

**Mockup: M-J7 — Review & Feedback Form**
![Figure 20 Mockup: M-J7 — Review & Feedback Form](path/to/M-J7.png)

**Table 24: Functional Requirements Derived from Mockup: M-J7**

| Feature (derived from UI) | Functional Requirement (FR-ID: Statement) | Business Rule |
| :--- | :--- | :--- |
| Rating System | **FR-J7.1:** The system shall allow users to provide a 1-5 star rating across multiple categories (e.g., Communication, Quality, Deadline). | A rating is mandatory to complete the feedback process. |
| Comment Box | **FR-J7.2:** The system shall provide a text area for users to leave a public comment about their experience. | The feedback is double-blind; neither party sees the other's feedback until both have submitted or a 14-day window closes. |

#### Module 5: Dispute Resolution

**Mockup: M-P2 — Dispute Initiation Form**
![Figure 21 Mockup: M-P2 — Dispute Initiation Form](path/to/M-P2.png)

**Table 25: Functional Requirements Derived from Mockup: M-P2**

| Feature (derived from UI) | Functional Requirement (FR-ID: Statement) | Business Rule |
| :--- | :--- | :--- |
| Guided Form | **FR-P2.1:** The system shall guide the user through initiating a dispute by asking for the reason and a description of the issue. | A dispute can only be initiated on an active, funded milestone. |
| Evidence Upload | **FR-P2.2:** The system shall allow the user to upload initial evidence files (e.g., screenshots, documents) to support their claim. | Maximum of 5 files, 25MB each. |

**Mockup: M-P3 — Dispute Voting Page**
![Figure 22 Mockup: M-P3 — Dispute Voting Page](path/to/M-P3.png)

**Table 26: Functional Requirements Derived from Mockup: M-P3**

| Feature (derived from UI) | Functional Requirement (FR-ID: Statement) | Business Rule |
| :--- | :--- | :--- |
| Evidence Review | **FR-P3.1:** The system shall present a neutral interface for jurors to view all case details and evidence submitted by both parties. | Jurors must not have any prior work history with either party involved. |
| Anonymous Voting | **FR-P3.2:** The system shall provide buttons for jurors to cast a confidential vote for either the "Client" or the "Freelancer". | A juror's voting power is weighted based on their trust score. |

#### Module 6: AI Capability Prediction System

**Mockup: M-P4 — AI Capability Score Display**
![Figure 23 Mockup: M-P4 — AI Capability Score Display](path/to/M-P4.png)

**Table 27: Functional Requirements Derived from Mockup: M-P4**

| Feature (derived from UI) | Functional Requirement (FR-ID: Statement) | Business Rule |
| :--- | :--- | :--- |
| Score Visualization | **FR-P4.1:** The system shall display the AI-generated score (e.g., "Beginner," "Intermediate," "Expert") with a clear label and an official-looking badge. | The score is only displayed for freelancers who have opted-in to the profile scan. |
| Explanatory Tooltip | **FR-P4.2:** The system shall provide a tooltip explaining that the score is an AI-generated estimate based on the freelancer's profile data and skill verifications. | N/A |

**Mockup: M-P5 — Skill Verification Hub**
![Figure 24 Mockup: M-P5 — Skill Verification Hub](path/to/M-P5.png)

**Table 28: Functional Requirements Derived from Mockup: M-P5**

| Feature (derived from UI) | Functional Requirement (FR-ID: Statement) | Business Rule |
| :--- | :--- | :--- |
| Skill List & Status | **FR-P5.1:** The system shall list all of a freelancer's skills, each with a status tag ("Verified" or "Not Verified"). | Verified skills will be given more weight by the AI capability model. |
| Test Initiation | **FR-P5.2:** The system shall provide a "Start Verification Test" button next to each unverified skill that has a test available. | A freelancer can attempt a specific skill test once every 30 days. |

**Mockup: M-P6 — Skill Verification Test (Microtask)**
![Figure 25 Mockup: M-P6 — Skill Verification Test (Microtask)](path/to/M-P6.png)

**Table 29: Functional Requirements Derived from Mockup: M-P6**

| Feature (derived from UI) | Functional Requirement (FR-ID: Statement) | Business Rule |
| :--- | :--- | :--- |
| Test Interface | **FR-P6.1:** The system shall present a clean, focused interface for the skill test, such as a multiple-choice quiz or an embedded code editor. | The test must be completed in a single, timed session. |
| Timer | **FR-P6.2:** The system shall display a countdown timer for the duration of the test. | If the timer runs out, the test is automatically submitted with the completed answers. |

**Mockup: M-P7 — Test Results Page**
![Figure 26 Mockup: M-P7 — Test Results Page](path/to/M-P7.png)

**Table 30: Functional Requirements Derived from Mockup: M-P7**

| Feature (derived from UI) | Functional Requirement (FR-ID: Statement) | Business Rule |
| :--- | :--- | :--- |
| Outcome Display | **FR-P7.1:** The system shall immediately display a clear result after the test is submitted ("Skill Verified!" or "Try Again"). | The result is final and cannot be appealed. |
| Status Update | **FR-P7.2:** Upon a successful result, the system shall automatically update the skill's status to "Verified" across the platform. | N/A |

#### Module 7: Admin Dashboard

**Mockup: M-S1 — Admin Dashboard**
![Figure 27 Mockup: M-S1 — Admin Dashboard](path/to/M-S1.png)

**Table 31: Functional Requirements Derived from Mockup: M-S1**

| Feature (derived from UI) | Functional Requirement (FR-ID: Statement) | Business Rule |
| :--- | :--- | :--- |
| Platform Metrics | **FR-S1.1:** The system shall display high-level platform health metrics, including total users, total value in escrow, and active disputes. | Access is restricted to users with the "Administrator" role. |
| Flagged Disputes | **FR-S1.2:** The system shall provide a section for administrators to review disputes that have been flagged for potential collusion or arbitration abuse. | Administrators cannot overturn a jury's decision but can suspend users who repeatedly abuse the system. |

#### Module 8: Notification and Communication System

**Mockup: M-S2 — In-App Messaging**
![Figure 28 Mockup: M-S2 — In-App Messaging](path/to/M-S2.png)

**Table 32: Functional Requirements Derived from Mockup: M-S2**

| Feature (derived from UI) | Functional Requirement (FR-ID: Statement) | Business Rule |
| :--- | :--- | :--- |
| Real-Time Chat | **FR-S2.1:** The system shall provide a real-time chat interface within the project workspace for clients and freelancers to communicate. | All chat history is archived and can be submitted as evidence in a dispute. |
| File Sharing | **FR-S2.2:** The system shall allow users to share files directly within the chat interface. | Shared files are stored on IPFS. |

**Mockup: M-S3 — Notification Center**
![Figure 29 Mockup: M-S3 — Notification Center](path/to/M-S3.png)

**Table 33: Functional Requirements Derived from Mockup: M-S3**

| Feature (derived from UI) | Functional Requirement (FR-ID: Statement) | Business Rule |
| :--- | :--- | :--- |
| Notification List | **FR-S3.1:** The system shall display a chronological list of the user's most recent notifications (e.g., new proposal, milestone approved). | The list shall display a maximum of the 10 most recent notifications. |
| Unread Indicator | **FR-S3.2:** The system shall visually distinguish between read and unread notifications and display a badge with a count of unread notifications on the bell icon. | Clicking on a notification shall mark it as read and navigate the user to the relevant page. |
| Mark All as Read | **FR-S3.3:** The system shall provide a "Mark all as read" button within the notification center. | Clicking this button will update the status of all unread items and remove the count badge from the bell icon. |

**Mockup: M-S4 — Notification Settings Page**
![Figure 30 Mockup: M-S4 — Notification Settings Page](path/to/M-S4.png)

**Table 34: Functional Requirements Derived from Mockup: M-S4**

| Feature (derived from UI) | Functional Requirement (FR-ID: Statement) | Business Rule |
| :--- | :--- | :--- |
| Notification Controls | **FR-S4.1:** The system shall provide toggle switches for users to enable or disable notifications for specific event categories (e.g., "New Proposals," "Project Messages," "Payment Updates"). | Users can set preferences for each channel independently (In-App, Email). |
| Channel Preferences | **FR-S4.2:** The system shall allow users to choose their preferred channel for receiving notifications (e.g., enable email but disable in-app for certain events). | Critical security notifications (e.g., password reset) are mandatory and cannot be disabled. |

---

### 2.3 Non-Functional Requirements

#### 2.3.1 Reliability
* **REL-1:** The system's off-chain components (web server, APIs) shall be highly available. The application should handle temporary connection losses to the blockchain network gracefully, informing the user of the status without crashing.
* **REL-2:** The smart contracts shall be developed following industry security best practices (e.g., OpenZeppelin standards) and tested against common vulnerabilities (e.g., reentrancy). The contracts shall include an emergency-stop (pausable) mechanism controllable by the system administrator.
* **REL-3:** The system shall ensure all on-chain actions are atomic. All feedback and transaction records stored on-chain shall be considered final and irreversible once confirmed by the network.

#### 2.3.2 Usability
* **USE-1:** A new user familiar with crypto wallets should be able to connect their wallet, create a profile, and perform a core action (post a job or submit a proposal) in under 10 minutes.
* **USE-2:** The user interface shall abstract away blockchain complexities. Users will interact with clear buttons (e.g., "Fund Project," "Approve Milestone") and will not need to manually handle smart contract addresses or technical transaction details.
* **USE-3:** The system shall provide immediate and clear visual feedback for the status of all significant actions, especially asynchronous ones like blockchain transactions (e.g., "Funding Escrow...", "Transaction Confirmed").

#### 2.3.3 Performance
* **PERF-1:** The user interface shall update to reflect the confirmed status of on-chain transactions (e.g., escrow funded) within 60 seconds of the user signing the transaction, contingent on the Layer-2 network's confirmation time.
* **PERF-2:** The AI capability score for a freelancer profile shall be generated and displayed within 60 seconds of the user initiating the scan.
* **PERF-3:** The web application's main pages (Dashboard, Job Board) shall achieve a Largest Contentful Paint (LCP) of under 4 seconds on a standard broadband connection.

#### 2.3.4 Security
* **SEC-1:** All communication between the client-side DApp and any off-chain backend services shall be encrypted using TLS 1.3 (HTTPS) when deployed.
* **SEC-2:** The system shall operate non-custodially. User private keys will never be stored or handled by the system; all transactions must be signed by the user through their external wallet application.
* **SEC-3:** The system will implement role-based access control for administrative functions to prevent unauthorized changes to platform-level smart contract parameters.
* **SEC-4:** To ensure data integrity and reduce on-chain costs, large files (e.g., portfolio items, dispute evidence) will be stored on IPFS, with only the resulting hash being logged on the blockchain.

#### 2.3.5 Maintainability
* **MAIN-1:** The source code for both the smart contracts and the web application will be well-commented, particularly for complex logic involving financial calculations or state changes.
* **MAIN-2:** The application will be architected in a modular fashion to allow for future upgrades or changes to individual components (e.g., the trust scoring algorithm, the AI model) with minimal impact on the rest of the system.

### 2.4 External Interface Requirements

#### 2.4.1 User Interfaces Requirements
* **UI-1: GUI Standards and Style Guide:** The application will adhere to a consistent and modern design system to ensure a professional and intuitive user experience. This includes standardized fonts (e.g., Inter), icons, button styles, color schemes, and component layouts.
* **UI-2: Responsive Design:** The web application must be fully responsive, providing an optimal and seamless user experience on all major devices, including desktops, tablets, and mobile phones.
* **UI-3: Navigational Consistency:** The system will feature a persistent and clear navigation structure for logged-in users, allowing easy access to the Dashboard, Job Board, Active Projects, and Profile settings.
* **UI-4: Message Display Conventions:** The system will use non-intrusive "toast" notifications to provide feedback to the user for actions like successful submissions, pending transactions, or errors. Critical alerts may use modals to ensure they are acknowledged.

#### 2.4.2 Software Interfaces
* **SI-1: Blockchain Network Interface**
    * **SI-1.1:** The system shall interface with a public JSON-RPC endpoint of an Ethereum-compatible Layer-2 network (e.g., Polygon) to read data from smart contracts and to broadcast signed transactions for execution.
* **SI-2: User Wallet Interface**
    * **SI-2.1:** The system shall integrate with browser-based Ethereum wallet extensions via the window.ethereum provider API (for wallets like MetaMask) and WalletConnect for connections to mobile and other desktop wallets. This interface is used exclusively for authentication and prompting the user to sign transactions.
* **SI-3: Decentralized Storage Interface**
    * **SI-3.1:** The system shall use a client-side library or a gateway API to interact with the InterPlanetary File System (IPFS) for uploading and retrieving large files, such as portfolio items and dispute evidence.

#### 2.4.3 Hardware Interfaces
As DeTrust is a web-based decentralized application, it does not directly interface with any specialized hardware components. All interactions are handled through the user's standard computer or mobile device.

#### 2.4.4 Communications Interfaces
* **CI-1: Blockchain Node Communication**
    * **CI-1.1:** The client-side application will communicate with a blockchain node provider (e.g., Infura, Alchemy) over a secure WebSocket (WSS) or HTTPS connection to receive real-time event updates from the smart contracts and to query the state of the blockchain.
* **CI-2: Off-Chain Notifications**
    * **CI-2.1:** The system may use a lightweight backend service to manage off-chain notifications. This service will use WebSockets to push real-time alerts to the user's browser (e.g., "You have received a new proposal").
    * **CI-2.2:** For critical asynchronous events (e.g., dispute resolution outcomes, password resets for email accounts), the system shall send notifications to the user's registered email address via an external email service.

---

# Chapter 7: References

1.  Nguyen, T., Lee, G. M., Sun, K., Guitton, F., & Guo, Y. “A Blockchain-based Trust System for Decentralised Applications: When trustless needs trust.” Future Generation Computer Systems, vol. 124, pp. 68–79, May 2021
2.  IEEE, "MIG: Addressing the Cold-Start Problem in Task Recommendations," 2024, https://ieeexplore.ieee.org/document/10831509/
3.  Radosavljevic, M., Pesic, A., Petrovic, N., & Tosic, M. “Freelancing Blockchain: A Practical Case-Study of Trust-Driven Applications Development.” Proceedings of the 2021 International Conference on Electrical, Electronic, and Computing Engineering (IcETRAN), Ethno Village Stanisic, Bosnia and Herzegovina, pp. 8–10, September 2021.
4.  Kellogg School of Management. (2022). Algorithmic Bias in Online Labor Platforms. Retrieved from: https://insight.kellogg.northwestern.edu/article/algorithmic-bias-gig-economy
5.  Upwork. (2025). Upwork Service Fees. Retrieved from: https://support.upwork.com/hc/en-us/articles/211062538-Freelancer-Service-Fees
6.  Fiverr. (2025). Fiverr Seller Fees. Retrieved from: https://www.fiverr.com/terms_of_service/seller
7.  Freelancers Union & Upwork. (2025). Survey: Freelancers and Payment Challenges. Retrieved from: https://www.freelancersunion.org/resources/freelancing-in-america/
8.  Upwork. (2025). Dispute Assistance Process. Retrieved from: https://support.upwork.com/hc/en-us/articles/211067788-Dispute-Assistance
9.  Upwork. (2025). Arbitration Rules. Retrieved from: https://www.upwork.com/legal#arb
10. Public dataset: Freelance Contracts Dataset (1.3 Million Entries)

---

# Chapter 8: Plagiarism Report

![Figure 31 Plagiarism Report](path/to/plagiarism_report.png)