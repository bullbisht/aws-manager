# Frontend Integration Test Plan

## Test Workflow
1. **Login Page Testing** - Navigate and test login form
2. **Dashboard Testing** - Verify dashboard loads with user data
3. **Buckets Page Testing** - Test bucket list and interactions
4. **API Test Page** - Verify interactive API testing
5. **Navigation Testing** - Test routing and navigation

## Browser Console Tests

### Test 1: Check if App is Loaded
```javascript
// Run in browser console
console.log('Testing S3 Manager Frontend...');
console.log('Current URL:', window.location.href);
console.log('React DevTools available:', !!window.__REACT_DEVTOOLS_GLOBAL_HOOK__);
```

### Test 2: Test Login Form Validation
```javascript
// Navigate to login page first, then run:
const form = document.querySelector('form');
if (form) {
    console.log('Login form found');
    const inputs = form.querySelectorAll('input');
    console.log('Form inputs:', inputs.length);
} else {
    console.log('No login form found');
}
```

### Test 3: Test API Client (after login)
```javascript
// Test if API client is accessible
if (window.fetch) {
    fetch('/api/user/profile', { credentials: 'include' })
        .then(r => r.json())
        .then(data => console.log('Profile API test:', data))
        .catch(e => console.log('Profile API error:', e));
}
```

### Test 4: Test Frontend State Management
```javascript
// Check if auth context is working
const authElements = document.querySelectorAll('[data-testid*="auth"], [data-testid*="user"]');
console.log('Auth-related elements:', authElements.length);
```

## Manual Test Checklist

### ✅ Page Accessibility
- [ ] Home page (/) loads
- [ ] Login page (/login) loads  
- [ ] Dashboard page (/dashboard) loads
- [ ] Buckets page (/buckets) loads
- [ ] API Test page (/api-test) loads

### ✅ Login Functionality
- [ ] Login form displays correctly
- [ ] Input validation works
- [ ] Submit button functionality
- [ ] Error handling displays
- [ ] Successful login redirects to dashboard

### ✅ Dashboard
- [ ] User profile information displays
- [ ] Navigation menu works
- [ ] Logout functionality
- [ ] Quick stats/overview

### ✅ Buckets Page
- [ ] Bucket list loads from API
- [ ] Bucket cards display correctly
- [ ] Pagination/loading states
- [ ] Create bucket functionality
- [ ] Bucket actions (view objects, etc.)

### ✅ API Test Page
- [ ] All API endpoints listed
- [ ] Test forms for each endpoint
- [ ] Response display functionality
- [ ] Error handling in UI

### ✅ Navigation & UX
- [ ] Navbar displays correctly
- [ ] Menu items navigate properly
- [ ] Responsive design works
- [ ] Loading states display
- [ ] Error boundaries work

## Automated Tests to Add Later
- Unit tests for components
- Integration tests for API calls
- E2E tests with Playwright/Cypress
- Performance tests
- Accessibility tests
