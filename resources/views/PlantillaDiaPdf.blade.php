<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>Guardias - Hospital Comarcal Valle de los Pedroches</title>
    <style>
        /* Estilos compatibles con DomPDF */
        @page {
            size: A4;
            margin: 10mm;
        }

        * {
            margin: 0;
            padding: 0;
        }

        body {
            font-family: DejaVu Sans, sans-serif;
            font-size: 10px;
            color: #1a1a2e;
            line-height: 1.4;
        }

        .container {
            width: 100%;
            border: 2px solid #006B5A;
        }

        /* Header usando tabla para layout */
        .header-table {
            width: 100%;
            background-color: #006B5A;
            color: white;
            padding: 15px;
        }

        .header-table td {
            vertical-align: middle;
        }

        .logo-cell {
            width: 80px;
            padding: 10px;
        }

        .logo-cell img {
            width: 60px;
            height: auto;
            background: white;
            padding: 5px;
        }

        .header-text-cell {
            text-align: center;
            padding: 10px;
        }

        .hospital-name {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 10px;
            color: white;
        }

        .supervisor-line {
            font-size: 11px;
            margin-bottom: 6px;
            color: white;
        }

        .supervisor-name {
            font-weight: bold;
            color: #FFE066;
        }

        .facultativos-line {
            font-size: 10px;
            font-weight: bold;
            margin-bottom: 6px;
            color: white;
        }

        .fecha-line {
            font-size: 12px;
            color: white;
        }

        .fecha-value {
            font-weight: bold;
            color: #FFE066;
        }

        /* Contenedor de la tabla */
        .table-container {
            padding: 15px;
            background-color: #f8fafb;
        }

        /* Tabla principal */
        .guardias-table {
            width: 100%;
            border-collapse: collapse;
        }

        .guardias-table th,
        .guardias-table td {
            border: 1px solid #333;
            padding: 8px 6px;
            vertical-align: middle;
            text-align: left;
        }

        .guardias-table thead th {
            background-color: #006B5A;
            color: white;
            font-weight: bold;
            text-align: center;
            font-size: 10px;
            text-transform: uppercase;
        }

        .guardias-table th.especialidad-header {
            width: 20%;
        }

        .guardias-table th.continuidad-header {
            width: 18%;
        }

        .guardias-table th.jornada-header {
            width: 62%;
        }

        /* Sub-headers */
        .sub-header-row th {
            background-color: #008B72;
            font-size: 9px;
            padding: 6px;
            font-weight: bold;
            color: white;
        }

        .guardias-table th.pfisica-sub {
            width: 31%;
        }

        .guardias-table th.localizada-sub {
            width: 31%;
            background-color: #4A9B8F;
        }

        /* Celdas del body */
        .guardias-table tbody tr.row-even {
            background-color: #f0f4f5;
        }

        .guardias-table tbody tr.row-odd {
            background-color: #ffffff;
        }

        .guardias-table td.especialidad {
            font-weight: bold;
            font-size: 9px;
            color: #006B5A;
            background-color: #e8f4f2;
            border-left: 3px solid #006B5A;
            text-transform: uppercase;
        }

        .guardias-table td.doctor-cell {
            text-align: center;
            font-size: 10px;
            color: #2d3748;
        }

        .guardias-table td.localizada-cell {
            background-color: #f0f8f6;
        }

        /* Footer */
        .footer {
            padding: 25px 15px;
            margin-top: 15px;
            background-color: #f0f4f5;
            border-top: 2px solid #006B5A;
        }

        .footer-table {
            width: 100%;
        }

        .footer-table td {
            padding: 8px 0;
        }

        .footer-label {
            font-weight: bold;
            color: #1a1a2e;
            font-size: 11px;
        }

        .footer-name {
            color: #006B5A;
            font-weight: bold;
            font-size: 12px;
            border: 2px solid #006B5A;
            padding: 4px 12px;
            background-color: white;
        }

        .firma-box {
            width: 180px;
            height: 40px;
            border: 1px dashed #666;
            display: inline-block;
            margin-left: 10px;
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header usando tabla para compatibilidad -->
        <table class="header-table" cellpadding="0" cellspacing="0">
            <tr>
                <td class="header-text-cell">
                    <div class="hospital-name">HOSPITAL COMARCAL "VALLE DE LOS PEDROCHES"</div>
                    <div class="supervisor-line">
                        <span>SUPERVISOR DE GUARDIA:</span>
                        <span class="supervisor-name">{{$chiefWorker}}</span>
                    </div>
                    <div class="facultativos-line">FACULTATIVOS QUE PRESTAN SERVICIO FUERA DE JORNADA ORDINARIA</div>
                    <div class="fecha-line">
                        <span style="font-weight: bold;">FECHA:</span>
                        <span class="fecha-value">{{$date}}</span>
                    </div>
                </td>
            </tr>
        </table>

        <!-- Tabla de Guardias -->
        <div class="table-container">
            <table class="guardias-table">
                <thead>
                    <tr>
                        <th rowspan="2" class="especialidad-header">ESPECIALIDAD</th>
                        <th rowspan="2" class="continuidad-header">CONTINUIDAD<br>ASISTENCIAL<br>(15 a 20 h)</th>
                        <th colspan="2" class="jornada-header">JORNADA COMPLEMENTARIA</th>
                    </tr>
                    <tr class="sub-header-row">
                        <th class="pfisica-sub">P. Física</th>
                        <th class="localizada-sub">Localizada</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach ($specialities as $index => $speciality)
                    <tr class="{{ $index % 2 == 0 ? 'row-even' : 'row-odd' }}">
                        <td class="especialidad">{{ $speciality->name }}</td>
                        
                        {{-- Columna CA --}}
                        <td class="doctor-cell">
                            @foreach ($duties as $duty)
                                @if ($duty->id_speciality == $speciality->id && $duty->duty_type->value == "CA")
                                    @foreach ($workers as $worker)
                                        @if ($duty->id_worker == $worker->id)
                                            {{ $worker->name }}<br>
                                        @endif
                                    @endforeach
                                @endif
                            @endforeach
                        </td>
                        
                        {{-- Columna PF --}}
                        <td class="doctor-cell">
                            @foreach ($duties as $duty)
                                @if ($duty->id_speciality == $speciality->id && $duty->duty_type->value == "PF")
                                    @foreach ($workers as $worker)
                                        @if ($duty->id_worker == $worker->id)
                                            {{ $worker->name }}<br>
                                        @endif
                                    @endforeach
                                @endif
                            @endforeach
                        </td>
                        
                        {{-- Columna LOC --}}
                        <td class="doctor-cell localizada-cell">
                            @foreach ($duties as $duty)
                                @if ($duty->id_speciality == $speciality->id && $duty->duty_type->value == "LOC")
                                    @foreach ($workers as $worker)
                                        @if ($duty->id_worker == $worker->id)
                                            {{ $worker->name }}<br>
                                        @endif
                                    @endforeach
                                @endif
                            @endforeach
                        </td>
                    </tr>
                    @endforeach
                </tbody>
            </table>
        </div>

        <!-- Footer -->
        <div class="footer">
            <table class="footer-table" cellpadding="0" cellspacing="0">
                <tr>
                    <td>
                        <span class="footer-label">JEFE DE GUARDIA: Dr./a</span>
                        <span class="footer-name">{{ $chiefWorker }}</span>
                    </td>
                </tr>
                <tr>
                    <td style="padding-top: 20px;">
                        <span class="footer-label">FIRMA:</span>
                        <div class="firma-box"></div>
                    </td>
                </tr>
            </table>
        </div>
    </div>
</body>
</html>
