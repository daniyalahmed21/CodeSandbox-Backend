/**
 * Simple Dependency Injection Container
 * Implements Service Locator pattern for dependency management
 */
export class Container {
    constructor() {
        this.services = new Map();
        this.factories = new Map();
    }

    /**
     * Register a service instance
     * @param {string} name - Service name
     * @param {*} instance - Service instance
     */
    register(name, instance) {
        this.services.set(name, instance);
    }

    /**
     * Register a factory function for lazy instantiation
     * @param {string} name - Service name
     * @param {Function} factory - Factory function
     */
    registerFactory(name, factory) {
        this.factories.set(name, factory);
    }

    /**
     * Get a service instance
     * @param {string} name - Service name
     * @returns {*} Service instance
     */
    get(name) {
        // Return existing instance if available
        if (this.services.has(name)) {
            return this.services.get(name);
        }

        // Create instance using factory if available
        if (this.factories.has(name)) {
            const factory = this.factories.get(name);
            const instance = factory(this);
            this.services.set(name, instance);
            return instance;
        }

        throw new Error(`Service '${name}' not found`);
    }

    /**
     * Check if a service is registered
     * @param {string} name - Service name
     * @returns {boolean}
     */
    has(name) {
        return this.services.has(name) || this.factories.has(name);
    }

    /**
     * Clear all services (useful for testing)
     */
    clear() {
        this.services.clear();
        this.factories.clear();
    }
}
