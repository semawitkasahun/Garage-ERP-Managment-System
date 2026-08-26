<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('vehicle_checkins', function (Blueprint $table) {
            // Inspection workflow fields - only add if they don't exist
            if (!Schema::hasColumn('vehicle_checkins', 'checkin_status')) {
                $table->enum('checkin_status', ['in_progress', 'inspection_pending', 'inspection_in_progress', 'inspection_completed', 'review_pending', 'signature_pending', 'signature_declined', 'completed'])->default('in_progress')->after('checked_in_at');
            }
            
            // Inspector information
            if (!Schema::hasColumn('vehicle_checkins', 'inspector_id')) {
                $table->foreignId('inspector_id')->nullable()->constrained('users', 'user_id')->nullOnDelete()->after('checked_in_by');
            }
            if (!Schema::hasColumn('vehicle_checkins', 'inspection_started_at')) {
                $table->timestamp('inspection_started_at')->nullable()->after('checkin_status');
            }
            if (!Schema::hasColumn('vehicle_checkins', 'inspection_completed_at')) {
                $table->timestamp('inspection_completed_at')->nullable()->after('inspection_started_at');
            }
            
            // Signature information
            if (!Schema::hasColumn('vehicle_checkins', 'customer_signed_at')) {
                $table->timestamp('customer_signed_at')->nullable()->after('signature_file');
            }
            if (!Schema::hasColumn('vehicle_checkins', 'signature_decline_reason')) {
                $table->text('signature_decline_reason')->nullable()->after('customer_signed_at');
            }
            if (!Schema::hasColumn('vehicle_checkins', 'signature_declined_by')) {
                $table->foreignId('signature_declined_by')->nullable()->constrained('users', 'user_id')->nullOnDelete()->after('signature_decline_reason');
            }
            
            // Completion information
            if (!Schema::hasColumn('vehicle_checkins', 'checkin_completed_at')) {
                $table->timestamp('checkin_completed_at')->nullable()->after('signature_declined_by');
            }
            if (!Schema::hasColumn('vehicle_checkins', 'checkin_completed_by')) {
                $table->foreignId('checkin_completed_by')->nullable()->constrained('users', 'user_id')->nullOnDelete()->after('checkin_completed_at');
            }
            
            // Work Order reference
            if (!Schema::hasColumn('vehicle_checkins', 'work_order_id')) {
                $table->foreignId('work_order_id')->nullable()->constrained('work_orders', 'work_order_id')->nullOnDelete()->after('checkin_completed_by');
            }
            
            // Additional inspection notes
            if (!Schema::hasColumn('vehicle_checkins', 'inspection_notes')) {
                $table->text('inspection_notes')->nullable()->after('customer_complaint');
            }
        });
        
        // Create inspection categories table
        if (!Schema::hasTable('inspection_categories')) {
            Schema::create('inspection_categories', function (Blueprint $table) {
                $table->id('category_id');
                $table->string('name')->unique();
                $table->string('display_name');
                $table->integer('sort_order')->default(0);
                $table->timestamps();
            });
        }
        
        // Create inspection items table
        if (!Schema::hasTable('inspection_items')) {
            Schema::create('inspection_items', function (Blueprint $table) {
                $table->id('item_id');
                $table->foreignId('category_id')->constrained('inspection_categories', 'category_id')->cascadeOnDelete();
                $table->string('name');
                $table->string('display_name');
                $table->integer('sort_order')->default(0);
                $table->boolean('is_required')->default(false);
                $table->timestamps();
            });
        }
        
        // Create checkin inspection results table
        if (!Schema::hasTable('checkin_inspections')) {
            Schema::create('checkin_inspections', function (Blueprint $table) {
                $table->id('inspection_id');
                $table->foreignId('checkin_id')->constrained('vehicle_checkins', 'checkin_id')->cascadeOnDelete();
                $table->foreignId('inspector_id')->constrained('users', 'user_id')->restrictOnDelete();
                $table->timestamp('started_at')->nullable();
                $table->timestamp('completed_at')->nullable();
                $table->text('general_notes')->nullable();
                $table->timestamps();
            });
        }
        
        // Create checkin inspection item results table
        if (!Schema::hasTable('checkin_inspection_item_results')) {
            Schema::create('checkin_inspection_item_results', function (Blueprint $table) {
                $table->id('result_id');
                $table->foreignId('inspection_id')->constrained('checkin_inspections', 'inspection_id')->cascadeOnDelete();
                $table->foreignId('inspection_item_id')->constrained('inspection_items', 'item_id')->cascadeOnDelete();
                $table->enum('status', ['ok', 'needs_attention', 'na'])->default('ok');
                $table->text('notes')->nullable();
                $table->timestamps();
            });
        }
        
        // Create vehicle damage records table
        if (!Schema::hasTable('vehicle_damage_records')) {
            Schema::create('vehicle_damage_records', function (Blueprint $table) {
                $table->id('damage_id');
                $table->foreignId('checkin_id')->constrained('vehicle_checkins', 'checkin_id')->cascadeOnDelete();
                $table->string('damage_type'); // scratch, dent, crack, broken_part, paint_damage, missing_part, other
                $table->string('location');
                $table->text('description')->nullable();
                $table->string('photo_path')->nullable();
                $table->boolean('is_existing_damage')->default(true); // true = existing damage, false = new damage
                $table->timestamps();
            });
        }
        
        // Seed inspection categories and items only if they're empty
        if (\DB::table('inspection_categories')->count() === 0) {
            $this->seedInspectionData();
        }
    }
    
    private function seedInspectionData()
    {
        $categories = [
            ['name' => 'exterior', 'display_name' => 'Exterior', 'sort_order' => 1],
            ['name' => 'interior', 'display_name' => 'Interior', 'sort_order' => 2],
            ['name' => 'tires_wheels', 'display_name' => 'Tires & Wheels', 'sort_order' => 3],
            ['name' => 'lights', 'display_name' => 'Lights', 'sort_order' => 4],
            ['name' => 'engine_fluids', 'display_name' => 'Engine / Fluids', 'sort_order' => 5],
            ['name' => 'safety', 'display_name' => 'Safety', 'sort_order' => 6],
        ];
        
        foreach ($categories as $category) {
            \DB::table('inspection_categories')->insert($category);
        }
        
        $exteriorItems = [
            ['Front bumper', 'front_bumper', 1],
            ['Rear bumper', 'rear_bumper', 2],
            ['Hood', 'hood', 3],
            ['Roof', 'roof', 4],
            ['Trunk', 'trunk', 5],
            ['Left front door', 'left_front_door', 6],
            ['Left rear door', 'left_rear_door', 7],
            ['Right front door', 'right_front_door', 8],
            ['Right rear door', 'right_rear_door', 9],
            ['Fenders', 'fenders', 10],
            ['Side mirrors', 'side_mirrors', 11],
            ['Handles', 'handles', 12],
            ['Paint/body condition', 'paint_body_condition', 13],
            ['Windshield', 'windshield', 14],
            ['Windows', 'windows', 15],
        ];
        
        $interiorItems = [
            ['Driver seat', 'driver_seat', 1],
            ['Passenger seats', 'passenger_seats', 2],
            ['Rear seats', 'rear_seats', 3],
            ['Dashboard', 'dashboard', 4],
            ['Steering wheel', 'steering_wheel', 5],
            ['Floor/carpet', 'floor_carpet', 6],
            ['Floor mats', 'floor_mats', 7],
            ['Interior trim', 'interior_trim', 8],
            ['Center console', 'center_console', 9],
            ['Infotainment system', 'infotainment_system', 10],
            ['Air conditioning/heating', 'ac_heating', 11],
            ['Interior lights', 'interior_lights', 12],
            ['Power windows', 'power_windows', 13],
            ['Door locks', 'door_locks', 14],
        ];
        
        $tiresItems = [
            ['Front left tire', 'front_left_tire', 1],
            ['Front right tire', 'front_right_tire', 2],
            ['Rear left tire', 'rear_left_tire', 3],
            ['Rear right tire', 'rear_right_tire', 4],
            ['Spare tire', 'spare_tire', 5],
            ['Rims/wheels', 'rims_wheels', 6],
            ['Tire pressure', 'tire_pressure', 7],
        ];
        
        $lightsItems = [
            ['Headlights', 'headlights', 1],
            ['High beams', 'high_beams', 2],
            ['Brake lights', 'brake_lights', 3],
            ['Tail lights', 'tail_lights', 4],
            ['Turn signals', 'turn_signals', 5],
            ['Hazard lights', 'hazard_lights', 6],
            ['Reverse lights', 'reverse_lights', 7],
            ['Fog lights', 'fog_lights', 8],
        ];
        
        $engineItems = [
            ['Engine condition', 'engine_condition', 1],
            ['Engine oil', 'engine_oil', 2],
            ['Coolant', 'coolant', 3],
            ['Brake fluid', 'brake_fluid', 4],
            ['Transmission fluid', 'transmission_fluid', 5],
            ['Power steering fluid', 'power_steering_fluid', 6],
            ['Windshield washer fluid', 'windshield_washer_fluid', 7],
            ['Battery condition', 'battery_condition', 8],
            ['Visible leaks', 'visible_leaks', 9],
        ];
        
        $safetyItems = [
            ['Seat belts', 'seat_belts', 1],
            ['Brakes', 'brakes', 2],
            ['Parking brake', 'parking_brake', 3],
            ['Horn', 'horn', 4],
            ['Airbag warning light', 'airbag_warning_light', 5],
            ['ABS warning light', 'abs_warning_light', 6],
            ['Check engine light', 'check_engine_light', 7],
            ['Other dashboard warning lights', 'other_dashboard_lights', 8],
        ];
        
        $categoryMap = [
            'exterior' => $exteriorItems,
            'interior' => $interiorItems,
            'tires_wheels' => $tiresItems,
            'lights' => $lightsItems,
            'engine_fluids' => $engineItems,
            'safety' => $safetyItems,
        ];
        
        foreach ($categoryMap as $categoryName => $items) {
            $category = \DB::table('inspection_categories')->where('name', $categoryName)->first();
            if ($category) {
                foreach ($items as $item) {
                    \DB::table('inspection_items')->insert([
                        'category_id' => $category->category_id,
                        'name' => $item[1],
                        'display_name' => $item[0],
                        'sort_order' => $item[2],
                    ]);
                }
            }
        }
    }

    public function down(): void
    {
        Schema::table('vehicle_checkins', function (Blueprint $table) {
            $table->dropColumn([
                'checkin_status',
                'inspector_id',
                'inspection_started_at',
                'inspection_completed_at',
                'customer_signed_at',
                'signature_decline_reason',
                'signature_declined_by',
                'checkin_completed_at',
                'checkin_completed_by',
                'work_order_id',
                'inspection_notes',
            ]);
        });
        
        Schema::dropIfExists('vehicle_damage_records');
        Schema::dropIfExists('checkin_inspection_item_results');
        Schema::dropIfExists('checkin_inspections');
        Schema::dropIfExists('inspection_items');
        Schema::dropIfExists('inspection_categories');
    }
};