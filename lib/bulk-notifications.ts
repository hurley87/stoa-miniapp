import { getUserNotificationDetails } from "@/lib/notifications";
import { sendFrameNotification } from "@/lib/notification-client";
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface UserWithFid {
  fid: number;
  username: string | null;
}

export async function getAllUsersWithFids(): Promise<UserWithFid[]> {
  const { data: users, error } = await supabase
    .from('users')
    .select('fid, username')
    .not('fid', 'is', null);
  
  if (error) {
    console.error('Error fetching users with FIDs:', error);
    return [];
  }
  
  return users || [];
}

export async function sendBulkNotification({
  title,
  body,
  excludeFid,
}: {
  title: string;
  body: string;
  excludeFid?: number; // Don't notify the question creator
}) {
  const users = await getAllUsersWithFids();
  
  // Filter out the question creator if provided
  const targetUsers = excludeFid 
    ? users.filter(user => user.fid !== excludeFid)
    : users;
  
  const results = {
    success: 0,
    noToken: 0,
    rateLimit: 0,
    error: 0,
  };

  // Send notifications in batches to avoid overwhelming the system
  const batchSize = 50;
  for (let i = 0; i < targetUsers.length; i += batchSize) {
    const batch = targetUsers.slice(i, i + batchSize);
    
    const batchPromises = batch.map(async (user) => {
      try {
        const result = await sendFrameNotification({
          fid: user.fid,
          title,
          body,
        });
        
        switch (result.state) {
          case 'success':
            results.success++;
            break;
          case 'no_token':
            results.noToken++;
            break;
          case 'rate_limit':
            results.rateLimit++;
            break;
          case 'error':
            results.error++;
            console.error(`Notification error for FID ${user.fid}:`, result.error);
            break;
        }
      } catch (error) {
        results.error++;
        console.error(`Failed to send notification to FID ${user.fid}:`, error);
      }
    });
    
    await Promise.all(batchPromises);
    
    // Small delay between batches to be respectful to the notification service
    if (i + batchSize < targetUsers.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  console.log('Bulk notification results:', {
    totalUsers: targetUsers.length,
    ...results,
  });
  
  return results;
}