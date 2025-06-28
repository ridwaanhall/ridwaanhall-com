from datetime import datetime

class PrivacyPolicyData:
    privacy_policy = {
        "website": "Ridwan Halim's Awesome Personal Website",
        "contact_email": "hi@ridwaanhall.com",
        "last_updated": datetime.strptime("2025-06-29T00:30:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
        "data_collected": {
            "Cloudflare": {
                "IP address": "Picked up for tracking purposes and security protection",
                "Country": "Noted to understand our global audience and content localization",
                "ASN": "Grabbed to keep tabs on network details and prevent abuse",
                "User agent": "Tracked to see how you're browsing and optimize compatibility",
                "Method": "Logged to monitor interaction types and API usage",
                "Scheme": "Captured to ensure secure connections (HTTPS enforcement)",
                "OS device type": "Spotted to optimize device compatibility and responsive design",
                "Referrer information": "Collected to understand traffic sources and user navigation patterns"
            },
            "Google Analytics": {
                "Country": "Noted to map out our worldwide visitors and content preferences",
                "Region": "Logged to dive deeper into geographic trends and regional interests",
                "City": "Tracked to get a vibe on urban engagement and local relevance",
                "Language": "Picked up to tailor content for you and improve accessibility",
                "Device category": "Collected to optimize mobile, desktop, and tablet experiences",
                "Browser information": "Gathered to ensure cross-browser compatibility",
                "Page views": "Tracked to understand content popularity and navigation patterns",
                "Session duration": "Monitored to analyze user engagement and content effectiveness"
            },
            "Guestbook Feature": {
                "User authentication": "Handled via Google and GitHub OAuth for secure login",
                "Profile information": "Name, email, and profile picture from your OAuth provider",
                "Message content": "Text messages you post in the guestbook chat (max 500 characters)",
                "Message timestamps": "When you posted your messages for proper chronological display",
                "User roles": "Author and co-author status for content management purposes",
                "Reply associations": "Links between messages and their replies for threaded conversations",
                "User session data": "Temporary session cookies for maintaining login state"
            },
            "Technical & Security Data": {
                "Session cookies": "Essential cookies for site functionality, authentication, and security (CSRF protection)",
                "Security headers": "Content Security Policy violations and security-related browser data",
                "Navigation patterns": "Page transitions and user flow data for UX optimization",
                "Cache performance": "Temporary data storage metrics for optimizing load times"
            }
        },
        "data_usage": [
            "Digging into website analytics to track visits, page views, and how you interact with our content",
            "Keeping everything secure, optimized, and running like a well-oiled machine",
            "Leveling up the user experience by analyzing visitor trends and preferences",
            "Managing guestbook interactions and maintaining conversation threads",
            "Authenticating users securely through trusted OAuth providers",
            "Displaying user profiles and managing author/co-author permissions",
            "Protecting against CSRF attacks and ensuring secure form submissions",
            "Understanding content popularity to improve blog posts and project showcases",
            "Analyzing geographic distribution of visitors for content localization",
            "Tracking social media engagement and external link interactions",
            "Maintaining session state for logged-in guestbook users"
        ],
        "third_party_services": {
            "Cloudflare": "Our go-to for top-notch security, DDoS protection, and detailed web analytics",
            "Google Analytics": "Helps us get the full scoop on who's visiting and what they're into",
            "Google OAuth": "Secure authentication provider for guestbook user login",
            "GitHub OAuth": "Alternative secure authentication provider for guestbook access",
            "Vercel": "Hosting platform that may collect deployment and performance metrics",
            "PostgreSQL": "Database hosting service for secure data storage in production environment"
        },
        "data_protection": {
            "storage": "Locked down tight with state-of-the-art security measures, encrypted connections, and secure database hosting",
            "personal identifiable information": "We steer clear of collecting anything too personal - most data is aggregated and anonymized",
            "aggregation": "Data's only used for big-picture, anonymized reports and site improvement analytics",
            "retention": "API cache data is refreshed every 3 hours, session cookies expire after 1 hour, guestbook messages are stored indefinitely unless deleted",
            "security headers": "Implementation of Content Security Policy (CSP), HSTS, and other security headers to protect user data",
            "encryption": "All data transmission uses HTTPS encryption, and secure cookies are enabled in production",
            "access control": "Database access is restricted and authenticated, with role-based permissions for content management",
            "data minimization": "We only collect data that's necessary for site functionality and user experience improvements"
        },
        "user_rights": {
            "request data details": "Hit us up anytime to get the full rundown on what data we've got",
            "opt out options": "You can bounce from tracking via browser settings, ad blockers, or third-party tools",
            "contact": "Drop us a line at hi@ridwaanhall.com for any questions or concerns",
            "data deletion": "Request deletion of your guestbook messages or profile data by contacting us",
            "access requests": "Request a copy of any personal data we have stored about you",
            "correction rights": "Update or correct any inaccurate personal information",
            "analytics opt-out": "Disable analytics tracking using browser Do Not Track settings or privacy extensions",
            "cookie control": "Manage cookie preferences through your browser settings (essential cookies required for functionality)",
            "account deletion": "Delete your guestbook account and associated data through the platform or by contacting us"
        },
        "policy_updates": "We might give this policy a refresh as the website evolves and grows. Major changes will be reflected in the last updated date above, and we'll do our best to notify users of significant privacy policy updates.",
        "cookies": {
            "essential_cookies": {
                "sessionid": "Django session cookie for maintaining user login state (1 hour expiration)",
                "csrftoken": "CSRF protection token to prevent cross-site request forgery attacks",
                "messages": "Temporary cookies for displaying system messages and notifications"
            },
            "analytics_cookies": {
                "google_analytics": "Website usage analytics and visitor behavior tracking"
            },
            "performance_cookies": {
                "cache_control": "Browser caching preferences to improve page load times",
                "static_file_cache": "Cached static assets (CSS, JS, images) for faster subsequent visits"
            },
            "cookie_policy": "Essential cookies are required for site functionality. Analytics and performance cookies can be disabled through browser settings or Do Not Track preferences."
        },
        "legal_basis": {
            "legitimate_interest": "Analytics and site improvement based on legitimate business interests",
            "consent": "Guestbook participation and social authentication require explicit user consent",
            "contract": "User-generated content storage necessary for providing guestbook functionality",
            "legal_compliance": "Security measures and data protection implemented to comply with privacy regulations"
        }
    }
