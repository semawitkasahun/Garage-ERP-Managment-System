<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Enhance work_orders table for complete workflow
        Schema::table('work_orders', function (Blueprint $table) {
            // Mileage tracking
            if (!Schema::hasColumn('work_orders', 'mileage_in')) {
                $table->decimal('mileage_in', 10, 2)->nullable()->after('vehicle_id');
            }
            if (!Schema::hasColumn('work_orders', 'mileage_out')) {
                $table->decimal('mileage_out', 10, 2)->nullable()->after('mileage_in');
            }
            
            // Manual work order flag
            if (!Schema::hasColumn('work_orders', 'is_manual')) {
                $table->boolean('is_manual')->default(false)->after('mileage_out');
            }
            
            // Service bay assignment (commented out - service_bays table may not exist)
            // if (!Schema::hasColumn('work_orders', 'bay_id')) {
            //     $table->foreignId('bay_id')->nullable()->constrained('service_bays', 'bay_id')->nullOnDelete()->after('is_manual');
            // }
            
            // Invoice and payment connections
            if (!Schema::hasColumn('work_orders', 'invoice_id')) {
                $table->foreignId('invoice_id')->nullable()->constrained('invoices', 'invoice_id')->nullOnDelete()->after('completed_at');
            }
            // Payment connection (commented out - payments table may not exist)
            // if (!Schema::hasColumn('work_orders', 'payment_id')) {
            //     $table->foreignId('payment_id')->nullable()->constrained('payments', 'payment_id')->nullOnDelete()->after('invoice_id');
            // }
            
            // Enhanced status tracking
            if (!Schema::hasColumn('work_orders', 'qc_status')) {
                $table->string('qc_status', 50)->default('pending')->after('status');
            }
            if (!Schema::hasColumn('work_orders', 'qc_performed_at')) {
                $table->timestamp('qc_performed_at')->nullable()->after('qc_status');
            }
            if (!Schema::hasColumn('work_orders', 'qc_performed_by')) {
                $table->foreignId('qc_performed_by')->nullable()->constrained('users', 'user_id')->nullOnDelete()->after('qc_performed_at');
            }
            
            // Time tracking
            if (!Schema::hasColumn('work_orders', 'estimated_completion_date')) {
                $table->date('estimated_completion_date')->nullable()->after('qc_performed_by');
            }
        });
        
        // Enhance job_cards table for service management
        Schema::table('job_cards', function (Blueprint $table) {
            // Service connection (commented out - services table may not exist)
            // if (!Schema::hasColumn('job_cards', 'service_id')) {
            //     $table->foreignId('service_id')->nullable()->constrained('services', 'service_id')->nullOnDelete()->after('job_title');
            // }
            
            // Work interruption tracking
            if (!Schema::hasColumn('job_cards', 'pause_count')) {
                $table->integer('pause_count')->default(0)->after('status');
            }
            if (!Schema::hasColumn('job_cards', 'last_paused_at')) {
                $table->timestamp('last_paused_at')->nullable()->after('pause_count');
            }
            if (!Schema::hasColumn('job_cards', 'last_resumed_at')) {
                $table->timestamp('last_resumed_at')->nullable()->after('last_paused_at');
            }
            
            // Estimated completion
            if (!Schema::hasColumn('job_cards', 'estimated_completion_date')) {
                $table->date('estimated_completion_date')->nullable()->after('completed_date');
            }
            
            // Work order supplements
            if (!Schema::hasColumn('job_cards', 'is_supplement')) {
                $table->boolean('is_supplement')->default(false)->after('estimated_completion_date');
            }
            if (!Schema::hasColumn('job_cards', 'supplement_quotation_id')) {
                $table->foreignId('supplement_quotation_id')->nullable()->constrained('quotations', 'quotation_id')->nullOnDelete()->after('is_supplement');
            }
        });
        
        // Create work order supplements table for additional work
        if (!Schema::hasTable('work_order_supplements')) {
            Schema::create('work_order_supplements', function (Blueprint $table) {
                $table->id('supplement_id');
                $table->foreignId('work_order_id')->constrained('work_orders', 'work_order_id')->cascadeOnDelete();
                $table->foreignId('quotation_id')->nullable()->constrained('quotations', 'quotation_id')->nullOnDelete();
                $table->string('supplement_number')->unique();
                $table->string('reason');
                $table->text('description')->nullable();
                $table->decimal('additional_cost', 12, 2)->default(0);
                $table->enum('status', ['draft', 'sent', 'approved', 'rejected'])->default('draft');
                $table->foreignId('created_by')->constrained('users', 'user_id')->restrictOnDelete();
                $table->timestamp('customer_approved_at')->nullable();
                $table->text('rejection_reason')->nullable();
                $table->timestamps();
                
                $table->index('work_order_id');
                $table->index('quotation_id');
                $table->index('status');
            });
        }
        
        // Create work order attachments table for photos/documents
        if (!Schema::hasTable('work_order_attachments')) {
            Schema::create('work_order_attachments', function (Blueprint $table) {
                $table->id('attachment_id');
                $table->foreignId('work_order_id')->constrained('work_orders', 'work_order_id')->cascadeOnDelete();
                $table->foreignId('job_card_id')->nullable()->constrained('job_cards', 'job_card_id')->nullOnDelete();
                $table->string('file_path');
                $table->string('file_name');
                $table->string('file_type', 50);
                $table->bigInteger('file_size');
                $table->string('description')->nullable();
                $table->foreignId('uploaded_by')->constrained('users', 'user_id')->restrictOnDelete();
                $table->timestamps();
                
                $table->index('work_order_id');
                $table->index('job_card_id');
                $table->index('file_type');
            });
        }
        
        // Create QC checklist items table for standardized quality checks
        // Commented out - will handle separately to avoid foreign key issues
        // if (!Schema::hasTable('qc_checklist_items')) {
        //     Schema::create('qc_checklist_items', function (Blueprint $table) {
        //         $table->id('checklist_item_id');
        //         $table->string('item_name');
        //         $table->text('description')->nullable();
        //         $table->string('category', 50); // e.g., 'exterior', 'interior', 'mechanical', 'safety'
        //         $table->boolean('is_required')->default(true);
        //         $table->integer('sort_order')->default(0);
        //         $table->boolean('is_active')->default(true);
        //         $table->timestamps();
        //         
        //         $table->index('category');
        //         $table->index('is_active');
        //     });
        // }
        
        // Create QC checklist results table for tracking actual QC checks
        if (!Schema::hasTable('qc_checklist_results')) {
            Schema::create('qc_checklist_results', function (Blueprint $table) {
                $table->id('result_id');
                $table->foreignId('qc_result_id')->constrained('job_card_qc_results', 'qc_result_id')->cascadeOnDelete();
                $table->unsignedBigInteger('checklist_item_id')->nullable();
                $table->enum('status', ['passed', 'failed', 'not_applicable'])->default('not_applicable');
                $table->text('notes')->nullable();
                $table->timestamps();
                
                $table->index('qc_result_id');
                $table->index('checklist_item_id');
            });
        }
    }

    public function down(): void
    {
        // Drop new tables
        Schema::dropIfExists('qc_checklist_results');
        // Schema::dropIfExists('qc_checklist_items'); // Commented out - will handle separately
        Schema::dropIfExists('work_order_attachments');
        Schema::dropIfExists('work_order_supplements');
        
        // Revert job_cards table changes
        Schema::table('job_cards', function (Blueprint $table) {
            if (Schema::hasColumn('job_cards', 'supplement_quotation_id')) {
                $table->dropForeign(['supplement_quotation_id']);
                $table->dropColumn('supplement_quotation_id');
            }
            if (Schema::hasColumn('job_cards', 'is_supplement')) {
                $table->dropColumn('is_supplement');
            }
            if (Schema::hasColumn('job_cards', 'estimated_completion_date')) {
                $table->dropColumn('estimated_completion_date');
            }
            if (Schema::hasColumn('job_cards', 'last_resumed_at')) {
                $table->dropColumn('last_resumed_at');
            }
            if (Schema::hasColumn('job_cards', 'last_paused_at')) {
                $table->dropColumn('last_paused_at');
            }
            if (Schema::hasColumn('job_cards', 'pause_count')) {
                $table->dropColumn('pause_count');
            }
            // if (Schema::hasColumn('job_cards', 'service_id')) {
            //     $table->dropForeign(['service_id']);
            //     $table->dropColumn('service_id');
            // }
        });
        
        // Revert work_orders table changes
        Schema::table('work_orders', function (Blueprint $table) {
            if (Schema::hasColumn('work_orders', 'estimated_completion_date')) {
                $table->dropColumn('estimated_completion_date');
            }
            if (Schema::hasColumn('work_orders', 'qc_performed_by')) {
                $table->dropForeign(['qc_performed_by']);
                $table->dropColumn('qc_performed_by');
            }
            if (Schema::hasColumn('work_orders', 'qc_performed_at')) {
                $table->dropColumn('qc_performed_at');
            }
            if (Schema::hasColumn('work_orders', 'qc_status')) {
                $table->dropColumn('qc_status');
            }
            // if (Schema::hasColumn('work_orders', 'payment_id')) {
            //     $table->dropForeign(['payment_id']);
            //     $table->dropColumn('payment_id');
            // }
            if (Schema::hasColumn('work_orders', 'invoice_id')) {
                $table->dropForeign(['invoice_id']);
                $table->dropColumn('invoice_id');
            }
            // if (Schema::hasColumn('work_orders', 'bay_id')) {
            //     $table->dropForeign(['bay_id']);
            //     $table->dropColumn('bay_id');
            // }
            if (Schema::hasColumn('work_orders', 'is_manual')) {
                $table->dropColumn('is_manual');
            }
            if (Schema::hasColumn('work_orders', 'mileage_out')) {
                $table->dropColumn('mileage_out');
            }
            if (Schema::hasColumn('work_orders', 'mileage_in')) {
                $table->dropColumn('mileage_in');
            }
        });
    }
};