<?php

use App\Models\EmailVerificationCode;
use App\Models\User;
use App\Notifications\VerifyEmailCode;
use Database\Seeders\RoleSeeder;
use Illuminate\Auth\Events\Verified;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Notification;
use Laravel\Fortify\Features;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->skipUnlessFortifyHas(Features::emailVerification());
});

function sendCodeTo(User $user): string
{
    Notification::fake();

    $user->sendEmailVerificationNotification();

    $sent = null;
    Notification::assertSentTo($user, VerifyEmailCode::class, function (VerifyEmailCode $n) use (&$sent) {
        $sent = $n->code;

        return true;
    });

    return $sent;
}

test('a 6-digit code is emailed and stored hashed', function () {
    $user = User::factory()->unverified()->create();

    $code = sendCodeTo($user);

    expect($code)->toMatch('/^\d{6}$/');
    $record = EmailVerificationCode::where('user_id', $user->id)->sole();
    expect($record->code)->not->toBe($code);
});

test('email can be verified with the correct code', function () {
    $user = User::factory()->unverified()->create();
    $code = sendCodeTo($user);

    Event::fake([Verified::class]);

    $this->actingAs($user)
        ->post(route('verification.code'), ['code' => $code])
        ->assertRedirect(route('dashboard', absolute: false).'?verified=1');

    Event::assertDispatched(Verified::class);
    expect($user->fresh()->hasVerifiedEmail())->toBeTrue();
});

test('email is not verified with a wrong code', function () {
    $user = User::factory()->unverified()->create();
    $code = sendCodeTo($user);
    $wrong = $code === '000000' ? '111111' : '000000';

    $this->actingAs($user)
        ->post(route('verification.code'), ['code' => $wrong])
        ->assertSessionHasErrors('code');

    expect($user->fresh()->hasVerifiedEmail())->toBeFalse();
});

test('an expired code is rejected', function () {
    $user = User::factory()->unverified()->create();
    $code = sendCodeTo($user);

    $this->travel(11)->minutes();

    $this->actingAs($user)
        ->post(route('verification.code'), ['code' => $code])
        ->assertSessionHasErrors('code');

    expect($user->fresh()->hasVerifiedEmail())->toBeFalse();
});

test('resending invalidates the previous code', function () {
    $user = User::factory()->unverified()->create();
    $first = sendCodeTo($user);
    $second = sendCodeTo($user);

    if ($first === $second) {
        $this->markTestSkipped('Random codes collided.');
    }

    $this->actingAs($user)
        ->post(route('verification.code'), ['code' => $first])
        ->assertSessionHasErrors('code');

    expect($user->fresh()->hasVerifiedEmail())->toBeFalse();
});

test('a code is burned after too many wrong attempts', function () {
    $user = User::factory()->unverified()->create();
    $code = sendCodeTo($user);
    $wrong = $code === '000000' ? '111111' : '000000';

    EmailVerificationCode::where('user_id', $user->id)->update(['attempts' => 5]);

    $this->actingAs($user)
        ->post(route('verification.code'), ['code' => $code])
        ->assertSessionHasErrors('code');

    expect($user->fresh()->hasVerifiedEmail())->toBeFalse();
});

test('registration emails a verification code', function () {
    $this->skipUnlessFortifyHas(Features::registration());
    $this->seed(RoleSeeder::class);
    Notification::fake();

    $this->post(route('register.store'), [
        'name' => 'Test User',
        'email' => 'code@example.com',
        'password' => 'Str0ng!Passw0rd',
        'password_confirmation' => 'Str0ng!Passw0rd',
    ]);

    $user = User::where('email', 'code@example.com')->sole();

    Notification::assertSentTo($user, VerifyEmailCode::class);
});
