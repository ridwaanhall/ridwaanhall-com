from datetime import datetime

class PrivacyPolicyData:
    privacy_policy = {
        "last_updated": datetime.strptime("2025-06-29T01:48:45+07:00", "%Y-%m-%dT%H:%M:%S%z"),
        "overview": "I understand that your privacy is important. This policy explains how I collect, use, and protect your information when you visit my website.",
        "policy_updates": "I might give this policy a refresh as the website evolves and grows. Major changes will be reflected in the last updated date above, and I 'll do my best to notify users of significant privacy policy updates.",
        "data_collected": {
            "Cloudflare": {
                "IP address": "Picked up for tracking purposes and security protection",
                "Country": "Noted to understand my global audience and content localization",
                "ASN": "Grabbed to keep tabs on network details and prevent abuse",
                "User agent": "Tracked to see how you're browsing and optimize compatibility",
                "Method": "Logged to monitor interaction types and API usage",
                "Scheme": "Captured to ensure secure connections (HTTPS enforcement)",
                "OS device type": "Spotted to optimize device compatibility and responsive design",
                "Referrer information": "Collected to understand traffic sources and user navigation patterns"
            },
            "Google Analytics": {
                "Country": "Noted to map out my worldwide visitors and content preferences",
                "Region": "Logged to dive deeper into geographic trends and regional interests",
                "City": "Tracked to get a vibe on urban engagement and local relevance",
                "Language": "Picked up to tailor content for you and improve accessibility",
                "Device Category": "Collected to optimize mobile, desktop, and tablet experiences",
                "Browser Information": "Gathered to ensure cross-browser compatibility",
                "Page Views": "Tracked to understand content popularity and navigation patterns",
                "Session Duration": "Monitored to analyze user engagement and content effectiveness"
            },
            "Guestbook Feature": {
                "User Authentication": "Handled via Google and GitHub OAuth for secure login",
                "Profile Information": "Name, email, and profile picture from your OAuth provider",
                "Message Content": "Text messages you post in the guestbook chat (max 500 characters)",
                "Message Timestamps": "When you posted your messages for proper chronological display",
                "User Roles": "Author and co-author status for content management purposes",
                "Reply Associations": "Links between messages and their replies for threaded conversations",
                "User Session Data": "Temporary session cookies for maintaining login state"
            },
            "Technical & Security Data": {
                "Session Cookies": "Essential cookies for site functionality, authentication, and security (CSRF protection)",
                "Security Headers": "Content Security Policy violations and security-related browser data",
                "Navigation Patterns": "Page transitions and user flow data for UX optimization",
                "Cache Performance": "Temporary data storage metrics for optimizing load times"
            }
        },
        "data_usage": {
            "Website Analytics": "Track visits, page views, and content interaction patterns",
            "Security & Optimization": "Keep the site secure, optimized, and running smoothly",
            "User Experience": "Analyze visitor trends to improve site functionality and design",
            "Guestbook Management": "Handle user authentication, profiles, and message threading",
            "Content Improvement": "Understand popular content to enhance blog posts and projects",
            "Geographic Insights": "Analyze visitor distribution for content localization",
            "Session Management": "Maintain login state and protect against security threats"
        },
        "third_party_services": {
            "Cloudflare": "Our go-to for top-notch security, DDoS protection, and detailed web analytics",
            "Google Analytics": "Helps us get the full scoop on who's visiting and what they're into",
            "Google OAuth": "Secure authentication provider for guestbook user login",
            "GitHub OAuth": "Alternative secure authentication provider for guestbook access",
            "wsrv": "Image optimization service for faster loading times and better performance"
        },
        "data_protection": {
            "Storage": "Secure database hosting with encrypted connections and access controls",
            "Data Privacy": "Most data is aggregated and anonymized to protect your privacy",
            "Encryption": "All data transmission uses HTTPS encryption with secure cookies",
            "Retention": "Cache refreshes every 3 hours, session cookies expire after 1 hour",
            "Security Headers": "CSP, HSTS, and other security headers protect against attacks",
            "Data Minimization": "I only collect data necessary for site functionality"
        },
        "user_rights": {
            "Data Access": "Request details about what data I have collected about you",
            "Data Deletion": "Delete your guestbook messages, profile data, or account",
            "Data Correction": "Update or correct any inaccurate personal information",
            "Opt-Out Options": "Disable tracking via browser settings, ad blockers, or Do Not Track",
            "Contact": "Reach out to hi@ridwaanhall.com for any privacy questions or requests"
        },
        "cookies": {
            "Essential Cookies": {
                "SessionId": "Django session cookie for maintaining user login state (1 hour expiration)",
                "CsrfToken": "CSRF protection token to prevent cross-site request forgery attacks",
                "Messages": "Temporary cookies for displaying system messages and notifications"
            },
            "Analytics Cookies": {
                "Google Analytics": "Website usage analytics and visitor behavior tracking"
            },
            "Performance Cookies": {
                "Cache Control": "Browser caching preferences to improve page load times",
                "Static File Cache": "Cached static assets (CSS, JS, images) for faster subsequent visits"
            }
        },
        "legal_basis": {
            "Legitimate Interest": "Analytics and site improvement based on legitimate business interests",
            "Consent": "Guestbook participation and social authentication require explicit user consent",
            "Contract": "User-generated content storage necessary for providing guestbook functionality",
            "Legal Compliance": "Security measures and data protection implemented to comply with privacy regulations"
        }
    }
