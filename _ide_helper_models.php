<?php

// @formatter:off
// phpcs:ignoreFile
/**
 * A helper file for your Eloquent Models
 * Copy the phpDocs from this file to the correct Model,
 * And remove them from this file, to prevent double declarations.
 *
 * @author Barry vd. Heuvel <barryvdh@gmail.com>
 */


namespace App\Models{
/**
 * @property int $id
 * @property string $date
 * @property \App\Enums\DutyType $duty_type
 * @property int $id_speciality
 * @property int $id_worker
 * @property int|null $id_chief_worker
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \App\Models\Worker|null $chief
 * @property-read \App\Models\Worker|null $chiefWorker
 * @property-read \App\Models\Worker $worker
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Duty newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Duty newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Duty query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Duty whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Duty whereDate($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Duty whereDutyType($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Duty whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Duty whereIdChiefWorker($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Duty whereIdSpeciality($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Duty whereIdWorker($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Duty whereUpdatedAt($value)
 */
	class Duty extends \Eloquent {}
}

namespace App\Models{
/**
 * @property int $id
 * @property string $name
 * @property bool $active
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Speciality newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Speciality newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Speciality query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Speciality whereActive($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Speciality whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Speciality whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Speciality whereName($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Speciality whereUpdatedAt($value)
 */
	class Speciality extends \Eloquent {}
}

namespace App\Models{
/**
 * @property int $id
 * @property string $name
 * @property string $email
 * @property \Illuminate\Support\Carbon|null $email_verified_at
 * @property string $password
 * @property string|null $remember_token
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \Illuminate\Notifications\DatabaseNotificationCollection<int, \Illuminate\Notifications\DatabaseNotification> $notifications
 * @property-read int|null $notifications_count
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \Spatie\Permission\Models\Permission> $permissions
 * @property-read int|null $permissions_count
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \Spatie\Permission\Models\Role> $roles
 * @property-read int|null $roles_count
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \Laravel\Sanctum\PersonalAccessToken> $tokens
 * @property-read int|null $tokens_count
 * @method static \Database\Factories\UserFactory factory($count = null, $state = [])
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User permission($permissions, $without = false)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User role($roles, $guard = null, $without = false)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User whereEmail($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User whereEmailVerifiedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User whereName($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User wherePassword($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User whereRememberToken($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User whereUpdatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User withoutPermission($permissions)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User withoutRole($roles, $guard = null)
 */
	class User extends \Eloquent {}
}

namespace App\Models{
/**
 * @property int $id
 * @property string $name
 * @property string|null $rank
 * @property string $registration_date
 * @property string|null $discharge_date
 * @property int|null $id_speciality
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\Duty> $duties
 * @property-read int|null $duties_count
 * @property-read \App\Models\Speciality|null $speciality
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Worker newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Worker newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Worker query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Worker whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Worker whereDischargeDate($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Worker whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Worker whereIdSpeciality($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Worker whereName($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Worker whereRank($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Worker whereRegistrationDate($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Worker whereUpdatedAt($value)
 */
	class Worker extends \Eloquent {}
}

