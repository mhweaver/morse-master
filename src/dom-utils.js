/**
 * DOM Caching and Query Utilities
 * Reduces redundant DOM queries and improves performance
 */

export class DOMCache {
  constructor(rootElement) {
    if (!rootElement) {
      throw new Error('DOMCache: Root element is required');
    }
    this.root = rootElement;
    this.cache = new Map();
  }

  /**
   * Query with caching. Returns cached element if available,
   * otherwise queries and caches for future use.
   * @param {string} selector - CSS selector
   * @param {boolean} useCache - Whether to use cache (default true)
   * @returns {Element|null} Element if found, null otherwise
   */
  query(selector, useCache = true) {
    if (!selector || typeof selector !== 'string') {
      console.warn('DOMCache.query: Invalid selector', selector);
      return null;
    }

    if (useCache && this.cache.has(selector)) {
      return this.cache.get(selector);
    }
    
    const element = this.root.querySelector(selector);
    if (element && useCache) {
      this.cache.set(selector, element);
    }
    return element;
  }

  /**
   * Query all with optional caching
   * @param {string} selector - CSS selector
   * @param {boolean} useCache - Whether to use cache (default false for NodeLists)
   * @returns {NodeList} NodeList of elements (empty if none found)
   */
  queryAll(selector, useCache = false) {
    if (!selector || typeof selector !== 'string') {
      console.warn('DOMCache.queryAll: Invalid selector', selector);
      return this.root.querySelectorAll(':none'); // Returns empty NodeList
    }

    if (useCache && this.cache.has(selector)) {
      return this.cache.get(selector);
    }
    
    const elements = this.root.querySelectorAll(selector);
    if (useCache && elements.length > 0) {
      this.cache.set(selector, elements);
    }
    return elements;
  }

  /**
   * Clear specific cache entry or entire cache
   * @param {string|null} selector - Specific selector to clear, or null to clear all
   */
  clear(selector = null) {
    if (selector) {
      this.cache.delete(selector);
    } else {
      this.cache.clear();
    }
  }

  /**
   * Update a cached element reference
   * @param {string} selector - CSS selector
   * @param {Element} element - New element reference
   */
  set(selector, element) {
    this.cache.set(selector, element);
  }

  /**
   * Get cache statistics for debugging
   * @returns {Object}
   */
  stats() {
    return {
      cached: this.cache.size,
      entries: Array.from(this.cache.keys())
    };
  }
}

/**
 * Efficient batch DOM updates to reduce reflow/repaint
 */
export class DOMBatch {
  /**
   * Execute multiple DOM operations and trigger single reflow
   * @param {Function} updateFn - Function containing DOM mutations
   * @returns {any} Return value of updateFn
   */
  static update(updateFn) {
    // Browsers optimize multiple DOM mutations in sequence
    return updateFn();
  }

  /**
   * Clear and rebuild a container's children efficient
   * @param {Element} container - Container element
   * @param {Array} items - Items to render
   * @param {Function} renderFn - Function(item, index) => Element
   */
  static rebuild(container, items, renderFn) {
    // Use fragment to avoid multiple reflows
    const fragment = document.createDocumentFragment();
    
    items.forEach((item, idx) => {
      const element = renderFn(item, idx);
      if (element) fragment.appendChild(element);
    });
    
    // Single operation: clear and append
    container.innerHTML = '';
    container.appendChild(fragment);
  }

  /**
   * Update element classes efficiently
   * @param {Element} element - Target element
   * @param {string} classToAdd - Class to add
   * @param {string} classToRemove - Class to remove
   */
  static toggleClasses(element, classToAdd, classToRemove) {
    if (classToRemove) element.classList.remove(...classToRemove.split(' '));
    if (classToAdd) element.classList.add(...classToAdd.split(' '));
  }
}
