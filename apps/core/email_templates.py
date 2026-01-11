"""
Email templates for contact form submissions.
Contains HTML and plain text email formatting functions.
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
        <style>
            body {{
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
            }}
            .container {{
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
            }}
            .header {{
                background-color: #7367f0;
                color: white;
                padding: 20px;
                text-align: center;
                border-radius: 5px 5px 0 0;
            }}
            .content {{
                background-color: #f8f9fa;
                padding: 20px;
                border: 1px solid #ddd;
            }}
            table {{
                width: 100%;
                border-collapse: collapse;
                margin: 20px 0;
                background-color: white;
            }}
            th {{
                background-color: #7367f0;
                color: white;
                padding: 12px;
                text-align: left;
                font-weight: bold;
            }}
            td {{
                padding: 12px;
                border-bottom: 1px solid #ddd;
            }}
            .label {{
                font-weight: bold;
                color: #7367f0;
                width: 150px;
            }}
            .message-box {{
                background-color: #fff;
                padding: 15px;
                border-left: 4px solid #7367f0;
                margin: 10px 0;
            }}
            .footer {{
                text-align: center;
                margin-top: 20px;
                color: #666;
                font-size: 12px;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h2>New Contact Form Submission</h2>
            </div>
            <div class="content">
                <p>You have received a new message from your website contact form:</p>
                
                <table>
                    <tr>
                        <th colspan="2">Contact Information</th>
                    </tr>
                    <tr>
                        <td class="label">Name:</td>
                        <td>{name}</td>
                    </tr>
                    <tr>
                        <td class="label">Email Address:</td>
                        <td><a href="mailto:{sender_email}">{sender_email}</a></td>
                    </tr>
                </table>
                
                <table>
                    <tr>
                        <th>Message</th>
                    </tr>
                    <tr>
                        <td>
                            <div class="message-box">
                                {formatted_message}
                            </div>
                        </td>
                    </tr>
                </table>
                
                <p><strong>Note:</strong> You can reply directly to this email, and your response will be sent to {sender_email}.</p>
            </div>
            <div class="footer">
                <p>This email was sent from the contact form at ridwaanhall.com</p>
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
New Contact Form Submission
============================

Contact Information:
-------------------
Name: {name}
Email: {sender_email}

Message:
--------
{message_text}

---
You can reply directly to this email to respond to {sender_email}.
This email was sent from the contact form at ridwaanhall.com
    """