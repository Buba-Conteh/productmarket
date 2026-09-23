<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\ProfileDeleteRequest;
use App\Http\Requests\Settings\ProfileUpdateRequest;
use App\Support\FileUploader;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    /**
     * Show the user's profile settings page.
     */
    public function edit(Request $request): Response
    {
        $user = $request->user()->load('socialAccounts');

        return Inertia::render('settings/profile', [
            'mustVerifyEmail' => $request->user() instanceof MustVerifyEmail,
            'status' => $request->session()->get('status'),
            'avatarUrl' => $user->avatar_url,
            // Distinguishes a platform picture from an upload, so the uploader
            // can explain where the photo came from and hide "Remove" for one
            // it does not own.
            'avatarFromPlatform' => blank($user->avatar) && filled($user->avatar_url),
        ]);
    }

    /**
     * Update the user's profile information.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $request->user()->fill($request->validated());

        if ($request->user()->isDirty('email')) {
            $request->user()->email_verified_at = null;
        }

        $request->user()->save();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Profile updated.')]);

        return to_route('profile.edit');
    }

    /**
     * Upload (or replace) the user's avatar.
     */
    public function updateAvatar(Request $request): RedirectResponse
    {
        $request->validate([
            'avatar' => ['required', 'image', 'mimes:jpeg,jpg,png,webp', 'max:4096'],
        ]);

        $user = $request->user();

        // Only a previously uploaded path is replaceable; a platform-sourced
        // picture lives on the social account and isn't ours to delete.
        $existing = is_string($user->avatar) && ! str_starts_with($user->avatar, 'http')
            ? $user->avatar
            : null;

        $user->update([
            'avatar' => FileUploader::replace($existing, $request->file('avatar'), 'avatars'),
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Profile photo updated.')]);

        return to_route('profile.edit');
    }

    /**
     * Remove the uploaded avatar, falling back to the connected platform's
     * picture if there is one.
     */
    public function destroyAvatar(Request $request): RedirectResponse
    {
        $user = $request->user();

        if (is_string($user->avatar) && ! str_starts_with($user->avatar, 'http')) {
            FileUploader::delete($user->avatar);
        }

        $user->update(['avatar' => null]);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Profile photo removed.')]);

        return to_route('profile.edit');
    }

    /**
     * Delete the user's profile.
     */
    public function destroy(ProfileDeleteRequest $request): RedirectResponse
    {
        $user = $request->user();

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }
}
