## UI architecture
- Keep shared GSAP motion in a browser-effect hook with scoped cleanup and reduced-motion handling so navigation never leaks animations or listeners.
- Use CSS perspective for dimensional UI interactions rather than a WebGL scene so task tracking remains fast and accessible on phones.

## Git identity
- Use `edetankings <edetankings@gmail.com>` as the author and committer for future commits.
- Do not add `Co-authored-by` trailers or any other co-author attribution to commit messages.
- Do not commit, push, or rewrite existing commits without user authorization.
