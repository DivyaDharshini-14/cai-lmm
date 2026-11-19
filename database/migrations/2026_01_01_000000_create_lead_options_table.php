<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lead_options', function (Blueprint $table) {
            $table->id();
            $table->string('field', 32);
            $table->string('scope', 120)->default('');
            $table->string('value', 120);
            $table->string('description')->nullable();
            $table->unsignedSmallInteger('position');
            $table->boolean('requires_company')->default(false);
            $table->unique(['field', 'scope', 'value']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lead_options');
    }
};
