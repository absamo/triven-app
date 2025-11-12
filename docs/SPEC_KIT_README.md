# Spec Kit Integration - Triven App

This project now includes GitHub Spec Kit **v0.0.79** for **Spec-Driven Development**, enabling you to create features using natural language descriptions that get automatically converted into detailed specifications, implementation plans, and executable tasks.

## What's New in v0.0.79

The latest version includes enhanced workflow commands:

- **Constitution Management** - `/speckit.constitution` for establishing project principles
- **Clarification Phase** - `/speckit.clarify` for de-risking ambiguous specifications
- **Quality Validation** - `/speckit.checklist` for requirements validation
- **Consistency Analysis** - `/speckit.analyze` for cross-artifact validation
- **Automated Implementation** - `/speckit.implement` for executing generated tasks
- **Improved Templates** - Updated templates for better code generation
- **Enhanced Documentation** - Better guidance and examples throughout

## Quick Start

### 1. Using Spec Kit with GitHub Copilot

In VS Code, you can now use these commands with GitHub Copilot:

**Core Workflow Commands:**
```
/speckit.constitution  - Establish project principles
/speckit.specify       - Create baseline specification
/speckit.plan          - Create implementation plan
/speckit.tasks         - Generate actionable tasks
/speckit.implement     - Execute implementation
```

**Enhancement Commands (Optional):**
```
/speckit.clarify       - Ask structured questions to de-risk ambiguous areas
/speckit.analyze       - Cross-artifact consistency & alignment report
/speckit.checklist     - Generate quality checklists
```

**Legacy Commands (Still Supported):**
```
/specify [feature description]
/plan [implementation details] 
/tasks
```

### 2. Example Feature Creation

**Using New Workflow Commands:**

1. **Establish Constitution (if not already done):**
```
/speckit.constitution
```

2. **Create a Feature Specification:**
```
/speckit.specify Add inventory low-stock alerts that automatically notify managers when products fall below minimum thresholds, with email notifications and dashboard warnings
```

3. **Optional: Clarify Ambiguities:**
```
/speckit.clarify
```

4. **Generate Implementation Plan:**
```
/speckit.plan Use WebSocket for real-time alerts, PostgreSQL for threshold storage, Resend for email notifications, and add alert management UI
```

5. **Optional: Validate Quality:**
```
/speckit.checklist
```

6. **Break Down Into Tasks:**
```
/speckit.tasks
```

7. **Optional: Analyze Consistency:**
```
/speckit.analyze
```

8. **Execute Implementation:**
```
/speckit.implement
```

**Using Legacy Commands:**
```
/specify Add inventory low-stock alerts...
/plan Use WebSocket for real-time alerts...
/tasks
```

### 3. Manual CLI Usage

You can also use Spec Kit directly from the command line:

```bash
# Check if all tools are properly configured
bun run spec:check

# View available commands
source $HOME/.local/bin/env && uvx --from git+https://github.com/github/spec-kit.git specify --help
```

## File Structure

Spec Kit adds these directories to your project:

```
.github/
├── prompts/           # GitHub Copilot command prompts
│   ├── specify.prompt.md
│   ├── plan.prompt.md
│   └── tasks.prompt.md
└── copilot-instructions.md  # Project-specific Copilot guidance

.specify/
├── memory/
│   ├── constitution.md      # Project constitutional principles
│   └── constitution_update_checklist.md
├── scripts/           # Automation scripts for spec workflow
│   └── bash/
├── templates/         # Templates for specs, plans, and tasks
│   ├── spec-template.md
│   ├── plan-template.md
│   ├── tasks-template.md
│   └── agent-file-template.md

specs/                 # Generated feature specifications (created as needed)
├── 001-feature-name/
│   ├── spec.md
│   ├── plan.md
│   ├── research.md
│   ├── data-model.md
│   ├── quickstart.md
│   ├── contracts/
│   └── tasks.md
```

## Workflow

### Complete Spec-Driven Development Workflow

1. **Constitution Phase** (One-time setup)
   - Use `/speckit.constitution` to establish project principles
   - Defines architectural standards and constraints
   - Creates `.specify/memory/constitution.md`

2. **Specification Phase**
   - Use `/speckit.specify` to create a feature specification
   - Creates a new Git branch
   - Generates a structured specification document
   - Identifies user scenarios and requirements
   - Marks areas needing clarification

3. **Clarification Phase** (Optional)
   - Use `/speckit.clarify` to ask structured questions
   - De-risks ambiguous areas before planning
   - Helps ensure specification completeness

4. **Planning Phase**
   - Use `/speckit.plan` to generate detailed implementation plans
   - Technical architecture and design decisions
   - Database schema changes needed
   - API contracts and endpoints
   - Integration requirements
   - Research documentation for unknowns

5. **Quality Validation** (Optional)
   - Use `/speckit.checklist` to validate requirements
   - Checks completeness, clarity, and consistency
   - Ensures alignment with constitution

6. **Task Generation**
   - Use `/speckit.tasks` to break the plan into executable tasks
   - Ordered, dependency-aware task list
   - Test-driven development workflow
   - Parallel execution opportunities
   - Clear acceptance criteria

7. **Consistency Analysis** (Optional)
   - Use `/speckit.analyze` for cross-artifact consistency check
   - Validates alignment between spec, plan, and tasks
   - Identifies gaps or inconsistencies

8. **Implementation Phase**
   - Use `/speckit.implement` to execute the tasks
   - Automated implementation based on generated tasks
   - Follows TDD and constitutional principles
   - Creates all necessary code and tests

## Constitutional Principles

This project follows strict constitutional principles (see `.specify/memory/constitution.md`):

1. **Service-Oriented Architecture** - Features as standalone services
2. **API-First Development** - OpenAPI specs before implementation  
3. **Test-First Development** - TDD mandatory for all features
4. **Real-Time Capabilities** - WebSocket support for live updates
5. **Data Integrity** - Audit trails for business operations
6. **AI Integration Standards** - Optional, fault-tolerant AI features
7. **Performance & Scalability** - Optimized queries and caching

## Integration with Existing Workflow

Spec Kit integrates seamlessly with your current development process:

- **Compatible with React Router v7** - No conflicts with your routing
- **Works with Prisma** - Database planning includes Prisma schema generation
- **Supports Mantine UI** - Component planning follows Mantine patterns
- **Integrates with Vitest** - Test planning uses your existing test framework
- **Respects TypeScript** - All generated code follows TypeScript best practices

## Example Commands

Here are some example commands you can try with the new workflow:

**Constitution Setup:**
```
/speckit.constitution Establish principles for building a scalable inventory management platform
```

**Feature Specifications:**
```
/speckit.specify Add real-time inventory tracking dashboard with live updates when stock levels change

/speckit.specify Create customer order management system with order status tracking and email notifications

/speckit.specify Implement barcode scanning for inventory management with mobile-friendly interface

/speckit.specify Add AI-powered inventory forecasting based on historical sales data and seasonal trends
```

**Clarification:**
```
/speckit.clarify What are the ambiguous areas in the current specification?
```

**Planning:**
```
/speckit.plan Use React hooks for state management, Mantine UI for components, and WebSocket for real-time updates

/speckit.plan Implement with Prisma ORM, add caching layer with Redis, use Stripe for payments
```

**Quality Checks:**
```
/speckit.checklist Validate the implementation plan against requirements

/speckit.analyze Check consistency across all specification artifacts
```

**Task Management:**
```
/speckit.tasks Break down the implementation plan into executable development tasks
```

**Implementation:**
```
/speckit.implement Execute the generated tasks following TDD principles
```

## Benefits

- **Faster Feature Development** - Structured approach from idea to implementation
- **Better Documentation** - Automatic generation of specs and technical docs
- **Consistent Architecture** - Constitutional principles enforced automatically
- **Test-Driven Development** - Built-in TDD workflow
- **Team Collaboration** - Clear specifications for better communication
- **Quality Assurance** - Constitutional compliance checking
- **Risk Mitigation** - Optional clarification phase to de-risk ambiguous areas
- **Consistency Validation** - Cross-artifact analysis ensures alignment
- **Automated Implementation** - AI-powered code generation following best practices
- **Enhanced Quality Control** - Optional checklists for requirements validation

## Support

For issues with Spec Kit integration:
1. Check the constitution compliance in `.specify/memory/constitution.md`
2. Review the GitHub Copilot instructions in `.github/copilot-instructions.md`
3. Ensure all tools are installed with `bun run spec:check`
4. Refer to the official [GitHub Spec Kit documentation](https://github.com/github/spec-kit)