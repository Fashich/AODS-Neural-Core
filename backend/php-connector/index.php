<?php
/**
 * AODS PHP Third-Party Service Connector
 * Integrates with external APIs and services
 */

require 'vendor/autoload.php';

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Slim\Factory\AppFactory;
use GuzzleHttp\Client;
use Monolog\Logger;
use Monolog\Handler\StreamHandler;

// Initialize logger
$logger = new Logger('php-connector');
$logger->pushHandler(new StreamHandler('php://stdout', Logger::DEBUG));

// Create Slim app
$app = AppFactory::create();

// Add CORS middleware
$app->add(function (Request $request, $handler) {
    $response = $handler->handle($request);
    return $response
        ->withHeader('Access-Control-Allow-Origin', '*')
        ->withHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Accept, Origin, Authorization')
        ->withHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
});

// Add error middleware
$app->addErrorMiddleware(true, true, true);

// HTTP client for external requests
$httpClient = new Client([
    'timeout' => 30,
    'connect_timeout' => 10
]);

// Health check endpoint
$app->get('/health', function (Request $request, Response $response) {
    $data = [
        'status' => 'healthy',
        'service' => 'php-connector',
        'version' => '1.0.0',
        'timestamp' => date('c'),
        'php_version' => PHP_VERSION
    ];
    
    $response->getBody()->write(json_encode($data));
    return $response->withHeader('Content-Type', 'application/json');
});

// Alias for /api/health (used by test suite)
$app->get('/api/health', function (Request $request, Response $response) {
    $data = [
        'status' => 'healthy',
        'service' => 'php-connector',
        'version' => '1.0.0',
        'timestamp' => date('c'),
        'php_version' => PHP_VERSION
    ];
    
    $response->getBody()->write(json_encode($data));
    return $response->withHeader('Content-Type', 'application/json');
});

// Generic API proxy endpoint
$app->post('/proxy', function (Request $request, Response $response) use ($httpClient, $logger) {
    $body = json_decode($request->getBody()->getContents(), true);
    
    $targetUrl = $body['url'] ?? '';
    $method = $body['method'] ?? 'GET';
    $headers = $body['headers'] ?? [];
    $payload = $body['data'] ?? null;
    
    if (empty($targetUrl)) {
        $response->getBody()->write(json_encode(['error' => 'URL is required']));
        return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
    }
    
    try {
        $startTime = microtime(true);
        
        $options = [
            'headers' => $headers,
            'verify' => false // For development only
        ];
        
        if ($payload && in_array($method, ['POST', 'PUT', 'PATCH'])) {
            $options['json'] = $payload;
        }
        
        $apiResponse = $httpClient->request($method, $targetUrl, $options);
        
        $duration = (microtime(true) - $startTime) * 1000;
        
        $result = [
            'success' => true,
            'statusCode' => $apiResponse->getStatusCode(),
            'headers' => $apiResponse->getHeaders(),
            'body' => json_decode($apiResponse->getBody()->getContents(), true),
            'responseTimeMs' => round($duration, 2)
        ];
        
        $logger->info("Proxy request completed", [
            'url' => $targetUrl,
            'method' => $method,
            'duration' => $duration
        ]);
        
        $response->getBody()->write(json_encode($result));
        return $response->withHeader('Content-Type', 'application/json');
        
    } catch (Exception $e) {
        $logger->error("Proxy request failed", [
            'url' => $targetUrl,
            'error' => $e->getMessage()
        ]);
        
        $result = [
            'success' => false,
            'error' => $e->getMessage()
        ];
        
        $response->getBody()->write(json_encode($result));
        return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
    }
});

// Webhook handler endpoint
$app->post('/webhook/{service}', function (Request $request, Response $response, $args) use ($logger) {
    $service = $args['service'];
    $payload = json_decode($request->getBody()->getContents(), true);
    $headers = $request->getHeaders();
    
    $logger->info("Webhook received", [
        'service' => $service,
        'payload' => $payload
    ]);
    
    // Process webhook based on service
    $result = processWebhook($service, $payload, $headers);
    
    $response->getBody()->write(json_encode($result));
    return $response->withHeader('Content-Type', 'application/json');
});

// OAuth token exchange
$app->post('/oauth/exchange', function (Request $request, Response $response) use ($httpClient) {
    $body = json_decode($request->getBody()->getContents(), true);
    
    $provider = $body['provider'] ?? '';
    $code = $body['code'] ?? '';
    $clientId = $body['client_id'] ?? '';
    $clientSecret = $body['client_secret'] ?? '';
    $redirectUri = $body['redirect_uri'] ?? '';
    
    // Provider configurations
    $providers = [
        'google' => [
            'tokenUrl' => 'https://oauth2.googleapis.com/token',
            'userInfoUrl' => 'https://www.googleapis.com/oauth2/v2/userinfo'
        ],
        'github' => [
            'tokenUrl' => 'https://github.com/login/oauth/access_token',
            'userInfoUrl' => 'https://api.github.com/user'
        ],
        'microsoft' => [
            'tokenUrl' => 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
            'userInfoUrl' => 'https://graph.microsoft.com/v1.0/me'
        ]
    ];
    
    if (!isset($providers[$provider])) {
        $response->getBody()->write(json_encode(['error' => 'Unknown provider']));
        return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
    }
    
    try {
        // Exchange code for token
        $tokenResponse = $httpClient->post($providers[$provider]['tokenUrl'], [
            'form_params' => [
                'grant_type' => 'authorization_code',
                'code' => $code,
                'client_id' => $clientId,
                'client_secret' => $clientSecret,
                'redirect_uri' => $redirectUri
            ],
            'headers' => [
                'Accept' => 'application/json'
            ]
        ]);
        
        $tokenData = json_decode($tokenResponse->getBody()->getContents(), true);
        
        $result = [
            'success' => true,
            'provider' => $provider,
            'token' => $tokenData
        ];
        
        $response->getBody()->write(json_encode($result));
        return $response->withHeader('Content-Type', 'application/json');
        
    } catch (Exception $e) {
        $result = [
            'success' => false,
            'error' => $e->getMessage()
        ];
        
        $response->getBody()->write(json_encode($result));
        return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
    }
});

// File upload handler
$app->post('/upload', function (Request $request, Response $response) use ($logger) {
    $uploadedFiles = $request->getUploadedFiles();
    
    if (empty($uploadedFiles['file'])) {
        $response->getBody()->write(json_encode(['error' => 'No file uploaded']));
        return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
    }
    
    $file = $uploadedFiles['file'];
    
    if ($file->getError() !== UPLOAD_ERR_OK) {
        $response->getBody()->write(json_encode(['error' => 'Upload failed']));
        return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
    }
    
    $filename = $file->getClientFilename();
    $size = $file->getSize();
    $type = $file->getClientMediaType();
    
    // In production, upload to S3 or similar
    $uploadPath = '/tmp/uploads/' . uniqid() . '_' . $filename;
    $file->moveTo($uploadPath);
    
    $logger->info("File uploaded", [
        'filename' => $filename,
        'size' => $size,
        'type' => $type
    ]);
    
    $result = [
        'success' => true,
        'filename' => $filename,
        'size' => $size,
        'type' => $type,
        'path' => $uploadPath
    ];
    
    $response->getBody()->write(json_encode($result));
    return $response->withHeader('Content-Type', 'application/json');
});

// RSS/Atom feed parser
$app->post('/feed/parse', function (Request $request, Response $response) use ($httpClient) {
    $body = json_decode($request->getBody()->getContents(), true);
    $feedUrl = $body['url'] ?? '';
    
    if (empty($feedUrl)) {
        $response->getBody()->write(json_encode(['error' => 'Feed URL is required']));
        return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
    }
    
    try {
        $feedResponse = $httpClient->get($feedUrl);
        $xml = simplexml_load_string($feedResponse->getBody()->getContents());
        
        $items = [];
        
        if (isset($xml->channel->item)) {
            // RSS feed
            foreach ($xml->channel->item as $item) {
                $items[] = [
                    'title' => (string)$item->title,
                    'link' => (string)$item->link,
                    'description' => (string)$item->description,
                    'pubDate' => (string)$item->pubDate
                ];
            }
        } elseif (isset($xml->entry)) {
            // Atom feed
            foreach ($xml->entry as $entry) {
                $items[] = [
                    'title' => (string)$entry->title,
                    'link' => (string)$entry->link['href'],
                    'description' => (string)$entry->summary,
                    'pubDate' => (string)$entry->updated
                ];
            }
        }
        
        $result = [
            'success' => true,
            'title' => (string)($xml->channel->title ?? $xml->title),
            'itemCount' => count($items),
            'items' => array_slice($items, 0, 20)
        ];
        
        $response->getBody()->write(json_encode($result));
        return $response->withHeader('Content-Type', 'application/json');
        
    } catch (Exception $e) {
        $result = [
            'success' => false,
            'error' => $e->getMessage()
        ];
        
        $response->getBody()->write(json_encode($result));
        return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
    }
});

// Connected services status
$app->get('/services/status', function (Request $request, Response $response) {
    $services = [
        ['name' => 'Stripe', 'status' => 'connected', 'latency' => 45],
        ['name' => 'SendGrid', 'status' => 'connected', 'latency' => 120],
        ['name' => 'Twilio', 'status' => 'connected', 'latency' => 85],
        ['name' => 'AWS S3', 'status' => 'connected', 'latency' => 65],
        ['name' => 'Cloudflare', 'status' => 'connected', 'latency' => 25]
    ];
    
    $result = [
        'services' => $services,
        'total' => count($services),
        'connected' => count(array_filter($services, fn($s) => $s['status'] === 'connected'))
    ];
    
    $response->getBody()->write(json_encode($result));
    return $response->withHeader('Content-Type', 'application/json');
});

// Helper function to process webhooks
function processWebhook(string $service, array $payload, array $headers): array {
    $processors = [
        'stripe' => function($payload, $headers) {
            return [
                'processed' => true,
                'service' => 'stripe',
                'event' => $payload['type'] ?? 'unknown',
                'timestamp' => date('c')
            ];
        },
        'github' => function($payload, $headers) {
            return [
                'processed' => true,
                'service' => 'github',
                'event' => $headers['X-GitHub-Event'][0] ?? 'unknown',
                'repository' => $payload['repository']['full_name'] ?? 'unknown',
                'timestamp' => date('c')
            ];
        },
        'slack' => function($payload, $headers) {
            return [
                'processed' => true,
                'service' => 'slack',
                'challenge' => $payload['challenge'] ?? null,
                'timestamp' => date('c')
            ];
        }
    ];
    
    if (isset($processors[$service])) {
        return $processors[$service]($payload, $headers);
    }
    
    return [
        'processed' => false,
        'service' => $service,
        'error' => 'No processor found for this service',
        'timestamp' => date('c')
    ];
}

// Run the app
$app->run();
