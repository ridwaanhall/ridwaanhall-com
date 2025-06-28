from datetime import datetime

class PrivacyPolicyData:
    privacy_policy = {
        "website": "Ridwan Halim's Awesome Personal Website",
        "contact_email": "hi@ridwaanhall.com",
        "last_updated": datetime.strptime("2025-06-28T23:25:22+07:00", "%Y-%m-%dT%H:%M:%S%z"),
        "data_collected": {
            "Cloudflare": {
                "IP address": "Picked up for tracking purposes",
                "Country": "Noted to understand our global audience",
                "ASN": "Grabbed to keep tabs on network details",
                "User agent": "Tracked to see how you're browsing",
                "Method": "Logged to monitor interaction types",
                "Scheme": "Captured to ensure secure connections",
                "OS device type": "Spotted to optimize device compatibility"
            },
            "Google Analytics": {
                "Country": "Noted to map out our worldwide visitors",
                "Region": "Logged to dive deeper into geographic trends",
                "City": "Tracked to get a vibe on urban engagement",
                "Language": "Picked up to tailor content for you"
            },
            "Guestbook Feature": {
                "User authentication": "Handled via Google and GitHub OAuth for secure login",
                "Profile information": "Name, email, and profile picture from your OAuth provider",
                "Message content": "Text messages you post in the guestbook chat",
                "Message timestamps": "When you posted your messages for proper chronological display",
                "User roles": "Author and co-author status for content management purposes",
                "Reply associations": "Links between messages and their replies for threaded conversations"
            }
        },
        "data_usage": [
            "Digging into website analytics to track visits, page views, and how you interact with our content",
            "Keeping everything secure, optimized, and running like a well-oiled machine",
            "Leveling up the user experience by analyzing visitor trends and preferences",
            "Managing guestbook interactions and maintaining conversation threads",
            "Authenticating users securely through trusted OAuth providers",
            "Displaying user profiles and managing author/co-author permissions"
        ],
        "third_party_services": {
            "Cloudflare": "Our go-to for top-notch security and detailed analytics",
            "Google Analytics": "Helps us get the full scoop on who's visiting and what they're into"
        },
        "data_protection": {
            "storage": "Locked down tight with state-of-the-art security measures",
            "personal identifiable information": "We steer clear of collecting anything too personal",
            "aggregation": "Data's only used for big-picture, anonymized reports"
        },
        "user_rights": {
            "request data details": "Hit us up anytime to get the full rundown on what data we've got",
            "opt out options": "You can bounce from tracking via browser settings or third-party tools",
            "contact": "Drop us a line at hi@ridwaanhall.com for any questions or concerns"
        },
        "policy_updates": "We might give this policy a refresh as the website evolves and grows."
    }
