<?php

namespace App\Http\Controllers;

use App\Events\NotificationEvent;
use App\Models\Duty;
use App\Models\DutySwap;
use App\Models\Worker;
use App\Models\Speciality;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\Notification;
use App\Models\User;

class DutySwapController extends Controller
{
    public function index(Request $request)
    {
        $workerId = $request->user()->worker_id;
        
        if (!$workerId) {
            return response()->json(['message' => 'User not linked to a worker'], 403);
        }

        $swaps = DutySwap::with(['dutyFrom.speciality', 'dutyTo', 'requester', 'target', 'chiefApprover'])
            ->where(function($q) use ($workerId) {
                $q->where('id_worker_requester', $workerId)
                  ->orWhere('id_worker_target', $workerId);
            })
            ->orWhereHas('dutyFrom.speciality', function($query) use ($workerId) {
                $query->where('id_chief', '=', $workerId);
            })
            ->get();

        return response()->json($swaps);
    }

    public function store(Request $request)
    {
        $request->validate([
            'id_duty_from' => 'required|exists:duties,id',
            'id_duty_to' => 'required|exists:duties,id',
        ]);

        $workerRequesterId = $request->user()->worker_id;
        $dutyFrom = Duty::findOrFail($request->id_duty_from);
        $dutyTo = Duty::findOrFail($request->id_duty_to);

        if ($dutyFrom->id_worker != $workerRequesterId) {
            return response()->json(['message' => 'The origin duty does not belong to you'], 403);
        }

        if ($dutyFrom->id_speciality != $dutyTo->id_speciality) {
            return response()->json(['message' => 'Cannot swap duties between different specialties'], 400);
        }

        // Conflict Validation
        $conflictRequester = Duty::where('id_worker', '=', $workerRequesterId)
            ->where('date', '=', $dutyTo->date)
            ->exists();
        
        if ($conflictRequester) {
            return response()->json(['message' => 'You already have a duty assigned on the target date'], 400);
        }

        $conflictTarget = Duty::where('id_worker', '=', $dutyTo->id_worker)
            ->where('date', '=', $dutyFrom->date)
            ->exists();
        
        if ($conflictTarget) {
            return response()->json(['message' => 'The target colleague already has a duty assigned on your source date'], 400);
        }

        $swap = DutySwap::create([
            'id_duty_from' => $request->id_duty_from,
            'id_duty_to' => $request->id_duty_to,
            'id_worker_requester' => $workerRequesterId,
            'id_worker_target' => $dutyTo->id_worker,
            'status' => 'pending',
            'comments' => $request->comments,
        ]);

        // Notify Target
        $this->notifyUser(
            $dutyTo->id_worker,
            'Solicitud de Intercambio',
            $request->user()->name . ' te ha solicitado un intercambio de guardia para el ' . $dutyFrom->date,
            'swap_request',
            $swap->id
        );

        return response()->json($swap, 201);
    }

    public function accept(DutySwap $dutySwap, Request $request)
    {
        $workerId = $request->user()->worker_id;

        if ($dutySwap->id_worker_target !== $workerId) {
            return response()->json(['message' => 'Only the target worker can accept this swap'], 403);
        }

        if ($dutySwap->status !== 'pending') {
            return response()->json(['message' => 'Invalid swap status'], 400);
        }

        $dutySwap->load('dutyFrom.speciality');
        $dutySwap->update(['status' => 'accepted']);

        // Notify Requester
        $this->notifyUser(
            $dutySwap->id_worker_requester,
            'Intercambio Aceptado',
            $request->user()->name . ' ha aceptado tu solicitud de intercambio. Pendiente de aprobación del jefe.',
            'swap_accepted',
            $dutySwap->id
        );

        // Notify Chief
        $chiefWorkerId = $dutySwap->dutyFrom->speciality->id_chief;
        if ($chiefWorkerId) {
            $this->notifyUser(
                $chiefWorkerId,
                'Nuevo Intercambio Pendiente',
                'Hay una nueva solicitud de intercambio aceptada entre ' . $dutySwap->requester->name . ' y ' . $dutySwap->target->name,
                'swap_pending_approval',
                $dutySwap->id
            );
        }

        return response()->json($dutySwap);
    }

    public function reject(DutySwap $dutySwap, Request $request)
    {
        $workerId = $request->user()->worker_id;

        if ($dutySwap->id_worker_target !== $workerId) {
            return response()->json(['message' => 'Only the target worker can reject this swap'], 403);
        }

        $dutySwap->update(['status' => 'rejected']);

        // Notify Requester
        $this->notifyUser(
            $dutySwap->id_worker_requester,
            'Intercambio Rechazado',
            $request->user()->name . ' ha rechazado tu solicitud de intercambio.',
            'swap_rejected',
            $dutySwap->id
        );

        return response()->json($dutySwap);
    }

    public function approve(DutySwap $dutySwap, Request $request)
    {
        $workerId = $request->user()->worker_id;
        $speciality = $dutySwap->dutyFrom->speciality;

        if ($speciality->id_chief != $workerId) {
            return response()->json(['message' => 'Only the specialty chief can approve this swap'], 403);
        }

        if ($dutySwap->status != 'accepted') {
            return response()->json(['message' => 'Swap must be accepted by both workers first'], 400);
        }

        DB::transaction(function () use ($dutySwap, $workerId) {
            $dutyFrom = Duty::query()->find($dutySwap->id_duty_from, ['*']);
            $dutyTo = Duty::query()->find($dutySwap->id_duty_to, ['*']);

            // Swap workers
            $tempWorker = $dutyFrom->id_worker;
            $dutyFrom->id_worker = $dutyTo->id_worker;
            $dutyTo->id_worker = $tempWorker;

            $dutyFrom->save();
            $dutyTo->save();

            $dutySwap->update([
                'status' => 'approved',
                'id_chief_approver' => $workerId
            ]);
        });

        // Notify both parties
        $msg = 'El jefe de especialidad ha APROBADO el intercambio para el ' . $dutySwap->dutyFrom->date;
        $this->notifyUser($dutySwap->id_worker_requester, 'Intercambio Aprobado', $msg, 'swap_approved', $dutySwap->id);
        $this->notifyUser($dutySwap->id_worker_target, 'Intercambio Aprobado', $msg, 'swap_approved', $dutySwap->id);

        return response()->json($dutySwap);
    }

    public function decline(DutySwap $dutySwap, Request $request)
    {
        $workerId = $request->user()->worker_id;
        $speciality = $dutySwap->dutyFrom->speciality;

        if ($speciality->id_chief != $workerId) {
            return response()->json(['message' => 'Only the specialty chief can decline this swap'], 403);
        }

        $dutySwap->update([
            'status' => 'declined',
            'id_chief_approver' => $workerId
        ]);

        // Notify both parties
        $msg = 'El jefe de especialidad ha DENEGADO el intercambio solicitado.';
        $this->notifyUser($dutySwap->id_worker_requester, 'Intercambio Denegado', $msg, 'swap_declined', $dutySwap->id);
        $this->notifyUser($dutySwap->id_worker_target, 'Intercambio Denegado', $msg, 'swap_declined', $dutySwap->id);

        return response()->json($dutySwap);
    }

    private function notifyUser($workerId, $title, $message, $type, $relatedId = null)
    {
        $user = User::where('worker_id', '=', $workerId)->first();
        if (!$user) return;

        try {
            Notification::create([
                'user_id' => $user->id,
                'title' => $title,
                'message' => $message,
                'type' => $type,
                'related_id' => $relatedId
            ]);
        } catch (\Throwable $e) {
            \Log::error('Error creating notification: ' . $e->getMessage());
            return;
        }

        try {
            event(new NotificationEvent($user));
        } catch (\Throwable $e) {
            \Log::error('Error broadcasting NotificationEvent: ' . $e->getMessage());
        }
    }
}
