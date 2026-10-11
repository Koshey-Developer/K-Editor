<?php
/**
 * K-Editor API — Save/Load HTML content
 * Stores in MySQL database (keditor)
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

try {
    $pdo = new PDO('mysql:host=localhost;dbname=keditor;charset=utf8mb4', 'root', 'root');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->exec("CREATE TABLE IF NOT EXISTS documents (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) DEFAULT 'Без названия',
        content LONGTEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'error' => 'Database error: ' . $e->getMessage()]);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

// ===== POST — Save document =====
if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    if (empty($input['content'])) {
        echo json_encode(['success' => false, 'error' => 'Content is empty']);
        exit;
    }

    $content = $input['content'];
    $title = $input['title'] ?? 'Без названия';
    $id = $input['id'] ?? null;

    if ($id) {
        $stmt = $pdo->prepare('UPDATE documents SET content = ?, title = ?, updated_at = NOW() WHERE id = ?');
        $stmt->execute([$content, $title, $id]);
        echo json_encode(['success' => true, 'id' => $id, 'message' => 'Документ обновлён']);
    } else {
        $stmt = $pdo->prepare('INSERT INTO documents (title, content) VALUES (?, ?)');
        $stmt->execute([$title, $content]);
        echo json_encode(['success' => true, 'id' => $pdo->lastInsertId(), 'message' => 'Документ сохранён']);
    }
    exit;
}

// ===== GET — Load document(s) =====
if ($method === 'GET') {
    $id = $_GET['id'] ?? null;

    if ($id) {
        $stmt = $pdo->prepare('SELECT * FROM documents WHERE id = ?');
        $stmt->execute([$id]);
        $doc = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($doc) {
            echo json_encode(['success' => true, 'document' => $doc]);
        } else {
            echo json_encode(['success' => false, 'error' => 'Document not found']);
        }
    } else {
        $stmt = $pdo->query('SELECT id, title, created_at, updated_at FROM documents ORDER BY updated_at DESC LIMIT 50');
        $docs = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(['success' => true, 'documents' => $docs]);
    }
    exit;
}

// ===== DELETE =====
if ($method === 'DELETE') {
    $input = json_decode(file_get_contents('php://input'), true);
    $id = $input['id'] ?? null;

    if ($id) {
        $stmt = $pdo->prepare('DELETE FROM documents WHERE id = ?');
        $stmt->execute([$id]);
        echo json_encode(['success' => true, 'message' => 'Документ удалён']);
    } else {
        echo json_encode(['success' => false, 'error' => 'ID required']);
    }
    exit;
}

echo json_encode(['success' => false, 'error' => 'Method not allowed']);
?>
