# Spec Kit Changelog

## v0.0.79 (November 3, 2025)

### New Features

#### Core Workflow Commands
- **`/speckit.constitution`** - Establish or update project constitutional principles
  - Creates/updates `.specify/memory/constitution.md`
  - Defines architectural standards and constraints
  - Ensures consistency across all templates

- **`/speckit.specify`** - Enhanced specification creation
  - Improved natural language to specification conversion
  - Better requirement identification
  - Clearer ambiguity marking

- **`/speckit.clarify`** - Clarification phase
  - Structured question generation for ambiguous areas
  - Risk mitigation before planning
  - Ensures specification completeness

- **`/speckit.plan`** - Enhanced planning
  - Better technical architecture generation
  - Improved API contract design
  - More detailed database schema planning

- **`/speckit.checklist`** - Quality validation
  - Requirements completeness checking
  - Clarity validation
  - Consistency verification
  - Constitutional compliance checking

- **`/speckit.tasks`** - Improved task generation
  - Better dependency management
  - More granular task breakdown
  - Clearer acceptance criteria

- **`/speckit.analyze`** - Consistency analysis
  - Cross-artifact validation
  - Alignment checking between spec, plan, and tasks
  - Gap identification

- **`/speckit.implement`** - Automated implementation
  - Task execution with TDD principles
  - Constitutional compliance enforcement
  - Automated code and test generation

### Improvements

#### Enhanced Templates
- Updated specification template with better structure
- Improved plan template with more detailed sections
- Enhanced task template with clearer categorization
- Better agent file template for multi-agent workflows

#### Better Documentation
- More comprehensive examples
- Improved command descriptions
- Enhanced workflow guidance
- Better integration patterns

#### Quality Enhancements
- Stricter constitutional compliance checking
- Better error handling in templates
- Improved consistency validation
- Enhanced cross-artifact alignment

### Migration Guide

#### From Previous Versions

The legacy commands still work:
- `/specify` → Use `/speckit.specify` for enhanced features
- `/plan` → Use `/speckit.plan` for better planning
- `/tasks` → Use `/speckit.tasks` for improved task generation

#### Recommended Workflow

1. **First Time Setup**: Run `/speckit.constitution` to establish principles
2. **For Each Feature**:
   - `/speckit.specify` - Create specification
   - `/speckit.clarify` - (Optional) Clarify ambiguities
   - `/speckit.plan` - Generate implementation plan
   - `/speckit.checklist` - (Optional) Validate quality
   - `/speckit.tasks` - Break down into tasks
   - `/speckit.analyze` - (Optional) Check consistency
   - `/speckit.implement` - Execute implementation

### Breaking Changes

None. All legacy commands remain functional.

### Known Issues

None reported.

### Next Steps

After updating:
1. Review the new commands in `.github/copilot-instructions.md`
2. Read the updated `SPEC_KIT_README.md`
3. Try the new workflow on a small feature first
4. Update your team documentation if needed

## Previous Versions

See Git history for earlier version changes.
