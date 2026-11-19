<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class LeadOption extends Model
{
    public $timestamps = false;

    protected function casts(): array
    {
        return ['requires_company' => 'boolean'];
    }

    #[Scope]
    protected function ordered(Builder $query): void
    {
        $query->orderBy('field')->orderBy('scope')->orderBy('position')->orderBy('id');
    }
}
