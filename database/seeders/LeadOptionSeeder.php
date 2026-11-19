<?php

namespace Database\Seeders;

use App\Models\LeadOption;
use Illuminate\Database\Seeder;

class LeadOptionSeeder extends Seeder
{
    public function run(): void
    {
        $choices = [
            'lead_source' => ['Digital', 'Field', 'Financier', 'Exchange', 'Referral', 'Fleet', 'Institutional'],
            'business_type' => ['Individual', 'Company', 'Logistics'],
            'application' => ['Passenger', 'Cargo'],
            'vehicle_category' => ['3 Wheeler', '4 Wheeler SCV', '4 Wheeler Pickup'],
            'current_vehicle' => ['None', 'Mahindra 3 Wheeler', 'Other 3 Wheeler', '4 Wheeler SCV', '4 Wheeler Pickup', 'Car', 'Other'],
            'exchange' => ['Yes', 'No'],
            'test_drive' => ['Yes', 'No'],
            'finance' => ['Yes', 'No'],
            'priority' => ['HOT', 'WARM', 'COLD'],
        ];

        $scopedChoices = [
            'recommended_model' => [
                'Passenger' => ['Treo', 'UDO', 'e-Alfa', 'Alfa', 'Other'],
                'Cargo' => ['Zor Grand', 'ZEO', 'Jeeto', 'Other'],
            ],
            'hotspot' => [
                'Passenger' => [
                    'Railway stations and bus stands',
                    'Metro stations where applicable',
                    'IT parks and industrial estates',
                    'Hospitals and institutions',
                    'Tourist locations',
                    'Auto stands',
                    'High-density residential clusters',
                ],
                'Cargo' => [
                    'Wholesale markets and vegetable/fruit mandis',
                    'FMCG distributor clusters',
                    'Warehouses and dark stores',
                    'Industrial estates',
                    'Textile, hardware and pharma markets',
                    'Dairy distributors',
                    'Courier hubs',
                ],
            ],
        ];

        $descriptions = [
            'HOT' => 'Planning to buy within 0–30 days',
            'WARM' => 'Planning to buy within 31–90 days',
            'COLD' => 'More than 90 days / exploring',
        ];

        foreach ($choices as $field => $values) {
            $scopedChoices[$field][''] = $values;
        }

        $rows = [];
        foreach ($scopedChoices as $field => $scopes) {
            foreach ($scopes as $scope => $values) {
                foreach ($values as $position => $value) {
                    $rows[] = [
                        'field' => $field,
                        'scope' => $scope,
                        'value' => $value,
                        'description' => $field === 'priority' ? $descriptions[$value] : null,
                        'position' => $position,
                        'requires_company' => $field === 'business_type' && in_array($value, ['Company', 'Logistics'], true),
                    ];
                }
            }
        }

        LeadOption::upsert($rows, ['field', 'scope', 'value'], ['description', 'position', 'requires_company']);
    }
}
