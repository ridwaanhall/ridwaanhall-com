from datetime import datetime
from django.conf import settings
from apps.data.about.skills_data import SkillsData

# Project data for: el-perintis
project_data = {
    "id": 49,
    "title": """el-perintis""",
    "headline": """Eksplorasi naratif dan analogi kode tentang perintis dan pewaris dalam konteks perjuangan dan warisan budaya.""",
    "description": [
        "Repositori Python yang memadukan simulasi OOP dan non-OOP untuk menggambarkan filosofi membangun dari nol (perintis) versus melanjutkan warisan (pewaris).",
        "Dilengkapi dengan fungsi perjuangan dan narasi dinamis yang menghidupkan sudut pandang perjuangan personal dan sosial.",
        "Inspirasi diambil dari fenomena viral seperti kisah Ryu Kintaro, memberi nuansa aktual dalam perdebatan privilege vs legacy.",
        "API sederhana memungkinkan pengguna menghasilkan narasi perjuangan sesuai konteks mereka sendiri.",
        "Setiap baris kode mengundang refleksi: memilih menulis ulang takdir, atau menjaga api yang sudah dinyalakan."
    ],
    "images": {
        "el_perintis.webp": f"{settings.PROJECT_BASE_IMG_URL}/el_perintis.webp"
    },
    "is_featured": True,
    "features": [
        {"title": "Simulasi Filosofis", "description": "OOP mewakili membangun fondasi, non-OOP melambangkan penerus sistem."},
        {"title": "Narasi Dinamis", "description": "Fungsi Python menghidupkan cerita perjuangan dalam format yang bisa dikembangkan."},
        {"title": "API Reflektif", "description": "Endpoint sederhana untuk generate narasi perjuangan secara konteksual."}
    ],
    "tech_stack": [
        SkillsData.tech_stack["python"],
        SkillsData.tech_stack["fastapi"],
        SkillsData.tech_stack["pytest"]
    ],
    "github_url": "https://github.com/ridwaanhall/el-perintis",
    "demo_url": "",
    "status": "in-progress",
    "created_at": datetime.strptime("2025-07-31T21:19:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
    "updated_at": datetime.strptime("2025-07-31T21:19:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
    "category": "education",
    "tags": ["narasi", "filosofi", "perintis", "pewaris", "python", "oop", "api", "ryu-kintaro", "privilege", "simulasi"],
}
