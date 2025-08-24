# ParentConnect Branching Strategy

## Overview

This document outlines the Git branching strategy for the ParentConnect project, ensuring organized development, proper code review, and safe deployments.

## Branch Structure

### Main Branches

#### `master` (Production)
- **Purpose**: Production-ready code
- **Protection**: Direct commits disabled
- **Deployment**: Automatic deployment to production
- **Updates**: Only via Pull Requests from `develop` or hotfix branches

#### `develop` (Development)
- **Purpose**: Integration branch for features
- **Protection**: Direct commits disabled for team members
- **Deployment**: Automatic deployment to staging environment
- **Updates**: Via Pull Requests from feature branches

### Supporting Branches

#### Feature Branches
- **Naming**: `feature/description-of-feature`
- **Purpose**: Development of new features
- **Source**: `develop`
- **Target**: `develop`
- **Examples**:
  - `feature/websocket-integration`
  - `feature/file-upload`
  - `feature/push-notifications`

#### Release Branches
- **Naming**: `release/version-number`
- **Purpose**: Preparing for a new production release
- **Source**: `develop`
- **Target**: `master` and `develop`
- **Examples**:
  - `release/v1.0.0`
  - `release/v1.1.0`

#### Hotfix Branches
- **Naming**: `hotfix/description-of-fix`
- **Purpose**: Critical bug fixes for production
- **Source**: `master`
- **Target**: `master` and `develop`
- **Examples**:
  - `hotfix/security-vulnerability`
  - `hotfix/critical-bug-fix`

## Workflow

### Feature Development

1. **Create Feature Branch**
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/your-feature-name
   ```

2. **Develop Feature**
   - Make commits with descriptive messages
   - Keep commits atomic and focused
   - Test your changes thoroughly

3. **Push Feature Branch**
   ```bash
   git push origin feature/your-feature-name
   ```

4. **Create Pull Request**
   - Target: `develop`
   - Include description of changes
   - Request code review
   - Link related issues

5. **Code Review & Merge**
   - Address review comments
   - Ensure CI/CD passes
   - Merge to `develop`

### Release Process

1. **Create Release Branch**
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b release/v1.0.0
   ```

2. **Prepare Release**
   - Update version numbers
   - Update changelog
   - Final testing
   - Fix any last-minute issues

3. **Merge to Master**
   ```bash
   git checkout master
   git merge release/v1.0.0
   git tag v1.0.0
   git push origin master --tags
   ```

4. **Merge Back to Develop**
   ```bash
   git checkout develop
   git merge release/v1.0.0
   git push origin develop
   ```

5. **Delete Release Branch**
   ```bash
   git branch -d release/v1.0.0
   git push origin --delete release/v1.0.0
   ```

### Hotfix Process

1. **Create Hotfix Branch**
   ```bash
   git checkout master
   git pull origin master
   git checkout -b hotfix/critical-fix
   ```

2. **Fix the Issue**
   - Make minimal changes
   - Test thoroughly
   - Update version number

3. **Merge to Master**
   ```bash
   git checkout master
   git merge hotfix/critical-fix
   git tag v1.0.1
   git push origin master --tags
   ```

4. **Merge to Develop**
   ```bash
   git checkout develop
   git merge hotfix/critical-fix
   git push origin develop
   ```

5. **Delete Hotfix Branch**
   ```bash
   git branch -d hotfix/critical-fix
   git push origin --delete hotfix/critical-fix
   ```

## Commit Message Guidelines

### Format
```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types
- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, etc.)
- **refactor**: Code refactoring
- **test**: Adding or updating tests
- **chore**: Maintenance tasks

### Examples
```
feat(chat): add real-time messaging with WebSocket
fix(auth): resolve login token expiration issue
docs(readme): update installation instructions
refactor(api): restructure user endpoints
test(backend): add unit tests for message service
```

## Branch Protection Rules

### Master Branch
- Require pull request reviews
- Require status checks to pass
- Require branches to be up to date
- Restrict pushes to matching branches
- Require linear history

### Develop Branch
- Require pull request reviews
- Require status checks to pass
- Require branches to be up to date
- Restrict pushes to matching branches

## Environment Deployment

### Production (master)
- **URL**: https://parentconnect.app
- **Auto-deploy**: Yes
- **Manual approval**: Required

### Staging (develop)
- **URL**: https://staging.parentconnect.app
- **Auto-deploy**: Yes
- **Manual approval**: Not required

### Development (feature branches)
- **URL**: https://feature-name.parentconnect.app
- **Auto-deploy**: Yes (for PR previews)
- **Manual approval**: Not required

## Best Practices

### Do's
- ✅ Always pull latest changes before creating new branches
- ✅ Use descriptive branch names
- ✅ Write clear commit messages
- ✅ Keep feature branches focused and small
- ✅ Test thoroughly before creating PRs
- ✅ Update documentation with new features
- ✅ Delete merged branches

### Don'ts
- ❌ Commit directly to master or develop
- ❌ Use vague commit messages
- ❌ Create large, unfocused feature branches
- ❌ Merge without code review
- ❌ Leave branches unmerged for long periods
- ❌ Forget to update tests with new features

## Tools and Automation

### GitHub Actions
- **CI/CD Pipeline**: Automated testing and deployment
- **Code Quality**: Linting and formatting checks
- **Security Scanning**: Dependency vulnerability checks
- **Performance Testing**: Automated performance benchmarks

### Branch Management
- **Auto-delete**: Merged branches automatically deleted
- **Branch naming**: Enforced naming conventions
- **PR templates**: Standardized pull request templates
- **Issue linking**: Automatic linking of issues to PRs

## Emergency Procedures

### Critical Production Issues
1. Create hotfix branch from master
2. Implement minimal fix
3. Test thoroughly
4. Merge to master and develop
5. Deploy immediately
6. Create follow-up issue for proper fix

### Rollback Procedure
1. Identify the problematic commit
2. Create hotfix branch from previous stable commit
3. Revert changes or implement fix
4. Test thoroughly
5. Deploy rollback
6. Investigate root cause

---

This branching strategy ensures organized development, proper code review, and safe deployments for the ParentConnect project.
