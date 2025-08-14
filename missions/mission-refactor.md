# Mission: REFACTOR ♻️
## Code Quality Improvement

**Mission Code**: REFACTOR  
**Estimated Duration**: 2-4 hours  
**Complexity**: Medium  
**Squad Required**: Architect, Developer, Tester

## Mission Briefing

Improve code quality, maintainability, and performance without changing external behavior. This mission focuses on technical debt reduction and code optimization.

## Required Inputs

1. **Target Area** (required) - Files, modules, or system to refactor
2. **Refactor Goals** (optional) - Specific improvements needed
3. **Constraints** (optional) - Performance requirements, API compatibility

## Mission Phases

### Phase 1: Code Analysis (30-45 minutes)

**Lead**: @architect  
**Support**: @analyst  
**Objective**: Assess current state and plan improvements

```bash
@architect Analyze the codebase:
1. Review code structure and patterns
2. Identify code smells and anti-patterns
3. Measure complexity metrics
4. Assess test coverage
5. Prioritize refactoring opportunities
```

**Deliverables**:
- Code quality report
- Refactoring priorities
- Risk assessment
- Effort estimates

### Phase 2: Refactoring Strategy (20-30 minutes)

**Lead**: @architect  
**Support**: @developer  
**Objective**: Design the refactoring approach

```bash
@architect Design refactoring strategy:
1. Define target architecture
2. Plan incremental refactoring steps
3. Identify breaking change risks
4. Design new interfaces/abstractions
5. Create migration plan
```

**Deliverables**:
- Refactoring design
- Step-by-step plan
- Interface definitions
- Migration strategy

### Phase 3: Test Preparation (30 minutes)

**Lead**: @tester  
**Support**: @developer  
**Objective**: Ensure behavior preservation

```bash
@tester Prepare test safety net:
1. Review existing test coverage
2. Add characterization tests for current behavior
3. Create integration test suite
4. Set up performance benchmarks
5. Document expected behaviors
```

**Deliverables**:
- Enhanced test suite
- Behavior documentation
- Performance baselines
- Test coverage report

### Phase 4: Refactoring Implementation (1-2 hours)

**Lead**: @developer  
**Support**: @architect  
**Objective**: Execute refactoring with safety

```bash
@developer Implement refactoring:
1. Follow refactoring plan step-by-step
2. Make small, incremental changes
3. Run tests after each change
4. Preserve external interfaces
5. Update documentation as needed
```

**Deliverables**:
- Refactored code
- Passing test suite
- Updated documentation
- Change summary

### Phase 5: Validation (30 minutes)

**Lead**: @tester  
**Support**: @developer  
**Objective**: Verify behavior preservation

```bash
@tester Validate refactoring:
1. Run full regression suite
2. Compare performance metrics
3. Verify API compatibility
4. Check integration points
5. Validate error handling
```

**Deliverables**:
- Test results
- Performance comparison
- Compatibility report
- Sign-off

### Phase 6: Code Review (20-30 minutes)

**Lead**: @architect  
**Support**: @developer  
**Objective**: Ensure quality and patterns

```bash
@architect Review refactored code:
1. Verify design patterns applied correctly
2. Check code consistency
3. Validate abstraction levels
4. Ensure SOLID principles
5. Approve for merge
```

**Deliverables**:
- Review feedback
- Approval status
- Follow-up items

## Success Criteria

- [ ] All tests pass (100%)
- [ ] No behavior changes
- [ ] Performance maintained or improved
- [ ] Code complexity reduced
- [ ] Documentation updated
- [ ] Team review approved

## Refactoring Patterns

### Extract Method/Class
- Identify cohesive code blocks
- Create meaningful abstractions
- Improve testability

### Replace Conditionals
- Strategy pattern
- Polymorphism
- Guard clauses

### Simplify Method Calls
- Reduce parameters
- Introduce parameter objects
- Builder pattern

### Deal with Generalization
- Extract interface
- Pull up/push down methods
- Replace inheritance with composition

## Common Refactoring Targets

### Legacy Code Refactor
- Add tests first
- Small incremental changes
- Strangler fig pattern

### Performance Refactor
- Profile first
- Optimize algorithms
- Cache strategically

### API Refactor
- Version compatibility
- Deprecation warnings
- Migration guides

### Database Refactor
- Backwards compatibility
- Data migration scripts
- Staged rollout

## Risk Mitigation

- Always have rollback plan
- Feature flags for large changes
- Incremental deployment
- Monitor error rates

## Coordination Notes

- Update project-plan.md with progress
- Small, reviewable pull requests
- Daily progress check-ins
- Document decisions in progress.md

---

*Clean code is a joy to maintain. Begin with `/coord refactor [target-area.md]`*