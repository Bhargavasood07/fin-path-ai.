import json
from pathlib import Path
from typing import List, Dict, Any

OFFICIAL_DIR = Path(__file__).resolve().parent.parent / "official_sources"

_kfs_circular_cache = None
_digital_lending_cache = None
_sample_offers_cache = None

def get_kfs_circular_data() -> Dict[str, Any]:
    global _kfs_circular_cache
    if _kfs_circular_cache is None:
        file_path = OFFICIAL_DIR / "rbi_kfs_circular_2024.json"
        if file_path.exists():
            with open(file_path, "r", encoding="utf-8") as f:
                _kfs_circular_cache = json.load(f)
        else:
            _kfs_circular_cache = {"clauses": []}
    return _kfs_circular_cache

def get_digital_lending_data() -> Dict[str, Any]:
    global _digital_lending_cache
    if _digital_lending_cache is None:
        file_path = OFFICIAL_DIR / "rbi_digital_lending_guidelines.json"
        if file_path.exists():
            with open(file_path, "r", encoding="utf-8") as f:
                _digital_lending_cache = json.load(f)
        else:
            _digital_lending_cache = {"clauses": []}
    return _digital_lending_cache

def get_sample_loan_offers() -> List[Dict[str, Any]]:
    global _sample_offers_cache
    if _sample_offers_cache is None:
        file_path = OFFICIAL_DIR / "sample_loan_offers.json"
        if file_path.exists():
            with open(file_path, "r", encoding="utf-8") as f:
                _sample_offers_cache = json.load(f)
        else:
            _sample_offers_cache = []
    return _sample_offers_cache

def search_official_clauses(query: str, top_k: int = 3) -> List[Dict[str, Any]]:
    """
    Search across official RBI documents and return the most relevant clauses
    with exact citation details.
    """
    kfs_data = get_kfs_circular_data()
    dl_data = get_digital_lending_data()

    all_clauses = []
    for c in kfs_data.get("clauses", []):
        all_clauses.append({
            "source_type": "KFS Circular 2024",
            "circular_id": kfs_data.get("circular_id", "DOR.MCS.REC.21/01.01.001/2024-25"),
            "url": kfs_data.get("url", "https://www.rbi.org.in/scripts/NotificationUser.aspx?Id=12827"),
            "clause_id": c.get("clause_id"),
            "section": c.get("section"),
            "title": c.get("title"),
            "text": c.get("text"),
            "key_takeaways": c.get("key_takeaways", [])
        })

    for c in dl_data.get("clauses", []):
        all_clauses.append({
            "source_type": "Digital Lending Guidelines",
            "circular_id": dl_data.get("circular_id", "DOR.CRE.REC.66/21.07.001/2022-23"),
            "url": "https://www.rbi.org.in",
            "clause_id": c.get("clause_id"),
            "section": c.get("section"),
            "title": c.get("title"),
            "text": c.get("text"),
            "key_takeaways": c.get("key_takeaways", [])
        })

    keywords = query.lower().split()
    scored_clauses = []

    for item in all_clauses:
        searchable_text = f"{item['title']} {item['section']} {item['text']} {' '.join(item['key_takeaways'])}".lower()
        score = 0
        for kw in keywords:
            if len(kw) <= 2:
                continue
            if kw in searchable_text:
                score += 3
            if kw in item['title'].lower():
                score += 5

        # Domain term boosts
        if any(term in query.lower() for term in ["cooling", "look-up", "exit", "cancel"]) and "cooling" in item['title'].lower():
            score += 15
        if any(term in query.lower() for term in ["penal", "penalty", "default", "compound"]) and "penal" in item['title'].lower():
            score += 15
        if any(term in query.lower() for term in ["apr", "cost", "annual percentage", "fee", "hidden"]) and "apr" in item['title'].lower():
            score += 15
        if any(term in query.lower() for term in ["insurance", "third party", "bundled"]) and "third-party" in item['title'].lower():
            score += 15
        if any(term in query.lower() for term in ["ombudsman", "grievance", "complaint", "officer", "recovery"]) and "grievance" in item['title'].lower():
            score += 15

        if score > 0:
            scored_clauses.append((score, item))

    scored_clauses.sort(key=lambda x: x[0], reverse=True)
    results = [item for _, item in scored_clauses[:top_k]]

    # If no specific match, return top foundational clauses
    if not results and all_clauses:
        results = all_clauses[:top_k]

    return results
