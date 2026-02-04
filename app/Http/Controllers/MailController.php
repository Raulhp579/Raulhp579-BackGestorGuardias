<?php

namespace App\Http\Controllers;

use App\Mail\MailableConfig;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

class MailController extends Controller
{
    public function send(Request $request)
    {
        try {
            Mail::to($request->email)->send(new MailableConfig('GuardiApp', $request->asunto, $request->cuerpo));
            return response()->json(["success"=>"correro enviado correctamente"]);
        } catch (Exception $e) {
            return response()->json([
                'error' => 'there is a error sendind the email',
                'fail' => $e->getMessage(),
            ]);
        }
    }
}
