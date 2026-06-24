import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const skills = [
	// ── Smart Contracts ──
	{ name: 'Solidity', slug: 'solidity', category: 'Smart Contracts', description: 'Authoring and maintaining Ethereum Virtual Machine smart contracts.' },
	{ name: 'Hardhat Tooling', slug: 'hardhat', category: 'Smart Contracts', description: 'Testing, forking, and deploying Solidity projects with Hardhat plugins.' },
	{ name: 'Escrow Contract Architecture', slug: 'escrow-contracts', category: 'Smart Contracts', description: 'Milestone-based escrow logic, payout routing, and risk mitigations.' },
	{ name: 'Foundry', slug: 'foundry', category: 'Smart Contracts', description: 'Blazing-fast Solidity testing and deployment with Forge, Cast, and Anvil.' },
	{ name: 'Vyper', slug: 'vyper', category: 'Smart Contracts', description: 'Writing secure Ethereum smart contracts using the Pythonic Vyper language.' },
	{ name: 'OpenZeppelin', slug: 'openzeppelin', category: 'Smart Contracts', description: 'Leveraging battle-tested OpenZeppelin contract libraries and upgradeable patterns.' },
	{ name: 'ERC Standards', slug: 'erc-standards', category: 'Smart Contracts', description: 'Implementing ERC-20, ERC-721, ERC-1155, ERC-4337 and other token standards.' },

	// ── Web3 Engineering ──
	{ name: 'Ethers.js', slug: 'ethersjs', category: 'Web3 Engineering', description: 'Interacting with EVM networks and account abstraction flows using Ethers.js.' },
	{ name: 'Wagmi / Viem', slug: 'wagmi-viem', category: 'Web3 Engineering', description: 'Type-safe React hooks and low-level EVM primitives for dApp frontends.' },
	{ name: 'Web3.js', slug: 'web3js', category: 'Web3 Engineering', description: 'Building browser and Node.js dApps with the classic Web3.js library.' },
	{ name: 'The Graph (Subgraphs)', slug: 'the-graph', category: 'Web3 Engineering', description: 'Indexing on-chain data with custom subgraphs for fast GraphQL queries.' },
	{ name: 'IPFS / Filecoin', slug: 'ipfs-filecoin', category: 'Web3 Engineering', description: 'Decentralized file storage, pinning strategies, and content addressing.' },
	{ name: 'Account Abstraction (ERC-4337)', slug: 'account-abstraction', category: 'Web3 Engineering', description: 'Implementing smart accounts, paymasters, and bundlers for gasless UX.' },
	{ name: 'Chainlink Automation', slug: 'chainlink-automation', category: 'Web3 Engineering', description: 'Designing autonomous execution pipelines with Chainlink Keepers and Functions.' },
	{ name: 'Polygon / L2 Solutions', slug: 'polygon-l2', category: 'Web3 Engineering', description: 'Developing on Polygon, Optimism, Arbitrum, and zkSync rollup ecosystems.' },

	// ── Frontend Engineering ──
	{ name: 'React', slug: 'react', category: 'Frontend Engineering', description: 'Building component-driven interfaces with React 18+ and concurrent features.' },
	{ name: 'Next.js', slug: 'nextjs', category: 'Frontend Engineering', description: 'Delivering hybrid-rendered web apps with App Router, edge streaming, and server actions.' },
	{ name: 'Vue.js', slug: 'vuejs', category: 'Frontend Engineering', description: 'Reactive frontends with Vue 3 Composition API and single-file components.' },
	{ name: 'Angular', slug: 'angular', category: 'Frontend Engineering', description: 'Enterprise-scale SPAs with Angular signals, standalone components, and RxJS.' },
	{ name: 'Svelte / SvelteKit', slug: 'svelte', category: 'Frontend Engineering', description: 'Compiler-first UI framework delivering zero-runtime-overhead apps.' },
	{ name: 'Tailwind CSS', slug: 'tailwind-css', category: 'Frontend Engineering', description: 'Utility-first CSS for rapid, consistent, responsive styling.' },
	{ name: 'HTML / CSS', slug: 'html-css', category: 'Frontend Engineering', description: 'Semantic markup, responsive layouts, and modern CSS features.' },
	{ name: 'JavaScript', slug: 'javascript', category: 'Frontend Engineering', description: 'Core language fluency including ES2024+, async patterns, and DOM APIs.' },
	{ name: 'Redux / State Management', slug: 'redux-state', category: 'Frontend Engineering', description: 'Scalable client state with Redux Toolkit, Zustand, or Jotai.' },

	// ── Backend Engineering ──
	{ name: 'Node.js', slug: 'nodejs', category: 'Backend Engineering', description: 'Server-side JavaScript with event loop mastery and native module bindings.' },
	{ name: 'Express.js', slug: 'expressjs', category: 'Backend Engineering', description: 'Building RESTful APIs with Express middleware, routing, and error handling.' },
	{ name: 'NestJS', slug: 'nestjs', category: 'Backend Engineering', description: 'Enterprise Node.js with decorators, dependency injection, and modular architecture.' },
	{ name: 'Python', slug: 'python', category: 'Backend Engineering', description: 'General-purpose Python development for APIs, scripting, and data processing.' },
	{ name: 'FastAPI', slug: 'fastapi', category: 'Backend Engineering', description: 'High-performance async Python APIs with Pydantic validation and OpenAPI docs.' },
	{ name: 'Django', slug: 'django', category: 'Backend Engineering', description: 'Full-featured Python web framework with ORM, admin, and auth built in.' },
	{ name: 'Go (Golang)', slug: 'golang', category: 'Backend Engineering', description: 'Concurrent, statically-typed backend services and microservices in Go.' },
	{ name: 'Java / Spring Boot', slug: 'java-spring', category: 'Backend Engineering', description: 'Enterprise Java backends with Spring Boot auto-configuration and DI.' },
	{ name: 'PHP / Laravel', slug: 'php-laravel', category: 'Backend Engineering', description: 'Elegant web applications with Laravel Eloquent ORM and Blade templates.' },
	{ name: 'Ruby on Rails', slug: 'ruby-rails', category: 'Backend Engineering', description: 'Convention-over-configuration web development with Rails and ActiveRecord.' },
	{ name: 'REST API Design', slug: 'rest-api-design', category: 'Backend Engineering', description: 'RESTful resource modeling, versioning, pagination, and HATEOAS.' },
	{ name: 'GraphQL', slug: 'graphql', category: 'Backend Engineering', description: 'Modeling strongly-typed API schemas and performant resolvers with caching strategies.' },

	// ── Programming Languages ──
	{ name: 'TypeScript', slug: 'typescript', category: 'Programming Languages', description: 'Statically typed application development with modern TypeScript patterns.' },
	{ name: 'Rust', slug: 'rust', category: 'Programming Languages', description: 'Writing memory-safe services, smart contracts, and off-chain workers in Rust.' },
	{ name: 'C / C++', slug: 'c-cpp', category: 'Programming Languages', description: 'Systems programming, embedded development, and performance-critical code.' },
	{ name: 'C# / .NET', slug: 'csharp-dotnet', category: 'Programming Languages', description: 'Cross-platform applications with .NET 8, ASP.NET Core, and Blazor.' },
	{ name: 'Kotlin', slug: 'kotlin', category: 'Programming Languages', description: 'Modern JVM and Android development with coroutines and multiplatform support.' },
	{ name: 'Swift', slug: 'swift', category: 'Programming Languages', description: 'Apple ecosystem development with SwiftUI, Combine, and async/await.' },

	// ── Mobile Development ──
	{ name: 'React Native', slug: 'react-native', category: 'Mobile Development', description: 'Cross-platform mobile apps with React Native and Expo.' },
	{ name: 'Flutter / Dart', slug: 'flutter', category: 'Mobile Development', description: 'Beautiful cross-platform apps with Flutter widgets and Dart.' },
	{ name: 'iOS Development', slug: 'ios-development', category: 'Mobile Development', description: 'Native iOS apps with Swift, UIKit, and SwiftUI.' },
	{ name: 'Android Development', slug: 'android-development', category: 'Mobile Development', description: 'Native Android apps with Kotlin, Jetpack Compose, and Material Design.' },

	// ── Data Infrastructure ──
	{ name: 'PostgreSQL', slug: 'postgresql', category: 'Data Infrastructure', description: 'Relational database design, indexing, and query optimization in Postgres.' },
	{ name: 'MongoDB', slug: 'mongodb', category: 'Data Infrastructure', description: 'Document-oriented data modeling, aggregation pipelines, and Atlas deployment.' },
	{ name: 'Redis', slug: 'redis', category: 'Data Infrastructure', description: 'In-memory caching, pub/sub, rate limiting, and session management.' },
	{ name: 'MySQL', slug: 'mysql', category: 'Data Infrastructure', description: 'Relational database management with MySQL replication and InnoDB tuning.' },
	{ name: 'Prisma ORM', slug: 'prisma', category: 'Data Infrastructure', description: 'Type-safe database access with Prisma Client, migrations, and schema modeling.' },
	{ name: 'Elasticsearch', slug: 'elasticsearch', category: 'Data Infrastructure', description: 'Full-text search, log analytics, and real-time indexing at scale.' },
	{ name: 'Apache Kafka', slug: 'kafka', category: 'Data Infrastructure', description: 'Event streaming, message queuing, and distributed data pipelines.' },

	// ── DevOps & Infrastructure ──
	{ name: 'Docker', slug: 'docker', category: 'DevOps', description: 'Containerization with multi-stage builds, compose orchestration, and registries.' },
	{ name: 'Kubernetes', slug: 'kubernetes', category: 'DevOps', description: 'Container orchestration with autoscaling, GitOps, and secure supply chains.' },
	{ name: 'CI/CD Pipelines', slug: 'cicd', category: 'DevOps', description: 'Automated build, test, and deploy pipelines with GitHub Actions, GitLab CI, or Jenkins.' },
	{ name: 'AWS', slug: 'aws', category: 'DevOps', description: 'Cloud infrastructure with EC2, Lambda, S3, RDS, and CDK / CloudFormation.' },
	{ name: 'Azure', slug: 'azure', category: 'DevOps', description: 'Microsoft cloud services including App Service, Functions, and Azure DevOps.' },
	{ name: 'Google Cloud Platform', slug: 'gcp', category: 'DevOps', description: 'GCP services including Cloud Run, BigQuery, and Firebase.' },
	{ name: 'Terraform', slug: 'terraform', category: 'DevOps', description: 'Infrastructure as Code for multi-cloud provisioning and state management.' },
	{ name: 'Linux System Administration', slug: 'linux-sysadmin', category: 'DevOps', description: 'Server management, shell scripting, networking, and security hardening.' },
	{ name: 'Nginx / Reverse Proxy', slug: 'nginx', category: 'DevOps', description: 'Web server configuration, load balancing, SSL termination, and caching.' },

	// ── Security ──
	{ name: 'Smart Contract Auditing', slug: 'smart-contract-auditing', category: 'Security', description: 'Formal reviews, invariant testing, and exploit prevention for on-chain systems.' },
	{ name: 'Penetration Testing', slug: 'pentesting', category: 'Security', description: 'Ethical hacking, vulnerability assessment, and OWASP Top 10 remediation.' },
	{ name: 'Application Security', slug: 'appsec', category: 'Security', description: 'Secure coding practices, SAST/DAST tooling, and threat modeling.' },
	{ name: 'Cryptography', slug: 'cryptography', category: 'Security', description: 'Implementing encryption, hashing, digital signatures, and key management.' },

	// ── Applied Cryptography ──
	{ name: 'Zero-Knowledge Proofs', slug: 'zero-knowledge-proofs', category: 'Applied Cryptography', description: 'Designing zk circuits and integrating proof systems such as Groth16 and PLONK.' },

	// ── AI & Machine Learning ──
	{ name: 'Prompt Engineering', slug: 'prompt-engineering', category: 'AI & Machine Learning', description: 'Designing reliable LLM instructions, guardrails, and evaluation loops.' },
	{ name: 'LangChain', slug: 'langchain', category: 'AI & Machine Learning', description: 'Building agentic workflows, retrievers, and tool-using pipelines with LangChain.' },
	{ name: 'TensorFlow', slug: 'tensorflow', category: 'AI & Machine Learning', description: 'Training, optimizing, and serving deep learning models with TensorFlow and Keras.' },
	{ name: 'PyTorch', slug: 'pytorch', category: 'AI & Machine Learning', description: 'Deep learning research and production with PyTorch, Lightning, and ONNX export.' },
	{ name: 'OpenAI API / GPT Integration', slug: 'openai-api', category: 'AI & Machine Learning', description: 'Building intelligent apps with OpenAI chat completions, embeddings, and function calling.' },
	{ name: 'Computer Vision', slug: 'computer-vision', category: 'AI & Machine Learning', description: 'Image classification, object detection, and segmentation with CNNs and transformers.' },
	{ name: 'Natural Language Processing', slug: 'nlp', category: 'AI & Machine Learning', description: 'Text analysis, sentiment detection, NER, and transformer fine-tuning.' },
	{ name: 'Data Science / Analytics', slug: 'data-science', category: 'AI & Machine Learning', description: 'Statistical analysis, visualization, and insight extraction with pandas and notebooks.' },
	{ name: 'MLOps', slug: 'mlops', category: 'AI & Machine Learning', description: 'ML model lifecycle management with MLflow, DVC, and automated retraining pipelines.' },
	{ name: 'RAG (Retrieval-Augmented Generation)', slug: 'rag', category: 'AI & Machine Learning', description: 'Building knowledge-grounded AI systems with vector stores and retrieval pipelines.' },

	// ── Product Design ──
	{ name: 'UI/UX Design', slug: 'ui-ux-design', category: 'Product Design', description: 'User research, wireframing, prototyping, and interaction design.' },
	{ name: 'Figma', slug: 'figma', category: 'Product Design', description: 'Collaborative interface design with components, auto-layout, and design tokens.' },
	{ name: 'Web3 Product UX', slug: 'web3-product-ux', category: 'Product Design', description: 'Design systems and research for wallet-native, multi-chain user experiences.' },
	{ name: 'Responsive Web Design', slug: 'responsive-design', category: 'Product Design', description: 'Mobile-first layouts, fluid grids, and cross-device testing strategies.' },
	{ name: 'Accessibility (WCAG)', slug: 'accessibility', category: 'Product Design', description: 'WCAG 2.2 AA compliance, ARIA patterns, and inclusive design.' },

	// ── Decentralized Operations ──
	{ name: 'DAO Governance Strategy', slug: 'dao-governance', category: 'Decentralized Operations', description: 'Token-voting frameworks, incentive design, and treasury management for DAOs.' },
	{ name: 'Tokenomics', slug: 'tokenomics', category: 'Decentralized Operations', description: 'Token supply modeling, vesting schedules, and incentive mechanism design.' },
	{ name: 'DeFi Protocol Development', slug: 'defi-protocols', category: 'Decentralized Operations', description: 'Building lending, DEX, yield, and staking protocols with composable contracts.' },

	// ── Trust & Safety ──
	{ name: 'On-chain Dispute Operations', slug: 'dispute-operations', category: 'Trust & Safety', description: 'Workflow design for arbitration, juror selection, and evidence evaluation.' },
	{ name: 'KYC / Identity Verification', slug: 'kyc-identity', category: 'Trust & Safety', description: 'Identity verification flows, compliance frameworks, and fraud detection.' },

	// ── Testing & QA ──
	{ name: 'Unit Testing', slug: 'unit-testing', category: 'Testing & QA', description: 'Writing isolated, fast tests with Jest, Vitest, Mocha, or pytest.' },
	{ name: 'E2E Testing (Playwright)', slug: 'e2e-playwright', category: 'Testing & QA', description: 'Browser automation and end-to-end testing with Playwright or Cypress.' },
	{ name: 'Smart Contract Testing', slug: 'contract-testing', category: 'Testing & QA', description: 'Hardhat/Foundry test suites with fuzzing, invariant checks, and fork testing.' },

	// ── Content & Marketing ──
	{ name: 'Technical Writing', slug: 'technical-writing', category: 'Content & Marketing', description: 'API docs, developer guides, tutorials, and README authoring.' },
	{ name: 'SEO', slug: 'seo', category: 'Content & Marketing', description: 'Search engine optimization including technical SEO, schema markup, and Core Web Vitals.' },
	{ name: 'Copywriting', slug: 'copywriting', category: 'Content & Marketing', description: 'Persuasive writing for landing pages, email campaigns, and product messaging.' },
	{ name: 'Social Media Marketing', slug: 'social-media-marketing', category: 'Content & Marketing', description: 'Growth strategies, content calendars, and community engagement.' },

	// ── Project Management ──
	{ name: 'Agile / Scrum', slug: 'agile-scrum', category: 'Project Management', description: 'Sprint planning, backlog refinement, retrospectives, and velocity tracking.' },
	{ name: 'Product Management', slug: 'product-management', category: 'Project Management', description: 'Roadmap planning, user stories, prioritization frameworks, and stakeholder management.' },

	// ── Data Engineering ──
	{ name: 'ETL / Data Pipelines', slug: 'etl-pipelines', category: 'Data Engineering', description: 'Building data extraction, transformation, and loading workflows with Airflow or dbt.' },
	{ name: 'Data Visualization', slug: 'data-visualization', category: 'Data Engineering', description: 'Interactive dashboards with D3.js, Chart.js, Recharts, or Tableau.' },

	// ── Game & 3D ──
	{ name: 'Unity / C#', slug: 'unity-csharp', category: 'Game Development', description: 'Game development and interactive 3D experiences with Unity engine.' },
	{ name: 'Three.js / WebGL', slug: 'threejs-webgl', category: 'Game Development', description: 'Browser-based 3D graphics, shaders, and immersive web experiences.' },
];

async function main() {
	console.log('🌱 Seeding skills directory...');

	for (const skill of skills) {
		await prisma.skill.upsert({
			where: { slug: skill.slug },
			update: {
				name: skill.name,
				category: skill.category,
				description: skill.description,
				isActive: true,
			},
			create: {
				name: skill.name,
				slug: skill.slug,
				category: skill.category,
				description: skill.description,
			},
		});
	}

	console.log(`✅ Seeded ${skills.length} skills.`);
}

main()
	.catch((error) => {
		console.error('❌ Seed failed', error);
		process.exitCode = 1;
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
