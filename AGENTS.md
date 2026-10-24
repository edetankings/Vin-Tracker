## UI architecture
- Keep shared GSAP motion in a browser-effect hook with scoped cleanup and reduced-motion handling so navigation never leaks animations or listeners.
- Use CSS perspective for dimensional UI interactions rather than a WebGL scene so task tracking remains fast and accessible on phones.
