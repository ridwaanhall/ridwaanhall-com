class ApplicationsData:
    """ # Can be "In Progress", "Accepted", "Rejected", "Ghosted"
    {
        "company_name": ",
        "status": ",
        "position": ",
        "journey": [
            {
                "title": ",
                "details": ",
                "notes": "
            },
        ],
        "lessons_learned": "
    },
    """
    applications = [
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
            "company_name": "Indigoshi Digital Indonesia",
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