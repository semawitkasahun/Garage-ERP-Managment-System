<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('lead_followups', function (Blueprint $table) {
            $table->id('followup_id');
            $table->foreignId('lead_id')->constrained('leads', 'lead_id')->onDelete('cascade');
            $table->dateTime('scheduled_at');
            $table->string('method', 20); // phone, sms, whatsapp, email, in_person
            $table->text('notes')->nullable();
            $table->date('next_followup_date')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users', 'user_id');
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('lead_followups');
    }
};
