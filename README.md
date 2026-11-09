---
description: "Bind trusted messaging source metadata to live native tool executions."
kind: "package-library"
---
# dsh-im-requests

English | [中文](README.zh.md)

## Summary

A provider reserves an execution object, admits its logged source, then exposes a read-only attribution service to tool adapters. IDs, copied objects and retained Session records never grant authority. Closing the lease or cancelling its parent immediately revokes access and aborts dependent work. The library starts no application, performs no I/O and retains no member text.

## Table of Contents

- [Use and ownership](#use-and-ownership)
- [Privacy and limits](#privacy-and-limits)
- [Verification](#verification)

<a id="use-and-ownership"></a>
## Use and ownership

This is a library dependency, without a DSH bundle or executable. Import `RequestAuthority` and its typed metadata from the main entry. The optional `dsh-im-requests/cordis` entry only declares `Context.imRequests`; it starts no service. A trusted messaging consumer must create and provide `authority.service` through its Cordis effect.

`open(owner, source, signal)` reserves the exact native execution object. `lease.activate()` publishes it only after the provider observes the corresponding logged source. `service.current(exec.agent)` then returns the frozen source and its cancellation signal. A duplicate reservation fails instead of replacing a request. `lease.close()` revokes synchronously; an old lease cannot revoke a later reservation of the same object. Provider shutdown closes the authority.

The provider chooses `sender` or `shared` group model-history isolation and must honor that guarantee. Private executions are sender-isolated. Tool adapters must bind scope and requester from this service, combine its signal with their invocation signal, verify that the same request remains current after awaited work, and join their own cancellation cleanup.

<a id="privacy-and-limits"></a>
## Privacy and limits

Source metadata contains only the invocation ID, exact tenant/network/account/conversation, sender and source message ID. It is copied and frozen without retaining message text or media. The read-only service cannot create or activate leases. Model JSON must never select its execution object or requester. Same-process Host plugins are trusted; this library is not a sandbox against malicious Host code. It does not enforce archive permissions, output audience, tool allowlists or persistence.

Do not expose sender-private history to a shared group model Session: later participants could inherit cached tool results. A consumer must require sender-isolated Sessions or implement equivalent request-time context filtering. Persisted source fields alone are not authentication, and resuming a Session does not reactivate a lease.

<a id="verification"></a>
## Verification

Run `npm ci --ignore-scripts --no-audit --no-fund`, `npm run check`, then `npm run test:coverage`. Tests use synthetic identities, cancellation listeners, reused execution objects and independent consumers. They contact no QQ service or model API. Native provider and tool integration require their own profile tests.

## Model Experience

This library registers no model tool or prompt. A consuming tool adapter decides which authorized data reaches the model and must log its result through the native tool pipeline.

## Known Limitations and Deferred Work

There is no permission database, durable lease, transport login, model context filter or automatic shared-topic memory. Object identity is meaningful only inside one trusted Host process.

## Dev Note

Strict declarations and independent installed-consumer checks cover both entry points. New consumers must verify their native source admission, cancellation, output audience and sender isolation with synthetic profile tests.
