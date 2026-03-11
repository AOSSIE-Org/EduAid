"""
Content-Based Inference Result Caching System

This module provides a lightweight caching layer for transformer model inference results.
Cache keys are generated using SHA256 hashing based on input_text + endpoint + parameters.
"""

import hashlib
import threading
import time
from collections import OrderedDict
from typing import Any, Optional, Tuple


class InferenceCache:
    """
    LRU cache with TTL support for storing model inference results.
    
    Attributes:
        max_size: Maximum number of entries in cache
        ttl_seconds: Time-to-live for cache entries in seconds (default: 24 hours)
    """
    
    def __init__(self, max_size: int = 1000, ttl_seconds: int = 86400):
        """
        Initialize the cache.
        
        Args:
            max_size: Maximum cache size (default: 1000 entries)
            ttl_seconds: TTL in seconds (default: 86400 = 24 hours)
        """
        self.max_size = max_size
        self.ttl_seconds = ttl_seconds
        self.cache = OrderedDict()
        self.timestamps = {}
        self._lock = threading.RLock()
        
    def _generate_cache_key(self, input_text: str, endpoint: str, **params) -> str:
        """
        Generate SHA256 hash for cache key.
        
        Args:
            input_text: The input text to process
            endpoint: The endpoint name (e.g., 'get_mcq', 'get_boolq')
            **params: Additional parameters (e.g., max_questions)
            
        Returns:
            SHA256 hash string
        """
        # Sort params to ensure consistent hashing
        sorted_params = sorted(params.items())
        cache_string = f"{input_text.strip()}|{endpoint}|{sorted_params}"
        return hashlib.sha256(cache_string.encode('utf-8')).hexdigest()
    
    def _is_expired(self, cache_key: str) -> bool:
        """
        Check if a cache entry has expired.
        
        Args:
            cache_key: The cache key to check
            
        Returns:
            True if expired, False otherwise
        """
        if cache_key not in self.timestamps:
            return True
        
        age = time.time() - self.timestamps[cache_key]
        return age > self.ttl_seconds
    
    def get(self, input_text: str, endpoint: str, **params) -> Optional[Any]:
        """
        Retrieve cached result if available and not expired.
        
        Args:
            input_text: The input text
            endpoint: The endpoint name
            **params: Additional parameters
            
        Returns:
            Cached result or None if cache miss
        """
        cache_key = self._generate_cache_key(input_text, endpoint, **params)
        
        # Check if key exists and is not expired
        with self._lock:
            if cache_key in self.cache and not self._is_expired(cache_key):
                self.cache.move_to_end(cache_key)
                return self.cache[cache_key]

            if cache_key in self.cache:
                self.cache.pop(cache_key, None)
                self.timestamps.pop(cache_key, None)
        
        return None
    
    def set(self, result: Any, input_text: str, endpoint: str, **params) -> None:
        """
        Store result in cache.
        
        Args:
            result: The result to cache
            input_text: The input text
            endpoint: The endpoint name
            **params: Additional parameters
        """
        cache_key = self._generate_cache_key(input_text, endpoint, **params)
        
        with self._lock:
            if len(self.cache) >= self.max_size and cache_key not in self.cache:
                oldest_key = next(iter(self.cache))
                self.cache.pop(oldest_key, None)
                self.timestamps.pop(oldest_key, None)

            self.cache[cache_key] = result
            self.timestamps[cache_key] = time.time()
            self.cache.move_to_end(cache_key)
    
    def clear(self) -> None:
        """Clear all cache entries."""
        with self._lock:
            self.cache.clear()
            self.timestamps.clear()
    
    def get_stats(self) -> dict:
        """
        Get cache statistics.
        
        Returns:
            Dictionary with cache stats
        """
        with self._lock:
            return {
                "size": len(self.cache),
                "max_size": self.max_size,
                "ttl_seconds": self.ttl_seconds
            }


# Global cache instance
_global_cache = InferenceCache(max_size=1000, ttl_seconds=86400)


def get_cache() -> InferenceCache:
    """
    Get the global cache instance.
    
    Returns:
        Global InferenceCache instance
    """
    return _global_cache


def cached_inference(endpoint: str):
    """
    Decorator for caching inference results.
    
    Args:
        endpoint: The endpoint name for cache key generation
        
    Returns:
        Decorated function with caching
    """
    def decorator(func):
        def wrapper(*args, **kwargs):
            cache = get_cache()
            
            # Extract input_text and params from kwargs or request data
            # This assumes the function receives data dict with input_text
            data = kwargs.get('data') or (args[0] if args else {})
            
            if not isinstance(data, dict):
                # If not a dict, call function without caching
                return func(*args, **kwargs)
            
            input_text = data.get('input_text', '')
            max_questions = data.get('max_questions', 4)
            use_mediawiki = data.get('use_mediawiki', 0)
            
            # Try to get from cache
            cached_result = cache.get(
                input_text=input_text,
                endpoint=endpoint,
                max_questions=max_questions,
                use_mediawiki=use_mediawiki
            )
            
            if cached_result is not None:
                print(f"[CACHE HIT] {endpoint}")
                return cached_result
            
            print(f"[CACHE MISS] {endpoint}")
            
            # Call original function
            result = func(*args, **kwargs)
            
            # Store in cache
            cache.set(
                result=result,
                input_text=input_text,
                endpoint=endpoint,
                max_questions=max_questions,
                use_mediawiki=use_mediawiki
            )
            
            return result
        
        return wrapper
    return decorator
