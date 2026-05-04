<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class isAdmin
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next)
    {
        if(!Auth::check()){
            return response()->json([
                "error"=>"the user is not authenticated"
                
            ],401);
        }

        $user = Auth::user();

        if(!$user->hasRole("admin")){
            return response()->json([
                "error"=>"the user is not an admin"
                
            ],403);
        }
        return $next($request);
    }
}
