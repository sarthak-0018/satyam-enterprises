from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
import os
import json
import uuid

app = Flask(__name__, static_folder="frontend", static_url_path="")
CORS(app)

# ---------------- CONFIGURATION ---------------- #

db_url = os.environ.get("DATABASE_URL")

# Debug (temporary – remove later)
print("DATABASE_URL:", db_url)

if not db_url:
    raise RuntimeError("DATABASE_URL not set on Render!")

if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

app.config['SQLALCHEMY_DATABASE_URI'] = db_url
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)


# --- SUPABASE CONFIGURATION ---------------- #

from flask import send_from_directory
from supabase import create_client, Client 

# Initialize Supabase client
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("WARNING: SUPABASE_URL or SUPABASE_KEY not set!")
    supabase = None
else:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    print("Supabase client initialized successfully")

def upload_to_supabase(file, folder):
    """Upload file to Supabase Storage and return public URL"""
    if not supabase:
        raise Exception("Supabase not configured")
    
    file_ext = file.filename.split('.')[-1]
    filename = f"{folder}/{uuid.uuid4()}.{file_ext}"
    
    # Reset file pointer to beginning
    file.seek(0)
    file_bytes = file.read()
    
    # Upload to Supabase Storage
    response = supabase.storage.from_("images").upload(
        filename,
        file_bytes,
        {"content-type": file.content_type}
    )
    
    # Get public URL
    public_url = supabase.storage.from_("images").get_public_url(filename)
    
    return public_url


# ---------------- MODELS ---------------- #

class Admin(db.Model):
    __tablename__ = 'admin'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50))
    password = db.Column(db.String(200))

class Product(db.Model):
    __tablename__ = 'product'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200))
    category = db.Column(db.String(100))
    price = db.Column(db.String(50))
    description = db.Column(db.Text)
    image = db.Column(db.String(500))
    images = db.Column(db.Text)
    status = db.Column(db.String(20), default="active")

class Work(db.Model):
    __tablename__ = 'work'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200))
    description = db.Column(db.Text)
    image = db.Column(db.String(500))
    images = db.Column(db.Text)
    status = db.Column(db.String(20), default="active")

class Achievement(db.Model):
    __tablename__ = 'achievement'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200))
    description = db.Column(db.Text)
    image = db.Column(db.String(500))
    images = db.Column(db.Text)
    status = db.Column(db.String(20), default="active")

# ---------------- SETUP ---------------- #

# Keep local uploads folder for backward compatibility (optional)
os.makedirs("uploads/products", exist_ok=True)
os.makedirs("uploads/works", exist_ok=True)
os.makedirs("uploads/achievements", exist_ok=True)

# IMPORTANT: Don't use db.create_all() with Supabase!
# Tables should already exist in Supabase database
# If you need to create tables, do it via Supabase SQL Editor

print("Flask app initialized successfully")

# ---------------- ROUTES ---------------- #

# PUBLIC WEBSITE
@app.route("/")
def public_home():
    return app.send_static_file("dashboard.html")

# ADMIN LOGIN PAGE
@app.route("/admin")
def admin_page():
    return app.send_static_file("admin.html")

# ADMIN LOGIN API
@app.route("/admin/login", methods=["POST"])
def admin_login():
    data = request.json
    admin = Admin.query.filter_by(
        username=data["username"],
        password=data["password"]
    ).first()

    if admin:
        return jsonify({"success": True})
    else:
        return jsonify({"success": False}), 401

# PUBLIC PRODUCTS API
@app.route("/products", methods=["GET"])
def get_products():
    products = Product.query.filter_by(status="active").all()
    result = []
    for p in products:
        images = []
        if p.images:
            try:
                images = json.loads(p.images)
            except:
                images = []
        if not images and p.image:
            images = [p.image]
        result.append({
            "id": p.id,
            "name": p.name,
            "category": p.category,
            "price": p.price,
            "description": p.description,
            "image": p.image,
            "images": images
        })
    return jsonify(result)

# ADMIN ADD PRODUCT - USES SUPABASE STORAGE
@app.route("/admin/add-product", methods=["POST"])
def add_product():
    try:
        data = request.form
        images = request.files.getlist("images")
        
        image_urls = []
        for img in images:
            if img.filename:
                public_url = upload_to_supabase(img, "products")
                image_urls.append(public_url)
        
        first_image = image_urls[0] if image_urls else ""
        
        product = Product(
            name=data["name"],
            category=data["category"],
            price=data["price"],
            description=data["description"],
            image=first_image,
            images=json.dumps(image_urls)
        )

        db.session.add(product)
        db.session.commit()

        return jsonify({"success": True, "image_urls": image_urls})
    except Exception as e:
        print(f"Error adding product: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

# Product image endpoint - for old local images
@app.route("/uploads/<path:filename>")
def uploaded_files(filename):
    return send_from_directory("uploads", filename)

# Delete product
@app.route("/admin/delete-product/<int:pid>", methods=["DELETE"])
def delete_product(pid):
    product = Product.query.get(pid)
    if not product:
        return jsonify({"success": False}), 404

    product.status = "hidden"
    db.session.commit()
    return jsonify({"success": True})

@app.route("/admin/restore-product/<int:pid>", methods=["PUT"])
def restore_product(pid):
    product = Product.query.get(pid)
    if not product:
        return jsonify({"success": False}), 404

    product.status = "active"
    db.session.commit()
    return jsonify({"success": True})

@app.route("/admin/products", methods=["GET"])
def admin_products():
    products = Product.query.all()
    result = []
    for p in products:
        images = []
        if p.images:
            try:
                images = json.loads(p.images)
            except:
                images = []
        if not images and p.image:
            images = [p.image]
        result.append({
            "id": p.id,
            "name": p.name,
            "price": p.price,
            "image": p.image,
            "images": images,
            "status": p.status
        })
    return jsonify(result)

# Recent Works
@app.route("/works", methods=["GET"])
def get_works():
    works = Work.query.filter_by(status="active").all()
    result = []
    for w in works:
        images = []
        if w.images:
            try:
                images = json.loads(w.images)
            except:
                images = []
        if not images and w.image:
            images = [w.image]
        result.append({
            "id": w.id,
            "title": w.title,
            "description": w.description,
            "image": w.image,
            "images": images
        })
    return jsonify(result)

@app.route("/admin/works", methods=["GET"])
def admin_works():
    works = Work.query.all()
    result = []
    for w in works:
        images = []
        if w.images:
            try:
                images = json.loads(w.images)
            except:
                images = []
        if not images and w.image:
            images = [w.image]
        result.append({
            "id": w.id,
            "title": w.title,
            "description": w.description,
            "image": w.image,
            "images": images,
            "status": w.status
        })
    return jsonify(result)

@app.route("/admin/add-work", methods=["POST"])
def add_work():
    try:
        data = request.form
        images = request.files.getlist("images")
        
        image_urls = []
        for img in images:
            if img.filename:
                public_url = upload_to_supabase(img, "works")
                image_urls.append(public_url)
        
        first_image = image_urls[0] if image_urls else ""

        work = Work(
            title=data["title"],
            description=data["description"],
            image=first_image,
            images=json.dumps(image_urls)
        )

        db.session.add(work)
        db.session.commit()

        return jsonify({"success": True, "image_urls": image_urls})
    except Exception as e:
        print(f"Error adding work: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

@app.route("/admin/delete-work/<int:wid>", methods=["DELETE"])
def delete_work(wid):
    work = Work.query.get(wid)
    if not work:
        return jsonify({"success": False}), 404
    work.status = "hidden"
    db.session.commit()
    return jsonify({"success": True})

@app.route("/admin/restore-work/<int:wid>", methods=["PUT"])
def restore_work(wid):
    work = Work.query.get(wid)
    if not work:
        return jsonify({"success": False}), 404
    work.status = "active"
    db.session.commit()
    return jsonify({"success": True})

# Admin Achievements
@app.route("/achievements", methods=["GET"])
def get_achievements():
    achievements = Achievement.query.filter_by(status="active").all()
    result = []
    for a in achievements:
        images = []
        if a.images:
            try:
                images = json.loads(a.images)
            except:
                images = []
        if not images and a.image:
            images = [a.image]
        result.append({
            "id": a.id,
            "title": a.title,
            "description": a.description,
            "image": a.image,
            "images": images
        })
    return jsonify(result)

@app.route("/admin/achievements", methods=["GET"])
def admin_achievements():
    achievements = Achievement.query.all()
    result = []
    for a in achievements:
        images = []
        if a.images:
            try:
                images = json.loads(a.images)
            except:
                images = []
        if not images and a.image:
            images = [a.image]
        result.append({
            "id": a.id,
            "title": a.title,
            "description": a.description,
            "image": a.image,
            "images": images,
            "status": a.status
        })
    return jsonify(result)

@app.route("/admin/add-achievement", methods=["POST"])
def add_achievement():
    try:
        data = request.form
        images = request.files.getlist("images")
        
        image_urls = []
        for img in images:
            if img.filename:
                public_url = upload_to_supabase(img, "achievements")
                image_urls.append(public_url)
        
        first_image = image_urls[0] if image_urls else ""

        achievement = Achievement(
            title=data["title"],
            description=data["description"],
            image=first_image,
            images=json.dumps(image_urls)
        )

        db.session.add(achievement)
        db.session.commit()

        return jsonify({"success": True, "image_urls": image_urls})
    except Exception as e:
        print(f"Error adding achievement: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

@app.route("/admin/delete-achievement/<int:aid>", methods=["DELETE"])
def delete_achievement(aid):
    ach = Achievement.query.get(aid)
    if not ach:
        return jsonify({"success": False}), 404
    ach.status = "hidden"
    db.session.commit()
    return jsonify({"success": True})

@app.route("/admin/restore-achievement/<int:aid>", methods=["PUT"])
def restore_achievement(aid):
    ach = Achievement.query.get(aid)
    if not ach:
        return jsonify({"success": False}), 404
    ach.status = "active"
    db.session.commit()
    return jsonify({"success": True})

@app.route("/debug/products")
def debug_products():
    products = Product.query.all()
    return jsonify({
        "count": len(products),
        "products": [{
            "id": p.id,
            "name": p.name,
            "image": p.image,
            "images": p.images
        } for p in products]
    })

# Health check endpoint
@app.route("/health")
def health():
    return jsonify({"status": "healthy", "message": "Flask app is running"})

# ---------------- RUN ---------------- #

if __name__ == "__main__":
    app.run(debug=True)