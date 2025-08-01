from datetime import datetime

class PrivacyPolicyData:
    privacy_policy = {
        "last_updated": datetime.strptime("2025-08-01T19:19:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
        "overview": "I understand that your privacy is important. This policy explains how I collect, use, and protect your information when you visit my website.",
        "policy_updates": "I may update this policy as the website evolves and grows. Major changes will be reflected in the last updated date above, and I'll do my best to notify you of significant privacy policy updates.",
        "data_collected": {
            "Guestbook Feature": {
                "User Authentication": "Handled via Google and GitHub OAuth for secure login.",
                "Profile Information": "Name, email, and profile picture from your OAuth provider.",
                "Message Content": "Text messages you post in the guestbook chat (max 500 characters).",
                "Message Timestamps": "When you posted your messages for proper chronological display.",
                "Reply Associations": "Links between messages and their replies for threaded conversations.",
                "User Session Data": "Temporary session cookies for maintaining login state."
            },
            "Technical & Security Data": {
                "Session Cookies": "Essential cookies for site functionality, authentication, and security (CSRF protection).",
                "Security Headers": "Content Security Policy violations and security-related browser data.",
                "Navigation Patterns": "Page transitions and your flow data for UX optimization.",
                "Cache Performance": "Temporary data storage metrics for optimizing load times."
            },
            "Cloudflare": {
                "IP address": "Collected for tracking purposes and security protection.",
                "Country": "Noted to understand my global audience and content localization.",
                "ASN": "Collected to monitor network details and prevent abuse.",
                "User agent": "Tracked to see how you're browsing and optimize compatibility.",
                "Method": "Logged to monitor interaction types and API usage.",
                "Scheme": "Captured to ensure secure connections (HTTPS enforcement).",
                "OS device type": "Collected to optimize device compatibility and responsive design.",
                "Referrer information": "Collected to understand traffic sources and your navigation patterns."
            },
            "Google Analytics": {
                "Country": "Noted to map out my worldwide visitors and content preferences.",
                "Region": "Logged to analyze geographic trends and regional interests.",
                "City": "Tracked to understand urban engagement and local relevance.",
                "Language": "Collected to tailor content for you and improve accessibility.",
                "Device Category": "Collected to optimize mobile, desktop, and tablet experiences.",
                "Browser Information": "Gathered to ensure cross-browser compatibility.",
                "Page Views": "Tracked to understand content popularity and your navigation patterns.",
                "Session Duration": "Monitored to analyze your engagement and content effectiveness."
            }
        },
        "data_usage": {
            "Website Analytics": "Track visits, page views, and content interaction patterns.",
            "Security & Optimization": "Keep the site secure, optimized, and running smoothly.",
            "User Experience": "Analyze your trends to improve site functionality and design.",
            "Guestbook Management": "Handle your authentication, profiles, and message threading.",
            "Content Improvement": "Understand popular content to enhance blog posts and projects.",
            "Geographic Insights": "Analyze your distribution for content localization.",
            "Session Management": "Maintain login state and protect against security threats."
        },
        "third_party_services": {
            "Cloudflare": "My provider for security, DDoS protection, and detailed web analytics.",
            "Google Analytics": "Helps us understand who is visiting and what they're interested in.",
            "Google OAuth": "Secure authentication provider for guestbook user login.",
            "GitHub OAuth": "Alternative secure authentication provider for guestbook access.",
            "wsrv": "Image optimization service for faster loading times and better performance."
        },
        "data_protection": {
            "Storage": "Secure database hosting with encrypted connections and access controls.",
            "Data Privacy": "Most data is aggregated and anonymized to protect your privacy.",
            "Encryption": "All data transmission uses HTTPS encryption with secure cookies.",
            "Retention": "Cache refreshes every 3 hours; session cookies expire after 1 hour.",
            "Security Headers": "CSP, HSTS, and other security headers protect against attacks.",
            "Data Minimization": "I only collect data necessary for site functionality."
        },
        "user_rights": {
            "Data Access": "Request details about what data I have collected about you.",
            "Data Deletion": "Delete your guestbook messages, profile data, or account.",
            "Data Correction": "Update or correct any inaccurate personal information.",
            "Opt-Out Options": "Disable tracking via browser settings, ad blockers, or Do Not Track.",
            "Contact": "Reach out to hi@ridwaanhall.com for any privacy questions or requests."
        },
        "guestbook_limitations": {
            "Timestamp Display": "All message timestamps are stored and shown in Jakarta time (WIB, UTC+7), regardless of your local time zone.",
            "Message Management": "You can send messages and reply to other messages or your own messages.",
            "No Self-Deletion": "You cannot delete your own messages through the interface.",
            "No Message Editing": "Posted messages cannot be edited once submitted.",
            "Deletion Requests": "To delete your messages, contact hi@ridwaanhall.com with your request.",
            "Permanent Nature": "Consider your messages permanent once posted, as self-deletion is not available."
        },
        "cookies": {
            "Essential Cookies": {
                "SessionId": "Django session cookie for maintaining your login state (1 hour expiration).",
                "CsrfToken": "CSRF protection token to prevent cross-site request forgery attacks.",
                "Messages": "Temporary cookies for displaying system messages and notifications."
            },
            "Analytics Cookies": {
                "Google Analytics": "Website usage analytics and behavior tracking."
            },
            "Performance Cookies": {
                "Cache Control": "Browser caching preferences to improve page load times.",
                "Static File Cache": "Cached static assets (CSS, JS, images) for faster subsequent visits."
            }
        },
        "legal_basis": {
            "Legitimate Interest": "Analytics and site improvement based on legitimate business interests.",
            "Consent": "Guestbook participation and social authentication require your explicit consent.",
            "Contract": "Your content storage is necessary for providing guestbook functionality.",
            "Legal Compliance": "Security measures and data protection are implemented to comply with privacy regulations."
        }
    }
