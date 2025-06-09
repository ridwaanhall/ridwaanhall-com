from datetime import datetime

class PrivacyPolicyData:
    privacy_policy = {
        "website": "Ridwan Halim's Awesome Personal Website",
        "contact_email": "hi@ridwaanhall.com",
        "last_updated": datetime.strptime("2025-05-01T00:04:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
        "data_collected": {
            "Cloudflare": {
                "IP_address": "Picked up for tracking purposes",
                "Country": "Noted to understand our global audience",
                "ASN": "Grabbed to keep tabs on network details",
                "User_agent": "Tracked to see how you’re browsing",
                "Method": "Logged to monitor interaction types",
                "Scheme": "Captured to ensure secure connections",
                "OS_device_type": "Spotted to optimize device compatibility"
            },
            "Google_Analytics": {
                "Country": "Noted to map out our worldwide visitors",
                "Region": "Logged to dive deeper into geographic trends",
                "City": "Tracked to get a vibe on urban engagement",
                "Language": "Picked up to tailor content for you"
            },
            "Umami_Analytics": {
                "Browser": "Spotted to ensure smooth surfing",
                "OS": "Captured to fine-tune our tech stack",
                "Device": "Noted to make sure everything’s device-friendly",
                "Country": "Logged to see where our fans are chilling"
            }
        },
        "data_usage": [
            "Digging into website analytics to track visits, page views, and how you interact with our content",
            "Keeping everything secure, optimized, and running like a well-oiled machine",
            "Leveling up the user experience by analyzing visitor trends and preferences"
        ],
        "third_party_services": {
            "Cloudflare": "Our go-to for top-notch security and detailed analytics",
            "Google_Analytics": "Helps us get the full scoop on who’s visiting and what they’re into",
            "Umami_Analytics": "Keeps things privacy-first while giving us dope web analytics"
        },
        "data_protection": {
            "storage": "Locked down tight with state-of-the-art security measures",
            "personal_identifiable_information": "We steer clear of collecting anything too personal",
            "aggregation": "Data’s only used for big-picture, anonymized reports"
        },
        "user_rights": {
            "request_data_details": "Hit us up anytime to get the full rundown on what data we’ve got",
            "opt_out_options": "You can bounce from tracking via browser settings or third-party tools",
            "contact": "Drop us a line at hi@ridwaanhall.com for any questions or concerns"
        },
        "policy_updates": "We might give this policy a refresh as the website evolves and grows."
    }