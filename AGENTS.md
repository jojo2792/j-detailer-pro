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

- Derive staff queue groups, start-time cues, local filters and workload in the browser-safe `src/lib/staff-queue.ts` from the existing authorized board response; keep server queries and mutation/security boundaries unchanged to avoid new data exposure or operational side effects.
- Staff queue totals describe loaded records in the selected scope, not a complete historical queue; preserve visible coverage/refresh notes because the existing query excludes cancelled/past-date bookings and returns at most 200 records.
