import { getUserNotificationDetails } from "@/lib/notifications";
import { sendFrameNotification } from "@/lib/notification-client";
import { createClient } from '@supabase/supabase-js';
import { CreatorWithFid } from '@/lib/database.types';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function getAllCreatorsWithFids(): Promise<CreatorWithFid[]> {
  const { data: creators, error } = await supabase
    .from('creators')
    .select('creator_id, fid, username')
    .not('fid', 'is', null);
  
  if (error) {
    console.error('Error fetching creators with FIDs:', error);
    return [];
  }
  
  return creators || [];
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
  const creators = await getAllCreatorsWithFids();
  
  // Filter out the question creator if provided
  const targetCreators = excludeFid 
    ? creators.filter(creator => creator.fid !== excludeFid)
    : creators;
  
  const results = {
    success: 0,
    noToken: 0,
    rateLimit: 0,
    error: 0,
  };

  // Send notifications in batches to avoid overwhelming the system
  const batchSize = 50;
  for (let i = 0; i < targetCreators.length; i += batchSize) {
    const batch = targetCreators.slice(i, i + batchSize);
    
    const batchPromises = batch.map(async (creator) => {
      try {
        const result = await sendFrameNotification({
          fid: creator.fid,
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
            console.error(`Notification error for FID ${creator.fid}:`, result.error);
            break;
        }
      } catch (error) {
        results.error++;
        console.error(`Failed to send notification to FID ${creator.fid}:`, error);
      }
    });
    
    await Promise.all(batchPromises);
    
    // Small delay between batches to be respectful to the notification service
    if (i + batchSize < targetCreators.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  console.log('Bulk notification results:', {
    totalCreators: targetCreators.length,
    ...results,
  });
  
  return results;
}