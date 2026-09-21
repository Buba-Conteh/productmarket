<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\EarlyAccessSignup;
use Illuminate\Support\Facades\Response as ResponseFacade;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Read-only admin view of the temporary /early-access waitlist — see
 * context/features/early-access-signup.md.
 */
final class AdminEarlyAccessController extends Controller
{
    public function index(): Response
    {
        $signups = EarlyAccessSignup::orderByDesc('created_at')->paginate(20);

        return Inertia::render('admin/early-access/index', [
            'signups' => $signups,
        ]);
    }

    /**
     * Download the full waitlist as a CSV email list.
     */
    public function exportCsv(): StreamedResponse
    {
        $filename = 'early-access-waitlist-'.now()->format('Y-m-d').'.csv';

        return ResponseFacade::streamDownload(function (): void {
            $handle = fopen('php://output', 'w');

            fputcsv($handle, ['Name', 'Email', 'Role', 'Joined At']);

            EarlyAccessSignup::orderByDesc('created_at')
                ->chunk(500, function ($signups) use ($handle): void {
                    foreach ($signups as $signup) {
                        fputcsv($handle, [
                            $signup->name,
                            $signup->email,
                            $signup->role,
                            $signup->created_at?->toDateTimeString(),
                        ]);
                    }
                });

            fclose($handle);
        }, $filename, [
            'Content-Type' => 'text/csv',
        ]);
    }
}
