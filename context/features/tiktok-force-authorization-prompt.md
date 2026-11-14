# TikTok — always show the authorization prompt

**Status:** Complete

## Overview

The TikTok Connect flow can show TikTok's authorization screen even when the
creator already has an active TikTok session. This lets the creator review the
requested permissions instead of being silently reconnected.

## Implementation

- `TikTokProvider` includes `disable_auto_auth=1` in its authorization URL when
  `social_oauth.tiktok.disable_auto_auth` is enabled.
- The existing `TIKTOK_DISABLE_AUTO_AUTH` environment setting controls the
  option. When disabled, the parameter is omitted to preserve the existing
  default authorization behavior.
- A feature test verifies that the configured URL includes the expected
  parameter.

## Configuration

Set `TIKTOK_DISABLE_AUTO_AUTH=1` in the environment and refresh Laravel's
configuration cache if configuration is cached.

TikTok determines the exact consent screen and which requested permissions are
available to the creator.
