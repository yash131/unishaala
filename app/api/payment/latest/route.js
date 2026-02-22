import { NextResponse } from 'next/server';
import { connectToDatabase, getCollection } from '@/lib/db';
import { getUserFromToken } from '@/lib/auth';

export async function GET(request) {
  try {
    await connectToDatabase();
    const transactions = await getCollection('transactions');

    // Try to get user from token
    const token = request.cookies.get('auth_token')?.value;
    let transaction = null;

    if (token) {
      const user = await getUserFromToken(token);
      if (user) {
        // Get latest PENDING transaction for this user
        transaction = await transactions.findOne(
          { userId: user.id, status: 'PENDING' },
          { sort: { createdAt: -1 } }
        );
        
        // If no pending, get latest overall
        if (!transaction) {
          transaction = await transactions.findOne(
            { userId: user.id },
            { sort: { createdAt: -1 } }
          );
        }
      }
    }

    // If no user transaction, get most recent pending transaction globally (last 5 mins)
    if (!transaction) {
      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
      transaction = await transactions.findOne(
        { status: 'PENDING', createdAt: { $gte: fiveMinAgo } },
        { sort: { createdAt: -1 } }
      );
    }

    if (!transaction) {
      return NextResponse.json({ success: false, error: 'No recent transaction found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        merchantTxnNo: transaction.merchantTxnNo,
        status: transaction.status,
        amount: transaction.amount,
        itemName: transaction.itemName,
        examId: transaction.examId,
        createdAt: transaction.createdAt
      }
    });
  } catch (error) {
    console.error('Latest transaction error:', error);
    return NextResponse.json({ success: false, error: 'Failed to get transaction' }, { status: 500 });
  }
}
