# Spec Kit Integration - Triven App

This project now includes GitHub Spec Kit for **Spec-Driven Development**, enabling you to create features using natural language descriptions that get automatically converted into detailed specifications, implementation plans, and executable tasks.

## Quick Start

### 1. Using Spec Kit with GitHub Copilot

In VS Code, you can now use these commands with GitHub Copilot:

```
/specify [feature description]
/plan [implementation details] 
/tasks
```

### 2. Example Feature Creation

**Create a Feature Specification:**
```
/specify Add inventory low-stock alerts that automatically notify managers when products fall below minimum thresholds, with email notifications and dashboard warnings
```

**Generate Implementation Plan:**
```
/plan Use WebSocket for real-time alerts, PostgreSQL for threshold storage, Resend for email notifications, and add alert management UI
```

**Break Down Into Tasks:**
```
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

### 1. Specification Phase
Use `/specify` to create a feature specification from natural language:
- Creates a new Git branch
- Generates a structured specification document
- Identifies user scenarios and requirements
- Marks areas needing clarification

### 2. Planning Phase  
Use `/plan` to generate detailed implementation plans:
- Technical architecture and design decisions
- Database schema changes needed
- API contracts and endpoints
- Integration requirements
- Research documentation for unknowns

### 3. Task Generation
Use `/tasks` to break the plan into executable development tasks:
- Ordered, dependency-aware task list
- Test-driven development workflow
- Parallel execution opportunities
- Clear acceptance criteria

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

Here are some example commands you can try:

```
/specify Add real-time inventory tracking dashboard with live updates when stock levels change

/specify Create customer order management system with order status tracking and email notifications

/specify Implement barcode scanning for inventory management with mobile-friendly interface

/specify Add AI-powered inventory forecasting based on historical sales data and seasonal trends
```

## Benefits

- **Faster Feature Development** - Structured approach from idea to implementation
- **Better Documentation** - Automatic generation of specs and technical docs
- **Consistent Architecture** - Constitutional principles enforced automatically
- **Test-Driven Development** - Built-in TDD workflow
- **Team Collaboration** - Clear specifications for better communication
- **Quality Assurance** - Constitutional compliance checking

## Support

For issues with Spec Kit integration:
1. Check the constitution compliance in `.specify/memory/constitution.md`
2. Review the GitHub Copilot instructions in `.github/copilot-instructions.md`
3. Ensure all tools are installed with `bun run spec:check`
4. Refer to the official [GitHub Spec Kit documentation](https://github.com/github/spec-kit)