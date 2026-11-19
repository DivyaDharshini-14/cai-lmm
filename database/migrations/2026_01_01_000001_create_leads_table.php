<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('leads', function (Blueprint $table) {
            $table->id();
            $table->string('lead_source', 120);
            $table->string('business_type', 120);
            $table->string('company_name')->nullable();
            $table->string('location');
            $table->string('customer_name');
            $table->string('mobile', 10);
            $table->string('email', 254)->nullable();
            $table->string('application', 120);
            $table->string('vehicle_category', 120);
            $table->string('hotspot', 120);
            $table->string('current_vehicle', 120)->nullable();
            $table->string('exchange', 120)->nullable();
            $table->string('recommended_model', 120);
            $table->string('test_drive', 120)->nullable();
            $table->string('finance', 120)->nullable();
            $table->string('priority', 120);
            $table->date('follow_up_date');
            $table->text('remarks')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('leads');
    }
};
