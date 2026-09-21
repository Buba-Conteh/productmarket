<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\EarlyAccessSignup;
use Inertia\Inertia;
use Inertia\Response;

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
}
