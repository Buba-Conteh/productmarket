# Current Feature

## 6.10 — Minimum Payout Threshold

## Status

Completed

## Goals

Hold payout transfers until creator pending_earnings >= min_creator_payout.

## History

- 2026-04-21: Implemented — threshold guard in executeTransfer(), ReleaseHeldPayoutsJob scheduled hourly
