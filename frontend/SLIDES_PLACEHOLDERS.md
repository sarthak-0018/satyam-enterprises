Placement and image guidance for the editorial slideshow

Files to add (place inside `frontend/assets/`):

- `hero-cctv.jpg` — 2000x1200px (landscape). Alt: "Stylized CCTV camera illustration".
- `hero-works.jpg` — 2000x1200px. Alt: "Grid of recent installation thumbnails".
- `hero-achievements.jpg` — 2000x1200px. Alt: "Certificates and awards styled graphic".
- `hero-contact.jpg` — 2000x1200px. Alt: "Person consulting with technician illustration".

Guidelines:
- Use high-contrast, editorial-style photos/illustrations — avoid generic stock look. Prefer images with strong shapes and negative space to allow overlaying type.
- Use exported JPEGs with quality 70–80 for performance. Provide a WebP variant if available.
- Filenames above are referenced by the slideshow; keep exact names or update `dashboard.html` accordingly.
- If you need temporary placeholders, you can use solid-color images sized as above. The CSS applies grain and blend modes for a crafted look.

Optional advanced:
- Provide `hero-*.webp` versions next to each JPG and update `<img>` `srcset` in `dashboard.html` to serve WebP where supported.

Accessibility:
- Keep alt text concise and descriptive as suggested above.
