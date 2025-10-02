# CAWS Configuration for Designer

This directory contains the CAWS (Coding Agent Workflow System) configuration for the Designer project.

## Directory Structure

```
.caws/
├── README.md                    # This file
├── working-spec.yaml            # Current project specification
├── policy/
│   └── tier-policy.json         # Risk tier configuration
├── schemas/
│   ├── working-spec.schema.json # Schema for working specs
│   └── waivers.schema.json      # Schema for quality gate waivers
└── templates/
    ├── pr.md                    # Pull request template
    ├── feature.plan.md          # Feature planning template
    └── test-plan.md             # Test planning template
```

## Quick Reference

### Working Spec

The `working-spec.yaml` file defines the current project scope, invariants, and acceptance criteria. It follows the CAWS schema and includes:

- **id**: Unique identifier (DESIGNER-XXX)
- **risk_tier**: 1 (critical), 2 (core), or 3 (quality)
- **mode**: feature, refactor, fix, doc, or chore
- **scope**: Files included/excluded from changes
- **invariants**: System guarantees that must hold
- **acceptance**: Given/When/Then acceptance criteria
- **non_functional**: A11y, performance, security requirements

### Tier Policy

The `policy/tier-policy.json` file configures quality gates by risk tier:

- **Tier 1**: 90% coverage, 70% mutation, contracts mandatory
- **Tier 2**: 80% coverage, 50% mutation, contracts mandatory
- **Tier 3**: 70% coverage, 30% mutation, contracts optional

### Templates

Use templates to maintain consistency:

```bash
# Create new feature spec
cp .caws/templates/feature.plan.md docs/plans/DESIGNER-042.md

# Use PR template when creating pull requests
# (Automatically loaded from .caws/templates/pr.md)
```

## Validation

Validate your working spec:

```bash
node apps/tools/caws/validate.js .caws/working-spec.yaml
```

## Provenance

AI-assisted development provenance is tracked in `.agent/`:

- `provenance.json` - Initial project setup
- `scaffold-provenance.json` - CAWS scaffolding

These files provide audit trails for AI contributions.

## For More Information

- **AGENTS.md** - Complete agent workflow guide
- **docs/overview.md** - Project documentation
- **apps/tools/caws/** - CAWS tooling implementation

