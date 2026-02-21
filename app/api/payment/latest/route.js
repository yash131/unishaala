import { NextResponse } from 'next/server';
import { connectToDatabase, getCollection } from '@/lib/db';
import { getUserFromToken } from '@/lib/auth';

export async function GET(request) {
  try {
    // Get authenticated user
    const token = request.cookies.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const user = await getUserFromToken(token);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Invalid session' }, { status: 401 });
    }

    await connectToDatabase();
    const transactions = await getCollection('transactions');

    // Get the latest transaction for this user
    const transaction = await transactions.findOne(
      { userId: user.id },
      { sort: { createdAt: -1 } }
    );

    if (!transaction) {
      return NextResponse.json({ success: false, error: 'No transactions found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        merchantTxnNo: transaction.merchantTxnNo,
        status: transaction.status,
        amount: transaction.amount,
        itemName: transaction.itemName,
        createdAt: transaction.createdAt
      }
    });
  } catch (error) {
    console.error('Latest transaction error:', error);
    return NextResponse.json({ success: false, error: 'Failed to get transaction' }, { status: 500 });
  }
}
