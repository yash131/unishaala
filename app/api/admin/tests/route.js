import { NextResponse } from 'next/server';
import { connectToDatabase, getCollection } from '@/lib/db';
import { getUserFromToken } from '@/lib/auth';

export async function GET(request) {
  try {
    const token = request.cookies.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getUserFromToken(token);
    if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN')) {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
    }

    await connectToDatabase();
    const mockTests = await getCollection('mock_tests');
    
    const tests = await mockTests.find({}).sort({ createdAt: -1 }).toArray();

    return NextResponse.json({
      success: true,
      data: tests.map(t => ({
        id: t.id,
        title: t.title,
        examId: t.examId,
        totalQuestions: t.totalQuestions || 0
      }))
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
