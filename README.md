# K-Editor

WYSIWYG HTML editor with interactive widget system, voice recording, and file upload.

**Demo:** [https://demo.kosheydemo.info/keditor](https://demo.kosheydemo.info/keditor)

## Features

### Text Editing
- Bold, Italic, Underline, Strikethrough
- Headings (H1-H4), Quote, Code
- Font sizes (8 options)
- Text and background colors (preset palette)
- 4 text alignments (left, center, right, justify)
- Lists (ordered, unordered, indent/outdent)
- Links with Ctrl+K shortcut
- Images (URL + upload with align/alt)
- Video embed (YouTube, Vimeo)
- Tables with editable cells
- Horizontal rule

### Widgets (13 types)
- **Carousel** — image slideshow with autoplay, dots, arrows
- **YouTube** — embedded player with autoplay/mute/loop
- **Vimeo** — embedded player
- **Gallery** — grid layout with columns and lightbox
- **Audio** — HTML5 player with loop option
- **Voice** — MediaRecorder API, record and playback directly in editor
- **Quote** — 3 display styles with author attribution
- **Countdown Timer** — live ticking, 3 styles
- **OpenStreetMap** — embedded map with coordinates, zoom, marker
- **Code Block** — syntax highlighting, line numbers, copy button
- **Poll** — multi-choice voting with animated results
- **Spacer** — configurable height with optional divider line
- **Custom HTML** — raw HTML injection

### Productivity
- File upload (drag & drop, max 5MB: JPG/PNG/GIF/PDF/DOC/TXT)
- 64 emoji smileys
- Fullscreen mode (F11)
- 3 tabs: Editor / Preview / HTML source
- Keyboard shortcuts
- Word and character count
- localStorage auto-save
- Server save via REST API
- Toast notifications

## Tech Stack

- **Frontend:** Vanilla HTML/CSS/JS (contentEditable-based editor)
- **Backend:** PHP 8+ with MySQL (PDO)
- **Theme:** Dark olive + gold

## Installation

1. Clone the repository into your web server directory
2. Create MySQL database `keditor` and import the schema:

```sql
CREATE TABLE documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255),
    content LONGTEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

3. Configure database connection in `api/save.php` and `demo/index.php`:

```php
$pdo = new PDO('mysql:host=localhost;dbname=keditor', 'root', 'your_password');
```

4. Open `index.html` in browser via local server (Apache/nginx with PHP)

## Project Structure

```
keditor/
├── index.html          — Editor page
├── docs.html           — Documentation
├── api/
│   └── save.php        — REST API (save/load/delete documents)
├── demo/
│   └── index.php       — Document viewer with widget rendering
├── css/
│   ├── editor.css      — Editor styles (dark olive+gold theme)
│   └── icons.css       — Toolbar icon styles
└── js/
    ├── editor.js       — Core editor logic (13 widgets, voice, file upload)
    └── widget-renderer.js — Standalone widget renderer for demo pages
```

## Author

**Koshey-Developer** — [kosheydemo.info](https://kosheydemo.info)