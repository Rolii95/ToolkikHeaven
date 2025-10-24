import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface InventoryAlert {
  alert_id: string;
  product_id: string;
  product_name: string;
  category: string;
  alert_type: string;
  current_stock: number;
  threshold_value: number;
  alert_message: string;
  created_at: string;
}

interface WebhookPayload {
  timestamp: string;
  alert_count: number;
  alerts: InventoryAlert[];
  summary: {
    out_of_stock: number;
    critical_stock: number;
    low_stock: number;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    console.log('🔍 Starting inventory threshold check...')

    // Get all pending inventory alerts
    const { data: alerts, error: alertsError } = await supabase
      .rpc('get_pending_inventory_alerts')

    if (alertsError) {
      console.error('Error fetching alerts:', alertsError)
      throw new Error(`Failed to fetch alerts: ${alertsError.message}`)
    }

    console.log(`📊 Found ${alerts?.length || 0} pending alerts`)

    // If no alerts, return early
    if (!alerts || alerts.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No pending inventory alerts',
          checked_at: new Date().toISOString()
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    // Group alerts by type for summary
    const summary = alerts.reduce((acc, alert) => {
      acc[alert.alert_type as keyof typeof acc] = (acc[alert.alert_type as keyof typeof acc] || 0) + 1
      return acc
    }, { out_of_stock: 0, critical_stock: 0, low_stock: 0 })

    // Prepare webhook payload
    const webhookPayload: WebhookPayload = {
      timestamp: new Date().toISOString(),
      alert_count: alerts.length,
      alerts: alerts,
      summary
    }

    console.log('📦 Webhook payload prepared:', {
      alert_count: webhookPayload.alert_count,
      summary: webhookPayload.summary
    })

    // Send webhook notifications
    const webhookUrl = Deno.env.get('INVENTORY_WEBHOOK_URL')
    const backupWebhookUrl = Deno.env.get('BACKUP_WEBHOOK_URL')
    
    if (!webhookUrl) {
      console.warn('⚠️ No webhook URL configured - alerts not sent externally')
    }

    const webhookResults = []

    // Send to primary webhook
    if (webhookUrl) {
      try {
        console.log('📤 Sending to primary webhook...')
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Aurora-Commerce-Inventory-Monitor/1.0'
          },
          body: JSON.stringify(webhookPayload)
        })

        if (response.ok) {
          console.log('✅ Primary webhook sent successfully')
          webhookResults.push({ type: 'primary', success: true, status: response.status })
        } else {
          console.error('❌ Primary webhook failed:', response.status, await response.text())
          webhookResults.push({ type: 'primary', success: false, status: response.status })
        }
      } catch (error) {
        console.error('❌ Primary webhook error:', error)
        webhookResults.push({ type: 'primary', success: false, error: error.message })
      }
    }

    // Send to backup webhook if primary failed
    if (backupWebhookUrl && webhookResults.some(r => !r.success)) {
      try {
        console.log('📤 Sending to backup webhook...')
        const response = await fetch(backupWebhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Aurora-Commerce-Inventory-Monitor/1.0'
          },
          body: JSON.stringify(webhookPayload)
        })

        if (response.ok) {
          console.log('✅ Backup webhook sent successfully')
          webhookResults.push({ type: 'backup', success: true, status: response.status })
        } else {
          console.error('❌ Backup webhook failed:', response.status)
          webhookResults.push({ type: 'backup', success: false, status: response.status })
        }
      } catch (error) {
        console.error('❌ Backup webhook error:', error)
        webhookResults.push({ type: 'backup', success: false, error: error.message })
      }
    }

    // Mark alerts as notified if webhook was successful
    const successfulWebhook = webhookResults.some(r => r.success)
    if (successfulWebhook) {
      const alertIds = alerts.map(alert => alert.alert_id)
      
      const { data: updateResult, error: updateError } = await supabase
        .rpc('mark_alerts_as_notified', { alert_ids: alertIds })

      if (updateError) {
        console.error('❌ Error marking alerts as notified:', updateError)
      } else {
        console.log(`✅ Marked ${updateResult} alerts as notified`)
      }
    }

    // Send internal notification to database log
    const { error: logError } = await supabase
      .from('inventory_alert_logs')
      .insert({
        check_timestamp: new Date().toISOString(),
        alerts_found: alerts.length,
        alerts_summary: summary,
        webhook_results: webhookResults,
        notification_sent: successfulWebhook
      })

    if (logError) {
      console.warn('⚠️ Could not log to inventory_alert_logs:', logError.message)
    }

    // Return response
    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${alerts.length} inventory alerts`,
        timestamp: new Date().toISOString(),
        alerts_processed: alerts.length,
        summary,
        webhook_results: webhookResults,
        notifications_sent: successfulWebhook
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('❌ Inventory check function error:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})

/* 
Edge Function Configuration:
1. Deploy this function to Supabase:
   supabase functions deploy inventory-check

2. Set environment variables in Supabase Dashboard:
   - INVENTORY_WEBHOOK_URL: Your primary webhook URL (Zapier, BuildShip, etc.)
   - BACKUP_WEBHOOK_URL: Optional backup webhook URL
   - SUPABASE_URL: Auto-provided
   - SUPABASE_SERVICE_ROLE_KEY: Auto-provided

3. Set up cron job to run this function hourly:
   - Use Supabase Cron or external cron service
   - Call: POST https://your-project.supabase.co/functions/v1/inventory-check
   - Headers: { "Authorization": "Bearer YOUR_ANON_KEY" }

4. Example webhook payload structure:
   {
     "timestamp": "2024-01-15T10:30:00Z",
     "alert_count": 3,
     "alerts": [
       {
         "alert_id": "uuid",
         "product_name": "iPhone 15",
         "alert_type": "low_stock",
         "current_stock": 12,
         "threshold_value": 15,
         "alert_message": "WARNING: iPhone 15 is running low..."
       }
     ],
     "summary": {
       "out_of_stock": 0,
       "critical_stock": 1,
       "low_stock": 2
     }
   }
*/