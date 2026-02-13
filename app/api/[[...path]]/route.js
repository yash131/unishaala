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
      const { name, email, phone, password } = body;
      
      if (!name || !email || !password) {
        return jsonResponse({ success: false, error: 'Name, email and password are required' }, 400);
      }

      const users = await getCollection('users');
      const existingUser = await users.findOne({ email });
      
      if (existingUser) {
        return jsonResponse({ success: false, error: 'Email already registered' }, 400);
      }

      const hashedPassword = await hashPassword(password);
      const otp = generateOTP();
      
      const newUser = {
        id: uuidv4(),
        name,
        email,
        phone: phone || '',
        password: hashedPassword,
        role: 'USER',
        isVerified: false,
        otp,
        otpExpiry: new Date(Date.now() + 10 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await users.insertOne(newUser);
      console.log(`OTP for ${email}: ${otp}`);

      return jsonResponse({
        success: true,
        message: 'Registration successful. Please verify OTP.',
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
          ...body,
          slug: body.name.toLowerCase().replace(/\s+/g, '-'),
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
