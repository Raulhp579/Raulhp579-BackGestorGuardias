<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class CorsSimple
{
    public function handle(Request $request, Closure $next)
    {
        // Responde preflight SIEMPRE
        if ($request->getMethod() === 'OPTIONS') {
            return response('', 204)
                ->header('Access-Control-Allow-Origin', '*')
                ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
                ->header('Access-Control-Allow-Headers', '*')
                ->header('Access-Control-Max-Age', '86400');
        }

        $response = $next($request);

        // Añade headers a cualquier respuesta (incluye 302/401/500)
        return $response
            ->header('Access-Control-Allow-Origin', '*')
            ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
            ->header('Access-Control-Allow-Headers', '*');
    }
}
