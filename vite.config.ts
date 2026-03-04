import { defineConfig } from 'vite';

export default defineConfig({
    // When using a custom domain (e.g. raphael.dsouza-family.com), the base path should be '/'
    // Enforcing sub-path deployment for custom domain
    base: '/fighter-royale/',
});
