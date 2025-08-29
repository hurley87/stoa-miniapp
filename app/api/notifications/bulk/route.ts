import { sendBulkNotification } from "@/lib/bulk-notifications";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const BulkNotificationSchema = z.object({
  title: z.string().min(1).max(100),
  body: z.string().min(1).max(500),
  excludeFid: z.number().int().positive().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = BulkNotificationSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: validation.error.issues },
        { status: 400 }
      );
    }

    const { title, body: notificationBody, excludeFid } = validation.data;

    const results = await sendBulkNotification({
      title,
      body: notificationBody,
      excludeFid,
    });

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (error) {
    console.error("Error sending bulk notifications:", error);
    return NextResponse.json(
      { error: "Failed to send bulk notifications" },
      { status: 500 }
    );
  }
}