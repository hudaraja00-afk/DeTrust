/**
 * @swagger
 * /health:
 *   get:
 *     tags: [Health]
 *     summary: Health check
 *     responses:
 *       200:
 *         description: Server is healthy
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, name]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string, minLength: 8 }
 *               name: { type: string }
 *               walletAddress: { type: string }
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Validation error
 *
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login with email and password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Login successful, JWT set in httpOnly cookie
 *       401:
 *         description: Invalid credentials
 *
 * /auth/wallet-login:
 *   post:
 *     tags: [Auth]
 *     summary: Login with SIWE (Sign-In with Ethereum)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [message, signature]
 *             properties:
 *               message: { type: string }
 *               signature: { type: string }
 *     responses:
 *       200:
 *         description: Wallet login successful
 *
 * /auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Logout (clear auth cookie)
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Logged out
 *
 * /auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Refresh JWT token
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Token refreshed
 */

/**
 * @swagger
 * /users/me:
 *   get:
 *     tags: [Users]
 *     summary: Get current authenticated user profile
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: User profile data
 *
 * /users/{id}:
 *   get:
 *     tags: [Users]
 *     summary: Get a user's public profile
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: User profile
 *       404:
 *         description: User not found
 *
 * /users/{id}/trust-score:
 *   get:
 *     tags: [Users]
 *     summary: Get trust score breakdown for a user
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Trust score with component breakdown
 *
 * /users/{id}/trust-score/history:
 *   get:
 *     tags: [Users]
 *     summary: Get trust score history (trend data)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Array of historical trust score snapshots
 */

/**
 * @swagger
 * /jobs:
 *   get:
 *     tags: [Jobs]
 *     summary: List and search jobs
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Keyword search
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *       - in: query
 *         name: type
 *         schema: { type: string, enum: [FIXED, HOURLY] }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [DRAFT, OPEN, IN_PROGRESS, COMPLETED, CANCELLED] }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: Paginated job list
 *   post:
 *     tags: [Jobs]
 *     summary: Create a new job posting
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, description, type]
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *               type: { type: string, enum: [FIXED, HOURLY] }
 *               budgetMin: { type: number }
 *               budgetMax: { type: number }
 *               skills: { type: array, items: { type: string } }
 *     responses:
 *       201:
 *         description: Job created
 *
 * /jobs/{id}:
 *   get:
 *     tags: [Jobs]
 *     summary: Get job details
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Job details
 */

/**
 * @swagger
 * /proposals:
 *   post:
 *     tags: [Proposals]
 *     summary: Submit a proposal for a job
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [jobId, coverLetter, rate]
 *             properties:
 *               jobId: { type: string }
 *               coverLetter: { type: string, minLength: 50 }
 *               rate: { type: number }
 *               estimatedDuration: { type: string }
 *     responses:
 *       201:
 *         description: Proposal submitted
 *
 * /proposals/job/{jobId}:
 *   get:
 *     tags: [Proposals]
 *     summary: Get proposals for a specific job
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: List of proposals
 */

/**
 * @swagger
 * /contracts:
 *   get:
 *     tags: [Contracts]
 *     summary: List contracts for the authenticated user
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Paginated contract list
 *
 * /contracts/{id}:
 *   get:
 *     tags: [Contracts]
 *     summary: Get contract details with milestones
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Contract with milestones
 *
 * /contracts/{id}/fund:
 *   post:
 *     tags: [Contracts]
 *     summary: Record escrow funding for a contract
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [txHash]
 *             properties:
 *               txHash: { type: string }
 *     responses:
 *       200:
 *         description: Contract funded
 */

/**
 * @swagger
 * /reviews:
 *   get:
 *     tags: [Reviews]
 *     summary: Get reviews for a user
 *     parameters:
 *       - in: query
 *         name: subjectId
 *         schema: { type: string }
 *       - in: query
 *         name: minRating
 *         schema: { type: number }
 *       - in: query
 *         name: maxRating
 *         schema: { type: number }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: sort
 *         schema: { type: string, enum: [createdAt, overallRating] }
 *       - in: query
 *         name: order
 *         schema: { type: string, enum: [asc, desc] }
 *     responses:
 *       200:
 *         description: Paginated review list
 *   post:
 *     tags: [Reviews]
 *     summary: Submit a review for a completed contract
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [contractId, overallRating, comment]
 *             properties:
 *               contractId: { type: string }
 *               overallRating: { type: number, minimum: 1, maximum: 5 }
 *               communicationRating: { type: number }
 *               qualityRating: { type: number }
 *               timelinessRating: { type: number }
 *               professionalismRating: { type: number }
 *               comment: { type: string, minLength: 10, maxLength: 2000 }
 *     responses:
 *       201:
 *         description: Review submitted
 *
 * /reviews/{reviewId}/response:
 *   post:
 *     tags: [Reviews]
 *     summary: Submit a one-time rebuttal to a review (reviewed party only)
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [responseText]
 *             properties:
 *               responseText: { type: string, minLength: 10, maxLength: 2000 }
 *     responses:
 *       200:
 *         description: Response submitted (immutable)
 */

/**
 * @swagger
 * /disputes:
 *   get:
 *     tags: [Disputes]
 *     summary: List disputes (own for users, all for admin)
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [OPEN, VOTING, RESOLVED] }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: Paginated dispute list
 *   post:
 *     tags: [Disputes]
 *     summary: Create a dispute on an active contract
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [contractId, reason]
 *             properties:
 *               contractId: { type: string }
 *               reason: { type: string }
 *               description: { type: string }
 *               evidenceUrls: { type: array, items: { type: string } }
 *     responses:
 *       201:
 *         description: Dispute created
 *
 * /disputes/{disputeId}:
 *   get:
 *     tags: [Disputes]
 *     summary: Get dispute details
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: disputeId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Dispute details with votes
 *
 * /disputes/{disputeId}/eligibility:
 *   get:
 *     tags: [Disputes]
 *     summary: Check juror eligibility for a dispute
 *     description: Returns whether the authenticated user meets the requirements to serve as a juror (trust score >= 50, not a party, hasn't voted).
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: disputeId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Eligibility check result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 eligible: { type: boolean }
 *                 trustScore: { type: number }
 *                 minimumRequired: { type: integer, example: 50 }
 *                 meetsScoreRequirement: { type: boolean }
 *                 isParty: { type: boolean }
 *                 hasVoted: { type: boolean }
 *                 isAdmin: { type: boolean }
 *                 isVotingOpen: { type: boolean }
 *                 withinDeadline: { type: boolean }
 *
 * /disputes/{disputeId}/vote:
 *   post:
 *     tags: [Disputes]
 *     summary: Cast a vote on a dispute (juror or admin)
 *     description: Requires trust score >= 50 for non-admin jurors. Admin always has weight 10.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: disputeId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [vote]
 *             properties:
 *               vote: { type: string, enum: [CLIENT_WINS, FREELANCER_WINS] }
 *               reasoning: { type: string }
 *     responses:
 *       201:
 *         description: Vote cast
 *       403:
 *         description: Trust score too low or not eligible
 *
 * /disputes/{disputeId}/evidence:
 *   post:
 *     tags: [Disputes]
 *     summary: Submit additional evidence
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: disputeId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Evidence submitted
 *
 * /disputes/{disputeId}/start-voting:
 *   post:
 *     tags: [Disputes]
 *     summary: Start voting phase (admin only)
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: disputeId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Voting phase started
 *
 * /disputes/{disputeId}/resolve:
 *   post:
 *     tags: [Disputes]
 *     summary: Admin directly resolves a dispute
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: disputeId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [outcome, resolution]
 *             properties:
 *               outcome: { type: string, enum: [CLIENT_WINS, FREELANCER_WINS, SPLIT] }
 *               resolution: { type: string }
 *     responses:
 *       200:
 *         description: Dispute resolved
 */

/**
 * @swagger
 * /messages:
 *   post:
 *     tags: [Messages]
 *     summary: Send a message
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [recipientId, content]
 *             properties:
 *               recipientId: { type: string }
 *               content: { type: string }
 *     responses:
 *       201:
 *         description: Message sent
 *
 * /messages/conversations:
 *   get:
 *     tags: [Messages]
 *     summary: List conversations
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Conversation list with last message preview
 *
 * /messages/conversations/{recipientId}:
 *   get:
 *     tags: [Messages]
 *     summary: Get messages in a conversation
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: recipientId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Paginated message list
 *
 * /messages/unread:
 *   get:
 *     tags: [Messages]
 *     summary: Get unread message count
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Unread count
 */

/**
 * @swagger
 * /notifications:
 *   get:
 *     tags: [Notifications]
 *     summary: Get notifications for authenticated user
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Notification list
 *
 * /notifications/unread-count:
 *   get:
 *     tags: [Notifications]
 *     summary: Get unread notification count
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Unread count
 *
 * /notifications/{id}/read:
 *   patch:
 *     tags: [Notifications]
 *     summary: Mark a notification as read
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Notification marked as read
 *
 * /notifications/read-all:
 *   patch:
 *     tags: [Notifications]
 *     summary: Mark all notifications as read
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read
 */

/**
 * @swagger
 * /admin/stats:
 *   get:
 *     tags: [Admin]
 *     summary: Get platform-wide statistics
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Platform statistics (users, jobs, contracts, disputes, revenue)
 *
 * /admin/trends:
 *   get:
 *     tags: [Admin]
 *     summary: Monthly growth trends (6 months)
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Monthly trend data
 *
 * /admin/activity:
 *   get:
 *     tags: [Admin]
 *     summary: Recent platform activity feed
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 15, maximum: 50 }
 *     responses:
 *       200:
 *         description: Activity feed
 *
 * /admin/users:
 *   get:
 *     tags: [Admin]
 *     summary: List users with search, filter, and pagination
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: role
 *         schema: { type: string, enum: [FREELANCER, CLIENT, ADMIN] }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [ACTIVE, SUSPENDED] }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: Paginated user list
 *
 * /admin/users/{userId}/status:
 *   patch:
 *     tags: [Admin]
 *     summary: Suspend or activate a user
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [ACTIVE, SUSPENDED] }
 *     responses:
 *       200:
 *         description: User status updated
 *
 * /admin/jobs:
 *   get:
 *     tags: [Admin]
 *     summary: List all jobs with admin filters
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Paginated job list
 *
 * /admin/flagged:
 *   get:
 *     tags: [Admin]
 *     summary: Get flagged accounts with risk levels
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Flagged accounts with risk assessment
 */
