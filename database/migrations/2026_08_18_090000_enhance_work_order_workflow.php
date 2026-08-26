<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Enhance work_orders table
        Schema::table('work_orders', function (Blueprint $table) {
            // Work Order identification
            if (!Schema::hasColumn('work_orders', 'work_order_number')) {
                $table->string('work_order_number')->unique()->after('work_order_id');
            }
            
            // Staff assignments
            if (!Schema::hasColumn('work_orders', 'supervisor_id')) {
                $table->foreignId('supervisor_id')->nullable()->constrained('users', 'user_id')->nullOnDelete()->after('section_id');
            }
            if (!Schema::hasColumn('work_orders', 'service_advisor_id')) {
                $table->foreignId('service_advisor_id')->nullable()->constrained('users', 'user_id')->nullOnDelete()->after('supervisor_id');
            }
            
            // Priority and tracking
            if (!Schema::hasColumn('work_orders', 'priority')) {
                $table->string('priority', 20)->default('normal')->after('status');
            }
            
            // Work tracking
            if (!Schema::hasColumn('work_orders', 'started_at')) {
                $table->timestamp('started_at')->nullable()->after('completed_at');
            }
            if (!Schema::hasColumn('work_orders', 'started_by')) {
                $table->foreignId('started_by')->nullable()->constrained('users', 'user_id')->nullOnDelete()->after('started_at');
            }
            
            // Status update to support full workflow
            if (Schema::hasColumn('work_orders', 'status')) {
                $table->string('status', 50)->nullable()->change();
            }
        });
        
        // Enhance job_cards table
        Schema::table('job_cards', function (Blueprint $table) {
            // Job Card identification
            if (!Schema::hasColumn('job_cards', 'job_card_number')) {
                $table->string('job_card_number')->unique()->after('job_card_id');
            }
            
            // Job details
            if (!Schema::hasColumn('job_cards', 'job_title')) {
                $table->string('job_title')->after('description');
            }
            if (!Schema::hasColumn('job_cards', 'customer_complaint_related')) {
                $table->text('customer_complaint_related')->nullable()->after('job_title');
            }
            
            // Technician assignment
            if (!Schema::hasColumn('job_cards', 'assigned_technician_id')) {
                $table->foreignId('assigned_technician_id')->nullable()->constrained('users', 'user_id')->nullOnDelete()->after('priority');
            }
            
            // Labor tracking
            if (!Schema::hasColumn('job_cards', 'estimated_labor_hours')) {
                $table->decimal('estimated_labor_hours', 8, 2)->default(0)->after('assigned_technician_id');
            }
            if (!Schema::hasColumn('job_cards', 'actual_labor_hours')) {
                $table->decimal('actual_labor_hours', 8, 2)->default(0)->after('estimated_labor_hours');
            }
            
            // Cost tracking (internal costs)
            if (!Schema::hasColumn('job_cards', 'labor_cost')) {
                $table->decimal('labor_cost', 12, 2)->default(0)->after('actual_labor_hours');
            }
            if (!Schema::hasColumn('job_cards', 'parts_cost')) {
                $table->decimal('parts_cost', 12, 2)->default(0)->after('labor_cost');
            }
            if (!Schema::hasColumn('job_cards', 'other_cost')) {
                $table->decimal('other_cost', 12, 2)->default(0)->after('parts_cost');
            }
            if (!Schema::hasColumn('job_cards', 'estimated_total_cost')) {
                $table->decimal('estimated_total_cost', 12, 2)->default(0)->after('other_cost');
            }
            if (!Schema::hasColumn('job_cards', 'actual_total_cost')) {
                $table->decimal('actual_total_cost', 12, 2)->default(0)->after('estimated_total_cost');
            }
            
            // Technician notes and completion
            if (!Schema::hasColumn('job_cards', 'technician_notes')) {
                $table->text('technician_notes')->nullable()->after('actual_total_cost');
            }
            if (!Schema::hasColumn('job_cards', 'created_date')) {
                $table->timestamp('created_date')->nullable()->after('technician_notes');
            }
            if (!Schema::hasColumn('job_cards', 'completed_date')) {
                $table->timestamp('completed_date')->nullable()->after('created_date');
            }
            
            // Status update to support full workflow
            if (Schema::hasColumn('job_cards', 'status')) {
                $table->string('status', 50)->nullable()->change();
            }
            
            // Add foreign key constraint for work_order_id if it doesn't exist
            if (Schema::hasColumn('job_cards', 'work_order_id')) {
                $table->foreign('work_order_id')->references('work_order_id')->on('work_orders')->nullOnDelete();
            }
        });
        
        // Enhance quotations table
        Schema::table('quotations', function (Blueprint $table) {
            // Add checkin_id if not exists (already exists in inspection_id but we need direct checkin link)
            if (!Schema::hasColumn('quotations', 'checkin_id')) {
                $table->foreignId('checkin_id')->nullable()->constrained('vehicle_checkins', 'checkin_id')->nullOnDelete()->after('inspection_id');
            }
            
            // Add work_order_id
            if (!Schema::hasColumn('quotations', 'work_order_id')) {
                $table->foreignId('work_order_id')->nullable()->constrained('work_orders', 'work_order_id')->nullOnDelete()->after('checkin_id');
            }
            
            // Customer approval tracking
            if (!Schema::hasColumn('quotations', 'customer_approval_status')) {
                $table->string('customer_approval_status', 50)->default('draft')->after('status');
            }
            if (!Schema::hasColumn('quotations', 'customer_approved_at')) {
                $table->timestamp('customer_approved_at')->nullable()->after('customer_approval_status');
            }
            if (!Schema::hasColumn('quotations', 'customer_approved_by')) {
                $table->foreignId('customer_approved_by')->nullable()->constrained('users', 'user_id')->nullOnDelete()->after('customer_approved_at');
            }
            if (!Schema::hasColumn('quotations', 'sent_to_customer_at')) {
                $table->timestamp('sent_to_customer_at')->nullable()->after('customer_approved_by');
            }
            if (!Schema::hasColumn('quotations', 'sent_via')) {
                $table->string('sent_via', 50)->nullable()->after('sent_to_customer_at');
            }
            if (!Schema::hasColumn('quotations', 'rejection_reason')) {
                $table->text('rejection_reason')->nullable()->after('sent_via');
            }
            
            // Update status to support full workflow
            if (Schema::hasColumn('quotations', 'status')) {
                $table->string('status', 50)->nullable()->change();
            }
        });
        
        // Create job card parts table for tracking parts usage per job card
        if (!Schema::hasTable('job_card_parts')) {
            Schema::create('job_card_parts', function (Blueprint $table) {
                $table->id('job_card_part_id');
                $table->foreignId('job_card_id')->constrained('job_cards', 'job_card_id')->cascadeOnDelete();
                $table->foreignId('inventory_item_id')->constrained('inventory_items', 'item_id')->restrictOnDelete();
                $table->decimal('requested_quantity', 8, 2)->default(0);
                $table->decimal('issued_quantity', 8, 2)->default(0);
                $table->decimal('used_quantity', 8, 2)->default(0);
                $table->decimal('returned_quantity', 8, 2)->default(0);
                $table->decimal('unit_cost', 12, 2)->default(0);
                $table->decimal('total_cost', 12, 2)->default(0);
                $table->text('notes')->nullable();
                $table->timestamps();
                
                $table->index('job_card_id');
                $table->index('inventory_item_id');
            });
        }
        
        // Create job card labor table for tracking labor time per job card
        if (!Schema::hasTable('job_card_labor')) {
            Schema::create('job_card_labor', function (Blueprint $table) {
                $table->id('labor_id');
                $table->foreignId('job_card_id')->constrained('job_cards', 'job_card_id')->cascadeOnDelete();
                $table->foreignId('technician_id')->constrained('users', 'user_id')->restrictOnDelete();
                $table->timestamp('start_time');
                $table->timestamp('end_time')->nullable();
                $table->decimal('hours_worked', 8, 2)->default(0);
                $table->decimal('hourly_rate', 12, 2)->default(0);
                $table->decimal('labor_cost', 12, 2)->default(0);
                $table->text('notes')->nullable();
                $table->timestamps();
                
                $table->index('job_card_id');
                $table->index('technician_id');
            });
        }
        
        // Create work order activities table for audit trail
        if (!Schema::hasTable('work_order_activities')) {
            Schema::create('work_order_activities', function (Blueprint $table) {
                $table->id('activity_id');
                $table->foreignId('work_order_id')->constrained('work_orders', 'work_order_id')->cascadeOnDelete();
                $table->foreignId('job_card_id')->nullable()->constrained('job_cards', 'job_card_id')->nullOnDelete();
                $table->string('action', 100);
                $table->text('description')->nullable();
                $table->foreignId('performed_by')->constrained('users', 'user_id')->restrictOnDelete();
                $table->timestamp('performed_at')->default(now());
                $table->json('old_values')->nullable();
                $table->json('new_values')->nullable();
                
                $table->index('work_order_id');
                $table->index('job_card_id');
                $table->index('performed_at');
            });
        }
        
        // Create QC checklist results table for job cards
        if (!Schema::hasTable('job_card_qc_results')) {
            Schema::create('job_card_qc_results', function (Blueprint $table) {
                $table->id('qc_result_id');
                $table->foreignId('job_card_id')->constrained('job_cards', 'job_card_id')->cascadeOnDelete();
                $table->foreignId('inspector_id')->constrained('users', 'user_id')->restrictOnDelete();
                $table->enum('qc_status', ['passed', 'needs_rework', 'failed'])->default('needs_rework');
                $table->text('qc_notes')->nullable();
                $table->timestamp('qc_performed_at')->default(now());
                $table->timestamps();
                
                $table->index('job_card_id');
                $table->index('qc_status');
            });
        }
    }

    public function down(): void
    {
        // Drop new tables
        Schema::dropIfExists('job_card_qc_results');
        Schema::dropIfExists('work_order_activities');
        Schema::dropIfExists('job_card_labor');
        Schema::dropIfExists('job_card_parts');
        
        // Revert quotations table changes
        Schema::table('quotations', function (Blueprint $table) {
            if (Schema::hasColumn('quotations', 'rejection_reason')) {
                $table->dropColumn('rejection_reason');
            }
            if (Schema::hasColumn('quotations', 'sent_via')) {
                $table->dropColumn('sent_via');
            }
            if (Schema::hasColumn('quotations', 'sent_to_customer_at')) {
                $table->dropColumn('sent_to_customer_at');
            }
            if (Schema::hasColumn('quotations', 'customer_approved_by')) {
                $table->dropForeign(['customer_approved_by']);
                $table->dropColumn('customer_approved_by');
            }
            if (Schema::hasColumn('quotations', 'customer_approved_at')) {
                $table->dropColumn('customer_approved_at');
            }
            if (Schema::hasColumn('quotations', 'customer_approval_status')) {
                $table->dropColumn('customer_approval_status');
            }
            if (Schema::hasColumn('quotations', 'work_order_id')) {
                $table->dropForeign(['work_order_id']);
                $table->dropColumn('work_order_id');
            }
            if (Schema::hasColumn('quotations', 'checkin_id')) {
                $table->dropForeign(['checkin_id']);
                $table->dropColumn('checkin_id');
            }
        });
        
        // Revert job_cards table changes
        Schema::table('job_cards', function (Blueprint $table) {
            if (Schema::hasColumn('job_cards', 'completed_date')) {
                $table->dropColumn('completed_date');
            }
            if (Schema::hasColumn('job_cards', 'created_date')) {
                $table->dropColumn('created_date');
            }
            if (Schema::hasColumn('job_cards', 'technician_notes')) {
                $table->dropColumn('technician_notes');
            }
            if (Schema::hasColumn('job_cards', 'actual_total_cost')) {
                $table->dropColumn('actual_total_cost');
            }
            if (Schema::hasColumn('job_cards', 'estimated_total_cost')) {
                $table->dropColumn('estimated_total_cost');
            }
            if (Schema::hasColumn('job_cards', 'other_cost')) {
                $table->dropColumn('other_cost');
            }
            if (Schema::hasColumn('job_cards', 'parts_cost')) {
                $table->dropColumn('parts_cost');
            }
            if (Schema::hasColumn('job_cards', 'labor_cost')) {
                $table->dropColumn('labor_cost');
            }
            if (Schema::hasColumn('job_cards', 'actual_labor_hours')) {
                $table->dropColumn('actual_labor_hours');
            }
            if (Schema::hasColumn('job_cards', 'estimated_labor_hours')) {
                $table->dropColumn('estimated_labor_hours');
            }
            if (Schema::hasColumn('job_cards', 'assigned_technician_id')) {
                $table->dropForeign(['assigned_technician_id']);
                $table->dropColumn('assigned_technician_id');
            }
            if (Schema::hasColumn('job_cards', 'customer_complaint_related')) {
                $table->dropColumn('customer_complaint_related');
            }
            if (Schema::hasColumn('job_cards', 'job_title')) {
                $table->dropColumn('job_title');
            }
            if (Schema::hasColumn('job_cards', 'job_card_number')) {
                $table->dropColumn('job_card_number');
            }
        });
        
        // Revert work_orders table changes
        Schema::table('work_orders', function (Blueprint $table) {
            if (Schema::hasColumn('work_orders', 'started_by')) {
                $table->dropForeign(['started_by']);
                $table->dropColumn('started_by');
            }
            if (Schema::hasColumn('work_orders', 'started_at')) {
                $table->dropColumn('started_at');
            }
            if (Schema::hasColumn('work_orders', 'priority')) {
                $table->dropColumn('priority');
            }
            if (Schema::hasColumn('work_orders', 'service_advisor_id')) {
                $table->dropForeign(['service_advisor_id']);
                $table->dropColumn('service_advisor_id');
            }
            if (Schema::hasColumn('work_orders', 'supervisor_id')) {
                $table->dropForeign(['supervisor_id']);
                $table->dropColumn('supervisor_id');
            }
            if (Schema::hasColumn('work_orders', 'work_order_number')) {
                $table->dropColumn('work_order_number');
            }
        });
    }
};