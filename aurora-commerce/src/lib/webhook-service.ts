import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export interface WebhookConfig {
  id: string;
  name: string;
  url: string;
  is_active: boolean;
  webhook_type: 'zapier' | 'buildship' | 'slack' | 'discord' | 'email' | 'custom';
  auth_header?: string;
  custom_headers?: Record<string, string>;
  retry_attempts: number;
  timeout_seconds: number;
  created_at: string;
  updated_at: string;
}

export interface InventoryWebhookService {
  getAllWebhooks(): Promise<WebhookConfig[]>;
  createWebhook(config: Omit<WebhookConfig, 'id' | 'created_at' | 'updated_at'>): Promise<WebhookConfig>;
  updateWebhook(id: string, updates: Partial<WebhookConfig>): Promise<WebhookConfig>;
  deleteWebhook(id: string): Promise<void>;
  testWebhook(id: string): Promise<{ success: boolean; response?: any; error?: string }>;
  sendInventoryAlert(alerts: any[], webhookId?: string): Promise<{ success: boolean; results: any[] }>;
}

class InventoryWebhookServiceImpl implements InventoryWebhookService {
  async getAllWebhooks(): Promise<WebhookConfig[]> {
    const { data, error } = await supabase
      .from('webhook_configs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to fetch webhooks: ${error.message}`);
    return data || [];
  }

  async createWebhook(config: Omit<WebhookConfig, 'id' | 'created_at' | 'updated_at'>): Promise<WebhookConfig> {
    const { data, error } = await supabase
      .from('webhook_configs')
      .insert(config)
      .select()
      .single();

    if (error) throw new Error(`Failed to create webhook: ${error.message}`);
    return data;
  }

  async updateWebhook(id: string, updates: Partial<WebhookConfig>): Promise<WebhookConfig> {
    const { data, error } = await supabase
      .from('webhook_configs')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update webhook: ${error.message}`);
    return data;
  }

  async deleteWebhook(id: string): Promise<void> {
    const { error } = await supabase
      .from('webhook_configs')
      .delete()
      .eq('id', id);

    if (error) throw new Error(`Failed to delete webhook: ${error.message}`);
  }

  async testWebhook(id: string): Promise<{ success: boolean; response?: any; error?: string }> {
    try {
      const webhook = await this.getWebhookById(id);
      if (!webhook) {
        return { success: false, error: 'Webhook not found' };
      }

      const testPayload = {
        test: true,
        timestamp: new Date().toISOString(),
        message: 'This is a test webhook from Aurora Commerce Inventory System',
        alert_count: 1,
        alerts: [
          {
            alert_id: 'test-alert-id',
            product_name: 'Test Product',
            alert_type: 'low_stock',
            current_stock: 10,
            threshold_value: 15,
            alert_message: 'This is a test alert to verify webhook functionality'
          }
        ],
        summary: {
          out_of_stock: 0,
          critical_stock: 0,
          low_stock: 1
        }
      };

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'User-Agent': 'Aurora-Commerce-Inventory-Monitor/1.0'
      };

      if (webhook.auth_header) {
        headers['Authorization'] = webhook.auth_header;
      }

      if (webhook.custom_headers) {
        Object.assign(headers, webhook.custom_headers);
      }

      const response = await fetch(webhook.url, {
        method: 'POST',
        headers,
        body: JSON.stringify(testPayload),
        signal: AbortSignal.timeout(webhook.timeout_seconds * 1000)
      });

      const responseText = await response.text();
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = responseText;
      }

      return {
        success: response.ok,
        response: {
          status: response.status,
          statusText: response.statusText,
          data: responseData
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async sendInventoryAlert(alerts: any[], webhookId?: string): Promise<{ success: boolean; results: any[] }> {
    let webhooks: WebhookConfig[];

    if (webhookId) {
      const webhook = await this.getWebhookById(webhookId);
      webhooks = webhook ? [webhook] : [];
    } else {
      webhooks = await this.getAllWebhooks();
      webhooks = webhooks.filter(w => w.is_active);
    }

    if (webhooks.length === 0) {
      return { success: false, results: [{ error: 'No active webhooks found' }] };
    }

    const payload = {
      timestamp: new Date().toISOString(),
      alert_count: alerts.length,
      alerts,
      summary: alerts.reduce((acc, alert) => {
        acc[alert.alert_type] = (acc[alert.alert_type] || 0) + 1;
        return acc;
      }, { out_of_stock: 0, critical_stock: 0, low_stock: 0 })
    };

    const results = await Promise.allSettled(
      webhooks.map(async (webhook) => {
        try {
          const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'User-Agent': 'Aurora-Commerce-Inventory-Monitor/1.0'
          };

          if (webhook.auth_header) {
            headers['Authorization'] = webhook.auth_header;
          }

          if (webhook.custom_headers) {
            Object.assign(headers, webhook.custom_headers);
          }

          let attempt = 0;
          let lastError;

          while (attempt < webhook.retry_attempts) {
            try {
              const response = await fetch(webhook.url, {
                method: 'POST',
                headers,
                body: JSON.stringify(payload),
                signal: AbortSignal.timeout(webhook.timeout_seconds * 1000)
              });

              if (response.ok) {
                return {
                  webhookId: webhook.id,
                  success: true,
                  status: response.status,
                  attempt: attempt + 1
                };
              } else {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
              }
            } catch (error) {
              lastError = error;
              attempt++;
              if (attempt < webhook.retry_attempts) {
                // Exponential backoff: wait 2^attempt seconds
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
              }
            }
          }

          return {
            webhookId: webhook.id,
            success: false,
            error: lastError instanceof Error ? lastError.message : 'Unknown error',
            attempts: webhook.retry_attempts
          };

        } catch (error) {
          return {
            webhookId: webhook.id,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      })
    );

    const finalResults = results.map(result => 
      result.status === 'fulfilled' ? result.value : { success: false, error: result.reason }
    );

    const successCount = finalResults.filter(r => r.success).length;

    return {
      success: successCount > 0,
      results: finalResults
    };
  }

  private async getWebhookById(id: string): Promise<WebhookConfig | null> {
    const { data, error } = await supabase
      .from('webhook_configs')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return data;
  }
}

// Export singleton instance
export const webhookService = new InventoryWebhookServiceImpl();

// Webhook template configurations for popular services
export const WEBHOOK_TEMPLATES = {
  zapier: {
    name: 'Zapier Integration',
    webhook_type: 'zapier' as const,
    retry_attempts: 3,
    timeout_seconds: 30,
    custom_headers: {
      'X-Source': 'Aurora-Commerce'
    }
  },
  buildship: {
    name: 'BuildShip Workflow',
    webhook_type: 'buildship' as const,
    retry_attempts: 2,
    timeout_seconds: 25,
    custom_headers: {
      'X-Source': 'Aurora-Commerce',
      'Content-Type': 'application/json'
    }
  },
  slack: {
    name: 'Slack Notification',
    webhook_type: 'slack' as const,
    retry_attempts: 3,
    timeout_seconds: 15,
    custom_headers: {
      'Content-Type': 'application/json'
    }
  },
  discord: {
    name: 'Discord Webhook',
    webhook_type: 'discord' as const,
    retry_attempts: 2,
    timeout_seconds: 15,
    custom_headers: {
      'Content-Type': 'application/json'
    }
  }
};

// Utility function to format alerts for different webhook types
export function formatAlertForWebhook(alerts: any[], webhookType: string) {
  switch (webhookType) {
    case 'slack':
      return formatForSlack(alerts);
    case 'discord':
      return formatForDiscord(alerts);
    default:
      return {
        timestamp: new Date().toISOString(),
        alert_count: alerts.length,
        alerts,
        summary: alerts.reduce((acc, alert) => {
          acc[alert.alert_type] = (acc[alert.alert_type] || 0) + 1;
          return acc;
        }, { out_of_stock: 0, critical_stock: 0, low_stock: 0 })
      };
  }
}

function formatForSlack(alerts: any[]) {
  const emoji = { out_of_stock: '🚨', critical_stock: '⚠️', low_stock: '📦' };
  const summary = alerts.reduce((acc, alert) => {
    acc[alert.alert_type] = (acc[alert.alert_type] || 0) + 1;
    return acc;
  }, { out_of_stock: 0, critical_stock: 0, low_stock: 0 });

  return {
    text: `🏪 Aurora Commerce Inventory Alert - ${alerts.length} items need attention`,
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '🏪 Inventory Alert Summary'
        }
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*Out of Stock:* ${summary.out_of_stock}` },
          { type: 'mrkdwn', text: `*Critical Stock:* ${summary.critical_stock}` },
          { type: 'mrkdwn', text: `*Low Stock:* ${summary.low_stock}` },
          { type: 'mrkdwn', text: `*Total Alerts:* ${alerts.length}` }
        ]
      },
      ...alerts.slice(0, 5).map(alert => ({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `${emoji[alert.alert_type as keyof typeof emoji]} *${alert.product_name}*\n${alert.alert_message}`
        }
      }))
    ]
  };
}

function formatForDiscord(alerts: any[]) {
  const summary = alerts.reduce((acc, alert) => {
    acc[alert.alert_type] = (acc[alert.alert_type] || 0) + 1;
    return acc;
  }, { out_of_stock: 0, critical_stock: 0, low_stock: 0 });

  return {
    embeds: [
      {
        title: '🏪 Aurora Commerce - Inventory Alert',
        description: `${alerts.length} products need attention`,
        color: summary.out_of_stock > 0 ? 0xff0000 : summary.critical_stock > 0 ? 0xff8c00 : 0xffd700,
        fields: [
          { name: '🚨 Out of Stock', value: summary.out_of_stock.toString(), inline: true },
          { name: '⚠️ Critical Stock', value: summary.critical_stock.toString(), inline: true },
          { name: '📦 Low Stock', value: summary.low_stock.toString(), inline: true },
          ...alerts.slice(0, 3).map(alert => ({
            name: alert.product_name,
            value: alert.alert_message,
            inline: false
          }))
        ],
        timestamp: new Date().toISOString()
      }
    ]
  };
}