/**
 * Performance Utilities
 * 
 * Provides various performance optimization utilities for the reporting system:
 * - Debouncing functions
 * - Throttling functions  
 * - Lazy loading helpers
 * - Memoization utilities
 * - Memory management helpers
 */

class PerformanceUtils {
  constructor() {
    // Store active timeouts and intervals for cleanup
    this.timeouts = new Map();
    this.intervals = new Map();
  }

  /**
   * Debounce a function to prevent excessive calls
   * @param {Function} func - Function to debounce
   * @param {number} delay - Delay in milliseconds
   * @returns {Function} Debounced function
   */
  debounce(func, delay) {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
  }

  /**
   * Throttle a function to limit call frequency
   * @param {Function} func - Function to throttle
   * @param {number} limit - Minimum time between calls in milliseconds
   * @returns {Function} Throttled function
   */
  throttle(func, limit) {
    let inThrottle;
    return (...args) => {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  /**
   * Memoize a function to cache results
   * @param {Function} func - Function to memoize
   * @returns {Function} Memoized function
   */
  memoize(func) {
    const cache = new Map();
    return (...args) => {
      const key = JSON.stringify(args);
      if (cache.has(key)) {
        return cache.get(key);
      }
      const result = func.apply(this, args);
      cache.set(key, result);
      return result;
    };
  }

  /**
   * Lazy load data in chunks
   * @param {Array} data - Data to process
   * @param {Function} processor - Function to process each chunk
   * @param {number} chunkSize - Size of each chunk
   * @returns {Promise<Array>} Processed results
   */
  async lazyLoad(data, processor, chunkSize = 100) {
    const results = [];
    
    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.slice(i, i + chunkSize);
      const chunkResult = await processor(chunk);
      results.push(...chunkResult);
      
      // Yield control to event loop to prevent blocking
      if (i + chunkSize < data.length) {
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }
    
    return results;
  }

  /**
   * Virtual scroll helper to render only visible items
   * @param {Array} items - All items
   * @param {number} startIndex - Start index of visible items
   * @param {number} endIndex - End index of visible items
   * @param {number} bufferSize - Additional items to render as buffer
   * @returns {Array} Visible items with metadata
   */
  virtualScroll(items, startIndex, endIndex, bufferSize = 5) {
    const start = Math.max(0, startIndex - bufferSize);
    const end = Math.min(items.length, endIndex + bufferSize);
    
    return {
      visibleItems: items.slice(start, end).map((item, index) => ({
        ...item,
        __virtualIndex: start + index,
        __isVisible: start + index >= startIndex && start + index < endIndex
      })),
      totalItems: items.length,
      renderedStart: start,
      renderedEnd: end,
      visibleStart: startIndex,
      visibleEnd: endIndex
    };
  }

  /**
   * Optimize large array operations
   * @param {Array} arr - Array to optimize
   * @param {Function} operation - Operation to perform
   * @param {number} batchSize - Batch size for processing
   * @returns {Promise<Array>} Optimized results
   */
  async optimizeLargeArray(arr, operation, batchSize = 1000) {
    if (arr.length <= batchSize) {
      return operation(arr);
    }

    const batches = [];
    for (let i = 0; i < arr.length; i += batchSize) {
      batches.push(arr.slice(i, i + batchSize));
    }

    const results = [];
    for (const batch of batches) {
      results.push(await operation(batch));
      // Small delay to allow other operations to run
      await new Promise(resolve => setTimeout(resolve, 1));
    }

    return results.flat();
  }

  /**
   * Memory-efficient data processing
   * @param {Generator} dataGenerator - Generator function for data
   * @param {Function} processor - Processor function
   * @returns {Promise<Array>} Processed results
   */
  async processWithGenerator(dataGenerator, processor) {
    const results = [];
    
    for await (const chunk of dataGenerator) {
      const processed = await processor(chunk);
      results.push(...processed);
    }
    
    return results;
  }

  /**
   * Create a cancellation token for async operations
   * @returns {Object} Cancellation token with abort function
   */
  createCancellationToken() {
    let isCancelled = false;
    return {
      isCancelled: () => isCancelled,
      abort: () => { isCancelled = true; },
      throwIfAborted: () => {
        if (isCancelled) {
          throw new Error('Operation cancelled');
        }
      }
    };
  }

  /**
   * Performant deep clone with circular reference handling
   * @param {*} obj - Object to clone
   * @param {Map} visited - Map to track visited objects (internal use)
   * @returns {*} Cloned object
   */
  deepClone(obj, visited = new Map()) {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    if (visited.has(obj)) {
      return visited.get(obj); // Circular reference
    }

    if (obj instanceof Date) {
      return new Date(obj.getTime());
    }

    if (obj instanceof Array) {
      const cloned = [];
      visited.set(obj, cloned);
      for (let i = 0; i < obj.length; i++) {
        cloned[i] = this.deepClone(obj[i], visited);
      }
      return cloned;
    }

    if (typeof obj === 'object') {
      const cloned = {};
      visited.set(obj, cloned);
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          cloned[key] = this.deepClone(obj[key], visited);
        }
      }
      return cloned;
    }
  }

  /**
   * Optimize rendering by batching DOM updates
   * @param {Function} renderFn - Rendering function
   * @returns {Function} Batched rendering function
   */
  batchRender(renderFn) {
    let scheduled = false;
    const callbacks = [];

    return function batchedRender(...args) {
      callbacks.push([this, args]);

      if (!scheduled) {
        scheduled = true;
        Promise.resolve().then(() => {
          scheduled = false;
          callbacks.forEach(([ctx, args]) => {
            renderFn.apply(ctx, args);
          });
          callbacks.length = 0;
        });
      }
    };
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    // Clear all timeouts
    for (const [id, timeoutId] of this.timeouts) {
      clearTimeout(timeoutId);
    }
    this.timeouts.clear();

    // Clear all intervals
    for (const [id, intervalId] of this.intervals) {
      clearInterval(intervalId);
    }
    this.intervals.clear();
  }

  /**
   * Measure execution time of a function
   * @param {Function} fn - Function to measure
   * @param {string} label - Label for the measurement
   * @returns {Promise<any>} Function result with timing info
   */
  async measureTime(fn, label = 'Execution') {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();
    
    console.log(`${label}: ${(end - start).toFixed(2)}ms`);
    return { result, duration: end - start };
  }

  /**
   * Debounced function executor with promise support
   */
  debounceAsync(func, delay) {
    let timeoutId;
    return (...args) => {
      return new Promise((resolve, reject) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          try {
            const result = func.apply(this, args);
            if (result instanceof Promise) {
              result.then(resolve).catch(reject);
            } else {
              resolve(result);
            }
          } catch (error) {
            reject(error);
          }
        }, delay);
      });
    };
  }
}

// Singleton instance
const performanceUtils = new PerformanceUtils();

// Export utility functions individually for easy import
module.exports = {
  debounce: performanceUtils.debounce.bind(performanceUtils),
  throttle: performanceUtils.throttle.bind(performanceUtils),
  memoize: performanceUtils.memoize.bind(performanceUtils),
  lazyLoad: performanceUtils.lazyLoad.bind(performanceUtils),
  virtualScroll: performanceUtils.virtualScroll.bind(performanceUtils),
  optimizeLargeArray: performanceUtils.optimizeLargeArray.bind(performanceUtils),
  createCancellationToken: performanceUtils.createCancellationToken.bind(performanceUtils),
  deepClone: performanceUtils.deepClone.bind(performanceUtils),
  batchRender: performanceUtils.batchRender.bind(performanceUtils),
  measureTime: performanceUtils.measureTime.bind(performanceUtils),
  debounceAsync: performanceUtils.debounceAsync.bind(performanceUtils),
  PerformanceUtils: performanceUtils
};