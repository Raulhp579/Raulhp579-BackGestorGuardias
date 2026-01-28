<?php

namespace App\Http\Controllers;

use App\Models\User;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    /**
     * Obtener el perfil del usuario autenticado
     */
    public function profile()
    {
        try {
            $user = Auth::user();

            return response()->json($user, 200);
        } catch (Exception $e) {
            return response()->json([
                'error' => 'there is a problem showing your profile',
                'fail' => $e->getMessage(),
            ]);
        }

    }

    /**
     * Actualizar datos del usuario autenticado
     */
    public function update(Request $request)
    {
        try {
            $user = Auth::user();

            $validated = $request->validate([
                // SI está presente en la solicitud, debe cumplir con todas las demás validaciones
                'name' => 'sometimes|required|string|max:255',
                'email' => 'sometimes|required|email|unique:users,email,'.$user->id,
            ]);

            $user->update($validated);

            return response()->json([
                'message' => 'Perfil actualizado correctamente',
                'user' => $user,
            ], 200);
        } catch (Exception $e) {
            return response()->json([
                'error' => 'there is a problem updating your profile',
                'fail' => $e->getMessage(),
            ]);
        }

    }

    /**
     * Cambiar la contraseña del usuario necesita current_password password y password_confirmation
     */
    public function changePassword(Request $request)
    {
        try {
            $user = Auth::user();

            if (! $user) {
                return response()->json([
                    'error' => 'Usuario no autenticado',
                ], 401);
            }

            $validated = $request->validate([
                'current_password' => 'required',
                'password' => [
                    'required',
                    'confirmed',
                    'min:8',
                ],
            ]);

            // Verificar manualmente la contraseña actual
            if (! Hash::check($validated['current_password'], $user->password)) {
                return response()->json([
                    'error' => 'La contraseña actual es incorrecta',
                ], 422);
            }

            $user->update([
                'password' => Hash::make($validated['password']),
            ]);

            return response()->json([
                'message' => 'Contraseña actualizada correctamente',
            ], 200);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'error' => 'Validación fallida',
                'messages' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Error interno del servidor',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Eliminar cuenta del usuario
     */
    public function destroy(Request $request) // probar con usuario normal
    {
        try {
            $user = Auth::user();
            if ($user->hasRole('admin')) {
                return response()->json([
                    'error' => "your account can't be deleted because you are an admin. 
                    Please contact the administrator to delete your account in database.",
                ]);
            }

            $validated = $request->validate([
                'password' => 'required|current_password',
            ]);

            if (! Hash::check($validated['password'], $user->password)) {
                return response()->json([
                    'error' => 'the password is incorrect',
                ]);
            }

            $user->delete();

            return response()->json([
                'message' => 'Cuenta eliminada correctamente',
            ], 200);
        } catch (Exception $e) {
            return response()->json([
                'error' => 'there is a problem deleting the user',
                'fail' => $e->getMessage(),
            ]);
        }

    }

    /**
     * Obtener todos los usuarios (solo para administradores)
     */
    public function index(Request $request)
    {
        try {
            if (isset($request->name)) {
                return response()->json(User::where('name', 'LIKE', "%{$request->name}%")->first());
            }

            return response()->json(User::all(), 200);
        } catch (Exception $e) {
            return response()->json([
                'error' => 'there is a problem getting the users',
                'fail' => $e->getMessage(),
            ]);
        }

    }

    /**
     * Obtener un usuario específico
     */
    public function show($id)
    {
        try {
            $user = User::findOrFail($id);

            return response()->json($user, 200);
        } catch (Exception $e) {
            return response()->json([
                'error' => 'there is a problem showing the user',
                'fail' => $e->getMessage(),
            ]);
        }

    }

    /**
     * Editar un usuario específico (solo para administradores)
     * Permite cambiar name, email y/o password
     */
    public function edit(Request $request, $id)
    {
        try {
            $user = User::findOrFail($id);

            $validated = $request->validate([
                'name' => 'sometimes|required|string|max:255',
                'email' => 'sometimes|required|email|unique:users,email,'.$user->id,
                'password' => 'sometimes|required|min:8',
            ]);

            // Si se envía una nueva contraseña, hashearla
            if (isset($validated['password'])) {
                $validated['password'] = Hash::make($validated['password']);
            }

            $user->update($validated);

            return response()->json([
                'message' => 'Usuario actualizado correctamente',
                'user' => $user,
            ], 200);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'error' => 'Usuario no encontrado',
            ], 404);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'error' => 'Validación fallida',
                'messages' => $e->errors(),
            ], 422);
        } catch (Exception $e) {
            return response()->json([
                'error' => 'Error al actualizar el usuario',
                'fail' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Eliminar un usuario específico (solo para administradores)
     */
    public function destroyAdmin($id)
    {
        try {
            $user = User::findOrFail($id);

            // Evitar que se elimine a un admin
            if ($user->hasRole('admin')) {
                return response()->json([
                    'error' => 'No se puede eliminar a un administrador',
                ], 403);
            }

            $user->delete();

            return response()->json([
                'message' => 'Usuario eliminado correctamente',
            ], 200);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'error' => 'Usuario no encontrado',
            ], 404);
        } catch (Exception $e) {
            return response()->json([
                'error' => 'Error al eliminar el usuario',
                'fail' => $e->getMessage(),
            ], 500);
        }
    }
}
