<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class UserController extends Controller
{
    /**
     * Obtener el perfil del usuario autenticado
     */
    public function profile(Request $request)
    {
        return response()->json($request->user(), 200);
    }

    /**
     * Actualizar datos del usuario autenticado
     */
    public function update(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            // SI está presente en la solicitud, debe cumplir con todas las demás validaciones
            'name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|email|unique:users,email,' . $user->id,
        ]);

        $user->update($validated);

        return response()->json([
            'message' => 'Perfil actualizado correctamente',
            'user' => $user
        ], 200);
    }

    /**
     * Cambiar la contraseña del usuario
     */
    public function changePassword(Request $request)
    {
        $validated = $request->validate([
            'current_password' => 'required|current_password',
            'password' => [
                'required',
                'confirmed',
                Password::min(8)
            ]
        ]);

        $request->user()->update([
            'password' => Hash::make($validated['password'])
        ]);

        return response()->json([
            'message' => 'Contraseña actualizada correctamente'
        ], 200);
    }

    /**
     * Eliminar cuenta del usuario
     */
    public function destroy(Request $request)
    {
        $user = $request->user();
        
        $validated = $request->validate([
            'password' => 'required|current_password'
        ]);

        $user->delete();

        return response()->json([
            'message' => 'Cuenta eliminada correctamente'
        ], 200);
    }

    /**
     * Obtener todos los usuarios (solo para administradores)
     */
    public function index()
    {
        return response()->json(User::all(), 200);
    }

    /**
     * Obtener un usuario específico
     */
    public function show($id)
    {
        $user = User::findOrFail($id);
        return response()->json($user, 200);
    }
}
