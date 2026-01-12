<?php

namespace App\Enums;

enum DutyType: string
{
    case CA  = 'CA';
    case PF  = 'PF';
    case LOC = 'LOC';

    public function hours(): int
    {
        return match ($this) {
            self::CA  => 5,
            self::PF  => 24,
            self::LOC => 24,
        };
    }

    public function label(): string
    {
        return match ($this) {
            self::CA  => 'Continuity of Care',
            self::PF  => 'On-site 24h',
            self::LOC => 'On-call (Off-site) 24h',
        };
    }
}