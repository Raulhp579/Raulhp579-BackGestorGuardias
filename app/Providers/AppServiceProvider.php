<?php

namespace App\Providers;

use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\ServiceProvider;
use Symfony\Component\Mailer\Transport\Smtp\EsmtpTransport;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        Schema::defaultStringLength(191);

        // Symfony Mailer (Laravel 9+) no lee las stream options de config/mail.php.
        // Este override aplica verify_peer=false directamente sobre el SocketStream
        // para evitar el error de CN mismatch del certificado SSL del servidor de correo.
        Mail::extend('smtp', function () {
            $config = config('mail.mailers.smtp');

            $transport = new EsmtpTransport(
                $config['host'] ?? '127.0.0.1',
                (int) ($config['port'] ?? 465),
                ($config['encryption'] ?? '') === 'ssl'
            );

            $transport->setUsername($config['username'] ?? '');
            $transport->setPassword($config['password'] ?? '');

            $transport->getStream()->setStreamOptions([
                'ssl' => [
                    'verify_peer'       => false,
                    'verify_peer_name'  => false,
                    'allow_self_signed' => true,
                ],
            ]);

            return $transport;
        });
    }
}
