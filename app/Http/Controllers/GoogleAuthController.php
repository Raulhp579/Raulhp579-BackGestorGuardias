<?php

namespace App\Http\Controllers;

use Laravel\Socialite\Socialite;
use Laravel\Socialite\Two\GoogleProvider;

class GoogleAuthController extends Controller
{
    public function redirect()
    {

        /** @var GoogleProvider $driver */
        $driver = Socialite::driver('google');

        return $driver->stateless()->scopes(['https://www.googleapis.com/auth/calendar.events'])
            ->with([
                'access_type' => 'offline',
                'prompt' => 'consent',
            ])
            ->redirect();
    }

    public function callback()
    {
        /** @var GoogleProvider $driver */
        $driver = Socialite::driver('google');
        $gUser = $driver->stateless()->user();

        dd([
            'token' => $gUser->token,
            'refreshToken' => $gUser->refreshToken,
            'expiresIn' => $gUser->expiresIn,
            'email' => $gUser->email,
        ]);
    }
}
