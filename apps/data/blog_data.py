from datetime import datetime
from django.conf import settings

class BlogData:
    '''
    blog data maximum of is_featured true is only 2
    '''
    blogs = [
        {
            "id": 1,
            "title": "Python 101: Your Chill Guide to Getting Started",
            "description": "New to coding? Let’s dive into why Python’s the coolest way to kick off your programming adventure!",
            "image_url": f"{settings.BLOG_BASE_IMG_URL}/start_with_python.webp",
            "img_name": "start_with_python.webp",
            "created_at": datetime.strptime("2025-03-24T00:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
            "updated_at": datetime.strptime("2025-04-16T21:51:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
            "author": "Ridwan Halim",
            "username": "ridwaanhall",
            "author_image": f"{settings.BASE_URL}/static/img/ridwaanhall.webp",
            "content": [
                "Python’s like the Swiss Army knife of coding—simple, versatile, and straight-up fun. Whether you’re dreaming of building websites, crunching data, or automating boring tasks like renaming 100 files, Python’s got your back with a vibe that’s easy to pick up.",
                "Why’s it so dope? No cryptic syntax like some other languages—just clean, readable code. You can write a script to scrape a website or analyze your Spotify playlist in a weekend. Big shots like Google and Netflix use it, so you’re in good company.",
                "Ready to jump in? Head to python.org and grab the latest version (3.12 as of now—stay current!). Start with a simple ‘Hello, World!’ to get comfy. Then play with loops (like `for i in range(5)`), lists (`my_stuff = ['pizza', 'code', 'vibes']`), and functions to feel the flow.",
                "Stuck? The Python community’s your squad—Reddit’s r/learnpython, Stack Overflow, or free tutorials on YouTube are gold. Try coding a basic calculator or a to-do list to level up. Pro tip: use VS Code with the Python extension for a smooth ride.",
                "Next steps? Dip into libraries like `pandas` for data or `requests` for web stuff. Python’s a gateway to web dev, AI, or even hacking (ethically, of course!). Keep tinkering, and you’ll be building cool stuff in no time."
            ],
            "tags": ["Python", "Coding", "Newbies"],
            "is_featured": False
        },
        {
            "id": 2,
            "title": "Whipping Up Web Apps with Django’s Magic",
            "description": "See how Django’s all-in-one toolkit makes building secure, speedy web apps a total breeze.",
            "image_url": f"{settings.BLOG_BASE_IMG_URL}/building_web_applications_with_django.webp",
            "img_name": "building_web_applications_with_django.webp",
            "created_at": datetime.strptime("2025-03-24T00:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
            "updated_at": datetime.strptime("2025-04-16T21:51:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
            "author": "Ridwan Halim",
            "username": "ridwaanhall",
            "author_image": f"{settings.BASE_URL}/static/img/ridwaanhall.webp",
            "content": [
                "Django’s the Python framework that’s like having a superpower for web dev. It’s got everything—security, speed, and a vibe that lets you focus on coding your app instead of wrestling with configs. Think of it as the cheat code for building sites like OpenShop (yep, like that e-commerce API we’ve geeked out over!).",
                "First, fire up a project with `django-admin startproject myapp`. Boom—you’ve got a skeleton ready to roll. Create an app (`python manage.py startapp shop`) to handle your logic, like products or users. Django’s ORM is a beast: define a `Product` model with fields like `name` and `price`, and it’ll handle the database heavy lifting.",
                "Views are where the fun’s at—map a URL (say, `/products/`) to a function or class that pulls data and renders a template. Speaking of templates, Django’s got a slick system to keep your HTML clean. Throw in the built-in admin panel (`/admin/`), and you’re managing data like a pro without writing extra code.",
                "Security? Django’s got your back with CSRF protection and user auth out of the box. Need an API? Pair it with Django REST Framework (like we did for OpenShop) for JSON endpoints that scream speed. Scalability? It’s battle-tested—Instagram and Pinterest run on it.",
                "Wanna try it? Build a simple blog: set up models for posts, create views to list and detail them, and style it with Bootstrap. Debug with `python manage.py runserver` and tweak as you go. Trust me, once you go Django, you won’t wanna code raw again."
            ],
            "tags": ["Django", "Web Dev", "Python"],
            "is_featured": False
        },
        {
            "id": 3,
            "title": "Neural Nets Made Easy with TensorFlow & Keras",
            "description": "Ready to build AI that sees and thinks? Let’s get rolling with TensorFlow and Keras for some deep learning fun!",
            "image_url": f"{settings.BLOG_BASE_IMG_URL}/deep_learning_with_tensorflow_and_keras.webp",
            "img_name": "deep_learning_with_tensorflow_and_keras.webp",
            "created_at": datetime.strptime("2025-03-24T00:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
            "updated_at": datetime.strptime("2025-04-16T21:51:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
            "author": "Ridwan Halim",
            "username": "ridwaanhall",
            "author_image": f"{settings.BASE_URL}/static/img/ridwaanhall.webp",
            "content": [
                "TensorFlow and Keras are like the Batman and Robin of deep learning—TensorFlow’s the heavy-duty engine, Keras is the slick API making neural nets feel like a breeze. Together, they power AI that can spot cats in photos or predict your next binge-watch.",
                "Let’s build something real: a neural network to classify handwritten digits (MNIST dataset—classic!). Start with `tensorflow.keras.Sequential()` to stack layers—think `Dense(128, activation='relu')` for the brains and `softmax` for the final guess. Keras makes it stupid simple to add layers like LEGO bricks.",
                "Training’s where the magic happens. Feed your model data with `model.fit()`, tweak it with epochs (like 5-10), and watch it learn. TensorFlow’s handling the math under the hood—gradients, backprop, all that jazz. Use `model.evaluate()` to check accuracy—aim for 95%+ to flex.",
                "Wanna go deeper? Play with CNNs for image recognition (`Conv2D`) or RNNs for text (`LSTM`). Overfitting? Toss in `Dropout(0.2)`. Debug with TensorBoard to visualize your model’s vibe. I’ve used this combo for sentiment analysis and image classifiers—it’s legit.",
                "Kick it off with `pip install tensorflow` and Google Colab if your laptop’s not beefy. Try coding a model to guess movie genres from posters—fun and doable. Keep experimenting, and you’ll be an AI wizard before you know it."
            ],
            "tags": ["TensorFlow", "Keras", "AI", "Deep Learning"],
            "is_featured": False
        },
        {
            "id": 4,
            "title": "Hacking Your Dev Life: Time Management Tricks",
            "description": "Wanna crush code and still have a life? Here’s how to stay productive without burning out.",
            "image_url": f"{settings.BLOG_BASE_IMG_URL}/effective_time_management_for_developers.webp",
            "img_name": "effective_time_management_for_developers.webp",
            "created_at": datetime.strptime("2025-03-24T00:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
            "updated_at": datetime.strptime("2025-04-16T21:51:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
            "author": "Ridwan Halim",
            "username": "ridwaanhall",
            "author_image": f"{settings.BASE_URL}/static/img/ridwaanhall.webp",
            "content": [
                "Coding’s a rush, but deadlines and bugs can make you wanna yeet your laptop. Enter time management hacks like Pomodoro—25 minutes of pure focus, 5-minute breather. It’s like a gym sesh for your brain, keeping you sharp without crashing.",
                "Try timeboxing: give a task (say, debugging an API) 2 hours max. No perfectionism—ship it and move on. Tools like Trello or Notion keep your tasks in check; I use them to juggle ML projects and blog posts without losing my mind.",
                "Distractions are the enemy. Mute Slack, ditch social media, and pop on lo-fi beats—focus mode activated. Set hard boundaries: no coding past 9 PM unless it’s crunch time. That way, you’ve got juice for gaming, fam, or just chilling.",
                "Plan your week like a boss—Sunday nights, I map out big wins (like finishing a Django view) and small stuff (emails). Prioritize what moves the needle; skip the busywork. Bonus: track time with Toggl to see where you’re slacking.",
                "Burnout’s real, so take breaks seriously—walk, stretch, or pray to reset. I’ve dodged crashes by mixing coding sprints with downtime. Test these hacks for a week, tweak what works, and you’ll be shipping code like a pro with time to spare."
            ],
            "tags": ["Productivity", "Time Hacks", "Dev Life"],
            "is_featured": False
        },
        {
            "id": 5,
            "title": "Why Lailatul Qadr Is the Ultimate Night of Blessings",
            "description": "Get the lowdown on Lailatul Qadr and why it’s the most epic night in Islam.",
            "image_url": f"{settings.BLOG_BASE_IMG_URL}/lailatul_qadr_night.webp",
            "img_name": "lailatul_qadr_night.webp",
            "created_at": datetime.strptime("2025-03-27T00:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
            "updated_at": datetime.strptime("2025-04-16T21:51:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
            "author": "Ridwan Halim",
            "username": "ridwaanhall",
            "author_image": f"{settings.BASE_URL}/static/img/ridwaanhall.webp",
            "content": [
                "Lailatul Qadr, aka the Night of Power, is Islam’s holiest night—when the Quran’s first verses dropped to Prophet Muhammad. It’s like a spiritual jackpot, packed with blessings.",
                "The Quran says it’s ‘better than a thousand months,’ so worship on this night is like stacking 83+ years of good vibes. Muslims go all-in with prayers, Quran reading, and deep reflection to soak it all up."
            ],
            "tags": ["Islam", "Ramadan", "Lailatul Qadr", "Faith"],
            "is_featured": False
        },
        {
            "id": 6,
            "title": "PyTorch vs. TensorFlow: Pick Your AI Fight Club",
            "description": "TensorFlow or PyTorch? Let’s break down the big dogs of deep learning and find your perfect match.",
            "image_url": f"{settings.BLOG_BASE_IMG_URL}/pytorch_vs_tensorflow.webp",
            "img_name": "pytorch_vs_tensorflow.webp",
            "created_at": datetime.strptime("2025-03-28T00:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
            "updated_at": datetime.strptime("2025-04-16T21:51:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
            "author": "Ridwan Halim",
            "username": "ridwaanhall",
            "author_image": f"{settings.BASE_URL}/static/img/ridwaanhall.webp",
            "content": [
                "PyTorch and TensorFlow are the heavyweights of deep learning, but they’ve got different vibes. TensorFlow’s Google-backed, with a static graph setup that’s a beast for scaling and deploying to production—think TensorFlow Serving for servers or Lite for mobiles.",
                "PyTorch, from Meta, is the chill coder’s choice—dynamic graphs make debugging a breeze, and its Python-y flow feels like home for research nerds. Tools like TorchServe are catching up for production, too.",
                "TensorFlow’s got a massive toolbox: TensorBoard for slick visuals, TensorFlow.js for web apps, and optimizations that scream speed on specific hardware. PyTorch counters with fastai for quick models and GPU-friendly coding that’s a joy to tweak.",
                "Both handle GPUs and TPUs like champs, but TensorFlow’s got a slight edge in raw performance. Pick TensorFlow for bulletproof production apps, or PyTorch if you’re tinkering and iterating like a mad scientist."
            ],
            "tags": ["PyTorch", "TensorFlow", "AI", "Deep Learning", "ML"],
            "is_featured": False
        },
        {
            "id": 7,
            "title": "Eid al-Fitr: Celebrating the Prophet’s Way",
            "description": "Dive into how Prophet Muhammad (PBUH) rocked Eid al-Fitr with joy, faith, and community love.",
            "image_url": f"{settings.BLOG_BASE_IMG_URL}/eid_al_fitr_prophetic_way.webp",
            "img_name": "eid_al_fitr_prophetic_way.webp",
            "created_at": datetime.strptime("2025-03-31T00:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
            "updated_at": datetime.strptime("2025-04-16T21:51:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
            "author": "Ridwan Halim",
            "username": "ridwaanhall",
            "author_image": f"{settings.BASE_URL}/static/img/ridwaanhall.webp",
            "content": [
                "Eid al-Fitr back in Prophet Muhammad’s (PBUH) day was all about gratitude and good times. It kicked off with a big group prayer outdoors, followed by a sermon that lit up everyone’s faith and unity.",
                "The Prophet pushed takbir—glorifying Allah from Eid’s eve till prayer time—to keep the thankful vibes flowing. Zakat al-Fitr was a must, making sure everyone, especially the less fortunate, could join the party.",
                "Before heading out, he’d munch on dates to mark the end of fasting—a small move with big meaning. Eid was also about patching things up, forgiving, and spreading kindness to make the community tight."
            ],
            "tags": ["Eid al-Fitr", "Prophet Muhammad", "Islam", "Community"],
            "is_featured": False
        },
        {
            "id": 8,
            "title": "Nail Your Git Game with Conventional Commits",
            "description": "Make your commit messages pop with style and clarity—tell your code’s story like a pro!",
            "image_url": f"{settings.BLOG_BASE_IMG_URL}/conventional_commits_guide.webp",
            "img_name": "conventional_commits_guide.webp",
            "created_at": datetime.strptime("2025-04-04T00:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
            "updated_at": datetime.strptime("2025-04-16T21:51:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
            "author": "Ridwan Halim",
            "username": "ridwaanhall",
            "author_image": f"{settings.BASE_URL}/static/img/ridwaanhall.webp",
            "is_featured": True,
            "content": [
                "Commits aren’t just logs—they’re your code’s epic saga. Conventional Commits keep it clean and fun. Here’s the playbook to slay it:",
                "<ul class='list-disc pl-5'>",
                "<li><span class='font-bold text-blue-500'>✨ feat:</span> Drop something new and shiny! Like: <span class='font-mono text-blue-500'>feat: add user login flow</span></li>",
                "<li><span class='font-bold text-red-500'>🛠️ fix:</span> Squash bugs like a boss. Like: <span class='font-mono text-red-500'>fix: patch login glitch</span></li>",
                "<li><span class='font-bold text-yellow-500'>📝 docs:</span> Make your docs sparkle. Like: <span class='font-mono text-yellow-500'>docs: beef up API guide</span></li>",
                "<li><span class='font-bold text-purple-500'>🎨 style:</span> Keep it pretty—no logic changes. Like: <span class='font-mono text-purple-500'>style: tidy up CSS</span></li>",
                "<li><span class='font-bold text-orange-500'>🔄 refactor:</span> Revamp code for max vibes. Like: <span class='font-mono text-orange-500'>refactor: streamline DB calls</span></li>",
                "<li><span class='font-bold text-pink-500'>🧪 test:</span> Lock in those tests. Like: <span class='font-mono text-pink-500'>test: add auth unit tests</span></li>",
                "<li><span class='font-bold text-green-500'>⚡ perf:</span> Speed things up—wow factor! Like: <span class='font-mono text-green-500'>perf: optimize image load</span></li>",
                "<li><span class='font-bold text-indigo-500'>🤖 ci:</span> Keep CI humming. Like: <span class='font-mono text-indigo-500'>ci: tweak GitHub Actions</span></li>",
                "<li><span class='font-bold text-zinc-500'>🛠️ build:</span> Solidify your setup. Like: <span class='font-mono text-zinc-500'>build: update webpack</span></li>",
                "<li><span class='font-bold text-teal-500'>🚧 chore:</span> Handle the grunt work. Like: <span class='font-mono text-teal-500'>chore: bump dependencies</span></li>",
                "<li><span class='font-bold text-rose-500'>⏪ revert:</span> Hit rewind when needed. Like: <span class='font-mono text-rose-500'>revert: undo buggy commit</span></li>",
                "</ul>"
            ],
            "tags": ["Git", "Commits", "Coding Tips", "Dev Workflow"],
        },
        {
            "id": 9,
            "title": "How I Picked the Perfect Domain for My Site",
            "description": "The wild ride of choosing between .dev, .com, and .id for ridwaanhall.com—here’s the tea!",
            "image_url": f"{settings.BLOG_BASE_IMG_URL}/choosing_domain.webp",
            "img_name": "choosing_domain.webp",
            "created_at": datetime.strptime("2025-04-13T00:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
            "updated_at": datetime.strptime("2025-04-16T21:51:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
            "author": "Ridwan Halim",
            "username": "ridwaanhall",
            "author_image": f"{settings.BASE_URL}/static/img/ridwaanhall.webp",
            "content": [
                "Building <span class='text-blue-600'>ridwaanhall.com</span> wasn’t just about code—it was about giving it a vibe. Picking the right domain extension was a big deal, so I weighed <span class='text-green-600'>.dev</span>, <span class='text-blue-600'>.com</span>, and <span class='text-red-600'>.id</span> like a pro.",
                "<span class='text-green-600'>.dev</span> screamed coder cred—perfect for flexing my tech projects and geeky posts. But I wanted more than just a dev diary; I’m also into faith, culture, and big ideas, so it felt a bit narrow.",
                "Then there’s <span class='text-blue-600'>.com</span>—the OG. It’s global, flexible, and fits everything from AI tutorials to life musings. It’s like the ultimate stage for techies, casual readers, and everyone else.",
                "<span class='text-red-600'>.id</span> hit home as an Indonesian—it’s personal, proud, and rooted. But my site’s got global dreams, and I didn’t wanna box it in.",
                "So, I went with <span class='text-blue-600'>ridwaanhall.com</span>. It’s the sweet spot—tech, faith, and stories, all under one roof, welcoming folks from everywhere. Boom!"
            ],
            "tags": ["Domains", ".com", ".dev", ".id", "Web Dev", "Branding"],
            "is_featured": False
        },
        {
            "id": 10,
            "title": "Why I’m Coding for Gaza’s Truth",
            "description": "From pesantren to Python, here’s why I’m hustling to amplify Gaza’s crisis with facts, faith, and a call to act—no noise, just heart.",
            "image_url": f"{settings.BLOG_BASE_IMG_URL}/gaza_crisis.webp",
            "img_name": "gaza_crisis.webp",
            "created_at": datetime.strptime("2025-04-16T00:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
            "updated_at": datetime.strptime("2025-04-16T21:51:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
            "author": "Ridwan Halim",
            "username": "ridwaanhall",
            "author_image": f"{settings.BASE_URL}/static/img/ridwaanhall.webp",
            "content": [
                "Yo, I’m ridwaanhall—<span class='text-green-600'>coding by day, memorizing Quran by heart—who else but me?</span> Gaza’s crisis ain’t just a headline for me; it’s a call to debug the biggest bug: <span class='text-red-600'>injustice</span>. Growing up in Pondok Pesantren, I learned fairness is non-negotiable, Surah by Surah. Now, as a coder, I’m wiring that hustle into something real.",
                "Let’s talk facts: since October 2023, <span class='text-red-600'>42,000+ lives</span> have been lost in Gaza—kids, families, dreams. Over <span class='text-white'>1.9 million</span> people, 90% of the population, are displaced, scraping by in tents. And <span class='text-green-600'>60%+</span> of homes, schools, hospitals? Gone. These aren’t my numbers; they’re from <a href='https://www.ochaopt.org' target='_blank' class='text-green-400 hover:text-green-300'>OCHA</a> and <a href='https://www.unrwa.org' target='_blank' class='text-green-400 hover:text-green-300'>UNRWA</a>.",
                "Why do I care? Pondok taught me to stand for what’s right, no matter the stack. Coding taught me to solve problems, whether it’s a Django bug or a crisis screaming for truth. Gaza’s not just data—it’s <span class='text-white'>people</span> fighting for dignity. That’s why I’m curating resources like <a href='https://www.who.int/emergencies/situations/occupied-palestinian-territory' target='_blank' class='text-green-400 hover:text-green-300'>WHO’s health reports</a> or <a href='https://www.btselem.org' target='_blank' class='text-green-400 hover:text-green-300'>B’Tselem’s raw stories</a>.",
                "Here’s the deal: you can help. Donate to <a href='https://www.unrwa.org/donate' target='_blank' class='text-green-400 hover:text-green-300'>UNRWA</a>—they’re feeding families right now. Share this post on X to cut through the noise. Or dive into a book like <span class='text-red-600'>“Justice for Some”</span> by Noura Erakat to get the full picture. Every move counts.",
                "This blog’s my code for Gaza—<span class='text-green-600'>built with faith, facts, and grind</span>. Pesantren gave me roots; AI gave me tools. Together, let’s push for hope, one step at a time. Who’s with me?"
            ],
            "tags": ["Gaza", "Palestine", "Humanitarian", "Justice", "Resources", "Faith", "Coding"],
            "is_featured": True
        },
        {
            "id": 11,
            "title": "What’s Good with Brainrot in 2025?",
            "description": "Brainrot’s takin’ over the internet in 2025, and it’s WILD! From cursed memes to AI vids and slang that’s got no chill, here’s the tea on what brainrot is and how to not lose your mind in the chaos.",
            "image_url": f"{settings.BLOG_BASE_IMG_URL}/brainrot_explained_2025.webp",
            "img_name": "brainrot_explained_2025.webp",
            "created_at": datetime.strptime("2025-04-21T20:24:34+07:00", "%Y-%m-%dT%H:%M:%S%z"),
            "updated_at": datetime.strptime("2025-04-21T21:13:56+07:00", "%Y-%m-%dT%H:%M:%S%z"),
            "author": "Ridwan Halim",
            "username": "ridwaanhall",
            "author_image": f"{settings.BASE_URL}/static/img/ridwaanhall.webp",
            "content": [
                "Yo, <span class='text-purple-600'>brainrot</span> is the internet’s wildest flex in 2025, and it’s got us all actin’ unwise! It’s what happens when you’re deep in the scroll, drownin’ in <span class='text-red-600'>cursed memes</span>, AI vids, and slang that hits like a fever dream. Your brain’s like, ‘Bruh, I’m fried!’ Here’s the 411 on this digital chaos and how to keep your vibes high without crashin’. Check my blog at <span class='text-blue-600'>ridwaanhall.com</span> for more!",
                "<span class='text-blue-600'>What even is brainrot?</span> Straight-up, it’s like your brain’s gettin’ roasted by too much internet sauce. Think scrollin’ X or TikTok for hours, vibin’ with <span class='text-red-600'>absurd content</span> that’s funny but kinda pointless. It’s those moments when you’re laughin’ at a meme but forget how to think deep. My Coding Camp kids in Bandung call it ‘brain lag’—and they’re not wrong!",
                "In 2025, brainrot’s poppin’ off with <span class='text-green-600'>next-level chaos</span>. We got <span class='text-red-600'>Italian Brainrot memes</span> like **Bombardiro Crocodilo** (a freakin’ croc with a jet bod) or **Tung Tung Tung Sahur** (a kentongan with a face, no cap). Then there’s <span class='text-blue-600'>AI vids</span>—Grok 3’s out here droppin’ TikToks that keep you glued to your screen. And don’t sleep on slang like ‘rizz’ for smooth moves or ‘Ohio’ for anything cursed. I tried ‘rizzler’ in class, and my students were SCREAMIN’!",
                "But here’s the tea: brainrot can <span class='text-yellow-600'>mess you up</span>. Too much of it, and your brain’s on snooze mode—<span class='text-red-600'>no critical thinking</span>, just vibes. It kills your grind, too; I lost a whole afternoon to AI cat vids once, oops. Plus, it can stress you out when you realize you can’t focus. I felt that when I got stuck in a meme loop instead of preppin’ my coding lessons. Gotta stay woke!",
                "So, how do you <span class='text-purple-600'>survive the brainrot wave</span>? Keep it chill and picky with your content. I mix fun stuff with smart posts on <span class='text-blue-600'>ridwaanhall.com</span>—like droppin’ a Python tutorial with a side of silly memes. Curate your X feed for the good stuff: Indo jokes, tech hacks, or faith inspo. And take breaks—go code, pray, or just touch grass. My camp kids keep me grounded; they’re out here learnin’ while I’m dodgin’ brainrot traps!",
                "Real talk: brainrot’s part of the 2025 internet vibe, but you can <span class='text-green-600'>run the game</span> instead of lettin’ it run you. Pick one or two fire memes or slang words, flex ‘em, and move on. I learned this after sharin’ a coding meme that popped off on X. Balance the goofy with the glow-up, and you’re golden. So, you ever caught yourself in a brainrot spiral? Drop your story, fam—let’s vibe! 😎"
            ],
            "tags": ["Brainrot 101", "Internet Chaos", "Absurd Memes", "AI Vibes", "Slang Game", "Tech Life", "Indo Internet"],
            "is_featured": False
        },
        {
            "id": 12,
            "title": "Predicting Gold Prices in Indonesia: AI’s Golden Touch",
            "description": "Gold price forecasting in Indonesia just got smarter! Dive into how AI-powered LSTM models are transforming historical data into actionable insights for investors and analysts.",
            "image_url": f"{settings.BLOG_BASE_IMG_URL}/gold_price_prediction.webp",
            "img_name": "gold_price_prediction.webp",
            "created_at": datetime.strptime("2025-04-23T22:20:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
            "updated_at": datetime.strptime("2025-04-23T22:20:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
            "author": "Ridwan Halim",
            "username": "ridwaanhall",
            "author_image": f"{settings.BASE_URL}/static/img/ridwaanhall.webp",
            "content": [
                "<span class='text-purple-600'>Gold price prediction</span> is the next big flex for Indonesia’s market scene! With AI-powered LSTM models, we’re crunchin’ 10+ years of data to forecast trends that investors can bank on. Wanna know how it works? Check my blog at <span class='text-blue-600'>ridwaanhall.com</span> for the full scoop!",
                "<span class='text-blue-600'>What’s the deal with gold price prediction?</span> Straight-up, it’s about using deep learning to analyze historical price patterns and predict future trends. Think next-day prices, short-term vibes (1-6 months), and long-term outlooks (up to 5 years). My model’s got interactive plots and exportable data for that extra sauce. Investors in Jakarta are already hyped!",
                "In 2025, gold price prediction’s poppin’ off with <span class='text-green-600'>next-level precision</span>. We’re talkin’ LSTM neural networks that adapt to market volatility and seasonal trends. Plus, the visualizations are clean—dynamic plots that make data analysis a breeze. And don’t sleep on the CSV exports; they’re perfect for deeper dives into the numbers.",
                "But here’s the tea: forecasting isn’t foolproof. Market shocks and black swan events can throw predictions off. That’s why my model focuses on trends rather than exact prices for long-term forecasts. It’s all about staying informed and adaptable in a fast-changing market.",
                "So, how do you <span class='text-purple-600'>leverage gold price predictions</span>? Use the insights to make smarter investment decisions. Whether you’re a trader, analyst, or just curious about the market, this tool’s got you covered. Check out <span class='text-blue-600'>ridwaanhall.com</span> for tutorials on using the model and tips for navigating Indonesia’s gold market.",
                "Real talk: AI’s changing the game for gold price forecasting, and you can be part of it. Dive into the data, explore the trends, and make informed moves. Got questions or stories about your investment journey? Drop a comment, fam—let’s vibe! 😎"
            ],
            "tags": ["Gold Price Prediction", "AI Forecasting", "Deep Learning", "Market Trends", "Investment Insights", "Tech Life", "Indo Market"],
            "is_featured": True
        },
        {
            "id": 13,
            "title": "Complete Guide to Modern Web Development in 2025",
            "description": "Master modern web development with our comprehensive guide covering frontend frameworks, backend technologies, and DevOps practices for building powerful web applications.",
            "image_url": f"{settings.BLOG_BASE_IMG_URL}/modern_web_dev_guide.webp",
            "img_name": "modern_web_dev_guide.webp",
            "created_at": datetime.strptime("2025-05-10T11:05:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
            "updated_at": datetime.strptime("2025-05-10T11:05:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
            "author": "Ridwan Halim",
            "username": "ridwaanhall",
            "author_image": f"{settings.BASE_URL}/static/img/ridwaanhall.webp",
            "content": [
                "<p class='mb-4 text-sm md:text-base lg:text-lg'>Modern web development has transformed dramatically from basic HTML pages to dynamic, interactive applications. Today's developers need a comprehensive toolkit to build fast, secure, and scalable web solutions that meet user expectations across all devices.</p>",
                "<h2 class='text-xl md:text-2xl lg:text-3xl font-bold mt-4 md:mt-5 mb-2 md:mb-3'>Frontend Development: Creating Exceptional User Experiences</h2>",
                "<p class='mb-4 text-sm md:text-base lg:text-lg'>Frontend development forms the core of what users interact with directly. Modern web applications require responsive designs, accessibility features, and optimized performance to deliver outstanding user experiences across desktop and mobile devices.</p>",
                "<h3 class='text-lg md:text-xl font-bold mt-3 md:mt-4 mb-2'>Essential JavaScript Frameworks for Modern Web Development</h3>",
                "<p class='mb-4 text-sm md:text-base lg:text-lg'>The evolution of JavaScript has revolutionized web development through powerful frameworks like React, Vue.js, and Angular. These tools enable developers to create sophisticated single-page applications (SPAs) with reusable components and state management systems.</p>",
                "<h4 class='text-base md:text-lg font-bold mt-3 mb-2'>React: Component-Based Architecture for Scalable Applications</h4>",
                "<p class='mb-4 text-sm md:text-base lg:text-lg'>React has transformed modern web development with its virtual DOM and component-based architecture. By breaking interfaces into reusable components, developers can build complex web applications while maintaining clean, organized codebases and optimizing performance.</p>",
                "<h3 class='text-lg md:text-xl font-bold mt-3 md:mt-4 mb-2'>CSS Evolution: From Basic Styling to Design Systems</h3>",
                "<p class='mb-4 text-sm md:text-base lg:text-lg'>Modern CSS approaches like Tailwind CSS, styled-components, and CSS modules have revolutionized frontend styling. These methodologies enable rapid development, consistent design systems, and responsive layouts essential for contemporary web applications.</p>",
                "<h2 class='text-xl md:text-2xl lg:text-3xl font-bold mt-4 md:mt-5 mb-2 md:mb-3'>Backend Development: Powering Modern Web Applications</h2>",
                "<p class='mb-4 text-sm md:text-base lg:text-lg'>The backend architecture of modern web applications has evolved toward API-first approaches, microservices, and serverless functions. These technologies enable scalable, maintainable systems that can handle complex business logic and data processing requirements.</p>",
                "<h3 class='text-lg md:text-xl font-bold mt-3 md:mt-4 mb-2'>Server Technologies and Frameworks</h3>",
                "<p class='mb-4 text-sm md:text-base lg:text-lg'>Modern web development relies on powerful backend frameworks like Django and Express.js that accelerate development through convention-over-configuration principles. RESTful and GraphQL APIs have become standard for connecting frontend and backend systems in a decoupled architecture.</p>",
                "<h2 class='text-xl md:text-2xl lg:text-3xl font-bold mt-4 md:mt-5 mb-2 md:mb-3'>Deployment & DevOps: Delivering Modern Web Applications</h2>",
                "<p class='mb-4 text-sm md:text-base lg:text-lg'>Modern web development workflows incorporate continuous integration/continuous deployment (CI/CD) pipelines that automate testing and deployment processes. Container technologies like Docker have standardized application packaging, while Kubernetes orchestrates complex deployments.</p>",
                "<p class='mb-4 text-sm md:text-base lg:text-lg'>Performance optimization techniques including code splitting, lazy loading, and CDN integration ensure modern web applications deliver exceptional speed and responsiveness to users worldwide.</p>",
                "<h2 class='text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold mt-4 md:mt-6 mb-2 md:mb-4'>Full-Stack Integration: The Future of Modern Web Development</h2>",
                "<p class='mb-4 text-sm md:text-base lg:text-lg'>Successful modern web development requires balancing frontend and backend technologies while prioritizing performance, security, and exceptional user experiences. Full-stack developers who understand the complete web ecosystem are increasingly valuable in today's development landscape.</p>",
                "<p class='mb-4 text-sm md:text-base lg:text-lg'>By mastering these modern web development principles and technologies, you'll be equipped to build sophisticated, scalable web applications that meet the demands of both users and businesses in 2025 and beyond.</p>"
            ],
            "tags": ["Modern Web Development", "Frontend Development", "Backend Technologies", "JavaScript Frameworks", "React", "Web Applications", "DevOps", "Full-Stack Development", "CSS Frameworks", "Web Performance"],
            "is_featured": False
        },
        {
            "id": 14,
            "title": "Top 6 Asian Countries with Better Governance and Religious Harmony",
            "description": "Exploring Asian nations with strong governance, low corruption, and religious tolerance for Indonesians seeking alternatives.",
            "image_url": f"{settings.BLOG_BASE_IMG_URL}/asian_nations_comparison.webp",
            "img_name": "asian_nations_comparison.webp",
            "created_at": datetime.strptime("2025-05-10T12:17:08+07:00", "%Y-%m-%dT%H:%M:%S%z"),
            "updated_at": datetime.strptime("2025-05-10T12:17:08+07:00", "%Y-%m-%dT%H:%M:%S%z"),
            "author": "Ridwan Halim",
            "username": "ridwaanhall",
            "author_image": f"{settings.BASE_URL}/static/img/ridwaanhall.webp",
            "content": [
                "<p class='mb-4 text-sm md:text-base lg:text-lg'>Many Indonesians are exploring options abroad as concerns about governance, corruption, and religious freedom continue to rise. As someone who values both good governance and religious harmony, I've researched Asian countries that might offer better alternatives while remaining culturally accessible for Indonesians.</p>",
                
                "<h2 class='text-xl md:text-2xl lg:text-3xl font-bold mt-4 md:mt-5 mb-2 md:mb-3'>Singapore: Efficiency and Multiculturalism at Your Doorstep</h2>",
                "<p class='mb-4 text-sm md:text-base lg:text-lg'>Just a short flight from Jakarta, Singapore consistently ranks among the world's least corrupt nations (3rd on the 2024 Corruption Perceptions Index). The city-state's efficient governance, rule of law, and zero-tolerance policy toward corruption create a refreshingly transparent environment for residents and businesses alike.</p>",
                "<p class='mb-4 text-sm md:text-base lg:text-lg'>Singapore's approach to religious harmony is particularly noteworthy. The Presidential Council for Religious Harmony actively promotes understanding between different faiths, while Muslims, Buddhists, Christians, Hindus, and followers of other religions coexist peacefully. Indonesian Muslims will find numerous mosques, halal certification systems, and recognition of Islamic holidays—plus a substantial Indonesian expatriate community already established.</p>",
                "<p class='mb-4 text-red-500 font-semibold text-sm md:text-base'>Drawbacks to consider:</p><p class='mb-4 text-sm md:text-base lg:text-lg'>Singapore's extremely high cost of living can be challenging, with housing prices among the world's highest. The compact city-state can feel crowded, and its strict regulatory environment extends to personal freedoms—from chewing gum bans to severe penalties for minor offenses. Work culture tends toward long hours, and the competitive environment creates significant pressure. Permanent residency and citizenship have become increasingly difficult to obtain, with strict quotas in place.</p>",
                
                "<h2 class='text-xl md:text-2xl lg:text-3xl font-bold mt-4 md:mt-5 mb-2 md:mb-3'>Japan: Stability, Safety, and Respectful Coexistence</h2>",
                "<p class='mb-4 text-sm md:text-base lg:text-lg'>Japan offers an enticing combination of political stability, extremely low crime rates, and excellent public services. Ranking 16th on the Corruption Perceptions Index, Japan's governance systems prioritize accountability and transparency. While the language barrier presents challenges, many Indonesian professionals find opportunities in Japan's tech sector and universities.</p>",
                "<p class='mb-4 text-sm md:text-base lg:text-lg'>Though predominantly culturally Shinto and Buddhist, Japan's constitutional religious freedom has created space for all faiths. Major cities like Tokyo and Osaka feature beautiful mosques, and the Japan Muslim Association provides support for Muslim residents. The respectful Japanese approach to religious differences means you'll rarely face discrimination for your faith practices.</p>",
                "<p class='mb-4 text-red-500 font-semibold text-sm md:text-base'>Drawbacks to consider:</p><p class='mb-4 text-sm md:text-base lg:text-lg'>The language barrier in Japan is substantial, as English proficiency remains limited outside major tourist areas and international companies. The notoriously demanding work culture often includes extreme overtime (karoshi), while foreigners may experience social isolation due to the homogeneous society. Japan's aging population creates economic concerns, with high taxes needed to support social services. Finding halal food can be challenging in smaller cities, and housing often comes with high key money (non-refundable deposits) and space limitations.</p>",
                
                "<h2 class='text-xl md:text-2xl lg:text-3xl font-bold mt-4 md:mt-5 mb-2 md:mb-3'>South Korea: Innovation With Growing Religious Diversity</h2>",
                "<p class='mb-4 text-sm md:text-base lg:text-lg'>South Korea's remarkable transformation into an economic powerhouse comes with increasingly robust democratic institutions and anti-corruption efforts (31st on the CPI). The country's world-class infrastructure, healthcare system, and education opportunities attract many Southeast Asian professionals looking for better governance environments.</p>",
                "<p class='mb-4 text-sm md:text-base lg:text-lg'>Religious diversity is expanding in Korea, with Buddhism, Christianity, and various other faiths coexisting. The Seoul Central Mosque serves as a hub for Muslims, and halal food availability has improved significantly in recent years. Korean universities actively recruit Indonesian students, creating pathways for longer-term residence.</p>",
                "<p class='mb-4 text-red-500 font-semibold text-sm md:text-base'>Drawbacks to consider:</p><p class='mb-4 text-sm md:text-base lg:text-lg'>Korea's intensely competitive society creates significant pressure in both education and workplace environments, with some of the longest working hours in the developed world. The language barrier remains substantial, and social integration can be difficult for foreigners. Korea's homogeneous culture sometimes manifests as subtle discrimination against Southeast Asians. Weather extremes—from humid summers to freezing winters—can be challenging for those accustomed to Indonesia's tropical climate. The high population density in Seoul means housing is expensive and often limited in size.</p>",
                
                "<h2 class='text-xl md:text-2xl lg:text-3xl font-bold mt-4 md:mt-5 mb-2 md:mb-3'>Taiwan: Democratic Values and Constitutional Protections</h2>",
                "<p class='mb-4 text-sm md:text-base lg:text-lg'>Taiwan's vibrant democracy and commitment to civil liberties place it 25th on the Corruption Perceptions Index. The country's universal healthcare system, efficient public transportation, and strong educational institutions offer quality of life improvements for many expatriates from Southeast Asia.</p>",
                "<p class='mb-4 text-sm md:text-base lg:text-lg'>Taiwan's constitution explicitly protects religious freedom, and its multicultural approach welcomes diverse faith practices. The Taipei Grand Mosque serves a growing Muslim community, while the government has increased halal certification efforts to accommodate Muslim residents and visitors. Taiwan's technological sector offers numerous opportunities for skilled Indonesian professionals.</p>",
                "<p class='mb-4 text-red-500 font-semibold text-sm md:text-base'>Drawbacks to consider:</p><p class='mb-4 text-sm md:text-base lg:text-lg'>Taiwan's complex political situation with China creates uncertainty about long-term stability, with periodic tensions affecting international relations. The language barrier remains significant outside of technical fields and major cities. Taiwan experiences frequent typhoons and occasional earthquakes, while summer humidity can be overwhelming. Career advancement can hit a ceiling for foreigners who aren't fluent in Mandarin. Limited international recognition affects Taiwan's diplomatic status, potentially creating visa complications when traveling to certain countries after residing in Taiwan.</p>",
                
                "<h2 class='text-xl md:text-2xl lg:text-3xl font-bold mt-4 md:mt-5 mb-2 md:mb-3'>Brunei Darussalam: Islamic Values with Strong Governance</h2>",
                "<p class='mb-4 text-sm md:text-base lg:text-lg'>Brunei offers Indonesians a unique combination of Islamic governance with significantly better administrative efficiency (ranking 30th on the CPI compared to Indonesia's 110th). The small, oil-rich sultanate boasts impressive infrastructure, free education and healthcare, and zero income tax—creating a high standard of living for residents.</p>",
                "<p class='mb-4 text-sm md:text-base lg:text-lg'>As a Muslim-majority nation implementing Sharia principles, Brunei provides Indonesian Muslims with a familiar religious environment where Islamic practices are not just accommodated but integrated into daily life. The country's magnificent mosques, widespread halal food availability, and respect for Islamic holidays create a seamless transition for Muslim Indonesians.</p>",
                "<p class='mb-4 text-sm md:text-base lg:text-lg'>Brunei's relatively small population (under 500,000) means employment opportunities exist primarily in government, education, oil and gas sectors, and increasingly in Islamic finance. The cultural similarities, widespread use of Malay language, and proximity to Indonesia (just a short flight from Kalimantan) make Brunei an accessible option with minimal cultural adjustment required.</p>",
                "<p class='mb-4 text-red-500 font-semibold text-sm md:text-base'>Drawbacks to consider:</p><p class='mb-4 text-sm md:text-base lg:text-lg'>Brunei's small size and population can feel limiting over time, with limited entertainment options and social circles. The economy remains heavily dependent on oil and gas, creating potential long-term sustainability concerns as global energy transitions occur. While the Islamic environment benefits Muslims, non-Muslims face restrictions on alcohol, nightlife, and certain social activities. Career growth opportunities outside government and energy sectors are limited, and the conservative social environment may feel restrictive for those accustomed to more liberal settings.</p>",
                
                "<h2 class='text-xl md:text-2xl lg:text-3xl font-bold mt-4 md:mt-5 mb-2 md:mb-3'>Malaysia: Cultural Familiarity with Better Governance Metrics</h2>",
                "<p class='mb-4 text-sm md:text-base lg:text-lg'>For those seeking minimal cultural adjustment, Malaysia offers significant governance improvements (57th on CPI versus Indonesia's 110th) while maintaining many cultural similarities. The shared Malay heritage, widespread use of Bahasa, and similar culinary traditions make Malaysia an easier transition for many Indonesians.</p>",
                "<p class='mb-4 text-sm md:text-base lg:text-lg'>As a Muslim-majority country with constitutional protections for other faiths, Malaysia offers Indonesian Muslims a comfortable religious environment while still maintaining space for diverse beliefs. Major cities like Kuala Lumpur feature diverse communities where people of various faiths live harmoniously, despite occasional political tensions.</p>",
                "<p class='mb-4 text-red-500 font-semibold text-sm md:text-base'>Drawbacks to consider:</p><p class='mb-4 text-sm md:text-base lg:text-lg'>Malaysia experiences periodic political instability and ethnic tensions that affect policy consistency. The bumiputera affirmative action policies favor ethnic Malays, potentially limiting opportunities for non-Malays in certain sectors. Environmental issues include seasonal haze from forest fires (including those from Indonesia). Religious conservatism has been increasing in some states, affecting social policies. While corruption metrics are better than Indonesia's, patronage politics and cronyism still exist in various forms. Some Malaysians maintain stereotypes about Indonesians primarily as domestic workers, potentially affecting social integration.</p>",
                
                "<h2 class='text-xl md:text-2xl lg:text-3xl font-bold mt-4 md:mt-5 mb-2 md:mb-3'>Making Your Decision</h2>",
                "<p class='mb-4 text-sm md:text-base lg:text-lg'>When considering relocation, assess your priorities: career opportunities, language barriers, cost of living, proximity to Indonesia, and specific religious accommodations. Each country offers unique advantages and challenges. Remember that building a new life abroad requires research, patience, and openness to new experiences.</p>",
                "<p class='mb-4 text-sm md:text-base lg:text-lg'>While these nations offer stronger governance metrics and religious tolerance, no country is perfect. The decision to relocate is deeply personal and depends on your specific circumstances, values, and aspirations. Whatever you choose, maintaining connection to Indonesian culture and contributing positively to your new community will enrich your experience abroad.</p>",
                
                "<h2 class='text-xl md:text-2xl lg:text-3xl font-bold mt-4 md:mt-5 mb-2 md:mb-3'>Additional Considerations for Any Move</h2>",
                "<p class='mb-4 text-sm md:text-base lg:text-lg'>Before finalizing any relocation plans, research visa requirements thoroughly as they change frequently. Consider establishing connections with Indonesian expatriate communities in your target country through social media groups or cultural associations. These networks can provide invaluable guidance on practical matters like housing, banking, and healthcare navigation.</p>",
                "<p class='mb-4 text-sm md:text-base lg:text-lg'>It's also wise to visit your potential new home country as a tourist first, ideally staying for several weeks to experience daily life beyond tourist attractions. Explore residential neighborhoods, grocery shopping, public transportation, and other everyday activities to better understand what long-term living would entail.</p>",
                "<p class='mb-4 text-sm md:text-base lg:text-lg'>Finally, prepare for the emotional aspects of relocation. Homesickness is natural, and building a support system in your new country is essential. Maintain regular connections with family and friends in Indonesia while gradually establishing new relationships abroad. With proper preparation and realistic expectations, your transition can lead to rewarding personal and professional growth.</p>",
            ],
            "tags": ["Asian Countries", "Governance", "Religious Tolerance", "Expatriate Life", "Singapore", "Japan", "South Korea", "Taiwan", "Malaysia", "Brunei", "Pros and Cons"],
            "is_featured": False
        }
    ]