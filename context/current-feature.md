# Current Feature

## 6.8 — Escrow Refund on Campaign Cancellation

## Status

Completed

## Goals

Refund unspent escrow budget to brand on campaign cancellation.

## History

- 2026-04-21: Implemented — migration added refund fields, CampaignService::cancel() now issues Stripe partial refund
