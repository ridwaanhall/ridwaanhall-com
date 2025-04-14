class ApplicationsData:
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
    applications = [
        {
            'company_name': 'Dicoding Indonesia',
            'status': 'Accepted',
            'position': 'Machine Learning Mentor',
            'journey': [
                {
                    'title': 'First Hit',
                    'details': 'Got an email inviting me to mentor—caught me off guard but hyped!',
                    'notes': '-'
                },
                {
                    'title': 'Form Vibes',
                    'details': 'Filled out a Google Form with my info, motivation, pic, and experience',
                    'notes': '-'
                },
                {
                    'title': 'Course Grind',
                    'details': 'Had to complete the course I’d be mentoring—went all in!',
                    'notes': '-'
                },
                {
                    'title': 'Real Talk',
                    'details': 'Chatted about my background, passion, and tackled some problem-solving questions',
                    'notes': '-'
                },
                {
                    'title': 'Locked In!',
                    'details': 'Snagged the Machine Learning Mentor role—ready to inspire!',
                    'notes': '-'
                },
            ],
            'lessons_learned': 'Digging into HR’s docs like it’s a treasure hunt seriously boosts your chances!'
        },
        {
            'company_name': 'HashMicro',
            'status': 'In Progress',
            'position': 'Python Developer (Django)',
            'journey': [
                {
                    'title': 'LinkedIn DM',
                    'details': 'HR slid into my LinkedIn with an interview link—game on!',
                    'notes': '-'
                },
                {
                    'title': 'Tech Chat',
                    'details': 'Geeked out on Django class vs function views and talked salary. Had to turn my cam on, but theirs stayed off—odd.',
                    'notes': '<span class="text-red-600">Only my camera was on—kinda weird vibe</span>'
                },
                {
                    'title': 'Official Apply',
                    'details': 'Told to apply through their website—done deal',
                    'notes': '-'
                },
                {
                    'title': 'Brain Teasers',
                    'details': 'Tackled a logic test and coding challenge—sweated a bit!',
                    'notes': '-'
                },
                {
                    'title': 'Client Meet',
                    'details': 'Final interview with the user team—same deal, my cam on, theirs off',
                    'notes': '<span class="text-red-600">Again, just my camera—come on, really?</span>'
                },
                {
                    'title': 'Waiting Game',
                    'details': 'Now just chilling for their decision—wish me luck!',
                    'notes': '-'
                },
            ],
            'lessons_learned': 'Asking for my camera on but keeping theirs off? Not cool. Respect’s a two-way street—makes a big difference.'
        },
        {
            'company_name': 'Skyshi Digital Indonesia',
            'status': 'Rejected',
            'position': 'Python Developer (Junior Level)',
            'journey': [
                {
                    'title': 'Spotted It',
                    'details': 'Found a dope job post on LinkedIn—looked promising',
                    'notes': '-'
                },
                {
                    'title': 'Sent It',
                    'details': 'Applied via LinkedIn with my resume and docs',
                    'notes': '-'
                },
                {
                    'title': 'Some Action',
                    'details': 'Got a “resume viewed” ping—thought I was in the game!',
                    'notes': '-'
                },
                {
                    'title': 'Ghost Town',
                    'details': 'No call, no email—complete silence after that',
                    'notes': '<span class="text-red-600">Zero follow-up—pretty rude</span>'
                },
                {
                    'title': 'Job Closed',
                    'details': 'Listing shut down right after my app',
                    'notes': '-'
                },
                {
                    'title': 'Plot Twist',
                    'details': 'Same job popped back up a month later—shady!',
                    'notes': '<span class="text-red-600">Feels like they’re just hoarding resumes</span>'
                },
            ],
            'lessons_learned': 'Some companies play games, opening and closing jobs to collect resumes. Waste of time—be real and save everyone the hassle.'
        },
        {
            'company_name': 'Shortlyst AI',
            'status': 'Ghosting',
            'position': 'Backend Engineer Intern',
            'journey': [
                {
                    'title': 'First Contact',
                    'details': 'Got a LinkedIn ping about a backend internship—sweet!',
                    'notes': '-'
                },
                {
                    'title': 'Kickoff Chat',
                    'details': 'Talked about my background and projects—good vibes',
                    'notes': '-'
                },
                {
                    'title': 'Tech Dive',
                    'details': 'Discussed intern tasks—fun convo, but I had to cam up while they didn’t',
                    'notes': '<span class="text-red-600">Cam on for me, off for them—ugh</span>'
                },
                {
                    'title': 'Vanished',
                    'details': 'No word after that—total ghost mode',
                    'notes': '<span class="text-red-600">Ghosted with no heads-up—lame</span>'
                },
            ],
            'lessons_learned': 'Preaching professionalism but pulling a Houdini? Nah. Respect candidates’ time, and your rep stays solid.'
        },
        {
            'company_name': 'Speechify',
            'status': 'Rejected',
            'position': 'Frontend Developer',
            'journey': [
                {
                    'title': 'GitHub Glow',
                    'details': 'Recruiter vibed with my GitHub and shot me an email',
                    'notes': '-'
                },
                {
                    'title': 'Cool Offer',
                    'details': 'Got a frontend gig pitch and a coding test invite',
                    'notes': '-'
                },
                {
                    'title': 'Code Challenge',
                    'details': 'Tasked with building a speech-to-text web project',
                    'notes': '-'
                },
                {
                    'title': 'Security Drama',
                    'details': 'Mid-test, my account got sketchy—possible hack. Had to pull the plug.',
                    'notes': '<span class="text-red-600">Bailed on the test due to account issues</span>'
                },
                {
                    'title': 'No Go',
                    'details': 'Got word I didn’t make the cut—oh well',
                    'notes': '-'
                },
            ],
            'lessons_learned': 'Prep hard for coding tests—scope out the company’s stuff and online tips. Oh, and lock down your setup to avoid disasters.'
        },
        {
            'company_name': 'National Fair Housing Alliance',
            'status': 'Rejected',
            'position': 'AI Engineer Intern',
            'journey': [
                {
                    'title': 'Found It',
                    'details': 'Caught an internship post on LinkedIn—looked fire',
                    'notes': '-'
                },
                {
                    'title': 'Dropped Resume',
                    'details': 'Applied via LinkedIn with my CV and docs',
                    'notes': '-'
                },
                {
                    'title': 'Crickets',
                    'details': 'No response—probably got axed early',
                    'notes': '<span class="text-red-600">Likely filtered out in screening</span>'
                },
            ],
            'lessons_learned': 'Not every app gets a reply. Companies use bots to screen—tailor your resume to slip through.'
        },
        {
            'company_name': 'Reality AI Lab',
            'status': 'Rejected',
            'position': 'AI Engineer Intern',
            'journey': [
                {
                    'title': 'Job Radar',
                    'details': 'Spotted an AI internship on LinkedIn—had to try',
                    'notes': '-'
                },
                {
                    'title': 'Sent Docs',
                    'details': 'Submitted my resume and papers via LinkedIn',
                    'notes': '-'
                },
                {
                    'title': 'Silent Treatment',
                    'details': 'No feedback—guessing I got screened out',
                    'notes': '<span class="text-red-600">Probably didn’t pass  make the bot cut</span>'
                },
            ],
            'lessons_learned': 'Same deal—craft a laser-focused resume to dodge those screening bots.'
        },
        {
            'company_name': 'GaoTek Inc.',
            'status': 'Accepted',
            'position': 'Assistant Squad Leader of Web Developer Intern',
            'journey': [
                {
                    'title': 'Got Props',
                    'details': 'My work stood out, so they offered me assistant squad leader—hype!',
                    'notes': '-'
                },
                {
                    'title': 'Level Up',
                    'details': 'Set to step into the new role soon—let’s go!',
                    'notes': '-'
                },
            ],
            'lessons_learned': 'Grind hard, and the big roles come knocking—performance pays off!'
        },
        {
            'company_name': 'GaoTek Inc.',
            'status': 'Accepted',
            'position': 'Web Developer Intern',
            'journey': [
                {
                    'title': 'LinkedIn Hit',
                    'details': 'Scored a DM about an internship—felt legit!',
                    'notes': '-'
                },
                {
                    'title': 'Virtual Hang',
                    'details': 'Jumped on a Google Meet to talk experience and vibes',
                    'notes': '-'
                },
                {
                    'title': 'CV Drop',
                    'details': 'Joined a group and sent my CV with all the links',
                    'notes': '-'
                },
                {
                    'title': 'Nailed It!',
                    'details': 'Bagged the Web Developer Intern spot—ready to build!',
                    'notes': '-'
                },
            ],
            'lessons_learned': 'Keep your LinkedIn and CV fresh—doors open when you’re ready!'
        },
    ]