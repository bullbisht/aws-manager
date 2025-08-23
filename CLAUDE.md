# AWS Manager Development Guidelines

## Technology Stack Requirements

### Framework Versions
- **Next.js**: Always use the latest stable version (currently 14.x or newer)
- **React**: Always use the latest stable version (currently 18.x or newer)
- **TypeScript**: Use latest stable version for type safety
- **Tailwind CSS**: Use latest version for styling

### Before Implementation Protocol

#### 1. Documentation Research with MCP Servers
Before implementing any new feature or technology, ALWAYS use available MCP servers to fetch the latest documentation:

**Use Context7 MCP Server** for library-specific documentation:
- Call `resolve-library-id` to find the correct library
- Use `get-library-docs` to fetch up-to-date documentation
- Focus on latest patterns, best practices, and API changes

**Use AWS Documentation MCP Server** for AWS service integration:
- Search AWS documentation for the specific service
- Get the latest API references and best practices
- Check for any recent changes or deprecated methods

**Use Perplexity MCP Server** for general research:
- Research latest trends and best practices
- Verify compatibility between different library versions
- Get recent community insights and recommendations

#### 2. Technology Research Checklist
Before implementing:
- [ ] Check if there are newer versions of dependencies
- [ ] Research latest patterns and best practices via MCP servers
- [ ] Verify compatibility between different libraries
- [ ] Look for any breaking changes or deprecated methods
- [ ] Check for security updates or performance improvements

## Development Standards

### Component Architecture
- Use functional components with hooks
- Implement proper TypeScript interfaces
- Follow React Server Components patterns for Next.js 14+
- Use the latest React features (Suspense, Error Boundaries, etc.)

### State Management
- Use React's built-in state management (useState, useReducer, useContext)
- For complex state, consider Zustand or latest state management solutions
- Implement optimistic UI updates where appropriate

### API Integration
- Use Next.js App Router API routes (app/api directory structure)
- Implement proper error handling and loading states
- Use the latest fetch patterns and error boundaries

### UI/UX Standards
- Always implement modern, accessible UI components
- Use proper ARIA labels and semantic HTML
- Implement responsive design with mobile-first approach
- Use modern CSS features and Tailwind utilities
- **NEVER use basic HTML prompts or alerts** - always use custom React modals
- Follow accessibility guidelines (WCAG 2.1)

### AWS Integration
- Follow AWS SDK v3 patterns
- Implement proper error handling for AWS services
- Use environment variables for configuration
- Follow AWS security best practices

## Code Quality Standards

### TypeScript
- Always use strict TypeScript configuration
- Define proper interfaces for all data structures
- Use generics where appropriate
- Avoid `any` types

### Error Handling
- Implement comprehensive error boundaries
- Use proper try-catch blocks in async operations
- Provide meaningful error messages to users
- Log errors appropriately for debugging

### Performance
- Implement proper loading states
- Use React.memo and useMemo where beneficial
- Optimize bundle size with proper imports
- Follow Next.js performance best practices

## Specific AWS Manager Guidelines

### S3 Operations
- Always handle different storage classes appropriately
- Implement proper validation for restore operations
- Use optimistic UI updates for better user experience
- Handle AWS service limits and throttling

### Storage Class Management
- Support all AWS S3 storage classes
- Implement proper cost warnings for operations
- Handle transition restrictions appropriately
- Provide clear feedback on operation status

### Restoration Operations
- Support all restoration tiers (Standard, Expedited, Bulk)
- Implement proper duration validation (1-30 days)
- Show cost implications clearly
- Handle restoration status properly

### UI Components
- Use consistent design patterns across the application
- Implement proper loading and error states
- Follow accessibility best practices
- Use modern modal dialogs instead of browser prompts

## Development Workflow

### Before Starting Any Feature
1. Use MCP servers to research latest documentation
2. Check for framework updates and breaking changes
3. Review existing code patterns in the project
4. Plan the implementation with modern practices

### During Development
1. Write TypeScript interfaces first
2. Implement error handling early
3. Add proper loading states
4. Test with real AWS data when possible
5. Follow consistent naming conventions

### Before Committing
1. Verify all TypeScript types are correct
2. Test error scenarios
3. Check accessibility compliance
4. Verify responsive design
5. Update documentation as needed

## MCP Server Usage Examples

### Fetching Next.js Documentation
```
Use Context7 MCP Server:
- resolve-library-id: "next.js"
- get-library-docs: "/vercel/next.js" with topic "app-router"
```

### AWS Service Documentation
```
Use AWS Documentation MCP Server:
- search_documentation: "S3 storage classes"
- read_documentation: specific AWS S3 documentation URLs
```

### General Best Practices Research
```
Use Perplexity MCP Server:
- perplexity_research: "React 18 best practices 2024"
- perplexity_ask: "Next.js 14 performance optimization"
```

## Important Notes

- **Always prioritize user experience** - no basic HTML prompts or alerts
- **Security first** - never expose AWS credentials in frontend code
- **Performance matters** - implement proper loading states and optimizations
- **Accessibility is mandatory** - follow WCAG guidelines
- **Documentation is key** - use MCP servers to stay current with best practices

Remember: This project should showcase modern web development practices using the latest stable versions of all technologies.
