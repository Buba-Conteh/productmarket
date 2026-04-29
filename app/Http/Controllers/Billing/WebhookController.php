<?php

declare(strict_types=1);

namespace App\Http\Controllers\Billing;

use App\Models\User;
use App\Services\BillingService;
use Illuminate\Support\Facades\Log;
use Laravel\Cashier\Http\Controllers\WebhookController as CashierWebhook;
use Symfony\Component\HttpFoundation\Response;

final class WebhookController extends CashierWebhook
{
    /**
     * Handle subscription created event.
     */
    protected function handleCustomerSubscriptionCreated(array $payload): Response
    {
        $response = parent::handleCustomerSubscriptionCreated($payload);
        $this->syncUserSubscriptionStatus($payload);

        return $response;
    }

    /**
     * Handle subscription updated (plan swaps, renewals, cancellations).
     */
    protected function handleCustomerSubscriptionUpdated(array $payload): Response
    {
        $response = parent::handleCustomerSubscriptionUpdated($payload);
        $this->syncUserSubscriptionStatus($payload);

        return $response;
    }

    /**
     * Handle subscription deleted (hard cancellation).
     */
    protected function handleCustomerSubscriptionDeleted(array $payload): Response
    {
        $response = parent::handleCustomerSubscriptionDeleted($payload);
        $this->syncUserSubscriptionStatus($payload);

        return $response;
    }

    /**
     * Handle invoice payment failure — alert admin after repeat failures.
     */
    protected function handleInvoicePaymentFailed(array $payload): Response
    {
        $invoice = $payload['data']['object'];
        $attemptCount = $invoice['attempt_count'] ?? 1;

        if ($attemptCount >= 2) {
            Log::warning('Stripe invoice payment failed twice', [
                'customer' => $invoice['customer'] ?? null,
                'invoice_id' => $invoice['id'] ?? null,
                'amount_due' => $invoice['amount_due'] ?? null,
            ]);
        }

        return new Response('Webhook Handled', 200);
    }

    /**
     * Find the user from the webhook payload and sync their subscription status row.
     */
    private function syncUserSubscriptionStatus(array $payload): void
    {
        $stripeCustomerId = $payload['data']['object']['customer'] ?? null;
        $stripeSubId = $payload['data']['object']['id'] ?? null;

        if (! $stripeCustomerId || ! $stripeSubId) {
            return;
        }

        $user = User::where('stripe_id', $stripeCustomerId)->first();

        if (! $user) {
            return;
        }

        // Find which subscription type (brand/creator) this event relates to.
        $subscription = $user->subscriptions()->where('stripe_id', $stripeSubId)->first();

        if (! $subscription) {
            return;
        }

        app(BillingService::class)->syncStatus($user, $subscription->type);
    }
}
