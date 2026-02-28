"""Shared NLTK utility to avoid duplicating _safe_nltk_download across modules."""
import logging
import nltk

logger = logging.getLogger(__name__)


def safe_nltk_download(pkg):
    """Download an NLTK resource if not already present, logging failures."""
    try:
        nltk.data.find(pkg)
    except LookupError:
        try:
            success = nltk.download(pkg.split('/')[-1], quiet=True, raise_on_error=False)
            if not success:
                logger.warning("NLTK resource '%s' download returned False — resource may be unavailable", pkg)
        except Exception as e:
            logger.warning("Failed to download NLTK resource '%s': %s", pkg, e)
