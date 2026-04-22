<?php

declare(strict_types=1);

header('Content-Type: application/json');

// ── Autoloader (Composer) ─────────────────────────────────────────────────────
require_once __DIR__ . '/vendor/autoload.php';

// ── Routes ───────────────────────────────────────────────────────────────────
require_once __DIR__ . '/src/routes.php';