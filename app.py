from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
import os
import json
import uuid
from flask import send_from_directory

app = Flask(__name__, static_folder="frontend", static_url_path="")
CORS(app)


db_url = os.environ.get("postgresql://satyam_a2ar_user:OiqEX4Dod3wo7h0FSBQrAQGMQEYHcF6z@dpg-d5mgs21r0fns73evp28g-a/satyam_a2ar")

if db_url and db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

app.config['SQLALCHEMY_DATABASE_URI'] = db_url

app.config['UPLOAD_FOLDER'] = 'uploads'

db = SQLAlchemy(app)

# ---------------- MODELS ---------------- #

class Admin(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50))
    password = db.Column(db.String(200))

class Product(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200))
    category = db.Column(db.String(100))
    price = db.Column(db.String(50))
    description = db.Column(db.Text)
    image = db.Column(db.String(200))  # Keep for backward compatibility
    images = db.Column(db.Text)  # JSON array of image paths
    status = db.Column(db.String(20), default="active")

class Work(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200))
    description = db.Column(db.Text)
    image = db.Column(db.String(200))  # Keep for backward compatibility
    images = db.Column(db.Text)  # JSON array of image paths
    status = db.Column(db.String(20), default="active")

class Achievement(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200))
    description = db.Column(db.Text)
    image = db.Column(db.String(200))  # Keep for backward compatibility
    images = db.Column(db.Text)  # JSON array of image paths
    status = db.Column(db.String(20), default="active")

# ---------------- SETUP ---------------- #

os.makedirs("uploads/products", exist_ok=True)
os.makedirs("uploads/works", exist_ok=True)
os.makedirs("uploads/achievements", exist_ok=True)

with app.app_context():
    db.create_all()

    # Create default admin if no admin exists
    if not Admin.query.first():
        admin = Admin(username="satyam", password="SANVED2012")
        db.session.add(admin)
        db.session.commit()
        print("Default admin user created: username='satyam'")
    
    # Remove old admin user if it exists (migration)
    old_admin = Admin.query.filter_by(username="admin").first()
    if old_admin:
        db.session.delete(old_admin)
        db.session.commit()
        print("Old admin user removed")

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
        # Backward compatibility: if no images array, use single image
        if not images and p.image:
            images = [p.image]
        result.append({
            "id": p.id,
            "name": p.name,
            "category": p.category,
            "price": p.price,
            "description": p.description,
            "image": p.image,  # Keep for backward compatibility
            "images": images
        })
    return jsonify(result)

# ADMIN ADD PRODUCT
@app.route("/admin/add-product", methods=["POST"])
def add_product():
    data = request.form
    images = request.files.getlist("images")  # Get multiple images
    
    image_paths = []
    for img in images:
        if img.filename:
            unique_filename = f"{uuid.uuid4()}_{img.filename}"
            image_path = f"uploads/products/{unique_filename}"
            img.save(image_path)
            image_paths.append(image_path)
    
    # Store first image for backward compatibility
    first_image = image_paths[0] if image_paths else ""
    
    product = Product(
        name=data["name"],
        category=data["category"],
        price=data["price"],
        description=data["description"],
        image=first_image,
        images=json.dumps(image_paths)
    )

    db.session.add(product)
    db.session.commit()

    return jsonify({"success": True})


#product image

@app.route("/uploads/<path:filename>")
def uploaded_files(filename):
    return send_from_directory("uploads", filename)

#delete product
@app.route("/admin/delete-product/<int:pid>", methods=["DELETE"])
def delete_product(pid):
    product = Product.query.get(pid)
    if not product:
        return jsonify({"success": False}), 404

    product.status = "hidden"   # soft delete
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


#Recent Works

#Show recent Works
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

#Admin LIst Works
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

#Admin ADD work
@app.route("/admin/add-work", methods=["POST"])
def add_work():
    data = request.form
    images = request.files.getlist("images")  # Get multiple images
    
    image_paths = []
    for img in images:
        if img.filename:
            unique_filename = f"{uuid.uuid4()}_{img.filename}"
            image_path = f"uploads/works/{unique_filename}"
            img.save(image_path)
            image_paths.append(image_path)
    
    first_image = image_paths[0] if image_paths else ""

    work = Work(
        title=data["title"],
        description=data["description"],
        image=first_image,
        images=json.dumps(image_paths)
    )

    db.session.add(work)
    db.session.commit()

    return jsonify({"success": True})

#Admin DELETE and Restore Works
@app.route("/admin/delete-work/<int:wid>", methods=["DELETE"])
def delete_work(wid):
    work = Work.query.get(wid)
    work.status = "hidden"
    db.session.commit()
    return jsonify({"success": True})


@app.route("/admin/restore-work/<int:wid>", methods=["PUT"])
def restore_work(wid):
    work = Work.query.get(wid)
    work.status = "active"
    db.session.commit()
    return jsonify({"success": True})


#Admin AChievements
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

#ACHievement List
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

#ADD Achievement
@app.route("/admin/add-achievement", methods=["POST"])
def add_achievement():
    data = request.form
    images = request.files.getlist("images")  # Get multiple images
    
    image_paths = []
    for img in images:
        if img.filename:
            unique_filename = f"{uuid.uuid4()}_{img.filename}"
            image_path = f"uploads/achievements/{unique_filename}"
            img.save(image_path)
            image_paths.append(image_path)
    
    first_image = image_paths[0] if image_paths else ""

    achievement = Achievement(
        title=data["title"],
        description=data["description"],
        image=first_image,
        images=json.dumps(image_paths)
    )

    db.session.add(achievement)
    db.session.commit()

    return jsonify({"success": True})

#DELETE and REstore Achievemenrt
@app.route("/admin/delete-achievement/<int:aid>", methods=["DELETE"])
def delete_achievement(aid):
    ach = Achievement.query.get(aid)
    ach.status = "hidden"
    db.session.commit()
    return jsonify({"success": True})


@app.route("/admin/restore-achievement/<int:aid>", methods=["PUT"])
def restore_achievement(aid):
    ach = Achievement.query.get(aid)
    ach.status = "active"
    db.session.commit()
    return jsonify({"success": True})


# ---------------- RUN ---------------- #

if __name__ == "__main__":
    app.run(debug=True)
