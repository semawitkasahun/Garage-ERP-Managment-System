<?php

use App\Http\Controllers\Api\EquipmentController;
use App\Http\Controllers\Api\EquipmentMissingReportController;
use App\Http\Controllers\Api\EquipmentRequestController;
use App\Http\Controllers\Api\EquipmentTransferController;
use Illuminate\Support\Facades\Route;

Route::get('equipment/stats', [EquipmentController::class, 'stats']);
Route::get('equipment/{equipment}/qr', [EquipmentController::class, 'qrImage'])->name('equipment.qr');
Route::get('equipment/{equipment}/history', [EquipmentController::class, 'history']);
Route::get('equipment/accountability', [EquipmentController::class, 'accountability']);
Route::get('equipment/checkout-log', [EquipmentController::class, 'checkoutLog']);
Route::get('equipment/lookup-by-qr/{token}', [EquipmentController::class, 'lookupByQr']);
Route::apiResource('equipment', EquipmentController::class);

Route::prefix('equipment/{equipment}')->group(function () {
  Route::post('check-out', [EquipmentController::class, 'checkOut']);
  Route::post('check-in', [EquipmentController::class, 'checkIn']);
  Route::post('extend', [EquipmentController::class, 'extend']);
  Route::post('maintenance-logs', [EquipmentController::class, 'storeMaintenanceLog']);
  Route::post('complete-maintenance', [EquipmentController::class, 'completeMaintenance']);
  Route::post('regenerate-qr', [EquipmentController::class, 'regenerateQrCode']);
  Route::post('regenerate-checkout-qr', [EquipmentController::class, 'regenerateCheckoutQrCode']);
});

Route::apiResource('equipment-requests', EquipmentRequestController::class)->only(['index', 'store']);
Route::prefix('equipment-requests/{equipmentRequest}')->group(function () {
  Route::post('approve', [EquipmentRequestController::class, 'approve']);
  Route::post('reject', [EquipmentRequestController::class, 'reject']);
  Route::post('issue', [EquipmentRequestController::class, 'issue']);
});

Route::get('equipment-missing-reports', [EquipmentMissingReportController::class, 'index']);
Route::post('equipment-missing-reports/{equipmentMissingReport}/resolve', [EquipmentMissingReportController::class, 'resolve']);
Route::post('equipment/{equipment}/report-missing', [EquipmentMissingReportController::class, 'store']);
Route::get('equipment-transfers', [EquipmentTransferController::class, 'index']);
Route::post('equipment/{equipment}/transfer', [EquipmentTransferController::class, 'store']);