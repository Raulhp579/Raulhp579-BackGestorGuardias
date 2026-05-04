<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

try {
    $worker = App\Models\Worker::first();
    $speciality = App\Models\Speciality::first();

    if (!$worker || !$speciality) {
        throw new Exception("No worker or speciality found");
    }

    $data = [
        'date' => now()->addDays(random_int(10, 100))->format('Y-m-d'),
        'duty_type' => 'PF',
        'id_speciality' => $speciality->id,
        'id_worker' => $worker->id,
        'id_chief_worker' => $worker->id
    ];

    $request = Illuminate\Http\Request::create('/api/duties', 'POST', $data);
    
    // We instantiate the controller directly to avoid middleware auth issues in this script
    $controller = new App\Http\Controllers\DutyController();
    $response = $controller->store($request);

    echo "Status: " . $response->getStatusCode() . "\n";
    echo "Content: " . $response->getContent() . "\n";

    // Clean up
    $json = json_decode($response->getContent());
    if (isset($json->id)) {
        App\Models\Duty::destroy($json->id);
        echo "Cleaned up duty ID: " . $json->id . "\n";
    }

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
