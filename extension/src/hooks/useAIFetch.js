import { useState, useEffect, useRef } from "react";

/** @typedef {"TIMEOUT" | "NETWORK"} AIFetchErrorType */

/**
 * @typedef {Object} AIFetchState
 * @property {unknown} data - The response data, or `null` if not yet loaded.
 * @property {boolean} isLoading - Whether a request is currently in flight.
 * @property {AIFetchErrorType | null} error - Error classification, or `null`.
 */

/**
 * @typedef {Object} AIFetchOptions
 * @property {string} url - The endpoint URL to fetch.
 * @property {RequestInit} [fetchOptions] - Options forwarded to `fetch()`.
 * @property {number} [timeout=60000] - Timeout in milliseconds before aborting.
 */

/**
 * Custom hook for resilient AI backend fetching.
 *
 * - Uses `AbortController` to cancel requests on timeout or unmount.
 * - Classifies errors as `"TIMEOUT"` or `"NETWORK"`.
 * - Prevents memory leaks by aborting in the cleanup function.
 *
 * @param {AIFetchOptions} options
 * @returns {AIFetchState}
 *
 * @example
 * const { data, isLoading, error } = useAIFetch({
 *   url: "http://localhost:5000/get_mcq",
 *   fetchOptions: { method: "POST", body: JSON.stringify({ input_text: "..." }) },
 *   timeout: 30000,
 * });
 */
export function useAIFetch({ url, fetchOptions = {}, timeout = 60000 }) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(/** @type {AIFetchErrorType | null} */ (null));

  /** Track whether the component is still mounted */
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!url) {
      return;
    }

    const controller = new AbortController();
    const { signal } = controller;

    /** Abort after `timeout` ms */
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, timeout);

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      setData(null);

      try {
        const response = await fetch(url, {
          ...fetchOptions,
          signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const json = await response.json();

        if (isMountedRef.current) {
          setData(json);
        }
      } catch (err) {
        if (!isMountedRef.current) {
          return;
        }

        if (err.name === "AbortError") {
          setError("TIMEOUT");
        } else {
          setError("NETWORK");
        }
      } finally {
        clearTimeout(timeoutId);
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }
    };

    fetchData();

    /** Cleanup: abort in-flight request and clear the timeout */
    return () => {
      controller.abort();
      clearTimeout(timeoutId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, timeout]);

  return { data, isLoading, error };
}
