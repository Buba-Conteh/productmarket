<?php

declare(strict_types=1);

namespace App\Http\Controllers\Billing;

use App\Http\Controllers\Controller;
use App\Models\CreatorProfile;
use App\Services\StripeConnectService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Stripe\Account;
use Stripe\Exception\SignatureVerificationException;
use Stripe\Webhook;
use Symfony\Component\HttpFoundation\Response;

/**
 * Receives Stripe Connect events (events on creators' connected accounts).
 * Stripe sends these to a separate "Connect" endpoint with its own signing
 * secret, so they cannot share Cashier's /stripe/webhook route.
 */
final class ConnectWebhookController extends Controller
{
    public function __invoke(Request $request, StripeConnectService $stripeConnect): Response
    {
        $secret = config('services.stripe.connect_webhook_secret');

        if (! $secret) {
            Log::error('Stripe Connect webhook received but STRIPE_CONNECT_WEBHOOK_SECRET is not set.');

            return response('Webhook secret not configured', 500);
        }

        try {
            $event = Webhook::constructEvent(
                $request->getContent(),
                (string) $request->header('Stripe-Signature'),
                $secret,
            );
        } catch (SignatureVerificationException|\UnexpectedValueException) {
            return response('Invalid signature', 400);
        }

        if ($event->type === 'account.updated') {
            /** @var Account $account */
            $account = $event->data->object;

            $profile = CreatorProfile::where('stripe_connect_id', $account->id)->first();

            if ($profile) {
                $stripeConnect->applyAccountStatus($profile, $account);
            }
        }

        return response('Webhook Handled', 200);
    }
}
