"""Tests for graceful Wikipedia / MediaWiki fallback (issue #428).

When ``use_mediawiki=1`` is passed but the MediaWiki API call fails
(SSL error, timeout, network unreachable, etc.), every endpoint should:

  1. Still return HTTP 200 with valid quiz data.
  2. Include a ``warning`` key in the JSON response.
  3. Generate questions from the *original* input text (not crash).

Uses **pytest** with Flask's built-in test client.  All heavy ML models
are mocked in ``conftest.py`` – no running server or GPU required.
"""

from unittest.mock import patch, MagicMock

import pytest

# ---------------------------------------------------------------------------
# Shared test data
# ---------------------------------------------------------------------------

SAMPLE_TEXT = (
    "Artificial intelligence (AI) is the simulation of human intelligence "
    "processes by machines, especially computer systems. These processes "
    "include learning, reasoning, and self-correction. AI applications "
    "include speech recognition, natural language processing, machine "
    "vision, expert systems, and robotics. Machine learning is a subset "
    "of AI that focuses on algorithms that learn from data."
)


# ===========================================================================
# SSL / network errors produce a warning, not a 500
# ===========================================================================


class TestWikipediaFallbackBasicEndpoints:
    """Test the three primary question-generation endpoints."""

    @pytest.mark.parametrize("endpoint", [
        "/get_mcq", "/get_boolq", "/get_shortq",
    ])
    def test_ssl_error_returns_200_with_warning(self, client, endpoint):
        """SSLError in MediaWiki should NOT crash the request."""
        with patch("server.mediawikiapi") as wiki_mock:
            wiki_mock.summary.side_effect = Exception(
                "SSLError(SSLEOFError(8, 'EOF occurred in violation of protocol'))"
            )
            resp = client.post(
                endpoint,
                json={"input_text": SAMPLE_TEXT, "use_mediawiki": 1},
            )
        assert resp.status_code == 200
        data = resp.get_json()
        assert "output" in data
        assert "warning" in data
        assert "Wikipedia" in data["warning"] or "network" in data["warning"]

    @pytest.mark.parametrize("endpoint", [
        "/get_mcq", "/get_boolq", "/get_shortq",
    ])
    def test_connection_error_returns_200_with_warning(self, client, endpoint):
        """ConnectionError in MediaWiki should NOT crash the request."""
        with patch("server.mediawikiapi") as wiki_mock:
            wiki_mock.summary.side_effect = ConnectionError("Network unreachable")
            resp = client.post(
                endpoint,
                json={"input_text": SAMPLE_TEXT, "use_mediawiki": 1},
            )
        assert resp.status_code == 200
        data = resp.get_json()
        assert "output" in data
        assert "warning" in data

    @pytest.mark.parametrize("endpoint", [
        "/get_mcq", "/get_boolq", "/get_shortq",
    ])
    def test_timeout_returns_200_with_warning(self, client, endpoint):
        """TimeoutError in MediaWiki should NOT crash the request."""
        with patch("server.mediawikiapi") as wiki_mock:
            wiki_mock.summary.side_effect = TimeoutError("Connection timed out")
            resp = client.post(
                endpoint,
                json={"input_text": SAMPLE_TEXT, "use_mediawiki": 1},
            )
        assert resp.status_code == 200
        data = resp.get_json()
        assert "output" in data
        assert "warning" in data


class TestWikipediaFallbackHardEndpoints:
    """Test the three hard-question endpoints."""

    @pytest.mark.parametrize("endpoint", [
        "/get_shortq_hard", "/get_mcq_hard", "/get_boolq_hard",
    ])
    def test_ssl_error_hard_endpoints_returns_200_with_warning(self, client, endpoint):
        """SSL failure should NOT crash hard-question endpoints."""
        with patch("server.mediawikiapi") as wiki_mock:
            wiki_mock.summary.side_effect = ConnectionError("Network unreachable")
            resp = client.post(
                endpoint,
                json={"input_text": SAMPLE_TEXT, "use_mediawiki": 1},
            )
        assert resp.status_code == 200
        data = resp.get_json()
        assert "output" in data
        assert "warning" in data


class TestWikipediaFallbackProblems:
    """Test the combined /get_problems endpoint."""

    def test_ssl_error_get_problems_returns_200_with_warning(self, client):
        """SSL failure should NOT crash the combined /get_problems endpoint."""
        with patch("server.mediawikiapi") as wiki_mock:
            wiki_mock.summary.side_effect = TimeoutError("Connection timed out")
            resp = client.post(
                "/get_problems",
                json={"input_text": SAMPLE_TEXT, "use_mediawiki": 1},
            )
        assert resp.status_code == 200
        data = resp.get_json()
        assert "output_mcq" in data
        assert "output_boolq" in data
        assert "output_shortq" in data
        assert "warning" in data


# ===========================================================================
# Successful MediaWiki calls should NOT have a warning
# ===========================================================================


class TestWikipediaSuccessNoWarning:
    """When MediaWiki succeeds, no warning should be present."""

    @pytest.mark.parametrize("endpoint", [
        "/get_mcq", "/get_boolq", "/get_shortq",
    ])
    def test_successful_wiki_call_has_no_warning(self, client, endpoint):
        """Successful MediaWiki call should NOT include a warning."""
        resp = client.post(
            endpoint,
            json={"input_text": SAMPLE_TEXT, "use_mediawiki": 1},
        )
        assert resp.status_code == 200
        data = resp.get_json()
        assert "output" in data
        assert "warning" not in data

    def test_successful_wiki_get_problems_no_warning(self, client):
        """Successful MediaWiki call on /get_problems should NOT include a warning."""
        resp = client.post(
            "/get_problems",
            json={"input_text": SAMPLE_TEXT, "use_mediawiki": 1},
        )
        assert resp.status_code == 200
        data = resp.get_json()
        assert "warning" not in data


# ===========================================================================
# Without use_mediawiki, no warning should appear
# ===========================================================================


class TestNoMediawikiNoWarning:
    """When use_mediawiki is not set (or 0), no warning should appear."""

    @pytest.mark.parametrize("endpoint", [
        "/get_mcq", "/get_boolq", "/get_shortq",
    ])
    def test_no_mediawiki_no_warning(self, client, endpoint):
        """Without use_mediawiki=1, no warning should appear."""
        resp = client.post(
            endpoint,
            json={"input_text": SAMPLE_TEXT, "use_mediawiki": 0},
        )
        assert resp.status_code == 200
        data = resp.get_json()
        assert "warning" not in data

    @pytest.mark.parametrize("endpoint", [
        "/get_mcq", "/get_boolq", "/get_shortq",
    ])
    def test_default_no_mediawiki_no_warning(self, client, endpoint):
        """When use_mediawiki is not sent, no warning should appear."""
        resp = client.post(
            endpoint,
            json={"input_text": SAMPLE_TEXT},
        )
        assert resp.status_code == 200
        data = resp.get_json()
        assert "warning" not in data


# ===========================================================================
# Various exception types are all caught
# ===========================================================================


class TestVariousExceptionTypes:
    """All exception types from MediaWiki should be caught and handled."""

    @pytest.mark.parametrize("exc_class,exc_msg", [
        (ConnectionError, "Network unreachable"),
        (TimeoutError, "Connection timed out"),
        (OSError, "SSL: CERTIFICATE_VERIFY_FAILED"),
        (RuntimeError, "Unexpected mediawiki error"),
        (Exception, "SSLEOFError EOF occurred in violation of protocol"),
    ])
    def test_various_exceptions_handled_on_mcq(self, client, exc_class, exc_msg):
        """All exception types from MediaWiki should be caught on /get_mcq."""
        with patch("server.mediawikiapi") as wiki_mock:
            wiki_mock.summary.side_effect = exc_class(exc_msg)
            resp = client.post(
                "/get_mcq",
                json={"input_text": SAMPLE_TEXT, "use_mediawiki": 1},
            )
        assert resp.status_code == 200
        data = resp.get_json()
        assert "output" in data
        assert "warning" in data


# ===========================================================================
# Original text is preserved when MediaWiki fails
# ===========================================================================


class TestTextPreservation:
    """Verify the correct text is forwarded to the generator."""

    def test_original_text_used_on_failure(self, client):
        """When MediaWiki fails, generation should use the original text."""
        with patch("server.mediawikiapi") as wiki_mock, \
             patch("server.MCQGen") as mcq_mock:
            wiki_mock.summary.side_effect = ConnectionError("fail")
            mcq_mock.generate_mcq.return_value = {
                "questions": [{
                    "question_statement": "Test?",
                    "answer": "Yes",
                    "id": 1,
                    "options": ["No", "Maybe"],
                    "extra_options": [],
                    "context": "ctx",
                }]
            }
            resp = client.post(
                "/get_mcq",
                json={"input_text": SAMPLE_TEXT, "use_mediawiki": 1},
            )
        assert resp.status_code == 200
        # Verify generate_mcq was called with the *original* text
        call_args = mcq_mock.generate_mcq.call_args
        assert call_args[0][0]["input_text"] == SAMPLE_TEXT

    def test_enriched_text_used_on_success(self, client):
        """When MediaWiki succeeds, enriched text is forwarded to generation."""
        enriched = "Enriched text from Wikipedia about AI and machine learning."
        with patch("server.mediawikiapi") as wiki_mock, \
             patch("server.MCQGen") as mcq_mock:
            wiki_mock.summary.return_value = enriched
            mcq_mock.generate_mcq.return_value = {
                "questions": [{
                    "question_statement": "Test?",
                    "answer": "Yes",
                    "id": 1,
                    "options": ["No", "Maybe"],
                    "extra_options": [],
                    "context": "ctx",
                }]
            }
            resp = client.post(
                "/get_mcq",
                json={"input_text": SAMPLE_TEXT, "use_mediawiki": 1},
            )
        assert resp.status_code == 200
        call_args = mcq_mock.generate_mcq.call_args
        assert call_args[0][0]["input_text"] == enriched
