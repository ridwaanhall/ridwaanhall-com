"""Email templates for contact and guestbook emails.

Contains HTML and plain text email formatting functions for:
- Contact form notifications to site owner
- Contact form auto-replies to visitors
- Guestbook notifications
"""


def generate_html_email(name: str, sender_email: str, message_text: str) -> str:
    """
    Generate professional HTML email with table formatting.
    
    Args:
        name: Sender's name
        sender_email: Sender's email address
        message_text: Message content
        
    Returns:
        str: Formatted HTML email content
    """
    # Format message with line breaks
    formatted_message = message_text.replace('\n', '<br>')
    
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            * {{
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }}
            body {{
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                background-color: #09090b;
                color: #d4d4d8;
                padding: 20px;
            }}
            .container {{
                max-width: 600px;
                margin: 0 auto;
                background-color: #18181b;
                border-radius: 12px;
                overflow: hidden;
                border: 1px solid #27272a;
            }}
            .header {{
                background: linear-gradient(135deg, #27272a 0%, #3f3f46 100%);
                color: #fafafa;
                padding: 32px 24px;
                text-align: center;
                border-bottom: 2px solid #52525b;
            }}
            .header h1 {{
                font-size: 24px;
                font-weight: 600;
                margin-bottom: 8px;
                letter-spacing: -0.025em;
                color: #fafafa;
            }}
            .header p {{
                font-size: 14px;
                opacity: 0.85;
                color: #e4e4e7;
            }}
            .content {{
                padding: 32px 24px;
            }}
            .intro {{
                color: #a1a1aa;
                margin-bottom: 24px;
                font-size: 15px;
            }}
            .info-card {{
                background-color: #27272a;
                border: 1px solid #3f3f46;
                border-radius: 8px;
                padding: 20px;
                margin-bottom: 20px;
            }}
            .info-card h2 {{
                color: #a78bfa;
                font-size: 14px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                margin-bottom: 16px;
            }}
            .info-row {{
                display: flex;
                padding: 12px 0;
                border-bottom: 1px solid #3f3f46;
            }}
            .info-row:last-child {{
                border-bottom: none;
            }}
            .info-label {{
                font-weight: 600;
                color: #a78bfa;
                min-width: 120px;
                font-size: 14px;
            }}
            .info-value {{
                color: #d4d4d8;
                font-size: 14px;
            }}
            .info-value a {{
                color: #818cf8;
                text-decoration: none;
            }}
            .info-value a:hover {{
                text-decoration: underline;
            }}
            .message-card {{
                background-color: #27272a;
                border: 1px solid #3f3f46;
                border-radius: 8px;
                padding: 20px;
                margin-bottom: 20px;
            }}
            .message-card h2 {{
                color: #a78bfa;
                font-size: 14px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                margin-bottom: 16px;
            }}
            .message-box {{
                background-color: #18181b;
                padding: 16px;
                border-left: 4px solid #6366f1;
                border-radius: 4px;
                color: #d4d4d8;
                font-size: 14px;
                line-height: 1.8;
            }}
            .note {{
                background-color: #3730a3;
                background: linear-gradient(135deg, #312e81 0%, #3730a3 100%);
                padding: 16px;
                border-radius: 8px;
                margin-bottom: 20px;
            }}
            .note strong {{
                color: #c7d2fe;
                font-weight: 600;
            }}
            .note p {{
                color: #e0e7ff;
                font-size: 14px;
                margin: 0;
            }}
            .footer {{
                text-align: center;
                padding: 24px;
                color: #71717a;
                font-size: 13px;
                border-top: 1px solid #27272a;
            }}
            .footer a {{
                color: #818cf8;
                text-decoration: none;
            }}
            .badge {{
                display: inline-block;
                background-color: #3f3f46;
                color: #d4d4d8;
                padding: 4px 12px;
                border-radius: 12px;
                font-size: 12px;
                font-weight: 500;
                margin-top: 8px;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>New Contact Message</h1>
                <p>You've received a new message from ridwaanhall.com</p>
            </div>
            
            <div class="content">
                <p class="intro">
                    Someone has reached out to you through your website contact form. Here are the details:
                </p>
                
                <div class="info-card">
                    <h2>Contact Information</h2>
                    <div class="info-row">
                        <div class="info-label">Name:</div>
                        <div class="info-value">{name}</div>
                    </div>
                    <div class="info-row">
                        <div class="info-label">Email:</div>
                        <div class="info-value"><a href="mailto:{sender_email}">{sender_email}</a></div>
                    </div>
                </div>
                
                <div class="message-card">
                    <h2>Message Content</h2>
                    <div class="message-box">
                        {formatted_message}
                    </div>
                </div>
                
                <div class="note">
                    <p><strong>Quick Reply:</strong> You can reply directly to this email, and your response will be sent to {sender_email}.</p>
                </div>
            </div>
            
            <div class="footer">
                <p>This email was automatically sent from the contact form at <a href="https://ridwaanhall.com">ridwaanhall.com</a></p>
                <span class="badge">Automated Notification</span>
            </div>
        </div>
    </body>
    </html>
    """


def generate_text_email(name: str, sender_email: str, message_text: str) -> str:
    """
    Generate plain text email fallback.
    
    Args:
        name: Sender's name
        sender_email: Sender's email address
        message_text: Message content
        
    Returns:
        str: Formatted plain text email content
    """
    return f"""
╔════════════════════════════════════════════════════════╗
║        NEW CONTACT MESSAGE FROM RIDWAANHALL.COM        ║
╚════════════════════════════════════════════════════════╝

You've received a new message from your website contact form!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONTACT INFORMATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Name:  {name}
Email: {sender_email}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MESSAGE CONTENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{message_text}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

QUICK REPLY: You can reply directly to this email, and your 
response will be sent to {sender_email}.

───────────────────────────────────────────────────────────
Automated notification from ridwaanhall.com contact form
───────────────────────────────────────────────────────────
"""


def generate_contact_autoreply_html(name: str, sender_email: str, message_text: str) -> str:
    """Generate HTML auto-reply email for contact form visitors.

    Args:
        name: Visitor's name
        sender_email: Visitor's email address
        message_text: Original message content

    Returns:
        str: Formatted HTML email content for the visitor
    """
    display_name = name or "there"
    formatted_message = message_text.replace("\n", "<br>")

    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            * {{
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }}
            body {{
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                background-color: #09090b;
                color: #d4d4d8;
                padding: 20px;
            }}
            .container {{
                max-width: 600px;
                margin: 0 auto;
                background-color: #18181b;
                border-radius: 12px;
                overflow: hidden;
                border: 1px solid #27272a;
            }}
            .header {{
                background: linear-gradient(135deg, #27272a 0%, #3f3f46 100%);
                color: #fafafa;
                padding: 32px 24px;
                text-align: center;
                border-bottom: 2px solid #52525b;
            }}
            .header h1 {{
                font-size: 24px;
                font-weight: 600;
                margin-bottom: 8px;
                letter-spacing: -0.025em;
                color: #fafafa;
            }}
            .header p {{
                font-size: 14px;
                opacity: 0.85;
                color: #e4e4e7;
            }}
            .content {{
                padding: 32px 24px;
            }}
            .intro {{
                color: #a1a1aa;
                margin-bottom: 20px;
                font-size: 15px;
            }}
            .card {{
                background-color: #27272a;
                border: 1px solid #3f3f46;
                border-radius: 8px;
                padding: 20px;
                margin-bottom: 20px;
            }}
            .card h2 {{
                color: #a78bfa;
                font-size: 14px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                margin-bottom: 12px;
            }}
            .message-box {{
                background-color: #18181b;
                padding: 16px;
                border-left: 4px solid #6366f1;
                border-radius: 4px;
                color: #d4d4d8;
                font-size: 14px;
                line-height: 1.8;
            }}
            .meta {{
                font-size: 13px;
                color: #a1a1aa;
                margin-top: 8px;
            }}
            .footer {{
                text-align: center;
                padding: 24px;
                color: #71717a;
                font-size: 13px;
                border-top: 1px solid #27272a;
            }}
            .footer a {{
                color: #818cf8;
                text-decoration: none;
            }}
            .badge {{
                display: inline-block;
                background-color: #3f3f46;
                color: #d4d4d8;
                padding: 4px 12px;
                border-radius: 12px;
                font-size: 12px;
                font-weight: 500;
                margin-top: 8px;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Thanks for reaching out</h1>
                <p>Your message to ridwaanhall.com has been received</p>
            </div>

            <div class="content">
                <p class="intro">
                    Hi {display_name},<br><br>
                    Thanks for contacting <strong>Ridwan Halim</strong> through <strong>ridwaanhall.com</strong>.
                    This is a quick confirmation that your message has safely landed in the inbox.
                </p>

                <div class="card">
                    <h2>What happens next</h2>
                    <div class="message-box">
                        Ridwan usually replies within <strong>3 days</strong>.
                        If your message is time-sensitive, feel free to reply directly to this email with any additional details.
                    </div>
                </div>

                <div class="card">
                    <h2>Your original message</h2>
                    <div class="message-box">
                        {formatted_message}
                    </div>
                    <p class="meta">
                        Name: {name or sender_email}<br>
                        Email: {sender_email}
                    </p>
                </div>
            </div>

            <div class="footer">
                <p>Sent automatically from the contact form at <a href="https://ridwaanhall.com">ridwaanhall.com</a></p>
                <span class="badge">Confirmation Copy</span>
            </div>
        </div>
    </body>
    </html>
    """


def generate_contact_autoreply_text(name: str, sender_email: str, message_text: str) -> str:
    """Generate plain text auto-reply for contact form visitors.

    Args:
        name: Visitor's name
        sender_email: Visitor's email address
        message_text: Original message content

    Returns:
        str: Formatted plain text email content for the visitor
    """
    display_name = name or "there"

    return f"""
Hi {display_name},

Thanks for contacting Ridwan Halim through ridwaanhall.com.

This is a quick confirmation that your message has been received.
Ridwan usually replies within 3 days.

For your reference, here is a copy of what you sent:
--------------------------------------------------
From:   {name or sender_email}
Email:  {sender_email}

Message:
{message_text}
--------------------------------------------------

If you need to add anything, you can simply reply to this email.

— ridwaanhall.com
"""


def generate_guestbook_html_email(name: str, sender_email: str, message_text: str, timestamp: str, guestbook_url: str) -> str:
    """
    Generate professional HTML email for guestbook notifications.
    
    Args:
        name: Sender's name
        sender_email: Sender's email address
        message_text: Message content
        timestamp: Message timestamp
        guestbook_url: URL to the guestbook page
        
    Returns:
        str: Formatted HTML email content
    """
    # Format message with line breaks
    formatted_message = message_text.replace('\n', '<br>')
    
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            * {{
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }}
            body {{
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                background-color: #09090b;
                color: #d4d4d8;
                padding: 20px;
            }}
            .container {{
                max-width: 600px;
                margin: 0 auto;
                background-color: #18181b;
                border-radius: 12px;
                overflow: hidden;
                border: 1px solid #27272a;
            }}
            .header {{
                background: linear-gradient(135deg, #27272a 0%, #3f3f46 100%);
                color: #fafafa;
                padding: 32px 24px;
                text-align: center;
                border-bottom: 2px solid #52525b;
            }}
            .header h1 {{
                font-size: 24px;
                font-weight: 600;
                margin-bottom: 8px;
                letter-spacing: -0.025em;
                color: #fafafa;
            }}
            .header p {{
                font-size: 14px;
                opacity: 0.85;
                color: #e4e4e7;
            }}
            .content {{
                padding: 32px 24px;
            }}
            .intro {{
                color: #a1a1aa;
                margin-bottom: 24px;
                font-size: 15px;
            }}
            .info-card {{
                background-color: #27272a;
                border: 1px solid #3f3f46;
                border-radius: 8px;
                padding: 20px;
                margin-bottom: 20px;
            }}
            .info-card h2 {{
                color: #a78bfa;
                font-size: 14px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                margin-bottom: 16px;
            }}
            .info-row {{
                display: flex;
                padding: 12px 0;
                border-bottom: 1px solid #3f3f46;
            }}
            .info-row:last-child {{
                border-bottom: none;
            }}
            .info-label {{
                font-weight: 600;
                color: #a78bfa;
                min-width: 120px;
                font-size: 14px;
            }}
            .info-value {{
                color: #d4d4d8;
                font-size: 14px;
            }}
            .info-value a {{
                color: #818cf8;
                text-decoration: none;
            }}
            .info-value a:hover {{
                text-decoration: underline;
            }}
            .message-card {{
                background-color: #27272a;
                border: 1px solid #3f3f46;
                border-radius: 8px;
                padding: 20px;
                margin-bottom: 20px;
            }}
            .message-card h2 {{
                color: #a78bfa;
                font-size: 14px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                margin-bottom: 16px;
            }}
            .message-box {{
                background-color: #18181b;
                padding: 16px;
                border-left: 4px solid #6366f1;
                border-radius: 4px;
                color: #d4d4d8;
                font-size: 14px;
                line-height: 1.8;
            }}
            .action-button {{
                display: inline-block;
                background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
                color: #ffffff;
                padding: 12px 24px;
                border-radius: 8px;
                text-decoration: none;
                font-weight: 600;
                font-size: 14px;
                margin-top: 8px;
            }}
            .action-button:hover {{
                background: linear-gradient(135deg, #4f46e5 0%, #4338ca 100%);
            }}
            .footer {{
                text-align: center;
                padding: 24px;
                color: #71717a;
                font-size: 13px;
                border-top: 1px solid #27272a;
            }}
            .footer a {{
                color: #818cf8;
                text-decoration: none;
            }}
            .badge {{
                display: inline-block;
                background-color: #3f3f46;
                color: #d4d4d8;
                padding: 4px 12px;
                border-radius: 12px;
                font-size: 12px;
                font-weight: 500;
                margin-top: 8px;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>New Guestbook Message</h1>
                <p>Someone left a message in your guestbook</p>
            </div>
            
            <div class="content">
                <p class="intro">
                    You've received a new message in your guestbook. Here are the details:
                </p>
                
                <div class="info-card">
                    <h2>Message Information</h2>
                    <div class="info-row">
                        <div class="info-label">From:</div>
                        <div class="info-value">{name}</div>
                    </div>
                    <div class="info-row">
                        <div class="info-label">Email:</div>
                        <div class="info-value"><a href="mailto:{sender_email}">{sender_email}</a></div>
                    </div>
                    <div class="info-row">
                        <div class="info-label">Timestamp:</div>
                        <div class="info-value">{timestamp}</div>
                    </div>
                </div>
                
                <div class="message-card">
                    <h2>Message Content</h2>
                    <div class="message-box">
                        {formatted_message}
                    </div>
                </div>
                
                <div style="text-align: center; margin-top: 24px;">
                    <a href="{guestbook_url}" class="action-button">View Guestbook</a>
                </div>
            </div>
            
            <div class="footer">
                <p>This email was automatically sent from the guestbook at <a href="https://ridwaanhall.com">ridwaanhall.com</a></p>
                <span class="badge">Automated Notification</span>
            </div>
        </div>
    </body>
    </html>
    """


def generate_guestbook_text_email(name: str, sender_email: str, message_text: str, timestamp: str, guestbook_url: str) -> str:
    """
    Generate plain text email fallback for guestbook notifications.
    
    Args:
        name: Sender's name
        sender_email: Sender's email address
        message_text: Message content
        timestamp: Message timestamp
        guestbook_url: URL to the guestbook page
        
    Returns:
        str: Formatted plain text email content
    """
    return f"""
╔════════════════════════════════════════════════════════╗
║       NEW GUESTBOOK MESSAGE FROM RIDWAANHALL.COM       ║
╚════════════════════════════════════════════════════════╝

Someone has left a message in your guestbook!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MESSAGE INFORMATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

From:      {name}
Email:     {sender_email}
Timestamp: {timestamp}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MESSAGE CONTENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{message_text}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

View your guestbook: {guestbook_url}

───────────────────────────────────────────────────────────
Automated notification from ridwaanhall.com guestbook
───────────────────────────────────────────────────────────
"""