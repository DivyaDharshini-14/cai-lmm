@extends('layouts.dashboard')

@section('title', 'Staff sign-in')

@section('content')
<main class="wrap auth-wrap">
    <section class="card" aria-labelledby="loginTitle">
        <div class="section-head"><div><h2 id="loginTitle">Staff sign-in</h2><p>Sign in to the CAI Sales Workspace.</p></div></div>
        <form class="section-body auth-form" method="post" action="{{ route('login') }}">
            @csrf
            @if ($errors->any())
                <div class="notice notice-error" role="alert">{{ $errors->first() }}</div>
            @endif
            <div class="field">
                <label for="email">Email address</label>
                <input id="email" name="email" type="email" autocomplete="username" maxlength="254" value="{{ old('email') }}" required autofocus>
            </div>
            <div class="field">
                <label for="password">Password</label>
                <input id="password" name="password" type="password" autocomplete="current-password" maxlength="72" required>
            </div>
            <button class="btn btn-primary" type="submit">Sign in</button>
        </form>
    </section>
</main>
@endsection
