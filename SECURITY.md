# Security Policy

## Supported Versions

This project supports the following versions of dependencies as specified in `requirements.txt`:

| Package                   | Version   | Security Notes |
|---------------------------|-----------|--------------------------------|
| asgiref                   | 3.8.1     | Asynchronous framework support |
| certifi                   | 2025.1.31 | CA certificates bundle        |
| cffi                      | 1.17.1    | C extensions for cryptography  |
| charset-normalizer        | 3.4.1     | Character encoding detection   |
| cryptography              | 45.0.4    | Core cryptographic library     |
| Django                    | 5.2.5     | Security-focused framework    |
| django-allauth            | 65.9.0    | OAuth authentication          |
| django-csp                | 4.0       | Content Security Policy       |
| django-permissions-policy | 4.25.0    | Browser permissions control    |
| idna                      | 3.10      | International domain names    |
| mdurl                     | 0.1.2     | URL utilities for markdown   |
| oauthlib                  | 3.2.2     | OAuth protocol implementation |
| packaging                 | 25.0      | Package metadata handling    |
| psycopg2-binary           | 2.9.10    | PostgreSQL driver with security patches |
| pycparser                 | 2.22      | C parser for cffi/cryptography |
| Pygments                  | 2.19.1    | Syntax highlighting          |
| PyJWT                     | 2.10.1    | JWT authentication          |
| python-decouple           | 3.8       | Environment variable security |
| pytz                      | 2025.2    | Timezone support             |
| requests                  | 2.32.4    | HTTP library with security patches |
| requests-oauthlib         | 2.0.0     | OAuth support for requests   |
| rich                      | 14.0.0    | Rich text formatting         |
| sqlparse                  | 0.5.3     | SQL parsing library          |
| tzdata                    | 2025.1    | Timezone data               |
| urllib3                   | 2.5.0     | HTTP client with security fixes |
| whitenoise                | 6.9.0     | Static file serving          |

We regularly update dependencies to address security vulnerabilities. Users are encouraged to keep their installations updated to the latest supported versions.

## Security Features Implemented

### 🛡️ **Application-Level Security**

#### **Cross-Site Scripting (XSS) Protection**

- **Template Escaping**: All user-generated content automatically escaped using Django's `|escape` filter
- **JavaScript Sanitization**: Client-side HTML escaping function prevents script injection
- **Safe Content Rendering**: User messages inserted as text content, not HTML
- **Data Attribute Security**: All HTML data attributes properly escaped to prevent breakout attacks

#### **Cross-Site Request Forgery (CSRF) Protection**

- **Django CSRF Tokens**: All forms include CSRF protection tokens
- **AJAX Request Security**: CSRF tokens included in all asynchronous requests
- **Token Validation**: Server-side validation of all POST requests

#### **Authentication & Authorization**

- **OAuth Integration**: Secure Google OAuth 2.0 authentication via django-allauth
- **Session Management**: Django's secure session handling with proper expiration
- **Permission Controls**: Role-based access control (only authors can delete messages)
- **User Validation**: All user inputs validated and authenticated

#### **Input Validation & Sanitization**

- **Message Length Limits**: 500-character maximum for guestbook messages
- **Content Filtering**: Real-time validation of user input
- **SQL Injection Prevention**: Django ORM provides automatic protection
- **File Upload Security**: No file uploads in guestbook to prevent malicious uploads

### 🔒 **Infrastructure Security**

#### **HTTP Security Headers**

- **Content Security Policy (CSP)**: Comprehensive CSP implementation via django-csp
- **HTTP Strict Transport Security (HSTS)**: Force HTTPS connections
- **X-Content-Type-Options**: Prevent MIME type sniffing attacks
- **X-Frame-Options**: Clickjacking protection
- **Permissions Policy**: Browser feature restrictions via django-permissions-policy

#### **Data Protection**

- **Environment Variables**: Sensitive data stored in environment variables using python-decouple
- **Secret Key Management**: Secure Django secret key rotation capability
- **Database Security**: SQLite with proper file permissions in production
- **Static File Security**: Secure static file serving via WhiteNoise

### 🚀 **Deployment Security**

#### **Production Configuration**

- **Debug Mode**: Disabled in production environments
- **Error Handling**: Custom error pages without information disclosure
- **Logging**: Security event logging without sensitive data exposure
- **Dependency Management**: Regular security updates for all dependencies

#### **API Security**

- **Rate Limiting Ready**: Structure supports rate limiting implementation
- **API Token Management**: Secure GitHub and WakaTime API token handling
- **Request Validation**: All API requests properly validated and sanitized

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

### 🔧 **Deployment Security Checklist**

1. **HTTPS Configuration**
   - Use HTTPS exclusively in production
   - Configure proper SSL/TLS certificates
   - Enable HSTS headers for forced HTTPS

2. **Environment Security**
   - Store all sensitive data in environment variables
   - Use strong, unique SECRET_KEY values
   - Rotate API keys and tokens regularly
   - Never commit secrets to version control

3. **Database Security**
   - Use strong database passwords
   - Implement database connection encryption
   - Regular database backups with encryption
   - Restrict database access to application servers only

4. **Server Configuration**
   - Keep server software updated
   - Configure proper file permissions
   - Implement fail2ban or similar intrusion prevention
   - Regular security patches and updates

5. **Monitoring & Logging**
   - Enable security event logging
   - Monitor for suspicious activities
   - Set up alerts for security incidents
   - Regular security audits and penetration testing

### 🛡️ **Guestbook-Specific Security**

1. **Content Moderation**
   - Monitor message content for inappropriate material
   - Consider implementing profanity filters if needed
   - Regular review of user-generated content

2. **Rate Limiting**
   - Implement rate limiting for message posting
   - Prevent spam and abuse through request throttling
   - Consider CAPTCHA for additional protection

3. **User Management**
   - Regular review of user accounts and permissions
   - Audit author-level access periodically
   - Monitor for unusual user behavior patterns

### 🚨 **Security Incident Response**

1. **Immediate Actions**
   - Identify and isolate affected systems
   - Preserve evidence for investigation
   - Notify stakeholders of potential impact

2. **Investigation Process**
   - Determine scope and impact of incident
   - Identify root cause and attack vectors
   - Document all findings and remediation steps

3. **Recovery & Prevention**
   - Implement fixes and security improvements
   - Update security procedures and documentation
   - Conduct post-incident review and lessons learned

Thank you for helping keep our project secure.

## Security Testing & Validation

### 🧪 **Automated Security Testing**

The following security tests are recommended for ongoing validation:

1. **XSS Testing**

   ```bash
   # Test script injection in guestbook messages
   # Verify all user input is properly escaped
   # Validate JavaScript sanitization functions
   ```

2. **CSRF Testing**

   ```bash
   # Verify CSRF tokens in all forms
   # Test AJAX request protection
   # Validate state-changing operations
   ```

3. **Authentication Testing**

   ```bash
   # Test OAuth flow security
   # Verify session management
   # Validate permission controls
   ```

### 📊 **Security Metrics**

Current security implementation status:

| Security Feature | Status | Implementation |
|------------------|--------|---------------|
| **XSS Protection** | ✅ Implemented | Template escaping + JS sanitization |
| **CSRF Protection** | ✅ Implemented | Django CSRF tokens |
| **Authentication** | ✅ Implemented | Google OAuth via django-allauth |
| **Authorization** | ✅ Implemented | Role-based permissions |
| **Input Validation** | ✅ Implemented | Length limits + content filtering |
| **Security Headers** | ✅ Implemented | CSP + HSTS + Permissions Policy |
| **HTTPS Enforcement** | ✅ Implemented | Production HTTPS required |
| **Dependency Updates** | 🔄 Ongoing | Regular security patches |

### 🔍 **Security Audit Log**

- **2025-06-16**: Comprehensive XSS protection implemented in guestbook
- **2025-06-16**: CSRF protection validated across all forms
- **2025-06-16**: Input sanitization and validation enhanced
- **2025-06-16**: Security headers configuration updated
- **2025-06-16**: Authentication and authorization controls verified

---

**Last Updated**: June 16, 2025  
**Security Review**: Comprehensive security audit completed  
**Next Review**: Recommended every 3 months or after major updates
