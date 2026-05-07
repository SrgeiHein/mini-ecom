Senior Level Take-Home Assignment
E-commerce Mini-App
Project Overview: Build a functional e-commerce product catalog with a focus on security,
performance, and seamless user experience. As a senior role, we are looking for high-quality
architectural decisions, clean code, and attention to edge cases.
Suggested Time: 3 hours
Deadline: 3 days from receipt of this email.

1. Technical Stack
   ● Frontend: Next.js
   ● Backend: NestJS
   ● Database: PostgreSQL

2. Authentication & Session Management
   ● Secure Login: Implement a login screen with integrated spam and brute-force protection.
   ● Persistent Sessions: Users must remain logged in even after closing the browser tab or
   restarting the browser.
   ● Inactivity Timeout: For security, sessions must automatically invalidate after 30 minutes of
   inactivity, requiring the user to re-authenticate.

3. Product Catalog & Infinite Scroll
   ● Efficient Pagination: Implement an infinite scroll mechanism for the product listing to
   ensure a smooth browsing experience.
   ● Configurable Scaling: The page size must be user-configurable, supporting a minimum of
   5 and a maximum of 50 items per request.
   ● Performance: Ensure the frontend handles large lists efficiently without UI lag.

4. CI/CD pipeline
   ● Setup a basic pipeline to demonstrate your understanding of modern development
   workflows.
   Submission Instructions: Please provide a link to a GitHub repository including a README that
   briefly explains your architectural choices and instructions on how to run the project locally
