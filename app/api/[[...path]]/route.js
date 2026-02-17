import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { connectToDatabase, getCollection } from '@/lib/db';
import { createToken, verifyToken, hashPassword, verifyPassword, generateOTP, getUserFromToken } from '@/lib/auth';
import { seedDatabase } from '@/lib/seed';

// Helper function to create response
function jsonResponse(data, status = 200) {
  return NextResponse.json(data, { status });
}

// Helper to get auth user
async function getAuthUser(request) {
  const token = request.cookies.get('auth_token')?.value;
  if (!token) return null;
  return await getUserFromToken(token);
}

// Parse the path from the URL
function getPath(request) {
  const url = new URL(request.url);
  const pathname = url.pathname.replace('/api', '') || '/';
  return pathname;
}

// GET Requests Handler
export async function GET(request) {
  const path = getPath(request);
  const { searchParams } = new URL(request.url);

  try {
    await connectToDatabase();

    // Home page data
    if (path === '/home' || path === '/') {
      await seedDatabase();
      const exams = await getCollection('exams');
      const notifications = await getCollection('exam_notifications');
      const testimonials = await getCollection('testimonials');
      const jobs = await getCollection('jobs');
      const colleges = await getCollection('colleges');

      return jsonResponse({
        success: true,
        data: {
          exams: await exams.find({ status: 'Active' }).toArray(),
          notifications: await notifications.find({}).sort({ createdAt: -1 }).limit(4).toArray(),
          testimonials: await testimonials.find({}).limit(3).toArray(),
          jobs: await jobs.find({ status: 'Active' }).sort({ createdAt: -1 }).limit(3).toArray(),
          colleges: await colleges.find({}).sort({ ranking: 1 }).limit(4).toArray()
        }
      });
    }

    // All Exams
    if (path === '/exams') {
      const exams = await getCollection('exams');
      const category = searchParams.get('category');
      const query = category ? { status: 'Active', category } : { status: 'Active' };
      return jsonResponse({
        success: true,
        data: await exams.find(query).toArray()
      });
    }

    // Single Exam by slug - only show PUBLISHED mock tests for THIS EXAM to users
    if (path.startsWith('/exams/')) {
      const slug = path.split('/exams/')[1];
      const exams = await getCollection('exams');
      const exam = await exams.findOne({ slug });
      
      if (!exam) {
        return jsonResponse({ success: false, error: 'Exam not found' }, 404);
      }

      const mockTests = await getCollection('mock_tests');
      const previousPapers = await getCollection('previous_papers');
      const topperNotes = await getCollection('topper_notes');
      const questions = await getCollection('questions');

      // Get ONLY mock tests for THIS EXAM that are published and active
      // Filter by: examId matches current exam, isPublished = true, status = Active
      const examMockTests = await mockTests.find({
        examId: exam.id,
        isPublished: true,
        status: 'Active'
      }).toArray();

      // Add question count to each test (case-insensitive status check)
      const testsWithCount = await Promise.all(examMockTests.map(async (test) => {
        // Count questions with status Active or active (case-insensitive)
        const qCount = await questions.countDocuments({ 
          mockTestId: test.id, 
          $or: [
            { status: 'Active' },
            { status: 'active' },
            { status: { $exists: false } }
          ]
        });
        return { ...test, questionCount: qCount };
      }));

      // Only return tests that actually have questions
      const finalTests = testsWithCount.filter(t => t.questionCount > 0);

      return jsonResponse({
        success: true,
        data: {
          exam,
          mockTests: finalTests,
          previousPapers: await previousPapers.find({ examId: exam.id }).toArray(),
          topperNotes: await topperNotes.find({ examId: exam.id }).toArray(),
          questionBankCount: await questions.countDocuments({ status: 'Active' })
        }
      });
    }

    // Leaderboard for an exam - PUBLIC endpoint
    if (path.startsWith('/leaderboard/')) {
      const slug = path.split('/leaderboard/')[1];
      const exams = await getCollection('exams');
      const exam = await exams.findOne({ slug });
      
      if (!exam) {
        return jsonResponse({ success: false, error: 'Exam not found' }, 404);
      }

      const mockTests = await getCollection('mock_tests');
      const attempts = await getCollection('test_attempts');
      const users = await getCollection('users');

      // Get all mock test IDs for this exam
      const examMockTests = await mockTests.find({ examId: exam.id }).toArray();
      const mockTestIds = examMockTests.map(t => t.id);

      if (mockTestIds.length === 0) {
        return jsonResponse({
          success: true,
          data: {
            exam: { name: exam.name, slug: exam.slug, icon: exam.icon },
            leaderboard: [],
            totalParticipants: 0
          }
        });
      }

      // Aggregate: Get best score per user across all tests in this exam
      const pipeline = [
        // Match completed attempts for this exam's tests
        {
          $match: {
            mockTestId: { $in: mockTestIds },
            status: 'COMPLETED'
          }
        },
        // Group by userId to get best score and stats
        {
          $group: {
            _id: '$userId',
            bestScore: { $max: '$score' },
            totalMarks: { $first: '$totalMarks' },
            attempts: { $sum: 1 },
            lastAttempt: { $max: '$endTime' },
            bestCorrect: { $max: '$correct' },
            bestIncorrect: { $min: '$incorrect' }
          }
        },
        // Sort by best score descending
        {
          $sort: { bestScore: -1, lastAttempt: 1 }
        },
        // Limit to top 100
        {
          $limit: 100
        }
      ];

      const leaderboardData = await attempts.aggregate(pipeline).toArray();

      // Get user details for each entry
      const userIds = leaderboardData.map(entry => entry._id);
      const userList = await users.find({ id: { $in: userIds } }).toArray();
      const userMap = {};
      userList.forEach(u => {
        userMap[u.id] = { name: u.name, email: u.email };
      });

      // Build final leaderboard with ranks
      const leaderboard = leaderboardData.map((entry, index) => {
        const user = userMap[entry._id] || { name: 'Anonymous' };
        const accuracy = entry.totalMarks > 0 
          ? Math.round((entry.bestScore / entry.totalMarks) * 100) 
          : 0;
        
        return {
          rank: index + 1,
          userId: entry._id,
          name: user.name,
          bestScore: Math.round(entry.bestScore * 100) / 100,
          totalMarks: entry.totalMarks,
          accuracy,
          attempts: entry.attempts,
          correct: entry.bestCorrect || 0,
          incorrect: entry.bestIncorrect || 0,
          lastAttempt: entry.lastAttempt
        };
      });

      // Get total unique participants
      const totalParticipants = await attempts.distinct('userId', {
        mockTestId: { $in: mockTestIds },
        status: 'COMPLETED'
      });

      return jsonResponse({
        success: true,
        data: {
          exam: { name: exam.name, slug: exam.slug, icon: exam.icon, fullName: exam.fullName },
          leaderboard,
          totalParticipants: totalParticipants.length
        }
      });
    }

    // Get user's rank for an exam
    if (path.startsWith('/my-rank/')) {
      const slug = path.split('/my-rank/')[1];
      const user = await getAuthUser(request);
      
      if (!user) {
        return jsonResponse({ success: false, error: 'Please login to see your rank' }, 401);
      }

      const exams = await getCollection('exams');
      const exam = await exams.findOne({ slug });
      
      if (!exam) {
        return jsonResponse({ success: false, error: 'Exam not found' }, 404);
      }

      const mockTests = await getCollection('mock_tests');
      const attempts = await getCollection('test_attempts');

      // Get all mock test IDs for this exam
      const examMockTests = await mockTests.find({ examId: exam.id }).toArray();
      const mockTestIds = examMockTests.map(t => t.id);

      if (mockTestIds.length === 0) {
        return jsonResponse({
          success: true,
          data: { rank: null, bestScore: 0, totalParticipants: 0 }
        });
      }

      // Get user's best score
      const userBest = await attempts.aggregate([
        {
          $match: {
            mockTestId: { $in: mockTestIds },
            userId: user.id,
            status: 'COMPLETED'
          }
        },
        {
          $group: {
            _id: '$userId',
            bestScore: { $max: '$score' },
            totalMarks: { $first: '$totalMarks' },
            attempts: { $sum: 1 }
          }
        }
      ]).toArray();

      if (userBest.length === 0) {
        return jsonResponse({
          success: true,
          data: { rank: null, bestScore: 0, totalParticipants: 0, message: 'No attempts yet' }
        });
      }

      const userScore = userBest[0].bestScore;

      // Count how many users have higher score
      const higherScores = await attempts.aggregate([
        {
          $match: {
            mockTestId: { $in: mockTestIds },
            status: 'COMPLETED'
          }
        },
        {
          $group: {
            _id: '$userId',
            bestScore: { $max: '$score' }
          }
        },
        {
          $match: {
            bestScore: { $gt: userScore }
          }
        },
        {
          $count: 'count'
        }
      ]).toArray();

      const rank = (higherScores[0]?.count || 0) + 1;

      // Get total participants
      const totalParticipants = await attempts.distinct('userId', {
        mockTestId: { $in: mockTestIds },
        status: 'COMPLETED'
      });

      return jsonResponse({
        success: true,
        data: {
          rank,
          bestScore: Math.round(userScore * 100) / 100,
          totalMarks: userBest[0].totalMarks,
          attempts: userBest[0].attempts,
          totalParticipants: totalParticipants.length,
          percentile: Math.round(((totalParticipants.length - rank) / totalParticipants.length) * 100)
        }
      });
    }

    // Get Mock Test by ID (for users - only published)
    if (path.startsWith('/mock-test/')) {
      const testId = path.split('/mock-test/')[1];
      const mockTests = await getCollection('mock_tests');
      const test = await mockTests.findOne({ id: testId });
      
      if (!test) {
        return jsonResponse({ success: false, error: 'Mock test not found' }, 404);
      }

      // Check if test is published for regular users
      const user = await getAuthUser(request);
      const isAdmin = user && ['SUPER_ADMIN', 'ADMIN', 'CONTENT_MANAGER'].includes(user.role);
      
      if (!isAdmin && !test.isPublished) {
        return jsonResponse({ success: false, error: 'Test not available' }, 404);
      }

      return jsonResponse({ success: true, data: test });
    }

    // Get questions for a mock test (User taking test - only Active questions)
    if (path.startsWith('/mock-test-questions/')) {
      const testId = path.split('/mock-test-questions/')[1];
      const questions = await getCollection('questions');
      
      // Only fetch Active questions for this mockTestId (case-insensitive)
      const testQuestions = await questions.find({ 
        mockTestId: testId,
        $or: [
          { status: 'Active' },
          { status: 'active' },
          { status: { $exists: false } }
        ]
      }).sort({ questionNumber: 1 }).toArray();
      
      // Remove correct answers for test mode
      const questionsWithoutAnswers = testQuestions.map(q => ({
        id: q.id,
        questionNumber: q.questionNumber,
        question_title: q.question_title,
        questionText: q.question_title, // Backward compatibility
        description: q.description,
        topic_title: q.topic_title,
        options: [q.option1_title, q.option2_title, q.option3_title, q.option4_title],
        marks: q.marks || 2,
        duration: q.duration
      }));

      return jsonResponse({ success: true, data: questionsWithoutAnswers });
    }

    // Jobs list
    if (path === '/jobs') {
      const jobs = await getCollection('jobs');
      const category = searchParams.get('category');
      const query = category ? { status: 'Active', category } : { status: 'Active' };
      return jsonResponse({
        success: true,
        data: await jobs.find(query).sort({ createdAt: -1 }).toArray()
      });
    }

    // Single Job
    if (path.startsWith('/jobs/')) {
      const jobId = path.split('/jobs/')[1];
      const jobs = await getCollection('jobs');
      const job = await jobs.findOne({ id: jobId });
      
      if (!job) {
        return jsonResponse({ success: false, error: 'Job not found' }, 404);
      }
      return jsonResponse({ success: true, data: job });
    }

    // Colleges
    if (path === '/colleges') {
      const colleges = await getCollection('colleges');
      return jsonResponse({
        success: true,
        data: await colleges.find({}).sort({ ranking: 1 }).toArray()
      });
    }

    // Testimonials
    if (path === '/testimonials') {
      const testimonials = await getCollection('testimonials');
      return jsonResponse({
        success: true,
        data: await testimonials.find({}).toArray()
      });
    }

    // Notifications
    if (path === '/notifications') {
      const notifications = await getCollection('exam_notifications');
      return jsonResponse({
        success: true,
        data: await notifications.find({}).sort({ createdAt: -1 }).toArray()
      });
    }

    // User Profile
    if (path === '/profile') {
      const user = await getAuthUser(request);
      if (!user) {
        return jsonResponse({ success: false, error: 'Unauthorized' }, 401);
      }
      const { password, ...userData } = user;
      return jsonResponse({ success: true, data: userData });
    }

    // Test attempt result with solutions
    if (path.startsWith('/attempt/')) {
      const attemptId = path.split('/attempt/')[1];
      const attempts = await getCollection('test_attempts');
      const attempt = await attempts.findOne({ id: attemptId });
      
      if (!attempt) {
        return jsonResponse({ success: false, error: 'Attempt not found' }, 404);
      }

      const questions = await getCollection('questions');
      const testQuestions = await questions.find({ mockTestId: attempt.mockTestId }).toArray();
      
      // Format questions with solutions for review
      const formattedQuestions = testQuestions.map(q => ({
        id: q.id,
        questionNumber: q.questionNumber,
        questionText: q.question_title,
        options: [q.option1_title, q.option2_title, q.option3_title, q.option4_title],
        correctOption: q.correct_option_number,
        solution: q.solution_text,
        topic: q.topic_title,
        marks: q.marks || 2
      }));

      return jsonResponse({
        success: true,
        data: { attempt, questions: formattedQuestions }
      });
    }

    // ======= ADMIN ROUTES =======
    if (path.startsWith('/admin')) {
      const user = await getAuthUser(request);
      if (!user || !['SUPER_ADMIN', 'ADMIN', 'CONTENT_MANAGER'].includes(user.role)) {
        return jsonResponse({ success: false, error: 'Unauthorized' }, 401);
      }

      // Admin Dashboard Stats
      if (path === '/admin/stats') {
        const users = await getCollection('users');
        const exams = await getCollection('exams');
        const mockTests = await getCollection('mock_tests');
        const questions = await getCollection('questions');
        const jobs = await getCollection('jobs');

        return jsonResponse({
          success: true,
          data: {
            totalUsers: await users.countDocuments(),
            totalExams: await exams.countDocuments(),
            totalMockTests: await mockTests.countDocuments(),
            totalQuestions: await questions.countDocuments(),
            totalJobs: await jobs.countDocuments(),
            totalRevenue: 0
          }
        });
      }

      // Admin - Get all users
      if (path === '/admin/users') {
        const users = await getCollection('users');
        return jsonResponse({ 
          success: true, 
          data: await users.find({}).project({ password: 0 }).toArray() 
        });
      }

      // Admin - Get all exams
      if (path === '/admin/exams') {
        const exams = await getCollection('exams');
        return jsonResponse({ success: true, data: await exams.find({}).toArray() });
      }

      // Admin - Get all mock tests (including unpublished)
      if (path === '/admin/mock-tests') {
        const mockTests = await getCollection('mock_tests');
        const questions = await getCollection('questions');
        
        const tests = await mockTests.find({}).toArray();
        
        // Add question count to each test
        const testsWithCount = await Promise.all(tests.map(async (test) => {
          const count = await questions.countDocuments({ mockTestId: test.id });
          return { ...test, questionCount: count };
        }));
        
        return jsonResponse({ success: true, data: testsWithCount });
      }

      // Admin - Get questions for a specific mock test
      if (path === '/admin/questions') {
        const mockTestId = searchParams.get('mockTestId');
        const questions = await getCollection('questions');
        
        const query = mockTestId ? { mockTestId } : {};
        const allQuestions = await questions.find(query).sort({ createdAt: -1 }).toArray();
        
        return jsonResponse({ success: true, data: allQuestions });
      }

      // Admin - Get all jobs
      if (path === '/admin/jobs') {
        const jobs = await getCollection('jobs');
        return jsonResponse({ success: true, data: await jobs.find({}).toArray() });
      }

      // Admin - Get all colleges
      if (path === '/admin/colleges') {
        const colleges = await getCollection('colleges');
        return jsonResponse({ success: true, data: await colleges.find({}).toArray() });
      }

      // Admin - Get testimonials
      if (path === '/admin/testimonials') {
        const testimonials = await getCollection('testimonials');
        return jsonResponse({ success: true, data: await testimonials.find({}).toArray() });
      }

      // Admin - Get contact leads
      if (path === '/admin/contacts') {
        const contacts = await getCollection('contact_leads');
        return jsonResponse({ success: true, data: await contacts.find({}).sort({ createdAt: -1 }).toArray() });
      }

      // Admin - Get transactions
      if (path === '/admin/transactions') {
        const transactions = await getCollection('transactions');
        return jsonResponse({ success: true, data: await transactions.find({}).sort({ createdAt: -1 }).toArray() });
      }
    }

    return jsonResponse({ success: true, message: 'Unishaala API' });
  } catch (error) {
    console.error('API Error:', error);
    return jsonResponse({ success: false, error: error.message }, 500);
  }
}

// POST Requests Handler
export async function POST(request) {
  const path = getPath(request);

  try {
    const body = await request.json().catch(() => ({}));

    // User Registration
    if (path === '/auth/signup') {
      const { name, email, phone, password, phoneVerified } = body;
      
      if (!name || !email || !password) {
        return jsonResponse({ success: false, error: 'Name, email and password are required' }, 400);
      }

      if (!phone) {
        return jsonResponse({ success: false, error: 'Phone number is required' }, 400);
      }

      const users = await getCollection('users');
      const existingUser = await users.findOne({ email });
      
      if (existingUser) {
        return jsonResponse({ success: false, error: 'Email already registered' }, 400);
      }

      // Check if phone already registered
      const existingPhone = await users.findOne({ phone });
      if (existingPhone) {
        return jsonResponse({ success: false, error: 'Phone number already registered' }, 400);
      }

      const hashedPassword = await hashPassword(password);
      
      const newUser = {
        id: uuidv4(),
        name,
        email,
        phone: phone || '',
        password: hashedPassword,
        role: 'USER',
        isVerified: phoneVerified === true, // Verified if phone OTP was verified
        phoneVerified: phoneVerified === true,
        authProvider: 'local',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await users.insertOne(newUser);

      return jsonResponse({
        success: true,
        message: 'Registration successful.',
        data: { userId: newUser.id, email }
      });
    }

    // OTP Verification
    if (path === '/auth/verify-otp') {
      const { email, otp } = body;
      
      const users = await getCollection('users');
      const user = await users.findOne({ email });
      
      if (!user) {
        return jsonResponse({ success: false, error: 'User not found' }, 404);
      }

      if (user.otp !== otp) {
        return jsonResponse({ success: false, error: 'Invalid OTP' }, 400);
      }

      if (new Date() > new Date(user.otpExpiry)) {
        return jsonResponse({ success: false, error: 'OTP expired' }, 400);
      }

      await users.updateOne(
        { email },
        { $set: { isVerified: true, otp: null, otpExpiry: null } }
      );

      const token = createToken({ userId: user.id, email: user.email, role: user.role });
      
      const response = jsonResponse({
        success: true,
        message: 'Email verified successfully',
        data: { token }
      });

      response.cookies.set('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60
      });

      return response;
    }

    // User Login
    if (path === '/auth/login') {
      const { email, password } = body;
      
      if (!email || !password) {
        return jsonResponse({ success: false, error: 'Email and password are required' }, 400);
      }

      const users = await getCollection('users');
      const user = await users.findOne({ email });
      
      if (!user) {
        return jsonResponse({ success: false, error: 'Invalid credentials' }, 401);
      }

      const isValid = await verifyPassword(password, user.password);
      
      if (!isValid) {
        return jsonResponse({ success: false, error: 'Invalid credentials' }, 401);
      }

      const token = createToken({ userId: user.id, email: user.email, role: user.role });
      
      const response = jsonResponse({
        success: true,
        message: 'Login successful',
        data: {
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
          }
        }
      });

      response.cookies.set('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60
      });

      return response;
    }

    // Logout
    if (path === '/auth/logout') {
      const response = jsonResponse({ success: true, message: 'Logged out successfully' });
      response.cookies.delete('auth_token');
      return response;
    }

    // Send Phone OTP via Twilio
    if (path === '/auth/send-otp') {
      const { phone } = body;
      
      if (!phone) {
        return jsonResponse({ success: false, error: 'Phone number is required' }, 400);
      }

      try {
        const twilio = require('twilio');
        const client = twilio(
          process.env.TWILIO_ACCOUNT_SID,
          process.env.TWILIO_AUTH_TOKEN
        );

        const verification = await client.verify.v2
          .services(process.env.TWILIO_VERIFY_SERVICE_SID)
          .verifications.create({ to: phone, channel: 'sms' });

        return jsonResponse({
          success: true,
          message: 'OTP sent successfully',
          data: { status: verification.status }
        });
      } catch (error) {
        console.error('Twilio error:', error);
        return jsonResponse({ success: false, error: 'Failed to send OTP. Please check phone number.' }, 400);
      }
    }

    // Verify Phone OTP via Twilio
    if (path === '/auth/verify-phone-otp') {
      const { phone, code } = body;
      
      if (!phone || !code) {
        return jsonResponse({ success: false, error: 'Phone and OTP code are required' }, 400);
      }

      try {
        const twilio = require('twilio');
        const client = twilio(
          process.env.TWILIO_ACCOUNT_SID,
          process.env.TWILIO_AUTH_TOKEN
        );

        const verificationCheck = await client.verify.v2
          .services(process.env.TWILIO_VERIFY_SERVICE_SID)
          .verificationChecks.create({ to: phone, code: code });

        if (verificationCheck.status === 'approved') {
          return jsonResponse({
            success: true,
            message: 'Phone verified successfully',
            data: { verified: true }
          });
        } else {
          return jsonResponse({ success: false, error: 'Invalid OTP' }, 400);
        }
      } catch (error) {
        console.error('Twilio verification error:', error);
        return jsonResponse({ success: false, error: 'Verification failed' }, 400);
      }
    }

    // Google OAuth Callback
    if (path === '/auth/google-callback') {
      const { sessionId } = body;
      
      if (!sessionId) {
        return jsonResponse({ success: false, error: 'Session ID is required' }, 400);
      }

      try {
        // Exchange session_id for user data from Emergent Auth
        const authResponse = await fetch('https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data', {
          method: 'GET',
          headers: {
            'X-Session-ID': sessionId
          }
        });

        if (!authResponse.ok) {
          return jsonResponse({ success: false, error: 'Invalid session' }, 401);
        }

        const authData = await authResponse.json();
        const { email, name, picture, session_token } = authData;

        // Check if user exists or create new one
        const users = await getCollection('users');
        let user = await users.findOne({ email });

        if (!user) {
          // Create new user from Google auth
          user = {
            id: uuidv4(),
            name: name || email.split('@')[0],
            email,
            phone: '',
            password: '', // Google users don't have password
            role: 'USER',
            isVerified: true,
            phoneVerified: false,
            picture: picture || '',
            authProvider: 'google',
            createdAt: new Date(),
            updatedAt: new Date()
          };
          await users.insertOne(user);
        } else {
          // Update existing user with Google data
          await users.updateOne(
            { email },
            { 
              $set: { 
                name: name || user.name,
                picture: picture || user.picture,
                isVerified: true,
                updatedAt: new Date()
              } 
            }
          );
          user = await users.findOne({ email });
        }

        // Create our own token
        const token = createToken({ userId: user.id, email: user.email, role: user.role });
        
        const response = jsonResponse({
          success: true,
          message: 'Login successful',
          data: {
            token,
            user: {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
              picture: user.picture
            }
          }
        });

        response.cookies.set('auth_token', token, {
          httpOnly: true,
          secure: true,
          sameSite: 'none',
          path: '/',
          maxAge: 7 * 24 * 60 * 60
        });

        return response;
      } catch (error) {
        console.error('Google auth error:', error);
        return jsonResponse({ success: false, error: 'Authentication failed' }, 500);
      }
    }

    // Contact Form
    if (path === '/contact') {
      const { name, email, phone, subject, message } = body;
      
      if (!name || !email || !message) {
        return jsonResponse({ success: false, error: 'Name, email and message are required' }, 400);
      }

      const contacts = await getCollection('contact_leads');
      await contacts.insertOne({
        id: uuidv4(),
        name,
        email,
        phone: phone || '',
        subject: subject || '',
        message,
        status: 'New',
        createdAt: new Date()
      });

      return jsonResponse({ success: true, message: 'Message sent successfully' });
    }

    // ============================================
    // ICICI Orange PG Payment Gateway Integration
    // ============================================

    // Initiate Payment - ICICI Orange PG
    if (path === '/payment/initiate') {
      const user = await getAuthUser(request);
      if (!user) {
        return jsonResponse({ success: false, error: 'Please login to make payment' }, 401);
      }

      const { examId, mockTestId, amount, paymentType } = body;
      
      if (!amount || amount <= 0) {
        return jsonResponse({ success: false, error: 'Invalid amount' }, 400);
      }

      // Generate unique transaction ID
      const merchantTxnNo = `TXN${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

      // Get exam/test details
      let itemName = 'Test Purchase';
      let itemId = mockTestId || examId;
      
      if (examId) {
        const exams = await getCollection('exams');
        const exam = await exams.findOne({ id: examId });
        if (exam) itemName = `${exam.name} - Full Access`;
      } else if (mockTestId) {
        const mockTests = await getCollection('mock_tests');
        const test = await mockTests.findOne({ id: mockTestId });
        if (test) itemName = test.title;
      }

      // Create transaction record
      const transactions = await getCollection('transactions');
      const transaction = {
        id: uuidv4(),
        transactionId: merchantTxnNo,
        merchantTxnNo,
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        userPhone: user.phone || '',
        examId: examId || null,
        mockTestId: mockTestId || null,
        paymentType: paymentType || 'exam_purchase',
        itemName,
        amount: parseFloat(amount),
        currency: 'INR',
        status: 'PENDING',
        paymentMethod: null,
        gatewayResponse: null,
        iciciTransactionId: null,
        refundStatus: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await transactions.insertOne(transaction);

      // Prepare ICICI Orange PG request - JSON format as per documentation
      const crypto = require('crypto');
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
      
      // Format date as YYYYMMDDHHMMSS
      const now = new Date();
      const txnDate = now.getFullYear().toString() +
        String(now.getMonth() + 1).padStart(2, '0') +
        String(now.getDate()).padStart(2, '0') +
        String(now.getHours()).padStart(2, '0') +
        String(now.getMinutes()).padStart(2, '0') +
        String(now.getSeconds()).padStart(2, '0');

      // Format phone number - remove + and ensure 91 prefix
      let phoneNumber = (user.phone || '9999999999').replace(/\+/g, '');
      if (!phoneNumber.startsWith('91') && phoneNumber.length === 10) {
        phoneNumber = '91' + phoneNumber;
      }

      // ICICI Orange PG payload - exactly as per documentation
      const paymentData = {
        merchantId: process.env.ICICI_MID,
        aggregatorID: process.env.ICICI_AGG_ID,
        merchantTxnNo: merchantTxnNo,
        amount: parseFloat(amount).toFixed(2),
        currencyCode: '356', // INR numeric code
        payType: '0', // All payment modes
        customerEmailID: user.email,
        transactionType: 'SALE',
        returnURL: `${baseUrl}/api/payment/callback`,
        txnDate: txnDate,
        customerMobileNo: phoneNumber,
        customerName: user.name,
        addlParam1: user.id, // Store userId
        addlParam2: itemId || '' // Store itemId
      };

      // Generate secureHash - as per ICICI documentation
      // Step 1: Sort keys alphabetically
      const sortedKeys = Object.keys(paymentData).sort();
      
      // Step 2: Concatenate values of sorted keys
      let plainHashText = '';
      sortedKeys.forEach(key => {
        plainHashText += paymentData[key];
      });
      
      // Step 3: Generate HMAC-SHA256 hash
      const secureHash = crypto.createHmac('sha256', process.env.ICICI_KEY)
        .update(plainHashText)
        .digest('hex');
      
      paymentData.secureHash = secureHash;

      console.log('ICICI Payment Request:', JSON.stringify(paymentData, null, 2));
      console.log('Plain Hash Text:', plainHashText);

      try {
        // Make POST request to ICICI initiateSale API
        const iciciResponse = await fetch(process.env.ICICI_SALE_API, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(paymentData)
        });

        const iciciResult = await iciciResponse.json();
        console.log('ICICI Response:', JSON.stringify(iciciResult, null, 2));

        if (iciciResult.responseCode === 'R1000' && iciciResult.redirectURI) {
          // Success - construct payment URL
          const paymentUrl = `${iciciResult.redirectURI}?tranCtx=${iciciResult.tranCtx}`;
          
          // Update transaction with ICICI response
          await transactions.updateOne(
            { merchantTxnNo },
            {
              $set: {
                gatewayResponse: iciciResult,
                tranCtx: iciciResult.tranCtx,
                updatedAt: new Date()
              }
            }
          );

          return jsonResponse({
            success: true,
            data: {
              transactionId: merchantTxnNo,
              amount: parseFloat(amount),
              paymentUrl: paymentUrl,
              tranCtx: iciciResult.tranCtx
            }
          });
        } else {
          // Error from ICICI
          await transactions.updateOne(
            { merchantTxnNo },
            {
              $set: {
                status: 'FAILED',
                gatewayResponse: iciciResult,
                updatedAt: new Date()
              }
            }
          );

          return jsonResponse({
            success: false,
            error: iciciResult.respDescription || 'Payment initiation failed',
            data: iciciResult
          }, 400);
        }
      } catch (error) {
        console.error('ICICI API Error:', error);
        
        await transactions.updateOne(
          { merchantTxnNo },
          {
            $set: {
              status: 'FAILED',
              gatewayResponse: { error: error.message },
              updatedAt: new Date()
            }
          }
        );

        return jsonResponse({
          success: false,
          error: 'Payment gateway connection failed'
        }, 500);
      }
    }

    // Payment Callback - Handle ICICI Orange PG Response (POST from ICICI)
    if (path === '/payment/callback') {
      const transactions = await getCollection('transactions');
      
      console.log('Payment Callback Body:', JSON.stringify(body, null, 2));
      
      // ICICI sends response in body
      const {
        merchantTxnNo,
        txnID,
        txnStatus,
        txnResponseCode,
        txnRespDescription,
        amount,
        paymentMode,
        txnAuthID,
        addlParam1, // userId
        addlParam2, // itemId
        secureHash: responseSecureHash
      } = body;

      // Find transaction
      const transaction = await transactions.findOne({ merchantTxnNo });
      
      if (!transaction) {
        console.error('Transaction not found:', merchantTxnNo);
        // Redirect to failed page
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
        return NextResponse.redirect(`${baseUrl}/payment/failed?reason=Transaction%20not%20found`);
      }

      // Determine status
      const isSuccess = txnStatus === 'SUC' || txnResponseCode === '0000';
      const status = isSuccess ? 'SUCCESS' : (txnStatus === 'PEN' ? 'PENDING' : 'FAILED');

      // Update transaction status
      await transactions.updateOne(
        { merchantTxnNo },
        {
          $set: {
            status,
            iciciTransactionId: txnID,
            txnAuthID,
            paymentMethod: paymentMode,
            gatewayResponse: body,
            updatedAt: new Date()
          }
        }
      );

      // Redirect to appropriate page
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
      const redirectUrl = isSuccess 
        ? `${baseUrl}/payment/success?txn=${merchantTxnNo}`
        : `${baseUrl}/payment/failed?txn=${merchantTxnNo}&reason=${encodeURIComponent(txnRespDescription || 'Payment failed')}`;

      return NextResponse.redirect(redirectUrl);
    }

    // Check Payment Status
    if (path === '/payment/status') {
      const user = await getAuthUser(request);
      const { transactionId } = body;

      const transactions = await getCollection('transactions');
      const transaction = await transactions.findOne({ 
        $or: [
          { transactionId },
          { merchantTxnNo: transactionId }
        ]
      });

      if (!transaction) {
        return jsonResponse({ success: false, error: 'Transaction not found' }, 404);
      }

      // If user is checking their own transaction or admin
      if (transaction.userId !== user?.id && user?.role !== 'SUPER_ADMIN' && user?.role !== 'ADMIN') {
        return jsonResponse({ success: false, error: 'Unauthorized' }, 403);
      }

      return jsonResponse({
        success: true,
        data: {
          transactionId: transaction.merchantTxnNo || transaction.transactionId,
          status: transaction.status,
          amount: transaction.amount,
          itemName: transaction.itemName,
          paymentMethod: transaction.paymentMethod,
          createdAt: transaction.createdAt
        }
      });
    }

    // Verify Payment (for exam access check)
    if (path === '/payment/verify-access') {
      const user = await getAuthUser(request);
      if (!user) {
        return jsonResponse({ success: false, error: 'Please login' }, 401);
      }

      const { examId, mockTestId } = body;
      const transactions = await getCollection('transactions');

      // Check for successful payment
      const query = {
        userId: user.id,
        status: 'SUCCESS'
      };

      if (examId) {
        query.examId = examId;
      } else if (mockTestId) {
        query.$or = [
          { mockTestId },
          { examId: { $exists: true, $ne: null } } // Check if exam purchase covers this test
        ];
      }

      const hasPurchased = await transactions.findOne(query);

      // If exam purchase, also check if mockTestId belongs to that exam
      if (!hasPurchased && mockTestId) {
        const mockTests = await getCollection('mock_tests');
        const test = await mockTests.findOne({ id: mockTestId });
        if (test?.examId) {
          const examPurchase = await transactions.findOne({
            userId: user.id,
            examId: test.examId,
            status: 'SUCCESS'
          });
          if (examPurchase) {
            return jsonResponse({ success: true, data: { hasAccess: true, purchaseType: 'exam' } });
          }
        }
      }

      return jsonResponse({
        success: true,
        data: {
          hasAccess: !!hasPurchased,
          purchaseType: hasPurchased?.examId ? 'exam' : (hasPurchased?.mockTestId ? 'test' : null)
        }
      });
    }

    // Request Refund
    if (path === '/payment/refund') {
      const user = await getAuthUser(request);
      if (!user) {
        return jsonResponse({ success: false, error: 'Please login' }, 401);
      }

      const { transactionId, reason } = body;
      const transactions = await getCollection('transactions');
      const transaction = await transactions.findOne({ transactionId, userId: user.id });

      if (!transaction) {
        return jsonResponse({ success: false, error: 'Transaction not found' }, 404);
      }

      if (transaction.status !== 'SUCCESS') {
        return jsonResponse({ success: false, error: 'Only successful payments can be refunded' }, 400);
      }

      if (transaction.refundStatus === 'REQUESTED' || transaction.refundStatus === 'PROCESSED') {
        return jsonResponse({ success: false, error: 'Refund already requested' }, 400);
      }

      // Update with refund request
      await transactions.updateOne(
        { transactionId },
        {
          $set: {
            refundStatus: 'REQUESTED',
            refundReason: reason,
            refundRequestedAt: new Date(),
            updatedAt: new Date()
          }
        }
      );

      return jsonResponse({
        success: true,
        message: 'Refund request submitted. We will process it within 5-7 business days.'
      });
    }

    // Admin: Process Refund via ICICI API
    if (path === '/admin/payment/process-refund') {
      const user = await getAuthUser(request);
      if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN')) {
        return jsonResponse({ success: false, error: 'Unauthorized' }, 403);
      }

      const { transactionId, refundAmount } = body;
      const transactions = await getCollection('transactions');
      const transaction = await transactions.findOne({ transactionId });

      if (!transaction) {
        return jsonResponse({ success: false, error: 'Transaction not found' }, 404);
      }

      try {
        // Call ICICI Refund API
        const crypto = require('crypto');
        const refundTxnId = `REF${Date.now()}`;
        
        const refundData = {
          merchantId: process.env.ICICI_MID,
          aggregatorId: process.env.ICICI_AGG_ID,
          command: 'refund',
          merchantTxnRefNumber: refundTxnId,
          originalMerchantTxnRefNumber: transactionId,
          amount: (refundAmount || transaction.amount).toFixed(2)
        };

        const refundChecksum = crypto.createHash('sha256')
          .update(`${refundData.merchantId}|${refundData.originalMerchantTxnRefNumber}|${refundData.amount}|${process.env.ICICI_KEY}`)
          .digest('hex');
        refundData.checksum = refundChecksum;

        const refundResponse = await fetch(process.env.ICICI_COMMAND_API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(refundData)
        });

        const refundResult = await refundResponse.json();

        // Update transaction
        await transactions.updateOne(
          { transactionId },
          {
            $set: {
              refundStatus: refundResult.txnStatus === 'SUCCESS' ? 'PROCESSED' : 'FAILED',
              refundTransactionId: refundTxnId,
              refundAmount: parseFloat(refundAmount || transaction.amount),
              refundResponse: refundResult,
              refundProcessedAt: new Date(),
              updatedAt: new Date()
            }
          }
        );

        return jsonResponse({
          success: refundResult.txnStatus === 'SUCCESS',
          data: refundResult
        });
      } catch (error) {
        console.error('Refund error:', error);
        return jsonResponse({ success: false, error: 'Refund processing failed' }, 500);
      }
    }

    // Admin: Get All Transactions
    if (path === '/admin/transactions') {
      const user = await getAuthUser(request);
      if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN')) {
        return jsonResponse({ success: false, error: 'Unauthorized' }, 403);
      }

      const transactions = await getCollection('transactions');
      const allTransactions = await transactions.find({})
        .sort({ createdAt: -1 })
        .limit(500)
        .toArray();

      // Calculate stats
      const stats = {
        total: allTransactions.length,
        successful: allTransactions.filter(t => t.status === 'SUCCESS').length,
        failed: allTransactions.filter(t => t.status === 'FAILED').length,
        pending: allTransactions.filter(t => t.status === 'PENDING').length,
        totalRevenue: allTransactions
          .filter(t => t.status === 'SUCCESS')
          .reduce((sum, t) => sum + (t.amount || 0), 0),
        refundRequests: allTransactions.filter(t => t.refundStatus === 'REQUESTED').length
      };

      return jsonResponse({
        success: true,
        data: allTransactions,
        stats
      });
    }

    // ============================================
    // End of Payment Gateway Integration
    // ============================================

    // Start Mock Test
    if (path === '/start-test') {
      const user = await getAuthUser(request);
      if (!user) {
        return jsonResponse({ success: false, error: 'Please login to start test' }, 401);
      }

      const { mockTestId } = body;
      const mockTests = await getCollection('mock_tests');
      const test = await mockTests.findOne({ id: mockTestId });
      
      if (!test) {
        return jsonResponse({ success: false, error: 'Mock test not found' }, 404);
      }

      // Check if published
      if (!test.isPublished) {
        return jsonResponse({ success: false, error: 'Test not available' }, 404);
      }

      // Check if it's a paid test
      if (!test.isFree && test.price > 0) {
        const transactions = await getCollection('transactions');
        const hasPurchased = await transactions.findOne({
          userId: user.id,
          mockTestId,
          status: 'SUCCESS'
        });
        
        if (!hasPurchased) {
          return jsonResponse({ 
            success: false, 
            error: 'Please purchase this test to continue',
            requirePayment: true,
            price: test.price 
          }, 402);
        }
      }

      // Get question count
      const questions = await getCollection('questions');
      const questionCount = await questions.countDocuments({ mockTestId, status: 'Active' });

      const attempts = await getCollection('test_attempts');
      const attempt = {
        id: uuidv4(),
        userId: user.id,
        mockTestId,
        startTime: new Date(),
        endTime: null,
        status: 'IN_PROGRESS',
        answers: {},
        score: 0,
        totalMarks: test.totalMarks || questionCount * 2,
        createdAt: new Date()
      };

      await attempts.insertOne(attempt);

      return jsonResponse({
        success: true,
        data: { attemptId: attempt.id, duration: test.duration, totalQuestions: questionCount }
      });
    }

    // Submit Test
    if (path === '/submit-test') {
      const user = await getAuthUser(request);
      if (!user) {
        return jsonResponse({ success: false, error: 'Unauthorized' }, 401);
      }

      const { attemptId, answers } = body;
      const attempts = await getCollection('test_attempts');
      const attempt = await attempts.findOne({ id: attemptId, userId: user.id });
      
      if (!attempt) {
        return jsonResponse({ success: false, error: 'Test attempt not found' }, 404);
      }

      // Calculate score
      const questions = await getCollection('questions');
      const testQuestions = await questions.find({ mockTestId: attempt.mockTestId }).toArray();
      
      let score = 0;
      let correct = 0;
      let incorrect = 0;
      let unanswered = 0;

      testQuestions.forEach(q => {
        const userAnswer = answers[q.id];
        if (userAnswer === undefined || userAnswer === null) {
          unanswered++;
        } else if (userAnswer === q.correct_option_number) {
          score += (q.marks || 2);
          correct++;
        } else {
          score -= (q.negativeMarks || 0.66);
          incorrect++;
        }
      });

      await attempts.updateOne(
        { id: attemptId },
        {
          $set: {
            answers: answers || attempt.answers,
            endTime: new Date(),
            status: 'COMPLETED',
            score: Math.max(0, score),
            correct,
            incorrect,
            unanswered
          }
        }
      );

      return jsonResponse({
        success: true,
        data: {
          attemptId,
          score: Math.max(0, score),
          totalMarks: attempt.totalMarks,
          correct,
          incorrect,
          unanswered
        }
      });
    }

    // Rank Predictor
    if (path === '/rank-predictor') {
      const { examSlug, score, totalMarks } = body;
      
      const percentage = (score / totalMarks) * 100;
      let rankRange = { min: 0, max: 0 };
      let recommendations = [];

      if (percentage >= 90) {
        rankRange = { min: 1, max: 100 };
        recommendations = ['Top IITs', 'IISc Bangalore', 'Top NITs'];
      } else if (percentage >= 80) {
        rankRange = { min: 100, max: 500 };
        recommendations = ['Good NITs', 'Top IIITs', 'State universities'];
      } else if (percentage >= 70) {
        rankRange = { min: 500, max: 2000 };
        recommendations = ['NITs', 'IIITs', 'Good state colleges'];
      } else if (percentage >= 60) {
        rankRange = { min: 2000, max: 5000 };
        recommendations = ['Some NITs', 'State colleges', 'Private universities'];
      } else {
        rankRange = { min: 5000, max: 20000 };
        recommendations = ['State colleges', 'Private colleges'];
      }

      return jsonResponse({
        success: true,
        data: { percentage, rankRange, recommendations }
      });
    }

    // ======= ADMIN ROUTES =======
    if (path.startsWith('/admin')) {
      const user = await getAuthUser(request);
      if (!user || !['SUPER_ADMIN', 'ADMIN', 'CONTENT_MANAGER'].includes(user.role)) {
        return jsonResponse({ success: false, error: 'Unauthorized' }, 401);
      }

      // Create Mock Test
      if (path === '/admin/mock-tests') {
        const mockTests = await getCollection('mock_tests');
        
        const testData = {
          id: uuidv4(),
          title: body.title,
          description: body.description || '',
          examId: body.examId || null,
          testType: body.testType || 'mock_test', // mock_test, practice_questions, previous_year
          duration: parseInt(body.duration) || 60,
          totalQuestions: 0,
          totalMarks: 0,
          isFree: body.isFree ?? true,
          price: parseInt(body.price) || 0,
          status: body.status || 'Active',
          isPublished: false, // Default to unpublished
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        await mockTests.insertOne(testData);
        return jsonResponse({ success: true, data: testData });
      }

      // Publish/Unpublish Mock Test
      if (path === '/admin/mock-tests/publish') {
        const { testId, isPublished } = body;
        const mockTests = await getCollection('mock_tests');
        
        await mockTests.updateOne(
          { id: testId },
          { $set: { isPublished, updatedAt: new Date() } }
        );
        
        return jsonResponse({ success: true, message: isPublished ? 'Test published' : 'Test unpublished' });
      }

      // Save Questions (from CSV preview) - Save Draft or Publish
      if (path === '/admin/questions/save-batch') {
        const { mockTestId, questions: questionsData, publish } = body;
        
        if (!mockTestId || !Array.isArray(questionsData) || questionsData.length === 0) {
          return jsonResponse({ success: false, error: 'mockTestId and questions are required' }, 400);
        }

        const mockTests = await getCollection('mock_tests');
        const test = await mockTests.findOne({ id: mockTestId });
        
        if (!test) {
          return jsonResponse({ success: false, error: 'Mock test not found' }, 404);
        }

        const questions = await getCollection('questions');
        let inserted = 0;
        let duplicates = 0;
        let failed = 0;
        const errors = [];

        for (let i = 0; i < questionsData.length; i++) {
          const q = questionsData[i];
          
          try {
            // Check for duplicate (same mockTestId + question_title)
            const existing = await questions.findOne({
              mockTestId,
              question_title: q.question_title
            });
            
            if (existing) {
              duplicates++;
              continue;
            }

            // Validate required fields
            if (!q.question_title || !q.option1_title || !q.option2_title || !q.option3_title || !q.option4_title) {
              errors.push({ row: i + 1, error: 'Missing required fields' });
              failed++;
              continue;
            }

            const correctOption = parseInt(q.correct_option_number);
            if (isNaN(correctOption) || correctOption < 1 || correctOption > 4) {
              errors.push({ row: i + 1, error: 'correct_option_number must be 1-4' });
              failed++;
              continue;
            }

            // Insert question with mockTestId
            // Normalize status to 'Active' (capitalize first letter)
            let questionStatus = q.status || 'Active';
            if (questionStatus.toLowerCase() === 'active') questionStatus = 'Active';
            if (questionStatus.toLowerCase() === 'inactive') questionStatus = 'Inactive';
            
            await questions.insertOne({
              id: uuidv4(),
              mockTestId: mockTestId,
              questionNumber: inserted + 1,
              test_title: test.title,
              topic_title: q.topic_title || '',
              question_title: q.question_title,
              duration: parseInt(q.duration) || 2,
              description: q.description || '',
              solution_text: q.solution_text || '',
              tip: q.tip || '',
              status: questionStatus,
              option1_title: q.option1_title,
              option2_title: q.option2_title,
              option3_title: q.option3_title,
              option4_title: q.option4_title,
              correct_option_number: correctOption,
              marks: 2,
              negativeMarks: 0.66,
              createdAt: new Date()
            });
            inserted++;
          } catch (err) {
            errors.push({ row: i + 1, error: err.message });
            failed++;
          }
        }

        // Update mock test question count and marks
        const totalQuestions = await questions.countDocuments({ mockTestId });
        await mockTests.updateOne(
          { id: mockTestId },
          { 
            $set: { 
              totalQuestions,
              totalMarks: totalQuestions * 2,
              isPublished: publish === true,
              updatedAt: new Date()
            } 
          }
        );

        return jsonResponse({
          success: true,
          data: {
            total: questionsData.length,
            inserted,
            duplicates,
            failed,
            errors: errors.slice(0, 20),
            testPublished: publish === true
          }
        });
      }

      // Create single question
      if (path === '/admin/questions/create') {
        const { mockTestId } = body;
        
        if (!mockTestId) {
          return jsonResponse({ success: false, error: 'mockTestId is required' }, 400);
        }

        const mockTests = await getCollection('mock_tests');
        const test = await mockTests.findOne({ id: mockTestId });
        
        if (!test) {
          return jsonResponse({ success: false, error: 'Mock test not found' }, 404);
        }

        const questions = await getCollection('questions');
        
        // Check duplicate
        const existing = await questions.findOne({
          mockTestId,
          question_title: body.question_title
        });
        
        if (existing) {
          return jsonResponse({ success: false, error: 'Duplicate question exists' }, 400);
        }

        const count = await questions.countDocuments({ mockTestId });
        
        const questionData = {
          id: uuidv4(),
          mockTestId,
          questionNumber: count + 1,
          test_title: test.title,
          topic_title: body.topic_title || '',
          question_title: body.question_title,
          duration: parseInt(body.duration) || 2,
          description: body.description || '',
          solution_text: body.solution_text || '',
          tip: body.tip || '',
          status: body.status || 'Active',
          option1_title: body.option1_title,
          option2_title: body.option2_title,
          option3_title: body.option3_title,
          option4_title: body.option4_title,
          correct_option_number: parseInt(body.correct_option_number),
          marks: 2,
          negativeMarks: 0.66,
          createdAt: new Date()
        };
        
        await questions.insertOne(questionData);
        
        // Update test count
        await mockTests.updateOne(
          { id: mockTestId },
          { $set: { totalQuestions: count + 1, totalMarks: (count + 1) * 2 } }
        );
        
        return jsonResponse({ success: true, data: questionData });
      }

      // Create Exam
      if (path === '/admin/exams') {
        const examData = {
          id: uuidv4(),
          name: body.name,
          fullName: body.fullName || body.name,
          description: body.description || '',
          category: body.category || 'Engineering',
          icon: body.icon || '📚',
          price: parseInt(body.price) || 0,
          status: body.status || 'Active',
          slug: body.name.toLowerCase().replace(/\s+/g, '-'),
          totalTests: 0,
          totalQuestions: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        const exams = await getCollection('exams');
        await exams.insertOne(examData);
        return jsonResponse({ success: true, data: examData });
      }

      // Create Job
      if (path === '/admin/jobs') {
        const jobData = {
          id: uuidv4(),
          ...body,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        const jobs = await getCollection('jobs');
        await jobs.insertOne(jobData);
        return jsonResponse({ success: true, data: jobData });
      }

      // Create Testimonial
      if (path === '/admin/testimonials') {
        const testimonialData = {
          id: uuidv4(),
          ...body,
          createdAt: new Date()
        };
        const testimonials = await getCollection('testimonials');
        await testimonials.insertOne(testimonialData);
        return jsonResponse({ success: true, data: testimonialData });
      }

      // Bulk Delete Questions
      if (path === '/admin/questions/bulk-delete') {
        const { questionIds, mockTestId } = body;
        
        if (!Array.isArray(questionIds) || questionIds.length === 0) {
          return jsonResponse({ success: false, error: 'questionIds array is required' }, 400);
        }

        const questions = await getCollection('questions');
        
        // Delete all selected questions
        const result = await questions.deleteMany({ 
          id: { $in: questionIds } 
        });
        
        // Update mock test question count if mockTestId provided
        if (mockTestId) {
          const mockTests = await getCollection('mock_tests');
          const count = await questions.countDocuments({ mockTestId });
          await mockTests.updateOne(
            { id: mockTestId },
            { $set: { totalQuestions: count, totalMarks: count * 2 } }
          );
        }
        
        return jsonResponse({ 
          success: true, 
          message: `Deleted ${result.deletedCount} questions`,
          deletedCount: result.deletedCount
        });
      }
    }

    return jsonResponse({ success: false, error: 'Endpoint not found' }, 404);
  } catch (error) {
    console.error('API Error:', error);
    return jsonResponse({ success: false, error: error.message }, 500);
  }
}

// PUT Requests Handler
export async function PUT(request) {
  const path = getPath(request);

  try {
    const body = await request.json();
    const user = await getAuthUser(request);

    // Update Profile
    if (path === '/profile') {
      if (!user) {
        return jsonResponse({ success: false, error: 'Unauthorized' }, 401);
      }
      const { name, phone } = body;
      const users = await getCollection('users');
      await users.updateOne(
        { id: user.id },
        { $set: { name, phone, updatedAt: new Date() } }
      );
      return jsonResponse({ success: true, message: 'Profile updated' });
    }

    // Admin routes
    if (path.startsWith('/admin')) {
      if (!user || !['SUPER_ADMIN', 'ADMIN', 'CONTENT_MANAGER'].includes(user.role)) {
        return jsonResponse({ success: false, error: 'Unauthorized' }, 401);
      }

      // Update Mock Test
      if (path.startsWith('/admin/mock-tests/')) {
        const testId = path.split('/admin/mock-tests/')[1];
        const mockTests = await getCollection('mock_tests');
        await mockTests.updateOne(
          { id: testId },
          { $set: { ...body, updatedAt: new Date() } }
        );
        return jsonResponse({ success: true, message: 'Mock test updated' });
      }

      // Update Question
      if (path.startsWith('/admin/questions/')) {
        const questionId = path.split('/admin/questions/')[1];
        const questions = await getCollection('questions');
        await questions.updateOne(
          { id: questionId },
          { $set: { ...body, updatedAt: new Date() } }
        );
        return jsonResponse({ success: true, message: 'Question updated' });
      }

      // Update Exam
      if (path.startsWith('/admin/exams/')) {
        const examId = path.split('/admin/exams/')[1];
        const exams = await getCollection('exams');
        await exams.updateOne(
          { id: examId },
          { $set: { ...body, updatedAt: new Date() } }
        );
        return jsonResponse({ success: true, message: 'Exam updated' });
      }

      // Update Job
      if (path.startsWith('/admin/jobs/')) {
        const jobId = path.split('/admin/jobs/')[1];
        const jobs = await getCollection('jobs');
        await jobs.updateOne(
          { id: jobId },
          { $set: { ...body, updatedAt: new Date() } }
        );
        return jsonResponse({ success: true, message: 'Job updated' });
      }
    }

    return jsonResponse({ success: false, error: 'Endpoint not found' }, 404);
  } catch (error) {
    console.error('API Error:', error);
    return jsonResponse({ success: false, error: error.message }, 500);
  }
}

// DELETE Requests Handler
export async function DELETE(request) {
  const path = getPath(request);

  try {
    const user = await getAuthUser(request);

    if (!user || !['SUPER_ADMIN', 'ADMIN'].includes(user.role)) {
      return jsonResponse({ success: false, error: 'Unauthorized' }, 401);
    }

    // Delete Mock Test (also delete its questions)
    if (path.startsWith('/admin/mock-tests/')) {
      const testId = path.split('/admin/mock-tests/')[1];
      const mockTests = await getCollection('mock_tests');
      const questions = await getCollection('questions');
      
      await mockTests.deleteOne({ id: testId });
      await questions.deleteMany({ mockTestId: testId });
      
      return jsonResponse({ success: true, message: 'Mock test and questions deleted' });
    }

    // Delete Question
    if (path.startsWith('/admin/questions/')) {
      const questionId = path.split('/admin/questions/')[1];
      const questions = await getCollection('questions');
      const question = await questions.findOne({ id: questionId });
      
      if (question) {
        await questions.deleteOne({ id: questionId });
        
        // Update test count
        const mockTests = await getCollection('mock_tests');
        const count = await questions.countDocuments({ mockTestId: question.mockTestId });
        await mockTests.updateOne(
          { id: question.mockTestId },
          { $set: { totalQuestions: count, totalMarks: count * 2 } }
        );
      }
      
      return jsonResponse({ success: true, message: 'Question deleted' });
    }

    // Delete Exam
    if (path.startsWith('/admin/exams/')) {
      const examId = path.split('/admin/exams/')[1];
      const exams = await getCollection('exams');
      await exams.deleteOne({ id: examId });
      return jsonResponse({ success: true, message: 'Exam deleted' });
    }

    // Delete Job
    if (path.startsWith('/admin/jobs/')) {
      const jobId = path.split('/admin/jobs/')[1];
      const jobs = await getCollection('jobs');
      await jobs.deleteOne({ id: jobId });
      return jsonResponse({ success: true, message: 'Job deleted' });
    }

    // Delete Testimonial
    if (path.startsWith('/admin/testimonials/')) {
      const testimonialId = path.split('/admin/testimonials/')[1];
      const testimonials = await getCollection('testimonials');
      await testimonials.deleteOne({ id: testimonialId });
      return jsonResponse({ success: true, message: 'Testimonial deleted' });
    }

    return jsonResponse({ success: false, error: 'Endpoint not found' }, 404);
  } catch (error) {
    console.error('API Error:', error);
    return jsonResponse({ success: false, error: error.message }, 500);
  }
}
