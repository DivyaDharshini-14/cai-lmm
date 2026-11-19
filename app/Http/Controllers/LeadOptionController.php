<?php

namespace App\Http\Controllers;

use App\Models\LeadOption;
use Illuminate\Http\JsonResponse;

class LeadOptionController extends Controller
{
    public function __invoke(): JsonResponse
    {
        $options = LeadOption::ordered()
            ->get(['field', 'scope', 'value', 'description', 'requires_company'])
            ->groupBy('field')
            ->map(fn ($group) => $group->map(fn (LeadOption $option) => $option->only([
                'scope', 'value', 'description', 'requires_company',
            ])));

        return response()->json(['data' => $options]);
    }
}
