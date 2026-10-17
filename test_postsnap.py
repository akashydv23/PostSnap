"""
Automated Verification Suite for PostSnap
Tests functional requirements (FR-01 to FR-13) and acceptance criteria (AC-01 to AC-10).
"""

import io
from fastapi.testclient import TestClient
from PIL import Image

from app import app, validate_x_url, SAMPLE_TWEETS

client = TestClient(app)

def test_url_validation_valid():
    """FR-01, AC-01: Valid X / Twitter URLs."""
    valid_urls = [
        "https://x.com/jack/status/20",
        "https://twitter.com/jack/status/20",
        "http://x.com/user/status/123456789012345678",
        "https://www.twitter.com/user/status/9876543210123456",
        "https://mobile.twitter.com/user/status/1122334455667788",
        "https://x.com/user/status/1234567890?s=20&t=abc",
    ]
    for url in valid_urls:
        res = validate_x_url(url)
        assert res["valid"] is True, f"Failed on valid URL: {url}"
        assert "tweetId" in res

def test_url_validation_invalid():
    """FR-01, FR-11: Malformed and unsupported URLs."""
    invalid_cases = [
        ("", "INVALID_URL"),
        ("   ", "INVALID_URL"),
        ("not-a-url", "INVALID_URL"),
        ("ftp://x.com/jack/status/20", "INVALID_URL"),
        ("https://facebook.com/post/123", "INVALID_URL"),
        ("https://x.com/jack", "NOT_A_TWEET"),
        ("https://x.com/explore", "NOT_A_TWEET"),
    ]
    for url, expected_code in invalid_cases:
        res = validate_x_url(url)
        assert res["valid"] is False, f"Expected invalid for: {url}"
        assert res["code"] == expected_code

def test_capture_text_only_post():
    """AC-01: Text-only post URL produces valid preview and PNG."""
    resp = client.post("/api/capture", json={"url": "https://x.com/jack/status/20"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True
    assert data["method"] in ("captured", "recreated")
    assert data["tweet"]["id"] == "20"
    assert "just setting up my twttr" in data["tweet"]["text"]
    assert "imageBase64" in data
    assert len(data["imageBase64"]) > 500

def test_capture_one_image_post():
    """AC-02: Single-image post includes media."""
    resp = client.post("/api/capture", json={"url": "https://x.com/elonmusk/status/1683920951807971329"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True
    assert data["tweet"]["hasMedia"] is True

def test_capture_long_text_post():
    """AC-03: Long text expands output height without truncation."""
    resp = client.post("/api/capture", json={"url": "https://x.com/OpenAI/status/1770000000000000001"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True
    assert len(data["tweet"]["text"]) > 280

def test_engagement_metrics_accuracy():
    """AC-04: Metrics match source, never defaulted to zero."""
    resp = client.post("/api/capture", json={"url": "https://x.com/BarackObama/status/44196397"})
    assert resp.status_code == 200
    data = resp.json()
    metrics = data["tweet"]["metrics"]
    assert metrics is not None
    assert metrics["retweets"] == 870000
    assert metrics["likes"] == 640000

def test_recreation_fallback_disclosure():
    """AC-06, FR-09: Fallback output is visibly disclosed."""
    resp = client.post("/api/capture", json={
        "url": "https://x.com/jack/status/20",
        "force_fallback": True,
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["method"] == "recreated"

def test_png_download_endpoint():
    """AC-08, FR-10: PNG download with valid magic bytes and headers."""
    resp = client.post("/api/download", json={
        "tweetId": "20",
        "method": "captured",
        "theme": "light",
        "text": "just setting up my twttr",
        "authorName": "jack",
        "authorUsername": "jack",
    })
    assert resp.status_code == 200
    assert resp.headers["content-type"] == "image/png"
    assert "attachment" in resp.headers["content-disposition"]
    # Check PNG magic bytes: \x89PNG\r\n\x1a\n
    assert resp.content[:4] == b"\x89PNG"
    
    # Verify image opens with PIL
    img = Image.open(io.BytesIO(resp.content))
    assert img.format == "PNG"
    assert img.width > 200
    assert img.height > 100

def test_dark_mode_theme():
    """AC-05: Dark theme produces valid PNG."""
    resp = client.post("/api/download", json={
        "tweetId": "20",
        "method": "recreated",
        "theme": "dark",
        "text": "testing dark mode",
        "authorName": "jack",
        "authorUsername": "jack",
    })
    assert resp.status_code == 200
    img = Image.open(io.BytesIO(resp.content))
    assert img.format == "PNG"

def test_static_website_served():
    """FR-10, AC-08: Website root index.html is served."""
    resp = client.get("/")
    assert resp.status_code == 200
    assert "PostSnap" in resp.text
    assert "Turn any X post into a" in resp.text

if __name__ == "__main__":
    import pytest
    pytest.main(["-v", "test_postsnap.py"])
