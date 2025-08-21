# Contributing to AWS S3 Manager

Thank you for your interest in contributing to the AWS S3 Manager project! This document provides guidelines and information for contributors.

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Workflow](#development-workflow)
4. [Coding Standards](#coding-standards)
5. [Testing Guidelines](#testing-guidelines)
6. [Pull Request Process](#pull-request-process)
7. [Issue Reporting](#issue-reporting)

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code.

### Our Standards

- Use welcoming and inclusive language
- Be respectful of differing viewpoints and experiences
- Gracefully accept constructive criticism
- Focus on what is best for the community
- Show empathy towards other community members

## Getting Started

### Prerequisites

Before contributing, ensure you have:

- Node.js 18+ installed
- Docker and Docker Compose
- kubectl and access to a Kubernetes cluster
- AWS account with appropriate permissions
- Git configured with your GitHub account

### Development Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/your-username/s3-manager.git
   cd s3-manager
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Database Setup**
   ```bash
   npm run db:migrate
   npm run db:seed
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

## Development Workflow

### Branch Naming

Use descriptive branch names with prefixes:

- `feature/` - New features
- `bugfix/` - Bug fixes
- `hotfix/` - Critical fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring

Examples:
- `feature/object-bulk-delete`
- `bugfix/upload-progress-bar`
- `docs/api-authentication`

### Commit Messages

Follow the conventional commits specification:

```
type(scope): description

[optional body]

[optional footer]
```

**Types:**
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation
- `style` - Formatting, missing semicolons, etc.
- `refactor` - Code change that neither fixes a bug nor adds a feature
- `test` - Adding missing tests
- `chore` - Maintenance tasks

**Examples:**
```
feat(api): add bulk object deletion endpoint

fix(frontend): resolve upload progress bar flickering

docs(readme): update installation instructions

test(backend): add integration tests for authentication
```

## Coding Standards

### TypeScript/JavaScript

- Use TypeScript for all new code
- Follow ESLint and Prettier configurations
- Use meaningful variable and function names
- Add JSDoc comments for public APIs
- Prefer functional programming patterns
- Use async/await over Promises

**Example:**
```typescript
/**
 * Uploads a file to S3 bucket with progress tracking
 * @param bucket - The target S3 bucket name
 * @param key - The object key (path)
 * @param file - The file to upload
 * @param onProgress - Progress callback function
 * @returns Promise resolving to upload result
 */
export async function uploadFile(
  bucket: string,
  key: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<UploadResult> {
  // Implementation
}
```

### React Components

- Use functional components with hooks
- Follow single responsibility principle
- Use TypeScript interfaces for props
- Implement proper error boundaries
- Use React Query for data fetching

**Example:**
```typescript
interface BucketListProps {
  searchQuery: string;
  onBucketSelect: (bucket: Bucket) => void;
}

export const BucketList: React.FC<BucketListProps> = ({
  searchQuery,
  onBucketSelect,
}) => {
  const { data: buckets, isLoading, error } = useBuckets(searchQuery);

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <div className="bucket-list">
      {buckets?.map((bucket) => (
        <BucketCard
          key={bucket.name}
          bucket={bucket}
          onClick={() => onBucketSelect(bucket)}
        />
      ))}
    </div>
  );
};
```

### CSS/Styling

- Use Material-UI components and theming
- Follow BEM methodology for custom CSS
- Use CSS-in-JS for component-specific styles
- Ensure responsive design
- Follow accessibility guidelines

### API Design

- Follow RESTful conventions
- Use consistent error response format
- Implement proper HTTP status codes
- Add comprehensive input validation
- Document all endpoints with OpenAPI

### Database

- Use Prisma for database operations
- Write reversible migrations
- Add proper indexes for performance
- Use transactions for related operations
- Include proper error handling

## Testing Guidelines

### Unit Tests

- Write tests for all business logic
- Use Jest and React Testing Library
- Aim for 80%+ code coverage
- Test edge cases and error conditions

**Example:**
```typescript
describe('FileUploader', () => {
  it('should upload file successfully', async () => {
    const mockFile = new File(['content'], 'test.txt', { type: 'text/plain' });
    const onProgress = jest.fn();
    
    const result = await uploadFile('test-bucket', 'test.txt', mockFile, onProgress);
    
    expect(result.success).toBe(true);
    expect(onProgress).toHaveBeenCalled();
  });

  it('should handle upload errors', async () => {
    const mockFile = new File(['content'], 'test.txt', { type: 'text/plain' });
    
    // Mock S3 error
    mockS3.upload.mockRejectedValue(new Error('Network error'));
    
    await expect(uploadFile('test-bucket', 'test.txt', mockFile))
      .rejects.toThrow('Network error');
  });
});
```

### Integration Tests

- Test complete workflows
- Use test database and AWS mocks
- Test API endpoints with supertest
- Verify data persistence

### End-to-End Tests

- Use Cypress for E2E testing
- Test critical user journeys
- Include accessibility testing
- Test across different browsers

## Pull Request Process

### Before Submitting

1. **Code Quality**
   ```bash
   npm run lint
   npm run format
   npm run type-check
   ```

2. **Testing**
   ```bash
   npm test
   npm run test:integration
   npm run test:e2e
   ```

3. **Build**
   ```bash
   npm run build
   ```

4. **Security**
   ```bash
   npm audit
   npm run test:security
   ```

### PR Requirements

- [ ] Code follows project coding standards
- [ ] All tests pass
- [ ] Documentation updated (if applicable)
- [ ] No breaking changes (or properly documented)
- [ ] Security considerations addressed
- [ ] Performance impact assessed

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No breaking changes
```

### Review Process

1. **Automated Checks** - All CI/CD checks must pass
2. **Code Review** - At least two approvals required
3. **Security Review** - For security-related changes
4. **Testing** - Manual testing in staging environment
5. **Merge** - Squash and merge to main branch

## Issue Reporting

### Bug Reports

Use the bug report template:

```markdown
## Bug Description
Clear description of the bug

## Steps to Reproduce
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Environment
- OS: [e.g. macOS 12.0]
- Browser: [e.g. Chrome 91]
- Version: [e.g. 1.0.0]

## Additional Context
Screenshots, logs, etc.
```

### Feature Requests

Use the feature request template:

```markdown
## Feature Description
Clear description of the feature

## Problem Solved
What problem does this solve?

## Proposed Solution
How would you implement this?

## Alternatives Considered
Other solutions you considered

## Additional Context
Mockups, examples, etc.
```

### Security Issues

For security vulnerabilities:

1. **DO NOT** create a public issue
2. Email security@yourcompany.com
3. Include detailed description
4. Provide steps to reproduce
5. Wait for confirmation before disclosure

## Development Resources

### Useful Commands

```bash
# Development
npm run dev                    # Start development server
npm run dev:frontend          # Start only frontend
npm run dev:backend           # Start only backend

# Testing
npm test                      # Run unit tests
npm run test:watch           # Run tests in watch mode
npm run test:coverage        # Run tests with coverage
npm run test:integration     # Run integration tests
npm run test:e2e            # Run E2E tests

# Code Quality
npm run lint                 # Run ESLint
npm run lint:fix            # Fix ESLint errors
npm run format              # Format code with Prettier
npm run type-check          # TypeScript type checking

# Database
npm run db:migrate          # Run database migrations
npm run db:seed            # Seed database with test data
npm run db:reset           # Reset database

# Docker
npm run docker:build       # Build Docker images
npm run docker:run        # Run with Docker Compose

# Kubernetes
npm run k8s:deploy        # Deploy to Kubernetes
npm run k8s:delete        # Remove from Kubernetes
```

### Documentation

- [Architecture Guide](docs/ARCHITECTURE.md)
- [API Documentation](docs/API.md)
- [Installation Guide](docs/INSTALLATION.md)
- [Configuration Guide](docs/CONFIGURATION.md)

### Getting Help

- Join our [Discord server](https://discord.gg/s3manager)
- Check [GitHub Discussions](https://github.com/your-org/s3-manager/discussions)
- Read the [FAQ](docs/FAQ.md)
- Contact maintainers: dev-team@yourcompany.com

## Recognition

Contributors will be recognized in:

- CONTRIBUTORS.md file
- Release notes
- GitHub contributors page
- Annual contributor acknowledgments

Thank you for contributing to AWS S3 Manager! 🚀
