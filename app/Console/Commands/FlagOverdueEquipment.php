<?php

namespace App\Console\Commands;

use App\Models\Equipment;
use Illuminate\Console\Command;

class FlagOverdueEquipment extends Command
{
  protected $signature = 'equipment:flag-overdue';
  protected $description = 'Flag Checked Out equipment past its due date as Overdue';

  public function handle(): int
  {
    $count = Equipment::where('status', 'Checked Out')
      ->whereHas('checkouts', function ($query) {
        $query->whereNull('returned_at')->where('due_at', '<', now());
      })
      ->update(['status' => 'Overdue']);

    $this->info("Flagged {$count} equipment item(s) as Overdue.");
    return self::SUCCESS;
  }
}