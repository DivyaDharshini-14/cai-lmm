<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Lead extends Model
{
    protected $fillable = [
        'lead_source', 'business_type', 'company_name', 'location', 'customer_name', 'mobile', 'email',
        'application', 'vehicle_category', 'hotspot', 'current_vehicle', 'exchange', 'recommended_model',
        'test_drive', 'finance', 'priority', 'follow_up_date', 'remarks',
    ];

    protected function casts(): array
    {
        return ['follow_up_date' => 'immutable_date'];
    }
}
