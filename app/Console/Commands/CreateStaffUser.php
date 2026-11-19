<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class CreateStaffUser extends Command
{
    protected $signature = 'staff:create';

    protected $description = 'Create a staff account for the CAI LMM dashboard';

    public function handle(): int
    {
        $name = trim((string) $this->ask('Staff name'));
        $email = Str::lower(trim((string) $this->ask('Email address')));
        $password = (string) $this->secret('Password (8 or more characters)');
        $confirmation = (string) $this->secret('Confirm password');

        $validator = Validator::make([
            'name' => $name,
            'email' => $email,
            'password' => $password,
            'password_confirmation' => $confirmation,
        ], [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:254', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        if ($validator->fails() || strlen($password) > 72 || str_contains($password, "\0")) {
            foreach ($validator->errors()->all() as $error) {
                $this->error($error);
            }
            if (strlen($password) > 72 || str_contains($password, "\0")) {
                $this->error('The password must fit within 72 bytes and contain no null bytes.');
            }

            return self::FAILURE;
        }

        User::create($validator->safe()->only(['name', 'email', 'password']));
        $this->info('Staff account created.');

        return self::SUCCESS;
    }
}
