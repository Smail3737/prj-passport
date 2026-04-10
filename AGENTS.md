# AGENTS.md

## Project instructions

This repository is being migrated from an existing Electron application to a React application.

### Mandatory project directives
- Work only in this repository.
- Do not create a separate sibling project.
- Rename the project to `Project Passport (React)`.
- The original Electron code has already been backed up by the user.
- Starting fresh is acceptable.
- Do not implement any backup import or legacy data migration flow unless explicitly requested later.

### AI integration rules
- Remove all OpenAI-related code, configuration, environment variables, SDK usage, API calls, UI, labels, documentation, and references.
- Use only Ollama AI.
- Do not preserve OpenAI compatibility layers unless explicitly required as a temporary migration step, and remove them before final completion.

### Migration objective
Migrate the Electron app into a React app with strict parity in:
- design
- layout
- styling
- spacing
- typography
- interaction behavior
- user workflows
- feature set
- business logic
- edge-case handling

The React app must feel like the same product, not a redesign.

### Working rules
- Inspect the repository before making broad changes.
- Preserve parity first; optimize second.
- Do not redesign unless explicitly asked.
- Explicitly map Electron-specific behavior to web-compatible equivalents.
- Do not hide platform limitations; document them clearly.
- Implement all migration phases, not planning only.

### Required execution sequence
1. Discovery
2. Target architecture
3. UI parity foundation
4. Feature-by-feature migration
5. Electron-to-web capability replacement
6. Validation
7. Cleanup and finalization

### Required deliverables during migration
- migration audit
- feature parity matrix
- Electron-to-web mapping table
- OpenAI removal inventory
- Ollama integration plan
- risk list

### Engineering standards
- Use React + TypeScript by default.
- Keep the code typed, explicit, modular, and production-ready.
- Maintain accessibility, performance, security, and testability.
- Prefer targeted, reviewable changes over broad rewrites without justification.

### Validation requirements
Do not claim completion without explicit verification of:
- UI parity
- behavior parity
- OpenAI removal completeness
- Ollama-only behavior
- critical flows
- error/loading/empty states
- keyboard/accessibility behavior

### Additional instruction
Follow the detailed migration rules in `docs/migration-codex.md`.