class BlogData:
    '''
    blog data maximum of is_featured true is only 2
    '''
    blogs = [
        {
            "id": 1,
            "title": "Getting Started with Python: A Beginner's Guide",
            "description": "Learn the basics of Python programming and why it's an excellent language for beginners.",
            "image_url": "https://ridwaanhall.me/static/img/blog/start_with_python1.webp",
            "date": "March 24, 2025",
            "author": "Ridwan Halim",
            "username": "ridwaanhall",
            "author_image": "https://ridwaanhall.me/static/img/ridwaanhall.webp",
            "content": [
                "Python has become one of the most popular programming languages in the world due to its simplicity and versatility. Whether you're interested in web development, data science, or automation, Python provides a gentle learning curve and powerful capabilities.",
                "To get started with Python, first install it from python.org, then familiarize yourself with basic syntax and data structures. The Python community offers abundant resources for beginners, including documentation, tutorials, and forums where you can seek help."
            ],
            "tags": ["Python", "Programming", "Beginners"],
            "is_featured": False
        },
        {
            "id": 2,
            "title": "Building Web Applications with Django",
            "description": "Discover how Django makes web development faster and more secure with its batteries-included philosophy.",
            "image_url": "https://ridwaanhall.me/static/img/blog/building_web_applications_with_django.webp",
            "date": "March 24, 2025",
            "author": "Ridwan Halim",
            "username": "ridwaanhall",
            "author_image": "https://ridwaanhall.me/static/img/ridwaanhall.webp",
            "content": [
                "Django is a high-level Python web framework that encourages rapid development and clean, pragmatic design. Built by experienced developers, Django takes care of much of the hassle of web development, so you can focus on writing your app without needing to reinvent the wheel.",
                "With its robust ORM, built-in admin interface, and emphasis on security, Django is perfect for projects of any size. This article explores how to set up a Django project, create models, and build views to create a fully functional web application."
            ],
            "tags": ["Django", "Web Development", "Python"],
            "is_featured": False
        },
        {
            "id": 3,
            "title": "Deep Learning with TensorFlow and Keras",
            "description": "An introduction to building neural networks using TensorFlow and Keras for machine learning projects.",
            "image_url": "https://ridwaanhall.me/static/img/blog/deep_learning_with_tensorflow_and_keras.webp",
            "date": "March 24, 2025",
            "author": "Ridwan Halim",
            "username": "ridwaanhall",
            "author_image": "https://ridwaanhall.me/static/img/ridwaanhall.webp",
            "content": [
                "TensorFlow and Keras have revolutionized deep learning by making neural networks more accessible to developers. TensorFlow provides the backbone computational engine, while Keras offers a user-friendly API that simplifies the process of building and training models.",
                "In this article, we'll walk through creating a simple neural network for image classification, explaining key concepts like layers, activation functions, and how to train and evaluate your model on real data."
            ],
            "tags": ["TensorFlow", "Keras", "Deep Learning", "AI"],
            "is_featured": False
        },
        {
            "id": 4,
            "title": "Effective Time Management for Developers",
            "description": "Practical strategies to boost productivity and maintain work-life balance as a software developer.",
            "image_url": "https://ridwaanhall.me/static/img/blog/effective_time_management_for_developers.webp",
            "date": "March 24, 2025",
            "author": "Ridwan Halim",
            "username": "ridwaanhall",
            "author_image": "https://ridwaanhall.me/static/img/ridwaanhall.webp",
            "content": [
                "Time management is crucial for developers facing complex projects and tight deadlines. Techniques like the Pomodoro method (25 minutes of focused work followed by a short break) can significantly improve productivity while preventing burnout.",
                "Other effective strategies include timeboxing tasks, minimizing context switching, and setting clear boundaries between work and personal time. Learn how to implement these practices to become more efficient while maintaining creativity and problem-solving abilities."
            ],
            "tags": ["Productivity", "Time Management", "Developer Tips"],
            "is_featured": False
        },
        {
            "id": 5,
            "title": "Understanding Lailatul Qadr: The Night of Power",
            "description": "Learn about the significance of Lailatul Qadr in Islam and why it's considered the most blessed night of the year.",
            "image_url": "https://ridwaanhall.me/static/img/blog/lailatul_qadr_night.webp",
            "date": "March 27, 2025",
            "author": "Ridwan Halim",
            "username": "ridwaanhall",
            "author_image": "https://ridwaanhall.me/static/img/ridwaanhall.webp",
            "content": [
                "Lailatul Qadr, often translated as 'The Night of Power' or 'The Night of Decree', is considered the holiest night in the Islamic calendar. It is believed to be the night when the first verses of the Quran were revealed to Prophet Muhammad.",
                "The Quran states that this night is 'better than a thousand months', meaning that worship during this night is rewarded more than worship performed for over 83 years. Many Muslims devote themselves to prayer, Quran recitation, and spiritual reflection during this blessed night."
            ],
            "tags": ["Islam", "Ramadan", "Lailatul Qadr", "Spirituality"],
            "is_featured": False
        },
        {
            "id": 6,
            "title": "PyTorch vs TensorFlow: Choosing the Right Deep Learning Framework",
            "description": "A straightforward comparison of the two most popular deep learning frameworks and their core differences.",
            "image_url": "https://ridwaanhall.me/static/img/blog/pytorch_vs_tensorflow.webp",
            "date": "March 28, 2025",
            "author": "Ridwan Halim",
            "username": "ridwaanhall",
            "author_image": "https://ridwaanhall.me/static/img/ridwaanhall.webp",
            "content": [
                "PyTorch and TensorFlow represent two distinct approaches to deep learning. TensorFlow, developed by Google, uses a static computational graph approach and excels in production environments with its deployment tools like TensorFlow Serving. It offers excellent scalability and has strong support for mobile and edge devices.",
                "PyTorch, developed by Facebook (Meta), uses a dynamic computational graph that allows for more intuitive debugging and greater flexibility during model development. Its Python-like syntax and eager execution mode make it particularly popular in research settings. While TensorFlow is more mature in production settings, PyTorch is gaining ground with tools like TorchServe.",
                "TensorFlow boasts an expansive ecosystem, including TensorBoard for visualization, TensorFlow Lite for mobile, and TensorFlow.js for JavaScript-based applications. These tools streamline the development process and offer versatility across platforms.",
                "PyTorch, on the other hand, has steadily built a competitive ecosystem. TorchServe provides streamlined model serving capabilities, and the integration with libraries like fastai accelerates the development of high-performance models.",
                "Both frameworks support hardware acceleration with GPUs and TPUs, ensuring high performance for complex models. TensorFlow often leads in performance benchmarks, thanks to optimizations tailored for specific hardware. PyTorch’s simplicity in leveraging GPUs and its seamless debugging experience give it an edge for iterative experiments.",
                "Choosing the right framework depends on your project's requirements: opt for TensorFlow for production and scalability, or PyTorch for research and experimentation."
            ],
            "tags": ["PyTorch", "TensorFlow", "Deep Learning", "AI", "Machine Learning"],
            "is_featured": True
        },
        {
            "id": 7,
            "title": "The Prophetic Way to Celebrate Eid al-Fitr",
            "description": "Explore the traditions and practices of Eid al-Fitr as exemplified by Prophet Muhammad (PBUH).",
            "image_url": "https://ridwaanhall.me/static/img/blog/eid_al_fitr_prophetic_way.webp",
            "date": "March 31, 2025",
            "author": "Ridwan Halim",
            "username": "ridwaanhall",
            "author_image": "https://ridwaanhall.me/static/img/ridwaanhall.webp",
            "content": [
                "Eid al-Fitr during the time of Prophet Muhammad (PBUH) was marked by joy, gratitude, and the strengthening of community bonds. The celebration began with the congregational Eid prayer in an open space, followed by an uplifting sermon filled with reminders of faith and unity.",
                "The Prophet (PBUH) encouraged Muslims to glorify Allah through takbir, starting from the night of Eid until the prayer. Takbir reflected gratitude and reverence for completing the month of fasting and seeking Allah's blessings.",
                "Zakat al-Fitr was a crucial aspect of Eid, as it ensured that the less fortunate could celebrate joyfully. The Prophet (PBUH) emphasized giving zakat before the Eid prayer to purify the fasting Muslims and assist those in need.",
                "Before heading to the Eid prayer, Prophet Muhammad (PBUH) advised eating, typically dates, to signify the end of fasting. This small but meaningful act underscored the transition to celebration and gratitude.",
                "The Prophet (PBUH) embraced Eid as a time for reconciliation and fellowship. He encouraged Muslims to strengthen familial and social ties, asking for forgiveness, and offering kind words and deeds to one another.",
                "Eid al-Fitr was also a day of sharing happiness. Prophet Muhammad (PBUH) set an example by showing generosity, kindness, and care, ensuring that every member of the community felt included in the celebration."
            ],
            "tags": ["Eid al-Fitr", "Prophet Muhammad", "Islam", "Traditions", "Community"],
            "is_featured": False
        },
        {
            "id": 8,
            "title": "Mastering Conventional Commits: A Developer's Guide",
            "description": "Learn how to craft meaningful commit messages that tell your project's story with style and clarity.",
            "image_url": "https://ridwaanhall.me/static/img/blog/conventional_commits_guide.webp",
            "date": "April 4, 2025",
            "author": "Ridwan Halim",
            "username": "ridwaanhall",
            "author_image": "https://ridwaanhall.me/static/img/ridwaanhall.webp",
            "is_featured": True,
            "content": [
                "When it comes to coding, commit messages are more than just notes—they're your story in the making. Conventional Commit standards make this process cleaner and more exciting. Here's how you can rock those commits:",
                    "<ul class='list-disc pl-5'>",
                    "<li><span class='font-bold text-blue-500'>✨ feat:</span> Add something fresh and exciting! Use it to introduce new features that wow your users. Example: <span class='font-mono text-blue-500'>feat: add user authentication module</span></li>",
                    "<li><span class='font-bold text-red-500'>🛠️ fix:</span> Bugs, begone! Squash errors and keep your code pristine. Example: <span class='font-mono text-red-500'>fix: correct login validation error</span></li>",
                    "<li><span class='font-bold text-yellow-500'>📝 docs:</span> Because words matter too! Highlight updates or fixes in documentation. Example: <span class='font-mono text-yellow-500'>docs: update API usage in README</span></li>",
                    "<li><span class='font-bold text-purple-500'>🎨 style:</span> Keep it chic! Perfect your code format without touching its logic. Example: <span class='font-mono text-purple-500'>style: format files using Prettier</span></li>",
                    "<li><span class='font-bold text-orange-500'>🔄 refactor:</span> Code overhaul, anyone? Streamline and improve without altering the behavior. Example: <span class='font-mono text-orange-500'>refactor: optimize database queries</span></li>",
                    "<li><span class='font-bold text-pink-500'>🧪 test:</span> Test smarter, not harder! Add or update those life-saving test cases. Example: <span class='font-mono text-pink-500'>test: add unit tests for user service</span></li>",
                    "<li><span class='font-bold text-green-500'>⚡ perf:</span> Faster, smoother, better! Use this for jaw-dropping performance improvements. Example: <span class='font-mono text-green-500'>perf: improve image rendering efficiency</span></li>",
                    "<li><span class='font-bold text-indigo-500'>🤖 ci:</span> Automation is key! Make updates to the Continuous Integration setup. Example: <span class='font-mono text-indigo-500'>ci: update GitHub Actions workflow</span></li>",
                    "<li><span class='font-bold text-gray-500'>🛠️ build:</span> Solid foundations matter! Updates affecting your build system or dependencies. Example: <span class='font-mono text-gray-500'>build: add webpack config for production build</span></li>",
                    "<li><span class='font-bold text-teal-500'>🚧 chore:</span> Maintenance never stops! For those routine tasks that keep everything in top shape. Example: <span class='font-mono text-teal-500'>chore: update npm dependencies</span></li>",
                    "<li><span class='font-bold text-rose-500'>⏪ revert:</span> Second chances are everything! Undo past commits and start fresh. Example: <span class='font-mono text-rose-500'>revert: revert commit abc123 due to bug</span></li>",
                    "</ul>"
            ],
            "tags": ["Conventional Commits", "Git", "Commit Messages", "Coding Standards", "Development"],
        }
    ]