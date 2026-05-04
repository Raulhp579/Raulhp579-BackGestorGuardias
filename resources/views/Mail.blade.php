<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $asunto ?? 'Notificación' }}</title>
    <style>
        body {
            font-family: 'Inter', system-ui, -apple-system, Segoe UI, Arial, sans-serif;
            background-color: #F3F4F6;
            color: #111827;
            margin: 0;
            padding: 0;
            line-height: 1.5;
        }
        .container {
            width: 100%;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background-color: #007041;
            padding: 16px;
            border-radius: 8px 8px 0 0;
            text-align: center;
            color: #ffffff;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        .logo-wrap {
            display: inline-flex;
            align-items: center;
            gap: 10px;
            font-weight: 800;
            font-size: 20px;
            letter-spacing: -0.01em;
        }
        .logo-svg {
            width: 24px;
            height: 24px;
            fill: currentColor;
        }
        .card {
            background-color: #ffffff;
            padding: 32px;
            border-radius: 0 0 8px 8px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            border: 1px solid #E5E7EB;
            border-top: none;
        }
        h1 {
            font-size: 24px;
            font-weight: 700;
            color: #111827;
            margin-top: 0;
            margin-bottom: 24px;
        }
        .content {
            font-size: 16px;
            color: #374151;
            line-height: 1.6;
            margin-bottom: 32px;
        }
        .footer {
            margin-top: 24px;
            text-align: center;
            font-size: 12px;
            color: #6B7280;
        }
        .divider {
            height: 1px;
            background-color: #E5E7EB;
            margin: 24px 0;
            border: none;
        }
        .sender-info {
            font-size: 14px;
            color: #6B7280;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .sender-icon {
            color: #007041;
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header con el verde corporativo -->
        <div class="header">
            <div class="logo-wrap">
                <!-- SVG copiado del React Header.jsx -->
                <svg class="logo-svg" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 2L2 22h20L12 2zm0 3.8L18.4 20H5.6L12 5.8z" />
                </svg>
                <span>GuardiApp</span>
            </div>
        </div>
        
        <div class="card">
            <h1>{{ $asunto }}</h1>
            
            <div class="content">
                {!! nl2br(e($cuerpo)) !!}
            </div>

            <hr class="divider">

            <div class="sender-info">
                <span>Enviado por:</span>
                <strong style="color: #111827;">{{ $remitente }}</strong>
            </div>
        </div>

        <div class="footer">
            &copy; {{ date('Y') }} GuardiApp. Todos los derechos reservados.
        </div>
    </div>
</body>
</html>
