<?php
/**
 * K-Editor Demo — Forum-style document viewer
 * Displays saved documents as rendered posts with pagination
 */

$document = null;
$documents = [];
$error = null;
$perPage = 4;
$page = max(1, intval($_GET['page'] ?? 1));
$totalDocs = 0;
$totalPages = 1;

try {
    $pdo = new PDO('mysql:host=localhost;dbname=keditor;charset=utf8mb4', 'root', 'root');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $id = $_GET['id'] ?? null;

    if ($id) {
        $stmt = $pdo->prepare('SELECT * FROM documents WHERE id = ?');
        $stmt->execute([$id]);
        $document = $stmt->fetch(PDO::FETCH_ASSOC);
    }

    $totalDocs = $pdo->query('SELECT COUNT(*) FROM documents')->fetchColumn();
    $totalPages = max(1, ceil($totalDocs / $perPage));
    if ($page > $totalPages) $page = $totalPages;

    $offset = ($page - 1) * $perPage;
    $stmt = $pdo->prepare('SELECT id, title, content, created_at, updated_at FROM documents ORDER BY updated_at DESC LIMIT ? OFFSET ?');
    $stmt->bindValue(1, $perPage, PDO::PARAM_INT);
    $stmt->bindValue(2, $offset, PDO::PARAM_INT);
    $stmt->execute();
    $documents = $stmt->fetchAll(PDO::FETCH_ASSOC);

} catch (PDOException $e) {
    $error = $e->getMessage();
}
?>
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>K-Editor Demo — Просмотр документов</title>
    <link rel="stylesheet" href="../css/editor.css">
    <link rel="stylesheet" href="../css/icons.css">
    <style>
        .demo-wrapper {
            width: 100%;
            max-width: 900px;
            margin: 0 auto;
            padding: 20px;
        }

        .demo-nav {
            display: flex;
            justify-content: center;
            gap: 10px;
            margin-bottom: 30px;
            flex-wrap: wrap;
        }
        .demo-nav a {
            padding: 8px 18px;
            background: var(--bg-card);
            border: 1px solid var(--border);
            border-radius: var(--radius-sm);
            color: var(--gold);
            text-decoration: none;
            font-size: 0.85rem;
            transition: var(--transition);
        }
        .demo-nav a:hover {
            background: rgba(201, 168, 76, 0.12);
        }
        .demo-nav a.active {
            background: rgba(201, 168, 76, 0.15);
            border-color: var(--gold-dim);
        }

        /* Forum-style post card */
        .post-card {
            background: var(--bg-card);
            border: 1px solid var(--border);
            border-radius: var(--radius);
            margin-bottom: 24px;
            overflow: hidden;
        }
        .post-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 14px 20px;
            background: var(--bg-toolbar);
            border-bottom: 1px solid var(--border);
        }
        .post-title {
            font-size: 1.1rem;
            font-weight: 600;
            color: var(--gold);
        }
        .post-title a {
            color: var(--gold);
            text-decoration: none;
        }
        .post-title a:hover {
            color: var(--gold-hover);
            text-decoration: underline;
        }
        .post-meta {
            font-size: 0.75rem;
            color: var(--text-muted);
        }
        .post-body {
            padding: 24px;
            line-height: 1.7;
            font-size: 0.95rem;
        }
        .post-body h1, .post-body h2, .post-body h3, .post-body h4 {
            color: var(--gold);
            margin: 18px 0 10px;
        }
        .post-body h1 { font-size: 1.6rem; }
        .post-body h2 { font-size: 1.3rem; }
        .post-body h3 { font-size: 1.1rem; }
        .post-body a {
            color: var(--gold);
            text-decoration: underline;
        }
        .post-body img {
            max-width: 100%;
            height: auto;
            border-radius: 6px;
            margin: 12px 0;
            border: 1px solid var(--border);
        }
        .post-body blockquote {
            border-left: 3px solid var(--gold-dim);
            padding: 10px 18px;
            margin: 14px 0;
            background: rgba(201, 168, 76, 0.04);
            border-radius: 0 4px 4px 0;
            font-style: italic;
            color: var(--text-muted);
        }
        .post-body pre {
            background: rgba(0, 0, 0, 0.4);
            padding: 14px;
            border-radius: 4px;
            font-family: 'Consolas', monospace;
            overflow-x: auto;
            margin: 14px 0;
            border: 1px solid var(--border);
        }
        .post-body code {
            background: rgba(90, 138, 64, 0.15);
            padding: 2px 6px;
            border-radius: 3px;
            font-family: 'Consolas', monospace;
            font-size: 0.9em;
            color: var(--accent);
        }
        .post-body table {
            width: 100%;
            border-collapse: collapse;
            margin: 14px 0;
        }
        .post-body table td, .post-body table th {
            border: 1px solid var(--border);
            padding: 8px 12px;
        }
        .post-body table th {
            background: rgba(201, 168, 76, 0.08);
            color: var(--gold);
            font-weight: 600;
        }
        .post-body ul, .post-body ol {
            margin: 10px 0;
            padding-left: 26px;
        }
        .post-body li {
            margin-bottom: 5px;
        }
        .post-body hr {
            border: none;
            height: 1px;
            background: linear-gradient(90deg, transparent, var(--gold-dim), transparent);
            margin: 20px 0;
        }

        .post-footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 20px;
            border-top: 1px solid var(--border);
            background: var(--bg-toolbar);
            font-size: 0.75rem;
            color: var(--text-muted);
        }
        .post-footer a {
            color: var(--gold-dim);
            text-decoration: none;
            font-size: 0.8rem;
        }
        .post-footer a:hover {
            color: var(--gold);
        }

        /* Single document view */
        .post-body-full {
            padding: 30px;
            line-height: 1.7;
        }

        /* Empty state */
        .empty-state {
            text-align: center;
            padding: 80px 20px;
            color: var(--text-muted);
        }
        .empty-state .empty-icon {
            font-size: 3rem;
            margin-bottom: 16px;
            color: var(--gold-dim);
        }
        .empty-state p {
            margin-bottom: 20px;
        }
        .empty-state .btn-go {
            display: inline-block;
            padding: 10px 24px;
            background: rgba(201, 168, 76, 0.1);
            border: 1px solid var(--border);
            border-radius: var(--radius-sm);
            color: var(--gold);
            text-decoration: none;
            font-size: 0.9rem;
            transition: var(--transition);
        }
        .empty-state .btn-go:hover {
            background: rgba(201, 168, 76, 0.2);
        }

        /* Back link */
        .back-link {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            color: var(--gold-dim);
            text-decoration: none;
            font-size: 0.85rem;
            margin-bottom: 20px;
            transition: var(--transition);
        }
        .back-link:hover {
            color: var(--gold);
        }

        @media (max-width: 768px) {
            .demo-wrapper { padding: 12px; }
            .post-header { flex-direction: column; align-items: flex-start; gap: 6px; }
            .post-body { padding: 16px; }
        }

        /* Pagination */
        .pagination {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 6px;
            margin: 30px 0 10px;
            flex-wrap: wrap;
        }
        .pagination a, .pagination span {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-width: 36px;
            height: 36px;
            padding: 0 10px;
            border: 1px solid var(--border);
            border-radius: 6px;
            font-size: 0.85rem;
            text-decoration: none;
            transition: var(--transition);
        }
        .pagination a {
            background: var(--bg-card);
            color: var(--gold-dim);
        }
        .pagination a:hover {
            background: rgba(201, 168, 76, 0.12);
            color: var(--gold);
            border-color: var(--gold-dim);
        }
        .pagination .pg-current {
            background: rgba(201, 168, 76, 0.15);
            color: var(--gold);
            border-color: var(--gold-dim);
            font-weight: 600;
        }
        .pagination .pg-dots {
            border: none;
            color: var(--text-muted);
            min-width: 20px;
        }
        .pagination .pg-prev, .pagination .pg-next {
            font-weight: 600;
            letter-spacing: 0.5px;
        }
        .pagination .pg-disabled {
            opacity: 0.3;
            pointer-events: none;
        }
        .page-info {
            text-align: center;
            color: var(--text-muted);
            font-size: 0.8rem;
            margin-top: 10px;
        }
    </style>
</head>
<body>

    <!-- Top Banner -->
    <div class="top-banner">
        <div class="banner-content">
            <div class="banner-logo">
                <span class="logo-symbol">{<span class="logo-letter">K</span>}</span>
                <div class="logo-text">
                    <span class="logo-title">K - Editor</span>
                    <span class="logo-subtitle">Koshey Developer</span>
                </div>
            </div>
        </div>
    </div>

    <!-- Content -->
    <div class="demo-wrapper">

        <?php if ($document): ?>
            <!-- Single document view -->
            <a href="?" class="back-link">&larr; Все записи</a>

            <div class="post-card">
                <div class="post-header">
                    <span class="post-title"><?= htmlspecialchars($document['title']) ?></span>
                    <span class="post-meta">
                        Создано: <?= date('d.m.Y в H:i', strtotime($document['created_at'])) ?>
                        <?php if ($document['updated_at'] !== $document['created_at']): ?>
                            &nbsp;|&nbsp; Обновлено: <?= date('d.m.Y в H:i', strtotime($document['updated_at'])) ?>
                        <?php endif; ?>
                    </span>
                </div>
                <div class="post-body post-body-full">
                    <?= $document['content'] ?>
                </div>
            </div>

        <?php elseif (empty($documents)): ?>
            <!-- No documents -->
            <div class="empty-state">
                <div class="empty-icon">&#128196;</div>
                <p>Нет сохранённых записей</p>
                <a href="../index.html" class="btn-go">Открыть редактор</a>
            </div>

        <?php else: ?>
            <!-- All documents — forum list -->
            <div class="demo-nav">
                <a href="?" class="active">Все записи</a>
                <a href="../index.html">Редактор</a>
            </div>

            <?php foreach ($documents as $doc): ?>
                <div class="post-card">
                    <div class="post-header">
                        <span class="post-title">
                            <a href="?id=<?= $doc['id'] ?>"><?= htmlspecialchars($doc['title']) ?></a>
                        </span>
                        <span class="post-meta"><?= date('d.m.Y в H:i', strtotime($doc['updated_at'])) ?></span>
                    </div>
                    <div class="post-body">
                        <?= mb_strimwidth(strip_tags($doc['content']), 0, 300, '...') ?>
                    </div>
                    <div class="post-footer">
                        <span>ID: <?= $doc['id'] ?></span>
                        <a href="?id=<?= $doc['id'] ?>">Читать полностью &rarr;</a>
                    </div>
                </div>
            <?php endforeach; ?>

            <?php if ($totalPages > 1): ?>
                <div class="pagination">
                    <?php
                    $qp = '?';
                    $prevClass = $page <= 1 ? ' pg-disabled' : '';
                    $nextClass = $page >= $totalPages ? ' pg-disabled' : '';
                    ?>
                    <a href="<?= $qp ?>page=<?= $page - 1 ?>" class="pg-prev<?= $prevClass ?>">&laquo;</a>

                    <?php
                    $range = [];
                    for ($i = 1; $i <= $totalPages; $i++) {
                        if ($i === 1 || $i === $totalPages || abs($i - $page) <= 1) {
                            $range[] = $i;
                        }
                    }
                    $prev = 0;
                    foreach ($range as $p):
                        if ($prev && $p - $prev > 1): ?>
                            <span class="pg-dots">&hellip;</span>
                        <?php endif;
                        if ($p === $page): ?>
                            <span class="pg-current"><?= $p ?></span>
                        <?php else: ?>
                            <a href="<?= $qp ?>page=<?= $p ?>"><?= $p ?></a>
                        <?php endif;
                        $prev = $p;
                    endforeach; ?>

                    <a href="<?= $qp ?>page=<?= $page + 1 ?>" class="pg-next<?= $nextClass ?>">&raquo;</a>
                </div>
                <div class="page-info">Страница <?= $page ?> из <?= $totalPages ?> · Всего записей: <?= $totalDocs ?></div>
            <?php endif; ?>

        <?php endif; ?>

    </div>

    <!-- Footer -->
    <footer class="editor-footer">
        <div class="footer-content">
            <a href="https://kosheydemo.info" target="_blank" rel="noopener" class="footer-link">Koshey-Developer</a>
            <span class="footer-copy">&copy; 2011-2026. Все права защищены.</span>
        </div>
    </footer>

    <script src="../js/widget-renderer.js"></script>
</body>
</html>
