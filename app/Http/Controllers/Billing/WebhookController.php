<?php

declare(strict_types=1);

namespace App\Http\Controllers\Billing;

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
        // Defer to Cashier default handling
        return parent::handleCustomerSubscriptionCreated($payload);
    }

    /**
     * Handle subscription updated (plan swaps, renewals, cancellations).
     */
    protected function handleCustomerSubscriptionUpdated(array $payload): Response
    {
        return parent::handleCustomerSubscriptionUpdated($payload);
    }

    /**
     * Handle subscription deleted (hard cancellation).
     */
    protected function handleCustomerSubscriptionDeleted(array $payload): Response
    {
        return parent::handleCustomerSubscriptionDeleted($payload);
    }

    /**
     * Handle invoice payment failure — alert admin after repeat failures.
     */
    protected function handleInvoicePaymentFailed(array $payload): Response
    {
        $invoice = $payload['data']['object'];
        $attemptCount = $invoice['attempt_count'] ?? 1;

        if ($attemptCount >= 2) {
            // Two or more failures — log for admin review.
            Log::warning('Stripe invoice payment failed twice', [
                'customer' => $invoice['customer'] ?? null,
                'invoice_id' => $invoice['id'] ?? null,
                'amount_due' => $invoice['amount_due'] ?? null,
            ]);
        }

        return new Response('Webhook Handled', 200);
    }
}
