import nodemailer from 'nodemailer'

// Email service configuration
const createTransporter = () => {
  // For development, you can use Gmail SMTP or a service like Mailtrap
  // For production, use services like SendGrid, Postmark, AWS SES, etc.
  
  if (process.env.EMAIL_SERVICE === 'gmail') {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD, // App password, not regular password
      },
    })
  }

  if (process.env.EMAIL_SERVICE === 'sendgrid') {
    return nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      secure: false,
      auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY,
      },
    })
  }

  if (process.env.EMAIL_SERVICE === 'postmark') {
    return nodemailer.createTransport({
      host: 'smtp.postmarkapp.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.POSTMARK_SERVER_TOKEN,
        pass: process.env.POSTMARK_SERVER_TOKEN,
      },
    })
  }

  // Default to SMTP (for development with Mailtrap, etc.)
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })
}

export interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
  from?: string
}

export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
  try {
    const transporter = createTransporter()
    
    const mailOptions = {
      from: options.from || process.env.FROM_EMAIL || 'noreply@auroracommerce.com',
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    }

    const result = await transporter.sendMail(mailOptions)
    console.log('✅ Email sent successfully:', result.messageId)
    return true
  } catch (error) {
    console.error('❌ Email send failed:', error)
    return false
  }
}

export const sendTemplateEmail = async (
  templateName: string,
  recipientEmail: string,
  variables: Record<string, any>
): Promise<boolean> => {
  try {
    // This would typically fetch from your database
    // For now, we'll use a simple in-memory template system
    const templates = {
      order_confirmation: {
        subject: 'Order Confirmation - Order #{{order_id}}',
        html: `
          <h1>Thank you for your order!</h1>
          <p>Hi \${variables.customer_name || 'Customer'},</p>
          <p>We've received your order and are preparing it for shipment.</p>
          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2>Order Details</h2>
            <p><strong>Order ID:</strong> \${variables.order_id}</p>
            <p><strong>Total:</strong> $\${variables.order_total}</p>
            <p><strong>Email:</strong> \${variables.customer_email}</p>
          </div>
          <p>Thank you for shopping with us!</p>
        `
      },
      abandoned_cart_reminder: {
        subject: 'Don\'t forget your items! Complete your order',
        html: `
          <h1>Don't miss out!</h1>
          <p>You left some great items in your cart. Complete your purchase before they're gone!</p>
          <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2>Your Cart ($\${variables.cart_total})</h2>
            \${variables.cart_items_html || 'Your cart items'}
          </div>
          <a href="\${variables.checkout_url || '#'}" style="background: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px;">
            Complete Your Order
          </a>
        `
      }
    }

    const template = templates[templateName as keyof typeof templates]
    if (!template) {
      throw new Error(`Template ${templateName} not found`)
    }

    // Replace template variables
    let subject = template.subject
    let html = template.html

    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`
      subject = subject.replace(new RegExp(placeholder, 'g'), String(value))
      html = html.replace(new RegExp(placeholder, 'g'), String(value))
    })

    return await sendEmail({
      to: recipientEmail,
      subject,
      html,
    })
  } catch (error) {
    console.error('Template email send failed:', error)
    return false
  }
}

// Helper to format order items for email templates
export const formatOrderItemsForEmail = (items: any[]): { html: string; text: string } => {
  const html = items
    .map(item => `
      <div style="border-bottom: 1px solid #e5e7eb; padding: 10px 0;">
        <strong>${item.name}</strong><br>
        Quantity: ${item.quantity}<br>
        Price: $${(item.price * item.quantity).toFixed(2)}
      </div>
    `)
    .join('')

  const text = items
    .map(item => `- ${item.name} (Qty: ${item.quantity}) - $${(item.price * item.quantity).toFixed(2)}`)
    .join('\n')

  return { html, text }
}