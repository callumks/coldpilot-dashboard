import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '../../../../../lib/prisma';
import universalSender from '../../../../../lib/email/universal-sender';

export const dynamic = 'force-dynamic';

// POST /api/contacts/[id]/message - Send message to contact
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('📧 Send message request for contact:', params.id);

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: { subscription: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check subscription for messaging features
    if (!user.subscription || user.subscription.status === 'TRIALING') {
      return NextResponse.json(
        { error: 'Direct messaging requires a paid subscription' },
        { status: 403 }
      );
    }

    const { subject, body } = await request.json();

    if (!subject || !body) {
      return NextResponse.json(
        { error: 'Subject and message body are required' },
        { status: 400 }
      );
    }

    // Verify contact ownership
    const contact = await prisma.contact.findFirst({
      where: {
        id: params.id,
        userId: user.id
      }
    });

    if (!contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    // Create or get existing conversation (no type field in schema)
    let conversation = await prisma.conversation.findFirst({
      where: {
        contactId: params.id,
        userId: user.id
      }
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          contactId: params.id,
          userId: user.id,
          subject: subject,
          status: 'SENT',
          lastMessageAt: new Date(),
          unreadCount: 0
        }
      });
    }

    // Create the message
    const message = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        direction: 'OUTBOUND',
        content: body,
        sentAt: new Date()
      }
    });

    // Update conversation
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        lastMessageAt: new Date(),
        status: 'SENT'
      }
    });

    // Update contact status
    await prisma.contact.update({
      where: { id: params.id },
      data: {
        status: 'CONTACTED',
        lastContacted: new Date()
      }
    });

    // Send email using universal sender
    const emailResult = await universalSender.sendEmail({
      userId: user.id,
      to: contact.email,
      toName: contact.name,
      fromEmail: '',
      fromName: `${user.firstName} ${user.lastName}`,
      subject: subject,
      body: body,
      messageId: message.id,
      contactId: contact.id
    });

    // Update message status based on email result
    await prisma.message.update({
      where: { id: message.id },
      data: {
        deliveredAt: emailResult.success ? new Date() : null
      }
    });

    console.log('✅ Message sent successfully');

    return NextResponse.json({
      success: true,
      message: {
        id: message.id,
        conversationId: conversation.id,
        status: emailResult.success ? 'SENT' : 'FAILED',
        sentAt: message.sentAt
      },
      emailResult,
      successMessage: 'Message sent successfully'
    });

  } catch (error) {
    console.error('💥 Send message error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

