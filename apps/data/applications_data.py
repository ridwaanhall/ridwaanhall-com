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
            'status': 'Ghosting',
            'position': 'Python Developer (Django)',
            "journey": [
                {
                    "title": "LinkedIn DM",
                    "details": "HR slid into my LinkedIn with some interview link—thought it was lit!",
                    "notes": "-"
                },
                {
                    "title": "Tech Talk",
                    "details": "Got deep into Django class vs function views, hashed out salary. They forced my cam on, but theirs? Pitch fucking black—shady as hell.",
                    "notes": "<span class='text-red-600'>Just my face on? What a fucking cowardly move, HR!</span>"
                },
                {
                    "title": "Official Apply",
                    "details": "Told to apply through their shitty website—done, no sweat.",
                    "notes": "-"
                },
                {
                    "title": "Brain Teasers",
                    "details": "Smashed a logic test and coding challenge—fucking nailed it!",
                    "notes": "-"
                },
                {
                    "title": "Client Meet",
                    "details": "Final round with the user team—guess what? My cam’s on, theirs off. Again. Total bullshit.",
                    "notes": "<span class='text-red-600'>Solo cam vibes? Fucking disrespectful pricks!</span>"
                },
                {
                    "title": "Waiting Game",
                    "details": "Now just chilling, waiting for their damn decision—bet it’s gonna suck.",
                    "notes": "-"
                },
                {
                    "title": "Fucking Vanished",
                    "details": "No word after the final interview—ghosted like a bunch of spineless assholes.",
                    "notes": "<span class='text-red-600'>Dipped with no fucking update? Pathetic shitshow!</span>"
                }
            ],
            "lessons_learned": "<span class='text-red-600 font-bold'>Cam on for me, but you’re hiding like cowards?</span> Respect’s a two-way fucking street. HR, grow some damn balls: <span class='text-blue-600 font-bold'>tell candidates you’re screwing them over</span>. <span class='text-orange-600 font-bold'>Ghosting’s for gutless fucking losers</span>. This HR’s a <span class='underline decoration-red-400 decoration-2'>straight-up clown-ass disaster</span>."
        },
        {
            'company_name': 'indigoshi Digital Indonesia',
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
            "journey": [
                {
                    "title": "First Contact",
                    "details": "HR hit my LinkedIn with some backend intern bait—thought it was fucking dope!",
                    "notes": "-"
                },
                {
                    "title": "Kickoff Chat",
                    "details": "Chatted up my projects and skills—vibes were solid, no cap.",
                    "notes": "-"
                },
                {
                    "title": "Tech Dive",
                    "details": "Dug into intern tasks—cool talk, but they made me turn my cam on while they hid like fucking cowards.",
                    "notes": "<span class='text-red-600'>Cam on for me, theirs off? Shitty asshole move!</span>"
                },
                {
                    "title": "Fucking Vanished",
                    "details": "Not a damn peep after that—ghosted me like spineless pricks.",
                    "notes": "<span class='text-red-600'>Ditched with no word? Fucking pathetic trash!</span>"
                }
            ],
            "lessons_learned": "<span class='text-red-600 font-bold'>Talk big about professionalism but pull a disappearing act?</span> Fuck that noise. HR, quit being gutless assholes: <span class='text-blue-600 font-bold'>give candidates a damn heads-up</span>. <span class='text-orange-600 font-bold'>Ghosting’s for fucking lowlife scum</span>. This company’s a <span class='underline decoration-red-400 decoration-2'>straight-up shitshow circus</span>."
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
            "company_name": "Copilot ID",
            "status": "Accepted",
            "position": "Founder",
            "journey": [
                {
                    "title": "Dream Spark",
                    "details": "Got this wild idea to start a company vibin’ with my love for Python, ML, DL, and web dev.",
                    "notes": "-"
                },
                {
                    "title": "Name Hunt",
                    "details": "Brainstormed a dope name that screams my passion—boom, Copilot ID was born!",
                    "notes": "-"
                },
                {
                    "title": "Founder Vibes",
                    "details": "Stepped up as the founder, ready to hustle and make waves!",
                    "notes": "-"
                }
            ],
            "lessons_learned": "Chase your passion and give it a name—your vision’s gotta start somewhere!"
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
            "company_name": "GAOTek Inc.",
            "status": "Accepted",
            "position": "Main Team of Web Developer Intern",
            "journey": [
                {
                    "title": "Intern Grind",
                    "details": "Crushed my internship tasks like a boss, putting in that work.",
                    "notes": "-"
                },
                {
                    "title": "Level Up",
                    "details": "My performance was straight fire, so they bumped me to the main web dev team!",
                    "notes": "-"
                }
            ],
            "lessons_learned": "Go hard on your tasks—good vibes and hustle get you noticed!"
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
        {
            "company_name": "YoungDev",
            "status": "Accepted",
            "position": "Machine Learning Intern",
            "journey": [
                {
                    "title": "LinkedIn Scroll",
                    "details": "Spotted a ML intern gig on LinkedIn that matched my vibe.",
                    "notes": "-"
                },
                {
                    "title": "CV Yeet",
                    "details": "Shot my CV over, hyped to level up my ML knowledge.",
                    "notes": "-"
                },
                {
                    "title": "Group Chat Poppin’",
                    "details": "Got accepted and slid into the WhatsApp group for the deets.",
                    "notes": "-"
                }
            ],
            "lessons_learned": "Stay active on LinkedIn and shoot your shot—opportunities are out there!"
        },
        {
            "company_name": "iNeuron.ai",
            "status": "Accepted",
            "position": "Machine Learning Intern",
            "journey": [
                {
                    "title": "Website Find",
                    "details": "Stumbled on an intern post while surfin’ iNeuron’s site.",
                    "notes": "-"
                },
                {
                    "title": "Sign-Up Swag",
                    "details": "Applied for the ML intern gig and got the green light!",
                    "notes": "-"
                },
                {
                    "title": "Task Mode",
                    "details": "Got tasks to tackle, but I’m juggling other stuff since this gig’s chill and flexible.",
                    "notes": "-"
                }
            ],
            "lessons_learned": "Flexible gigs are dope—grab ‘em, but balance your hustle!"
        },
        {
            "company_name": "Imaarotu Syu'unith Tholabah",
            "status": "Accepted",
            "position": "Deputy of Da'wah",
            "journey": [
                {
                    "title": "Boarding School Buzz",
                    "details": "Hit senior year at boarding school, and it was time for the big org handover.",
                    "notes": "-"
                },
                {
                    "title": "Ustadz Call",
                    "details": "Teachers (ustadz) picked the roles, and I got tapped for Deputy of Da’wah!",
                    "notes": "-"
                }
            ],
            "lessons_learned": "Show up and shine—sometimes the big roles find you!"
        }
    ]