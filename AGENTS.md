<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep Meta conversions in the shared tracking helper with in-flight locks and guards saved only after browser dispatch; this preserves Pixel/CAPI IDs while permitting retries after initialization failure.
- Track payment-step entry from checkout state and Purchase from a matching successful-submission record on the thank-you route; this prevents failed or direct visits from counting.
