from datetime import datetime


class ApplicationsData:
    """
    {
        "id": 0,
        "company_name": "",
        "status": "", # Can be "In Progress", "Accepted", "Rejected", "Ghosted"
        "position": "",
        "journey": [
            {
                "timestamp": datetime.strptime("2023-01-01T00:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
                "title": "",
                "details": "",
                "notes": ""
            },
        ],
        "lessons_learned": ""
    },
    """
    applications = [
        {
            "id": 34,
            "company_name": "Resource Informatics Group, Inc",
            "status": "Applied",
            "position": "Python Developer",
            "journey": [
                {
                    "timestamp": datetime.strptime("2025-09-25T11:04:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
                    "title": "Job Discovery",
                    "details": "Found Python Developer role at Resource Informatics Group, Inc via LinkedIn Jobs.",
                    "notes": "Remote role based in Canada; aligned with Python expertise."
                },
                {
                    "timestamp": datetime.strptime("2025-09-25T11:05:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
                    "title": "Application Submitted",
                    "details": "Applied through LinkedIn Easy Apply.",
                    "notes": "Application confirmation received; no recruiter contact yet."
                }
            ],
            "lessons_learned": "Quick apply is efficient, but reviewing company’s own site may provide more context."
        },
        {
            "id": 33,
            "company_name": "Improvado",
            "status": "Applied",
            "position": "Junior Python Developer",
            "journey": [
                {
                    "timestamp": datetime.strptime("2025-09-25T10:55:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
                    "title": "Job Discovery",
                    "details": "Discovered Junior Python Developer role at Improvado.",
                    "notes": "Remote role based in Georgia; entry-level Python focus."
                },
                {
                    "timestamp": datetime.strptime("2025-09-25T11:01:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
                    "title": "Application Submitted",
                    "details": "Applied via LinkedIn Easy Apply.",
                    "notes": "Application confirmation received."
                },
                {
                    "timestamp": datetime.strptime("2025-09-25T11:01:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
                    "title": "Response Received",
                    "details": "Received automated acknowledgment email from Improvado confirming resume submission.",
                    "notes": "Message stated: 'Thank you for your interest… If your qualifications match our needs, we will contact you.'"
                },
            ],
            "lessons_learned": "Entry-level roles may have high competition; tailoring CV to highlight mentoring and open-source contributions could stand out."
        },
        {
            "id": 32,
            "company_name": "Codesis Technologies Private Limited",
            "status": "Applied",
            "position": "Junior Django Developer",
            "journey": [
                {
                    "timestamp": datetime.strptime("2025-09-25T10:55:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
                    "title": "Job Discovery",
                    "details": "Found Junior Django Developer role at Codesis Technologies.",
                    "notes": "Remote role in India; Django-specific focus."
                },
                {
                    "timestamp": datetime.strptime("2025-09-25T10:59:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
                    "title": "Application Submitted",
                    "details": "Applied through LinkedIn Easy Apply.",
                    "notes": "Confirmation received."
                }
            ],
            "lessons_learned": "Highlight Django projects and REST API experience to strengthen candidacy."
        },
        {
            "id": 31,
            "company_name": "Innodata Inc.",
            "status": "Applied",
            "position": "Python Developer (CAN START IMMEDIATELY)",
            "journey": [
                {
                    "timestamp": datetime.strptime("2025-09-25T10:44:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
                    "title": "Job Discovery",
                    "details": "Came across urgent Python Developer role at Innodata Inc.",
                    "notes": "Remote role in the Philippines; immediate availability emphasized."
                },
                {
                    "timestamp": datetime.strptime("2025-09-25T10:48:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
                    "title": "Application Submitted",
                    "details": "Applied via LinkedIn Easy Apply.",
                    "notes": "Application confirmation received."
                }
            ],
            "lessons_learned": "For urgent roles, readiness and availability should be highlighted in cover letter or CV headline."
        },
        {
            "id": 30,
            "company_name": "Logix Guru",
            "status": "Applied",
            "position": "Junior Python Developer",
            "journey": [
                {
                    "timestamp": datetime.strptime("2025-09-25T10:40:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
                    "title": "Job Discovery",
                    "details": "Discovered Junior Python Developer role at Logix Guru.",
                    "notes": "Remote role based in Pittsburgh, PA."
                },
                {
                    "timestamp": datetime.strptime("2025-09-25T10:44:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
                    "title": "Application Submitted",
                    "details": "Applied via LinkedIn Easy Apply.",
                    "notes": "Application confirmation received."
                }
            ],
            "lessons_learned": "US-based roles may require timezone flexibility; emphasize ability to collaborate asynchronously."
        },
        {
            "id": 29,
            "company_name": "10Pearls",
            "status": "In Progress",
            "position": "Backend Python/Django Developer",
            "journey": [
                {
                    "timestamp": datetime.strptime("2025-09-24T11:06:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
                    "title": "Job Discovery",
                    "details": "Discovered the Backend Python/Django role at 10Pearls via LinkedIn job recommendations.",
                    "notes": "Reviewed job listing on LinkedIn; noted remote setup and tech stack alignment."
                },
                {
                    "timestamp": datetime.strptime("2025-09-24T11:09:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
                    "title": "Application Submitted",
                    "details": "Applied directly through LinkedIn’s Easy Apply feature.",
                    "notes": "Received confirmation email from LinkedIn stating application was sent to 10Pearls."
                }
            ],
            "lessons_learned": "LinkedIn Easy Apply simplifies submission but may lack full role context. Reviewing company site or external listings can help clarify expectations. Always ensure CV keywords (e.g. Django, RESTful API, scalable systems) match the job description. Email confirmations are automated—no recruiter contact yet."
        },
        {
            "id": 28,
            "company_name": "Vodjo",
            "status": "In Progress",
            "position": "Python Developer",
            "journey": [
                {
                    "timestamp": datetime.strptime("2025-09-23T11:18:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
                    "title": "Job Discovery",
                    "details": "Found the Vodjo Python Developer listing via LinkedIn job recommendations.",
                    "notes": "Opened from LinkedIn job feed and reviewed full role description on Vodjo’s career page"
                },
                {
                    "timestamp": datetime.strptime("2025-09-23T11:21:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
                    "title": "Application Submitted",
                    "details": "Applied via Vodjo’s OrangeHRM portal.",
                    "notes": "Confirmed via success message on OrangeHRM page"
                }
            ],
            "lessons_learned": "Direct company portals often offer clearer role expectations than LinkedIn summaries. Matching keywords like RESTful API, Django, and scalable systems to your CV and notes field improves alignment. Consent checkbox is standard for data retention."
        },
        {
            "id": 27,
            "company_name": "Dattabot",
            "status": "In Progress",
            "position": "Data Python Engineer",
            "journey": [
                {
                    "timestamp": datetime.strptime("2025-09-23T11:17:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
                    "title": "Job Discovery",
                    "details": "Found the Dattabot Data Python Engineer listing while browsing LinkedIn job recommendations.",
                    "notes": "Opened from LinkedIn job feed"
                },
                {
                    "timestamp": datetime.strptime("2025-09-23T11:21:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
                    "title": "Application Submitted",
                    "details": "Applied via LinkedIn Easy Apply.",
                    "notes": "Confirmed via Gmail notification"
                }
            ],
            "lessons_learned": "Timely browsing of LinkedIn job feeds can surface relevant openings. For data-focused roles, emphasizing Python backend experience, API integration, and scalable systems in your profile increases alignment."
        },
        {
            "id": 26,
            "company_name": "Nawatech",
            "status": "In Progress",
            "position": "Machine Learning Engineer",
            "journey": [
                {
                    "timestamp": datetime.strptime("2025-09-22T13:10:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
                    "title": "Job Discovery",
                    "details": "Received the Nawatech Machine Learning Engineer job post from a friend via WhatsApp.",
                    "notes": "Link opened in LinkedIn"
                },
                {
                    "timestamp": datetime.strptime("2025-09-22T13:17:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
                    "title": "Application Submitted",
                    "details": "Applied via LinkedIn Easy Apply.",
                    "notes": "Confirmed via Gmail notification"
                }
            ],
            "lessons_learned": "Personal referrals can surface relevant opportunities faster. Even with Easy Apply, aligning your LinkedIn profile and resume with the role’s technical focus—especially ML deployment and Python—remains key."
        },
        {
            "id": 25,
            "company_name": "PT Amman Mineral Nusa Tenggara",
            "status": "In Progress",
            "position": "Data Analyst",
            "journey": [
                {
                    "timestamp": datetime.strptime("2025-09-21T14:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
                    "title": "Job Discovery",
                    "details": "Found the Data Analyst role at PT Amman Mineral Nusa Tenggara via LinkedIn. The position emphasizes data-driven decision support, mining operations analysis, and stakeholder reporting—well-aligned with my experience in Python, data pipelines, and multilingual documentation.",
                    "notes": "Discovered via LinkedIn Jobs"
                },
                {
                    "timestamp": datetime.strptime("2025-09-21T14:01:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
                    "title": "Application Submitted",
                    "details": "Applied for the Data Analyst position through LinkedIn. Submitted CV and tailored cover letter highlighting experience in scalable data systems and cohort mentoring.",
                    "notes": "Used LinkedIn platform"
                }
            ],
            "lessons_learned": "Tailoring application materials to emphasize domain relevance—such as mining analytics and stakeholder reporting—can strengthen positioning. LinkedIn remains a high-visibility platform for strategic outreach."
        },
        {
            "id": 24,
            "company_name": "PT Karisma Zona Kreatifku (KAZOKKU)",
            "status": "In Progress",
            "position": "Backend Engineer (Python & AI Integration)",
            "journey": [
                {
                    "timestamp": datetime.strptime("2025-09-20T15:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
                    "title": "Job Discovery",
                    "details": "Found the Backend Engineer (Python & AI Integration) role posted by PT Karisma Zona Kreatifku (KAZOKKU). The position aligns with my experience in AI/ML workflows, Python frameworks (FastAPI), and multilingual documentation.",
                    "notes": "Discovered via LinkedIn"
                },
                {
                    "timestamp": datetime.strptime("2025-09-20T09:15:50+07:00", "%Y-%m-%dT%H:%M:%S%z"),
                    "title": "Application Submitted",
                    "details": "Applied for the position through Glints. Submitted cv.",
                    "notes": "Used Glints platform"
                }
            ],
            "lessons_learned": "Cross-platform job discovery can expand opportunities. Applying through the employer’s preferred channel (Glints) while referencing LinkedIn insights ensures alignment and visibility."
        },
        {
            "id": 23,
            "company_name": "Toloka Annotators",
            "status": "In Progress",
            "position": "Data Annotator with Indonesian – AI Trainer",
            "journey": [
                {
                    "timestamp": datetime.strptime("2025-09-19T20:40:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
                    "title": "Job Discovery",
                    "details": "Found the Data Annotator with Indonesian – AI Trainer role. The position aligns with my experience in AI/ML workflows, Python frameworks, and multilingual documentation.",
                    "notes": "Posted on LinkedIn"
                },
                {
                    "timestamp": datetime.strptime("2025-09-19T20:50:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
                    "title": "Application Submitted",
                    "details": "Applied for the position via LinkedIn. Submitted resume and tailored cover letter highlighting relevant annotation and mentoring experience.",
                    "notes": "Used LinkedIn Easy Apply"
                },
                {
                    "timestamp": datetime.strptime("2025-09-19T20:58:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
                    "title": "Acknowledgement Received",
                    "details": "Received confirmation email from Toloka Annotators. Application is under review. If selected, next step will be a short assessment to evaluate attention to detail and task performance.",
                    "notes": "Email"
                },
            ],
            "lessons_learned": "Customizing application materials to match the job’s linguistic and technical requirements improves relevance and increases chances of progressing in the hiring process."
        },
        {
            "id": 22,
            "company_name": "Michael Page",
            "status": "In Progress",
            "position": "AI Engineer",
            "journey": [
                {
                    "timestamp": datetime.strptime("2025-09-19T17:30:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
                    "title": "Job Discovery",
                    "details": "Found the AI Engineer. The role aligns with my experience in AI/ML and Python frameworks.",
                    "notes": "Posted on LinkedIn"
                },
                {
                    "timestamp": datetime.strptime("2025-09-19T17:35:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
                    "title": "Application Submitted",
                    "details": "Applied for the position via Michael Page website.",
                    "notes": "Submitted resume"
                }
            ],
            "lessons_learned": "Customizing application materials to highlight relevant skills and experiences improves chances of progressing in the hiring process."
        },
        {
            "id": 21,
            "company_name": "Elitez Indonesia (Client in North Jakarta)",
            "status": "In Progress",
            "position": "Machine Learning Engineer",
            "journey": [
                {
                    "timestamp": datetime.strptime("2025-09-19T17:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
                    "title": "Job Discovery",
                    "details": "Found the Machine Learning Engineer opening posted by Elitez Indonesia. The role matches my experience in ML/DL and Python frameworks.",
                    "notes": "Posted on LinkedIn, recruiter contact: Andrew Nasution"
                },
                {
                    "timestamp": datetime.strptime("2025-09-19T17:07:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
                    "title": "Message Sent",
                    "details": "Sent a direct message to Andrew Nasution expressing interest and sharing relevant experience.",
                    "notes": "Included portfolio link and summary of ML/DL experience"
                }
            ],
            "lessons_learned": "Matching your message to the job post and highlighting relevant tools (TensorFlow, PyTorch, Django) helps recruiters quickly assess fit."
        },
        {
            "id": 20,
            "company_name": "PT InMotion Inovasi Teknologi",
            "status": "In Progress",
            "position": "Python Developer",
            "journey": [
                {
                    "timestamp": datetime.strptime("2025-09-11T15:50:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
                    "title": "Job Discovery",
                    "details": "Found the job posting on LinkedIn that matched my qualifications.",
                    "notes": "-"
                },
                {
                    "timestamp": datetime.strptime("2025-09-19T15:45:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
                    "title": "Application Submitted",
                    "details": "Applied for the position via Kalibrr.",
                    "notes": "-"
                },
                {
                    "timestamp": datetime.strptime("2025-09-21T21:17:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
                    "title": "Application Reviewed",
                    "details": "The application was reviewed by the hiring manager.",
                    "notes": "-"
                },
                {
                    "timestamp": datetime.strptime("2025-09-21T21:17:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
                    "title": "Shortlisted",
                    "details": "Application advanced to the shortlist stage, as confirmed by Kalibrr notification.",
                    "notes": "Consider sending a thank-you note to express enthusiasm."
                },
            ],
            "lessons_learned": "-"
        },
        {
            "id": 19,
            "company_name": "PT Appfuxion Consulting Indonesia",
            "status": "Rejected",
            "position": "Machine Learning Engineer",
            "journey": [
                {
                    "timestamp": datetime.strptime("2025-09-18T15:50:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
                    "title": "Job Discovery",
                    "details": "Found the job posting on LinkedIn that matched my qualifications.",
                    "notes": "-"
                },
                {
                    "timestamp": datetime.strptime("2025-09-19T15:50:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
                    "title": "Application Submitted",
                    "details": "Applied for the position via LinkedIn.",
                    "notes": "-"
                },
                {
                    "timestamp": datetime.strptime("2025-09-19T16:01:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
                    "title": "Application Viewed",
                    "details": "The application was viewed by the hiring manager.",
                    "notes": "-"
                },
                {
                    "timestamp": datetime.strptime("2025-09-21T15:33:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
                    "title": "Rejection Received",
                    "details": "Received rejection email via LinkedIn notification.",
                    "notes": "Thank you for your interest... Unfortunately, we will not be moving forward with your application."
                }
            ],
            "lessons_learned": "Tailoring your resume to highlight relevant skills increases visibility and engagement. For ML roles, consider emphasizing deployment experience and measurable impact in project outcomes."
        },
        {
            "id": 19,
            "company_name": "Tritronik",
            "status": "In Progress",
            "position": "AI/ML Presales Engineer",
            "journey": [
                {
                    "timestamp": datetime.strptime("2023-03-30T00:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
                    "title": "Job Discovery",
                    "details": "Found the job posting on LinkedIn that matched my qualifications.",
                    "notes": "-"
                },
                {
                    "timestamp": datetime.strptime("2025-09-19T00:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
                    "title": "Application Submitted",
                    "details": "Applied for the position via LinkedIn.",
                    "notes": "-"
                },
            ],
            "lessons_learned": "Understanding the business model helps craft better presales narratives."
        },
        {
            "id": 18,
            "company_name": "Lumoshive",
            "status": "In Progress",
            "position": "AI Engineer",
            "journey": [
                {
                    "timestamp": datetime.strptime("2025-09-17T09:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
                    "title": "Job Discovery",
                    "details": "Found the job posting on LinkedIn that matched my qualifications.",
                    "notes": "-"
                },
                {
                    "timestamp": datetime.strptime("2025-09-17T10:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
                    "title": "Application Submitted",
                    "details": "Applied for the position via LinkedIn.",
                    "notes": "-"
                },
                {
                    "timestamp": datetime.strptime("2025-09-18T08:30:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
                    "title": "Application Viewed",
                    "details": "The application was viewed by the hiring manager.",
                    "notes": "-"
                },
                {
                    "timestamp": datetime.strptime("2025-09-18T09:15:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
                    "title": "Application Downloaded",
                    "details": "The application was downloaded by the hiring manager.",
                    "notes": "-"
                },
            ],
            "lessons_learned": "Early application submission improves chances of visibility before the role closes."
        },
        {
            "id": 17,
            "company_name": "Avows Global IT Technologies Private Limited",
            "status": "In Progress",
            "position": "Python Developer",
            "journey": [
                {
                    "timestamp": datetime.strptime("2025-09-17T07:45:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
                    "title": "Job Discovery",
                    "details": "Found the job posting on LinkedIn that matched my qualifications.",
                    "notes": "-"
                },
                {
                    "timestamp": datetime.strptime("2025-09-17T08:30:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
                    "title": "Application Submitted",
                    "details": "Applied for the position via LinkedIn.",
                    "notes": "-"
                },
                {
                    "timestamp": datetime.strptime("2025-09-19T10:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
                    "title": "Application Viewed",
                    "details": "The application was viewed by the hiring manager.",
                    "notes": "-"
                },
                {
                    "timestamp": datetime.strptime("2025-09-23T10:53:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
                    "title": "Application Downloaded",
                    "details": "My application was downloaded from LinkedIn by the recruiter.",
                    "notes": "Confirmed via LinkedIn activity feed"
                },
            ],
            "lessons_learned": "Clear and concise project descriptions in your portfolio help recruiters assess fit quickly. Application downloads signal deeper interest—keep your LinkedIn profile aligned and updated."
        },
        {
            "id": 16,
            "company_name": "Urban CV",
            "status": "In Progress",
            "position": "AI Developer",
            "journey": [
                {
                    "timestamp": datetime.strptime("2025-09-13T11:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
                    "title": "Job Discovery",
                    "details": "Found the job posting on LinkedIn that matched my qualifications.",
                    "notes": "-"
                },
                {
                    "timestamp": datetime.strptime("2025-09-13T12:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
                    "title": "Application Submitted",
                    "details": "Applied for the position via LinkedIn.",
                    "notes": "-"
                },
                {
                    "timestamp": datetime.strptime("2025-09-17T14:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
                    "title": "Application Viewed",
                    "details": "The application was viewed by the hiring manager.",
                    "notes": "-"
                },
                {
                    "timestamp": datetime.strptime("2025-09-18T09:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
                    "title": "Recruiter Email Received",
                    "details": "Received instructions from Madison at 9cv9 via email.",
                    "notes": "Included registration and contact steps."
                },
                {
                    "timestamp": datetime.strptime("2025-09-19T10:30:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
                    "title": "Recruiter Contacted",
                    "details": "Sent a message to Ms. Meryl via Telegram.",
                    "notes": "Included registration confirmation."
                },
                {
                    "timestamp": datetime.strptime("2025-09-19T16:30:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
                    "title": "Awaiting Response",
                    "details": "Currently waiting for a response from the recruiter.",
                    "notes": "-"
                },
            ],
            "lessons_learned": "Timely follow-up and polite communication show initiative and professionalism."
        },
        {
            "id": 15,
            "company_name": "Indocyber Global Teknologi",
            "status": "Rejected",
            "position": "Fullstack Developer (Python)",
            "journey": [
                {
                    "timestamp": datetime.strptime("2025-09-04T09:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
                    "title": "Job Discovery",
                    "details": "Found the job posting on LinkedIn that matched my qualifications.",
                    "notes": "-"
                },
                {
                    "timestamp": datetime.strptime("2025-09-04T10:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
                    "title": "Application Submission",
                    "details": "Applied for the position via LinkedIn, redirected to Tech in Asia.",
                    "notes": "-"
                },
                {
                    "timestamp": datetime.strptime("2025-09-18T08:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
                    "title": "Application Outcome",
                    "details": "Received rejection email from Tech in Asia Jobs.",
                    "notes": "Suggested alternative roles at Antikode, Kompas Gramedia, and PT Tiga Daya Digital Indonesia."
                }
            ],
            "lessons_learned": "Rejections are redirections—each one refines your strategy and expands your network."
        },
        {
            "id": 14,
            "company_name": "Coding Camp Powered by DBS Foundation (Dicoding Indonesia)",
            "status": "Accepted",
            "position": "Machine Learning Mentor",
            "journey": [
                {
                    "title": "Initial Contact",
                    "details": "Received an email invitation to become a mentor, which was unexpected but exciting.",
                    "notes": "-"
                },
                {
                    "title": "Application Process",
                    "details": "Completed a Google Form with personal information, motivation, profile picture, and experience details.",
                    "notes": "-"
                },
                {
                    "title": "Course Completion",
                    "details": "Required to complete the course that I would be mentoring to ensure adequate preparation.",
                    "notes": "-"
                },
                {
                    "title": "Interview Session",
                    "details": "Discussed background, passion, and answered problem-solving questions during the interview.",
                    "notes": "<span class='text-blue-600'>Appreciated the professional interview setup with both parties having cameras enabled.</span>"
                },
                {
                    "title": "Final Selection",
                    "details": "Successfully secured the Machine Learning Mentor position.",
                    "notes": "-"
                },
            ],
            "lessons_learned": "Thoroughly researching company information and requirements significantly improves application success rates."
        },
        {
            "id": 13,
            "company_name": "HashMicro",
            "status": "Rejected",
            "position": "Python Developer (Django)",
            "journey": [
                {
                    "title": "Initial Contact",
                    "details": "HR contacted me via LinkedIn with an interview invitation.",
                    "notes": "-"
                },
                {
                    "title": "Technical Interview",
                    "details": "Discussed Django class vs function views and salary expectations. Interview format had cameras enabled only for candidates.",
                    "notes": "<span class='text-orange-600'>Interview setup could be improved with mutual camera visibility for better engagement.</span>"
                },
                {
                    "title": "Formal Application",
                    "details": "Completed the official application through company website.",
                    "notes": "-"
                },
                {
                    "title": "Assessment Phase",
                    "details": "Successfully completed logic test and coding challenge assessments.",
                    "notes": "-"
                },
                {
                    "title": "Final Interview",
                    "details": "Final interview round with the client team, maintaining the same camera format.",
                    "notes": "<span class='text-orange-600'>Consistent interview format throughout the process.</span>"
                },
                {
                    "title": "Extended Wait Period",
                    "details": "Waited over 30 days for feedback without receiving status updates.",
                    "notes": "<span class='text-orange-600'>Extended communication gap during evaluation period.</span>"
                },
                {
                    "title": "Rejection Notification",
                    "details": "Received rejection email after 30+ days, acknowledging resume quality but indicating non-selection. Offered opportunity to request feedback.",
                    "notes": "<span class='text-orange-600'>Lengthy response time for final decision communication.</span>"
                },
                {
                    "title": "Professional Response",
                    "details": "Sent a courteous reply expressing gratitude, requesting constructive feedback, and maintaining openness for future opportunities.",
                    "notes": "<span class='text-blue-600'>Maintained professional communication throughout the process.</span>"
                }
            ],
            "lessons_learned": "<span class='text-blue-600'>Professional interview setups benefit from mutual respect and transparency.</span> <span class='text-orange-600'>Extended communication delays can impact candidate experience and company reputation.</span> Providing timely feedback and maintaining consistent communication standards are essential for professional hiring processes."
        },
        {
            "id": 12,
            "company_name": "Skyshi Digital Indonesia",
            "status": "Rejected",
            "position": "Python Developer (Junior Level)",
            "journey": [
                {
                    "title": "Job Discovery",
                    "details": "Found an attractive job posting on LinkedIn that matched my qualifications.",
                    "notes": "-"
                },
                {
                    "title": "Application Submission",
                    "details": "Submitted resume and supporting documents via LinkedIn.",
                    "notes": "-"
                },
                {
                    "title": "Initial Response",
                    "details": "Received notification that resume was viewed and downloaded.",
                    "notes": "-"
                },
                {
                    "title": "Communication Gap",
                    "details": "No follow-up communication received after initial acknowledgment.",
                    "notes": "<span class='text-orange-600'>Limited follow-up communication after application review.</span>"
                },
                {
                    "title": "Job Listing Closure",
                    "details": "Job posting was removed shortly after application submission.",
                    "notes": "-"
                },
                {
                    "title": "Listing Reappearance",
                    "details": "Same position was reposted approximately one month later.",
                    "notes": "<span class='text-orange-600'>Uncertain hiring timeline and process clarity.</span>"
                }
            ],
            "lessons_learned": "<span class='text-orange-600'>Some companies may have extended recruitment cycles or changing requirements.</span> <span class='text-blue-600'>Candidates should maintain realistic expectations about hiring timelines and continue exploring other opportunities.</span> Clear communication about hiring processes would improve candidate experience."
        },
        {
            "id": 11,
            "company_name": "Shortlyst AI",
            "status": "Ghosted",
            "position": "Backend Engineer Intern",
            "journey": [
                {
                    "title": "Initial Contact",
                    "details": "HR reached out via LinkedIn about a backend intern position.",
                    "notes": "-"
                },
                {
                    "title": "Preliminary Discussion",
                    "details": "Discussed projects and technical skills in initial conversation.",
                    "notes": "-"
                },
                {
                    "title": "Technical Discussion",
                    "details": "Detailed conversation about intern responsibilities and tasks. Interview format had candidate camera enabled.",
                    "notes": "<span class='text-orange-600'>Interview setup could benefit from mutual camera visibility.</span>"
                },
                {
                    "title": "Communication Cessation",
                    "details": "No further communication received after technical discussion.",
                    "notes": "<span class='text-orange-600'>Process concluded without formal closure or feedback.</span>"
                }
            ],
            "lessons_learned": "<span class='text-blue-600'>Professional communication includes providing closure to candidates regardless of outcome.</span> <span class='text-orange-600'>Clear hiring timelines and follow-up processes improve overall candidate experience.</span> Companies should maintain consistent communication standards throughout the recruitment process."
        },
        {
            "id": 10,
            "company_name": "Speechify",
            "status": "Rejected",
            "position": "Frontend Developer",
            "journey": [
                {
                    "title": "Recruiter Outreach",
                    "details": "Recruiter discovered my GitHub profile and initiated contact via email.",
                    "notes": "-"
                },
                {
                    "title": "Position Offer",
                    "details": "Received frontend developer position pitch and coding test invitation.",
                    "notes": "-"
                },
                {
                    "title": "Technical Assessment",
                    "details": "Assigned to build a speech-to-text web application project.",
                    "notes": "-"
                },
                {
                    "title": "Technical Interruption",
                    "details": "Encountered account security issues during assessment that required immediate attention and test discontinuation.",
                    "notes": "<span class='text-orange-600'>Had to withdraw from assessment due to security concerns.</span>"
                },
                {
                    "title": "Final Decision",
                    "details": "Received notification of non-selection for the position.",
                    "notes": "-"
                },
            ],
            "lessons_learned": "Thorough preparation for technical assessments is crucial, including researching company products and available resources. Maintaining secure development environments is essential to avoid disruptions during critical evaluations."
        },
        {
            "id": 9,
            "company_name": "National Fair Housing Alliance",
            "status": "Rejected",
            "position": "AI Engineer Intern",
            "journey": [
                {
                    "title": "Job Discovery",
                    "details": "Found an internship opportunity on LinkedIn that aligned with my interests.",
                    "notes": "-"
                },
                {
                    "title": "Application Submission",
                    "details": "Applied via LinkedIn with CV and supporting documentation.",
                    "notes": "-"
                },
                {
                    "title": "No Response",
                    "details": "Did not receive any communication following application submission.",
                    "notes": "<span class='text-orange-600'>Application likely filtered during initial screening phase.</span>"
                },
            ],
            "lessons_learned": "Not all applications receive individual responses due to high volume. Companies often use automated screening systems, making resume optimization important for initial filtering stages."
        },
        {
            "id": 8,
            "company_name": "Reality AI Lab",
            "status": "Rejected",
            "position": "AI Engineer Intern",
            "journey": [
                {
                    "title": "Opportunity Identification",
                    "details": "Discovered AI internship position on LinkedIn platform.",
                    "notes": "-"
                },
                {
                    "title": "Document Submission",
                    "details": "Submitted resume and supporting materials via LinkedIn.",
                    "notes": "-"
                },
                {
                    "title": "No Communication",
                    "details": "Did not receive feedback following application submission.",
                    "notes": "<span class='text-orange-600'>Application likely did not pass initial screening criteria.</span>"
                },
            ],
            "lessons_learned": "Focus on creating targeted resumes that align with specific job requirements to improve success rates in automated screening processes."
        },
        {
            "id": 7,
            "company_name": "Copilot ID",
            "status": "Accepted",
            "position": "Founder",
            "journey": [
                {
                    "title": "Vision Development",
                    "details": "Conceived the idea to start a company based on expertise in Python, ML, DL, and web development.",
                    "notes": "-"
                },
                {
                    "title": "Brand Creation",
                    "details": "Developed company name and branding that reflects technical passion and expertise.",
                    "notes": "-"
                },
                {
                    "title": "Leadership Role",
                    "details": "Established position as company founder to pursue entrepreneurial goals.",
                    "notes": "-"
                }
            ],
            "lessons_learned": "Following your passion and technical expertise can lead to entrepreneurial opportunities. Clear vision and branding are essential foundation elements for new ventures."
        },
        {
            "id": 6,
            "company_name": "GaoTek Inc.",
            "status": "Accepted",
            "position": "Assistant Squad Leader of Web Developer Intern",
            "journey": [
                {
                    "title": "Performance Recognition",
                    "details": "Work performance was recognized, leading to promotion opportunity to assistant squad leader position.",
                    "notes": "-"
                },
                {
                    "title": "Role Transition",
                    "details": "Prepared to assume new leadership responsibilities in the upcoming period.",
                    "notes": "-"
                },
            ],
            "lessons_learned": "Consistent high performance and dedication to work responsibilities can lead to advancement opportunities and increased responsibilities."
        },
        {
            "id": 5,
            "company_name": "GAOTek Inc.",
            "status": "Accepted",
            "position": "Main Team of Web Developer Intern",
            "journey": [
                {
                    "title": "Internship Performance",
                    "details": "Successfully completed internship tasks and demonstrated strong work ethic.",
                    "notes": "-"
                },
                {
                    "title": "Team Promotion",
                    "details": "Strong performance resulted in promotion to the main web development team.",
                    "notes": "-"
                }
            ],
            "lessons_learned": "Dedication to assigned tasks and maintaining positive work attitude leads to recognition and career advancement opportunities."
        },
        {
            "id": 4,
            "company_name": "GaoTek Inc.",
            "status": "Accepted",
            "position": "Web Developer Intern",
            "journey": [
                {
                    "title": "LinkedIn Opportunity",
                    "details": "Received direct message about internship opportunity through LinkedIn.",
                    "notes": "-"
                },
                {
                    "title": "Virtual Interview",
                    "details": "Participated in Google Meet interview to discuss experience and qualifications.",
                    "notes": "-"
                },
                {
                    "title": "Documentation Submission",
                    "details": "Joined group communication and submitted CV with portfolio links.",
                    "notes": "-"
                },
                {
                    "title": "Position Secured",
                    "details": "Successfully obtained Web Developer Intern position.",
                    "notes": "-"
                },
            ],
            "lessons_learned": "Maintaining an updated LinkedIn profile and current CV creates opportunities for career advancement and professional networking."
        },
        {
            "id": 3,
            "company_name": "YoungDev",
            "status": "Accepted",
            "position": "Machine Learning Intern",
            "journey": [
                {
                    "title": "Opportunity Discovery",
                    "details": "Found ML intern position on LinkedIn that aligned with career interests.",
                    "notes": "-"
                },
                {
                    "title": "Application Submission",
                    "details": "Submitted CV with enthusiasm for expanding ML knowledge and experience.",
                    "notes": "-"
                },
                {
                    "title": "Acceptance Communication",
                    "details": "Received acceptance and joined WhatsApp group for program details and coordination.",
                    "notes": "-"
                }
            ],
            "lessons_learned": "Active engagement on professional platforms and willingness to pursue learning opportunities can lead to valuable internship experiences."
        },
        {
            "id": 2,
            "company_name": "iNeuron.ai",
            "status": "Accepted",
            "position": "Machine Learning Intern",
            "journey": [
                {
                    "title": "Website Discovery",
                    "details": "Found internship posting while browsing iNeuron's company website.",
                    "notes": "-"
                },
                {
                    "title": "Application Success",
                    "details": "Applied for ML intern position and received acceptance confirmation.",
                    "notes": "-"
                },
                {
                    "title": "Flexible Engagement",
                    "details": "Received tasks to complete while managing other commitments due to flexible program structure.",
                    "notes": "-"
                }
            ],
            "lessons_learned": "Flexible internship opportunities provide valuable experience while allowing for balanced schedule management and multiple learning pursuits."
        },
        {
            "id": 1,
            "company_name": "Imaarotu Syu'unith Tholabah",
            "status": "Accepted",
            "position": "Deputy of Da'wah",
            "journey": [
                {
                    "title": "Senior Year Transition",
                    "details": "Reached final year at boarding school during organizational leadership transition period.",
                    "notes": "-"
                },
                {
                    "title": "Leadership Selection",
                    "details": "Selected by teachers (ustadz) for Deputy of Da'wah leadership position.",
                    "notes": "-"
                }
            ],
            "lessons_learned": "Consistent positive behavior and dedication to community responsibilities can lead to recognition and leadership opportunities."
        }
    ]