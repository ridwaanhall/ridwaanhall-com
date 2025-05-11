# Security Policy

## Supported Versions

This project supports the following versions of dependencies as specified in `requirements.txt`:

| Package                   | Version  |
| ------------------------- | -------- |
| asgiref                   | 3.8.1    |
| certifi                   | 2025.1.31|
| charset-normalizer        | 3.4.1    |
| Django                    | 5.2.1    |
| django-csp                | 4.0      |
| django-permissions-policy | 4.25.0   |
| idna                      | 3.10     |
| packaging                 | 25.0     |
| python-decouple           | 3.8      |
| requests                  | 2.32.3   |
| sqlparse                  | 0.5.3    |
| tzdata                    | 2025.1   |
| urllib3                   | 2.3.0    |
| whitenoise                | 6.9.0    |

We regularly update dependencies to address security vulnerabilities. Users are encouraged to keep their installations updated to the latest supported versions.

## Reporting a Vulnerability

We take the security of our project seriously. If you discover a security vulnerability, please follow these steps:

1. **Do not disclose the vulnerability publicly**
2. Send details of the vulnerability to [hi@ridwaanhall.com](mailto:hi@ridwaanhall.com)
3. Include the following information:
    - Description of the vulnerability
    - Steps to reproduce
    - Potential impact
    - Any suggestions for mitigation

### What to expect

- You will receive an acknowledgment within 48 hours
- We will investigate and provide a timeline for resolution
- We will keep you updated on the progress
- Once resolved, you will be credited for the discovery (unless you prefer to remain anonymous)

For less critical issues, please open a GitHub issue with the "[Security]" prefix.

## Security Best Practices

When deploying this project, we recommend:

1. Using HTTPS exclusively
2. Configuring proper Content Security Policy headers
3. Keeping all dependencies up to date
4. Following the principle of least privilege for user accounts

Thank you for helping keep our project secure.
