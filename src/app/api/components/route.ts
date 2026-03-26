import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { components } from '@/db/schema';
import { desc, ilike, or, and } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const search = searchParams.get('search');
    const category = searchParams.get('category');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    const conditions = [];

    if (search) {
      conditions.push(
        or(
          ilike(components.name, `%${search}%`),
          ilike(components.modelNumber, `%${search}%`)
        )
      );
    }

    if (category) {
      conditions.push(ilike(components.category, `%${category}%`));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const query = db
      .select()
      .from(components);

    const finalQuery = whereClause ? query.where(whereClause) : query;

    const componentList = await finalQuery
      .orderBy(desc(components.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({ success: true, data: componentList });
  } catch (error) {
    console.error('Components fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
