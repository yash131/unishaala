import { v4 as uuidv4 } from 'uuid';
import { getCollection } from './db';
import { hashPassword } from './auth';

export async function seedDatabase() {
  console.log('Starting database seed...');

  // Seed Admin User
  const users = await getCollection('users');
  const existingAdmin = await users.findOne({ email: 'admin@unishaala.com' });
  
  if (!existingAdmin) {
    const adminPassword = await hashPassword('admin123');
    await users.insertOne({
      id: uuidv4(),
      name: 'Super Admin',
      email: 'admin@unishaala.com',
      phone: '9999999999',
      password: adminPassword,
      role: 'SUPER_ADMIN',
      isVerified: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    console.log('Admin user created: admin@unishaala.com / admin123');
  }

  // Update existing mock tests to have testType field if missing
  const mockTests = await getCollection('mock_tests');
  const testsWithoutType = await mockTests.find({ testType: { $exists: false } }).toArray();
  
  if (testsWithoutType.length > 0) {
    for (const test of testsWithoutType) {
      // Assign testType based on title patterns or default to 'mock_test'
      let testType = 'mock_test';
      if (test.title.toLowerCase().includes('topic') || test.title.toLowerCase().includes('practice')) {
        testType = 'practice_questions';
      } else if (test.title.toLowerCase().includes('previous') || test.title.toLowerCase().includes('year')) {
        testType = 'previous_year';
      }
      
      await mockTests.updateOne(
        { id: test.id },
        { $set: { testType: testType } }
      );
    }
    console.log(`Updated ${testsWithoutType.length} mock tests with testType field`);
  }

  // Seed Exams
  const exams = await getCollection('exams');
  const examCount = await exams.countDocuments();
  
  if (examCount === 0) {
    const sampleExams = [
      { id: uuidv4(), name: 'GATE', slug: 'gate', fullName: 'Graduate Aptitude Test in Engineering', category: 'Engineering', icon: '🎓', description: 'National level examination for admission to postgraduate programs', totalTests: 45, totalQuestions: 1200, status: 'Active', createdAt: new Date() },
      { id: uuidv4(), name: 'CAT', slug: 'cat', fullName: 'Common Admission Test', category: 'Management', icon: '📊', description: 'MBA entrance examination conducted by IIMs', totalTests: 30, totalQuestions: 800, status: 'Active', createdAt: new Date() },
      { id: uuidv4(), name: 'UPSC', slug: 'upsc', fullName: 'Union Public Service Commission', category: 'Civil Services', icon: '🏛️', description: 'Civil Services Examination for administrative positions', totalTests: 50, totalQuestions: 1500, status: 'Active', createdAt: new Date() },
      { id: uuidv4(), name: 'JEE Main', slug: 'jee-main', fullName: 'Joint Entrance Examination Main', category: 'Engineering', icon: '⚡', description: 'Engineering entrance exam for NITs, IIITs', totalTests: 40, totalQuestions: 1000, status: 'Active', createdAt: new Date() },
      { id: uuidv4(), name: 'NEET', slug: 'neet', fullName: 'National Eligibility cum Entrance Test', category: 'Medical', icon: '🏥', description: 'Medical entrance examination', totalTests: 35, totalQuestions: 900, status: 'Active', createdAt: new Date() },
      { id: uuidv4(), name: 'SSC CGL', slug: 'ssc-cgl', fullName: 'Staff Selection Commission CGL', category: 'Government', icon: '📋', description: 'Combined Graduate Level Examination', totalTests: 25, totalQuestions: 600, status: 'Active', createdAt: new Date() },
      { id: uuidv4(), name: 'Bank PO', slug: 'bank-po', fullName: 'Bank Probationary Officer', category: 'Banking', icon: '🏦', description: 'Banking sector recruitment examination', totalTests: 20, totalQuestions: 500, status: 'Active', createdAt: new Date() },
      { id: uuidv4(), name: 'RRB NTPC', slug: 'rrb-ntpc', fullName: 'Railway Recruitment Board NTPC', category: 'Railways', icon: '🚂', description: 'Railway non-technical popular categories exam', totalTests: 22, totalQuestions: 550, status: 'Active', createdAt: new Date() }
    ];
    await exams.insertMany(sampleExams);
    console.log('Sample exams created');
  }

  // Seed Exam Notifications
  const notifications = await getCollection('exam_notifications');
  const notifCount = await notifications.countDocuments();
  
  if (notifCount === 0) {
    const sampleNotifications = [
      { id: uuidv4(), title: 'GATE 2025 Registration Open', examName: 'GATE', date: '2025-06-15', description: 'Online registration for GATE 2025 has started', link: '#', isNew: true, createdAt: new Date() },
      { id: uuidv4(), title: 'CAT 2025 Notification Released', examName: 'CAT', date: '2025-06-20', description: 'IIM Calcutta releases CAT 2025 notification', link: '#', isNew: true, createdAt: new Date() },
      { id: uuidv4(), title: 'UPSC CSE 2025 Calendar', examName: 'UPSC', date: '2025-06-10', description: 'UPSC releases exam calendar for 2025', link: '#', isNew: false, createdAt: new Date() },
      { id: uuidv4(), title: 'JEE Main 2025 Session 2', examName: 'JEE Main', date: '2025-06-25', description: 'JEE Main April session dates announced', link: '#', isNew: true, createdAt: new Date() }
    ];
    await notifications.insertMany(sampleNotifications);
    console.log('Sample notifications created');
  }

  // Seed Testimonials
  const testimonials = await getCollection('testimonials');
  const testCount = await testimonials.countDocuments();
  
  if (testCount === 0) {
    const sampleTestimonials = [
      { id: uuidv4(), name: 'Rahul Sharma', exam: 'GATE 2024', rank: 'AIR 156', image: 'https://randomuser.me/api/portraits/men/1.jpg', testimonial: 'Unishaala\'s mock tests were exactly like the actual exam. The detailed solutions helped me understand concepts better.', rating: 5, createdAt: new Date() },
      { id: uuidv4(), name: 'Priya Patel', exam: 'CAT 2024', rank: '99.5 Percentile', image: 'https://randomuser.me/api/portraits/women/2.jpg', testimonial: 'The question bank is comprehensive and covers all topics. Highly recommend for serious aspirants!', rating: 5, createdAt: new Date() },
      { id: uuidv4(), name: 'Amit Kumar', exam: 'UPSC 2024', rank: 'AIR 89', image: 'https://randomuser.me/api/portraits/men/3.jpg', testimonial: 'Previous year papers with solutions were invaluable. Topper notes gave me the edge I needed.', rating: 5, createdAt: new Date() }
    ];
    await testimonials.insertMany(sampleTestimonials);
    console.log('Sample testimonials created');
  }

  // Seed Jobs
  const jobs = await getCollection('jobs');
  const jobCount = await jobs.countDocuments();
  
  if (jobCount === 0) {
    const sampleJobs = [
      { id: uuidv4(), title: 'Assistant Professor', organization: 'IIT Delhi', location: 'New Delhi', salary: '₹1,00,000 - ₹1,50,000', lastDate: '2025-07-15', vacancies: 25, qualification: 'Ph.D. in relevant field', category: 'Teaching', status: 'Active', createdAt: new Date() },
      { id: uuidv4(), title: 'Software Engineer', organization: 'ISRO', location: 'Bangalore', salary: '₹60,000 - ₹80,000', lastDate: '2025-07-20', vacancies: 50, qualification: 'B.Tech/M.Tech in CS/IT', category: 'Technical', status: 'Active', createdAt: new Date() },
      { id: uuidv4(), title: 'Bank PO', organization: 'SBI', location: 'Pan India', salary: '₹45,000 - ₹65,000', lastDate: '2025-07-10', vacancies: 2000, qualification: 'Graduation in any discipline', category: 'Banking', status: 'Active', createdAt: new Date() }
    ];
    await jobs.insertMany(sampleJobs);
    console.log('Sample jobs created');
  }

  // Seed Mock Tests
  const mockCount = await mockTests.countDocuments();
  
  if (mockCount === 0) {
    const gateExam = await exams.findOne({ slug: 'gate' });
    if (gateExam) {
      const sampleMockTests = [
        { id: uuidv4(), examId: gateExam.id, title: 'GATE CS Full Mock Test 1', testType: 'mock_test', description: 'Complete mock test covering all GATE CS topics', duration: 180, totalQuestions: 65, totalMarks: 100, isFree: true, price: 0, status: 'Active', isPublished: true, createdAt: new Date() },
        { id: uuidv4(), examId: gateExam.id, title: 'GATE CS Full Mock Test 2', testType: 'mock_test', description: 'Advanced level mock test for GATE CS', duration: 180, totalQuestions: 65, totalMarks: 100, isFree: false, price: 199, status: 'Active', isPublished: true, createdAt: new Date() },
        { id: uuidv4(), examId: gateExam.id, title: 'GATE CS Topic Test - DSA', testType: 'practice_questions', description: 'Topic-wise test on Data Structures & Algorithms', duration: 60, totalQuestions: 25, totalMarks: 40, isFree: true, price: 0, status: 'Active', isPublished: true, createdAt: new Date() }
      ];
      await mockTests.insertMany(sampleMockTests);
      console.log('Sample mock tests created');
    }
  }

  // Seed Questions
  const questions = await getCollection('questions');
  const qCount = await questions.countDocuments();
  
  if (qCount === 0) {
    const mockTest = await mockTests.findOne({});
    if (mockTest) {
      const sampleQuestions = [
        { id: uuidv4(), mockTestId: mockTest.id, questionNumber: 1, question_title: 'What is the time complexity of binary search?', option1_title: 'O(n)', option2_title: 'O(log n)', option3_title: 'O(n²)', option4_title: 'O(1)', correct_option_number: 2, marks: 2, negativeMarks: 0.66, solution_text: 'Binary search divides the search space in half with each iteration, hence O(log n).', topic_title: 'Algorithms', status: 'Active', createdAt: new Date() },
        { id: uuidv4(), mockTestId: mockTest.id, questionNumber: 2, question_title: 'Which data structure uses LIFO principle?', option1_title: 'Queue', option2_title: 'Stack', option3_title: 'Array', option4_title: 'Linked List', correct_option_number: 2, marks: 2, negativeMarks: 0.66, solution_text: 'Stack follows Last In First Out (LIFO) principle.', topic_title: 'Data Structures', status: 'Active', createdAt: new Date() },
        { id: uuidv4(), mockTestId: mockTest.id, questionNumber: 3, question_title: 'What is the worst-case time complexity of QuickSort?', option1_title: 'O(n log n)', option2_title: 'O(n²)', option3_title: 'O(n)', option4_title: 'O(log n)', correct_option_number: 2, marks: 2, negativeMarks: 0.66, solution_text: 'QuickSort has O(n²) worst case when pivot selection is poor.', topic_title: 'Algorithms', status: 'Active', createdAt: new Date() }
      ];
      await questions.insertMany(sampleQuestions);
      console.log('Sample questions created');
    }
  }

  // Seed Colleges
  const colleges = await getCollection('colleges');
  const collegeCount = await colleges.countDocuments();
  
  if (collegeCount === 0) {
    const sampleColleges = [
      { id: uuidv4(), name: 'IIT Bombay', location: 'Mumbai, Maharashtra', ranking: 1, type: 'Government', courses: ['B.Tech', 'M.Tech', 'Ph.D'], fees: '₹2,00,000/year', rating: 4.9, acceptedExams: ['JEE Advanced'], createdAt: new Date() },
      { id: uuidv4(), name: 'IIT Delhi', location: 'New Delhi', ranking: 2, type: 'Government', courses: ['B.Tech', 'M.Tech', 'MBA'], fees: '₹2,00,000/year', rating: 4.8, acceptedExams: ['JEE Advanced'], createdAt: new Date() },
      { id: uuidv4(), name: 'IIM Ahmedabad', location: 'Ahmedabad, Gujarat', ranking: 1, type: 'Government', courses: ['MBA', 'PGDM'], fees: '₹23,00,000/course', rating: 4.9, acceptedExams: ['CAT'], createdAt: new Date() },
      { id: uuidv4(), name: 'AIIMS Delhi', location: 'New Delhi', ranking: 1, type: 'Government', courses: ['MBBS', 'MD', 'MS'], fees: '₹5,000/year', rating: 4.9, acceptedExams: ['NEET'], createdAt: new Date() }
    ];
    await colleges.insertMany(sampleColleges);
    console.log('Sample colleges created');
  }

  console.log('Database seeding complete!');
  return true;
}
