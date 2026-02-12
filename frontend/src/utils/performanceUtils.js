/**
 * Performance Utilities for JESPR Reporting System
 * 
 * Provides optimization functions for:
 * - Debouncing and throttling user interactions
 * - Virtual scrolling for large datasets
 * - Memory management and cleanup
 * - Performance monitoring
 */

/**
 * Debounce function to limit rate of function execution
 * @param {Function} func - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @param {boolean} immediate - Execute immediately on first call
 * @returns {Function} Debounced function
 */
export function debounce(func, delay, immediate = false) {
  let timeoutId;
  
  return function executedFunction(...args) {
    const later = () => {
      timeoutId = null;
      if (!immediate) func.apply(this, args);
    };
    
    const callNow = immediate && !timeoutId;
    
    clearTimeout(timeoutId);
    timeoutId = setTimeout(later, delay);
    
    if (callNow) func.apply(this, args);
  };
}

/**
 * Throttle function to limit rate of function execution
 * @param {Function} func - Function to throttle
 * @param {number} limit - Limit in milliseconds
 * @returns {Function} Throttled function
 */
export function throttle(func, limit) {
  let inThrottle;
  
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Virtual Scroll Implementation
 * Renders only visible items for better performance with large datasets
 */
export class VirtualScroll {
  constructor(options = {}) {
    this.itemHeight = options.itemHeight || 30;
    this.buffer = options.buffer || 5;
    this.containerHeight = options.containerHeight || 400;
    this.onRender = options.onRender || (() => {});
  }
  
  /**
   * Calculate visible items based on scroll position
   * @param {number} scrollTop - Current scroll position
   * @param {number} totalItems - Total number of items
   * @returns {Object} Visible items info
   */
  getVisibleItems(scrollTop, totalItems) {
    const startIndex = Math.max(0, Math.floor(scrollTop / this.itemHeight) - this.buffer);
    const visibleCount = Math.ceil(this.containerHeight / this.itemHeight) + (this.buffer * 2);
    const endIndex = Math.min(totalItems, startIndex + visibleCount);
    
    return {
      startIndex,
      endIndex,
      offsetY: startIndex * this.itemHeight,
      visibleItems: endIndex - startIndex
    };
  }
  
  /**
   * Render visible items
   * @param {Array} items - All items
   * @param {number} scrollTop - Current scroll position
   * @returns {Array} Visible items to render
   */
  render(items, scrollTop) {
    if (!items || items.length === 0) return [];
    
    const visibleInfo = this.getVisibleItems(scrollTop, items.length);
    const visibleItems = items.slice(visibleInfo.startIndex, visibleInfo.endIndex);
    
    this.onRender(visibleInfo);
    
    return {
      items: visibleItems,
      offsetY: visibleInfo.offsetY,
      totalHeight: items.length * this.itemHeight
    };
  }
}

/**
 * Memory Management Utilities
 */
export class MemoryManager {
  constructor() {
    this.weakRefs = new Map();
    this.cleanupCallbacks = new Set();
  }
  
  /**
   * Add cleanup callback for component unmount
   * @param {Function} callback - Cleanup function
   */
  addCleanup(callback) {
    this.cleanupCallbacks.add(callback);
  }
  
  /**
   * Remove cleanup callback
   * @param {Function} callback - Cleanup function to remove
   */
  removeCleanup(callback) {
    this.cleanupCallbacks.delete(callback);
  }
  
  /**
   * Execute all cleanup functions
   */
  cleanup() {
    this.cleanupCallbacks.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.warn('Cleanup error:', error);
      }
    });
    this.cleanupCallbacks.clear();
  }
  
  /**
   * Create weak reference for large objects
   * @param {Object} obj - Object to reference
   * @param {string} key - Reference key
   */
  setWeakRef(obj, key) {
    this.weakRefs.set(key, new WeakRef(obj));
  }
  
  /**
   * Get weak reference
   * @param {string} key - Reference key
   * @returns {Object|null} Referenced object or null
   */
  getWeakRef(key) {
    const ref = this.weakRefs.get(key);
    return ref ? ref.deref() : null;
  }
}

/**
 * Performance Monitoring Utilities
 */
export class PerformanceMonitor {
  constructor() {
    this.metrics = {
      renderCount: 0,
      totalRenderTime: 0,
      averageRenderTime: 0,
      memoryUsage: 0
    };
  }
  
  /**
   * Start performance measurement
   * @param {string} label - Measurement label
   */
  start(label) {
    if (performance.mark) {
      performance.mark(`${label}-start`);
    }
  }
  
  /**
   * End performance measurement
   * @param {string} label - Measurement label
   * @returns {number} Duration in milliseconds
   */
  end(label) {
    if (performance.mark && performance.measure) {
      const startMark = `${label}-start`;
      const endMark = `${label}-end`;
      
      performance.mark(endMark);
      const measure = performance.measure(label, startMark, endMark);
      
      return measure.duration;
    }
    return 0;
  }
  
  /**
   * Track render performance
   * @param {Function} renderFunction - Render function to measure
   * @returns {*} Render result
   */
  trackRender(renderFunction) {
    this.metrics.renderCount++;
    const startTime = performance.now();
    
    const result = renderFunction();
    
    const renderTime = performance.now() - startTime;
    this.metrics.totalRenderTime += renderTime;
    this.metrics.averageRenderTime = this.metrics.totalRenderTime / this.metrics.renderCount;
    
    return result;
  }
  
  /**
   * Get current memory usage (if available)
   * @returns {Object} Memory usage info
   */
  getMemoryUsage() {
    if (performance.memory) {
      return {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit
      };
    }
    return { used: 0, total: 0, limit: 0 };
  }
  
  /**
   * Get performance metrics
   * @returns {Object} Current metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      memoryUsage: this.getMemoryUsage(),
      timestamp: Date.now()
    };
  }
}

/**
 * Lazy Loading Utilities
 */
export class LazyLoader {
  constructor(options = {}) {
    this.threshold = options.threshold || 0.1;
    this.rootMargin = options.rootMargin || '50px';
    this.observers = new Map();
  }
  
  /**
   * Create intersection observer for lazy loading
   * @param {Function} callback - Load callback
   * @param {Object} options - Observer options
   * @returns {IntersectionObserver} Observer instance
   */
  createObserver(callback, options = {}) {
    const observerOptions = {
      threshold: options.threshold || this.threshold,
      rootMargin: options.rootMargin || this.rootMargin
    };
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          callback(entry.target);
        }
      });
    }, observerOptions);
    
    this.observers.set(callback, observer);
    return observer;
  }
  
  /**
   * Observe element for lazy loading
   * @param {Element} element - Element to observe
   * @param {Function} callback - Load callback
   * @param {Object} options - Observer options
   */
  observe(element, callback, options) {
    const observer = this.observers.get(callback) || this.createObserver(callback, options);
    observer.observe(element);
  }
  
  /**
   * Unobserve element
   * @param {Element} element - Element to unobserve
   * @param {Function} callback - Load callback
   */
  unobserve(element, callback) {
    const observer = this.observers.get(callback);
    if (observer) {
      observer.unobserve(element);
    }
  }
  
  /**
   * Disconnect all observers
   */
  disconnectAll() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
  }
}

/**
 * Data Processing Optimizations
 */
export class DataOptimizer {
  /**
   * Chunk large arrays for processing
   * @param {Array} array - Array to chunk
   * @param {number} chunkSize - Size of each chunk
   * @returns {Array} Array of chunks
   */
  static chunk(array, chunkSize) {
    const chunks = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }
  
  /**
   * Process data in chunks to prevent blocking
   * @param {Array} data - Data to process
   * @param {Function} processor - Processing function
   * @param {number} chunkSize - Chunk size
   * @param {Function} onProgress - Progress callback
   * @returns {Promise} Processing promise
   */
  static async processInChunks(data, processor, chunkSize = 1000, onProgress) {
    const chunks = this.chunk(data, chunkSize);
    const results = [];
    
    for (let i = 0; i < chunks.length; i++) {
      const chunkResults = chunks[i].map(processor);
      results.push(...chunkResults);
      
      if (onProgress) {
        onProgress({
          processed: (i + 1) * chunkSize,
          total: data.length,
          percentage: ((i + 1) / chunks.length) * 100
        });
      }
      
      // Yield to event loop
      await new Promise(resolve => setTimeout(resolve, 0));
    }
    
    return results;
  }
  
  /**
   * Memoize expensive function calls
   * @param {Function} func - Function to memoize
   * @param {Function} resolver - Cache key resolver
   * @returns {Function} Memoized function
   */
  static memoize(func, resolver) {
    const cache = new Map();
    
    return function(...args) {
      const key = resolver ? resolver(...args) : JSON.stringify(args);
      
      if (cache.has(key)) {
        return cache.get(key);
      }
      
      const result = func.apply(this, args);
      cache.set(key, result);
      return result;
    };
  }
}

// Export singleton instances
export const memoryManager = new MemoryManager();
export const performanceMonitor = new PerformanceMonitor();
export const lazyLoader = new LazyLoader();

// Export utility functions
export default {
  debounce,
  throttle,
  VirtualScroll,
  MemoryManager,
  PerformanceMonitor,
  LazyLoader,
  DataOptimizer,
  memoryManager,
  performanceMonitor,
  lazyLoader
};