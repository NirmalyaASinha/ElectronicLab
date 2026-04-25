import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session || !session.user) return NextResponse.json({ success: false, error: 'Unauthenticated' }, { status: 401 });

  const componentId = params.id;
  try {
    const body = await req.json();
    const { message } = body;

    // fetch component record
    const comp = await db.query.components.findFirst({ where: (c, { eq }) => eq(c.id, componentId) });
    if (!comp) return NextResponse.json({ success: false, error: 'Component not found' }, { status: 404 });

    // Simple grounded responder: use specs and description to craft a reply.
    // TODO: Replace with RAG + LLM call (OpenAI/Claude/etc.) for richer answers.
    const pieces: string[] = [];
    if (comp.name) pieces.push(`Name: ${comp.name}.`);
    if (comp.modelNumber) pieces.push(`Model: ${comp.modelNumber}.`);
    if (comp.description) pieces.push(`Description: ${comp.description}`);
    if (comp.specs) {
      try {
        const specs = typeof comp.specs === 'string' ? JSON.parse(comp.specs) : comp.specs;
        if (specs.pinout) pieces.push(`Pinout: ${specs.pinout}`);
        if (specs.notes) pieces.push(`Notes: ${specs.notes}`);
        if (specs.tutorial) pieces.push(`Tutorial summary: ${specs.tutorial.substring(0, 400)}${specs.tutorial.length>400? '...':''}`);
        if (specs.datasheetUrl) pieces.push(`Datasheet: ${specs.datasheetUrl}`);
      } catch (e) {
        // ignore parse errors
      }
    }

    // naive answer: echo user's question and then the collected grounding info
    const reply = `I can help with that. Here's what I know about this component:\n\n${pieces.join('\n\n')}\n\nIf you need step-by-step instructions or code examples, say so and I'll try to provide them.`;

    return NextResponse.json({ success: true, reply });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
