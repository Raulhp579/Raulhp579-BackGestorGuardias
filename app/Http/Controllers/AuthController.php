<?php
namespace App\Http\Controllers;

use App\Models\User;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            "auth" => [
                "access_token" => $token,
                "token_type" => "Bearer"
            ],
        ], 201);
    }

    public function login(Request $request)
    {
        try{
            $request->validate([
            'email' => 'required|email',
            'password' => 'required',
            ]);

            $user = User::where('email', $request->email)->first();

            if (!$user || !Hash::check($request->password, $user->password)) 
            {
                throw ValidationException::withMessages([
                    'email' => ['Las credenciales proporcionadas son incorrectas.'],
                ]);
            }

            // Revocar tokens anteriores si se desea
            $user->tokens()->delete();

            $token = $user->createToken('auth_token')->plainTextToken;

            return response()->json([
                "auth" => [
                    "access_token" => $token,
                    "roles"=>$user->getRoleNames(),
                    "token_type" => "Bearer"
                ],
            ], 201);
        }catch(Exception $e){
            return response()->json([
                "error"=>"there is a problem with the login of the user",
                "fail"=>$e->getMessage()
            ]);
        }
        
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Sesión cerrada exitosamente'
        ]);
    }

    public function profile(Request $request)
    {
        return response()->json($request->user());
    }
}