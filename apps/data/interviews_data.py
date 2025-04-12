class InterviewsData:
    ''' # Can be 'Accepted', 'Rejected', or 'In Progress'
    {
        'company_name': '',
        'status': '',
        'position': '',
        'journey': [
            {
                'title': '',
                'details': '',
                'notes': ''
            },
        ],
        'lessons_learned': ''
    },
    '''
    interviews = [
        {
            'company_name': 'Dicoding Indonesia',
            'status': 'Accepted',
            'position': 'Machine Learning Mentor',
            'journey': [
                {
                    'title': 'Initial Contact',
                    'details': 'Received email invitation to become a mentor',
                    'notes': '-'
                },
                {
                    'title': 'Application Process',
                    'details': 'Completed Google form with personal data, motivation, photo, and experience details',
                    'notes': '-'
                },
                {
                    'title': 'Course Completion',
                    'details': 'Required to complete the course I would be mentoring',
                    'notes': '-'
                },
                {
                    'title': 'Interview',
                    'details': 'Discussed personal background, motivation, and problem-solving skills',
                    'notes': '-'
                },
                {
                    'title': 'Final Result',
                    'details': 'Accepted for the Machine Learning Mentor position',
                    'notes': '-'
                },
            ],
            'lessons_learned': 'Thoroughly studying the documentation provided by the HR team significantly increases the likelihood of a successful application outcome.'
        },
        {
            'company_name': 'HashMicro',
            'status': 'In Progress',
            'position': 'Python Developer (Django)',
            'journey': [
                {
                    'title': 'Initial Contact',
                    'details': 'HR reached out through LinkedIn with an interview link',
                    'notes': '-'
                },
                {
                    'title': 'Technical Interview',
                    'details': 'Discussed Django class views vs function views and salary expectations',
                    'notes': '<span class="text-red-600">They asked me to turn on my camera, but not theirs</span>'
                },
                {
                    'title': 'Application Process',
                    'details': 'Directed to apply formally through the company website',
                    'notes': '-'
                },
                {
                    'title': 'Assessment Tests',
                    'details': 'Completed logical reasoning psychological test and technical assessment',
                    'notes': '-'
                },
                {
                    'title': 'User Interview',
                    'details': 'Final interview with the user/client team',
                    'notes': '<span class="text-red-600">They asked me to turn on my camera, but not theirs</span>'
                },
                {
                    'title': 'Waiting for Feedback',
                    'details': 'Currently awaiting decision from the company',
                    'notes': '-'
                },
            ],
            'lessons_learned': 'Requiring candidates to turn on their cameras while not reciprocating may reflect a lack of mutual respect and transparency, which can leave a negative impression of the organization\'s values.'
        },
        {
            'company_name': 'Skyshi Digital Indonesia',
            'status': 'Rejected',
            'position': 'Python Developer (Junior Level)',
            'journey': [
                {
                    'title': 'Discovery',
                    'details': 'Found the job opportunity on LinkedIn',
                    'notes': '-'
                },
                {
                    'title': 'Application Submission',
                    'details': 'Applied through LinkedIn with resume and required documents',
                    'notes': '-'
                },
                {
                    'title': 'Application Progress',
                    'details': 'Received notification that application was viewed and resume downloaded',
                    'notes': '-'
                },
                {
                    'title': 'No Response',
                    'details': 'Received no callback or follow-up after resume review',
                    'notes': '<span class="text-red-600">No communication despite application being processed</span>'
                },
                {
                    'title': 'Position Closed',
                    'details': 'The job listing was closed after my application',
                    'notes': '-'
                },
                {
                    'title': 'Position Reopened',
                    'details': 'Same position was reposted one month later',
                    'notes': '<span class="text-red-600">Suggests they were collecting resumes rather than hiring</span>'
                },
            ],
            'lessons_learned': 'Companies that repeatedly post and close the same positions without engaging candidates may be building resume databases rather than filling actual roles. This practice wastes applicants\' time and erodes trust. If your organization has no immediate hiring intentions, consider more transparent ways to build your talent pipeline that respect candidates\' time and hopes.'
        },
        {
            'company_name': 'Shortlyst AI',
            'status': 'Ghosting',
            'position': 'Backend Engineer Intern',
            'journey': [
                {
                    'title': 'Initial Contact',
                    'details': 'Contacted through LinkedIn for a Backend Engineer internship opportunity',
                    'notes': '-'
                },
                {
                    'title': 'First Interview',
                    'details': 'Discussed personal background and previous projects',
                    'notes': '-'
                },
                {
                    'title': 'Technical Interview',
                    'details': 'Discussed potential internship work and responsibilities',
                    'notes': '<span class="text-red-600">Interviewer requested I turn on my camera but did not reciprocate</span>'
                },
                {
                    'title': 'Waiting for Feedback',
                    'details': 'No further communication received after technical interview',
                    'notes': '<span class="text-red-600">Ghosted with no status update</span>'
                },
            ],
            'lessons_learned': 'Fascinating how some organizations preach professionalism yet vanish without a trace. Perhaps those who demand transparency without offering it in return may someday wonder why their talent pipeline mysteriously runs dry. The industry remembers those who respect candidates\' time and dignity—and those who don\'t.'
        },
        {
            'company_name': 'Speechify',
            'status': 'Rejected',
            'position': 'Frontend Developer',
            'journey': [
                {
                    'title': 'Initial Contact',
                    'details': 'Received email from recruiter who was interested in my GitHub profile',
                    'notes': '-'
                },
                {
                    'title': 'Job Opportunity',
                    'details': 'Was offered a frontend position and invited to complete a coding test',
                    'notes': '-'
                },
                {
                    'title': 'Technical Assessment',
                    'details': 'Asked to build a speech-to-text website project as part of the evaluation',
                    'notes': '-'
                },
                {
                    'title': 'Security Incident',
                    'details': 'Experienced account security issues during the testing session',
                    'notes': '<span class="text-red-600">Had to terminate the test due to potential hacking attempt on my account</span>'
                },
                {
                    'title': 'Final Result',
                    'details': 'Received notification that I did not meet the required criteria',
                    'notes': '-'
                },
            ],
            'lessons_learned': 'Thoroughly prepare for coding tests by researching both online resources and the company\'s products. Always ensure your testing environment is secure before beginning any technical assessments.'
        },
        {
            'company_name': 'National Fair Housing Alliance',
            'status': 'Rejected',
            'position': 'AI Engineer Intern',
            'journey': [
                {
                    'title': 'Discovery',
                    'details': 'Found the internship opportunity through LinkedIn job postings',
                    'notes': '-'
                },
                {
                    'title': 'Application Submission',
                    'details': 'Applied through LinkedIn with resume and required documents',
                    'notes': '-'
                },
                {
                    'title': 'No Response',
                    'details': 'Received no feedback or follow-up after application submission',
                    'notes': '<span class="text-red-600">Likely eliminated during initial screening phase</span>'
                },
            ],
            'lessons_learned': 'Not all applications receive responses. Companies often use automated screening systems that filter candidates before human review. Having a targeted resume for each role increases chances of passing initial screens.'
        },
        {
            'company_name': 'Reality AI Lab',
            'status': 'Rejected',
            'position': 'AI Engineer Intern',
            'journey': [
            {
                'title': 'Discovery',
                'details': 'Found the internship opportunity through LinkedIn job postings',
                'notes': '-'
            },
            {
                'title': 'Application Submission',
                'details': 'Applied through LinkedIn with resume and required documents',
                'notes': '-'
            },
            {
                'title': 'No Response',
                'details': 'Received no feedback or follow-up after application submission',
                'notes': '<span class="text-red-600">Likely eliminated during initial screening phase</span>'
            },
            ],
            'lessons_learned': 'Not all applications receive responses. Companies often use automated screening systems that filter candidates before human review. Having a targeted resume for each role increases chances of passing initial screens.'
        },
        {
            'company_name': 'GaoTek Inc.',
            'status': 'Accepted',
            'position': 'Assistant Squad Leader of Web Developer Intern',
            'journey': [
                {
                    'title': 'Performance Recognition',
                    'details': 'Was offered assistant position through my channel due to good performance',
                    'notes': '-'
                },
                {
                    'title': 'Role Transition',
                    'details': 'Scheduled to begin assistant squad leader position',
                    'notes': '-'
                },
            ],
            'lessons_learned': 'Good performance in your role can lead to faster promotions and career advancement opportunities.'
        },
        {
            'company_name': 'GaoTek Inc.',
            'status': 'Accepted',
            'position': 'Web Developer Intern',
            'journey': [
                {
                    'title': 'Initial Contact',
                    'details': 'Contacted through LinkedIn offering an internship opportunity',
                    'notes': '-'
                },
                {
                    'title': 'Interview Process',
                    'details': 'Participated in a Google Meet interview discussing experience and personal background',
                    'notes': '-'
                },
                {
                    'title': 'Application Requirements',
                    'details': 'Invited to a group and asked to submit CV with link',
                    'notes': '-'
                },
                {
                    'title': 'Final Result',
                    'details': 'Received acceptance for the Web Developer Intern position',
                    'notes': '-'
                },
            ],
            'lessons_learned': 'Maintaining an updated LinkedIn profile and CV can lead to internship opportunities through direct outreach.'
        },
    ]