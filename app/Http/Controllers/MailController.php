<?php

namespace App\Http\Controllers;

use Exception;
use Illuminate\Http\Request;

class MailController extends Controller
{
    public function send(Request $request)
    {
        try {

        } catch (Exception $e) {
            return response()->json([
                'error' => 'there is a error sendind the email',
                'fail' => $e->getMessage(),
            ]);
        }
    }
}
