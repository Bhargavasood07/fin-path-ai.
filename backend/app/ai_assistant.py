import time
from typing import List, Dict, Any, Tuple
from app.config import OPENAI_API_KEY, OPENAI_MODEL
from app.models import ChatSourceCitation, ChatMessageResponse
from app.official_sources import search_official_clauses

try:
    from openai import OpenAI
except ImportError:
    OpenAI = None

def generate_local_grounded_reply(user_message: str, relevant_clauses: List[Dict[str, Any]]) -> str:
    """
    Synthesizes a structured, highly authoritative financial advisor response
    grounded directly in the official RBI clauses retrieved.
    """
    msg_lower = user_message.lower()

    if not relevant_clauses:
        return (
            "According to official Reserve Bank of India (RBI) regulations, regulated entities (Banks and NBFCs) "
            "must adhere strictly to the Fair Practices Code and the April 2024 Key Facts Statement (KFS) directions. "
            "Every loan offer must disclose the all-inclusive Annual Percentage Rate (APR), provide an explicit cooling-off period, "
            "and eliminate hidden charges. Please ask about specific loan aspects such as APR calculation, cooling-off periods, "
            "penal charges, or grievance redressal for detailed clause references."
        )

    primary = relevant_clauses[0]
    sec_citations = ", ".join([f"`[{c['clause_id']}] {c['title']}`" for c in relevant_clauses])

    response_lines = [
        f"### **Official RBI Regulatory Guidance**",
        f"Based on **{primary['source_type']}** (*{primary['circular_id']}*):",
        "",
        f"> **{primary['title']} ({primary['clause_id']})**: \"{primary['text']}\"",
        "",
        f"#### **Key Consumer Protections & Borrower Rights:**"
    ]

    for takeaway in primary.get("key_takeaways", []):
        response_lines.append(f"- **{takeaway}**")

    # Domain specific guidance based on user message
    if "cooling" in msg_lower or "look-up" in msg_lower or "exit" in msg_lower or "cancel" in msg_lower:
        response_lines.extend([
            "",
            "#### **Borrower Action Plan:**",
            "- If your loan tenure is **7 days or longer**, you are legally entitled to at least **3 days** to change your mind and exit.",
            "- Lenders cannot levy any foreclosure charges or prepayment penalties during this window; you only return the principal plus interest accrued for those days."
        ])
    elif "penal" in msg_lower or "penalty" in msg_lower or "compound" in msg_lower:
        response_lines.extend([
            "",
            "#### **Borrower Action Plan:**",
            "- **Zero Compound Penal Interest**: RBI strictly bans lenders from capitalizing late payment fines into principal.",
            "- Penal charges must be levied separately as flat or simple fees and must never increase your underlying loan interest rate."
        ])
    elif "apr" in msg_lower or "fee" in msg_lower or "hidden" in msg_lower or "cost" in msg_lower:
        response_lines.extend([
            "",
            "#### **Borrower Action Plan:**",
            "- **The True Cost Rule**: If a charge (e.g. processing fee, valuation, credit insurance) is not explicitly listed in Part A & B of your KFS, **the lender cannot legally charge it** at any point in the loan lifecycle.",
            "- Always verify the **Annual Percentage Rate (APR)** rather than just the nominal interest rate."
        ])
    else:
        response_lines.extend([
            "",
            "#### **Compliance Checklist:**",
            "- Ensure your lender furnishes the standard Key Facts Statement (KFS) in simple language **before** signing the sanction letter.",
            "- Check the Principal Nodal Officer details and the 30-day resolution timeline."
        ])

    response_lines.append(f"\n*Official RBI References consulted: {sec_citations}*")
    return "\n".join(response_lines)

def process_assistant_chat(
    user_message: str,
    conversation_history: List[Dict[str, str]] = None,
    force_mode: str = "auto",
    custom_api_key: str = None
) -> ChatMessageResponse:
    start_time = time.time()
    relevant_clauses = search_official_clauses(user_message, top_k=3)

    citations: List[ChatSourceCitation] = [
        ChatSourceCitation(
            title=c["title"],
            circular_id=c["circular_id"],
            clause_id=c["clause_id"],
            section=c["section"],
            relevance_snippet=c["text"][:180] + "..." if len(c["text"]) > 180 else c["text"],
            url=c.get("url")
        )
        for c in relevant_clauses
    ]

    active_api_key = (custom_api_key or OPENAI_API_KEY or "").strip()
    use_openai = (force_mode == "openai") or (force_mode == "auto" and bool(active_api_key))

    if use_openai and OpenAI and active_api_key:
        try:
            client = OpenAI(api_key=active_api_key)

            # Grounding context from official RBI sources
            context_text = "\n\n".join([
                f"Source: {c['source_type']} | Circular: {c['circular_id']} | Clause {c['clause_id']} ({c['title']}):\n{c['text']}"
                for c in relevant_clauses
            ])

            system_prompt = (
                "You are FinPath AI, an expert, source-grounded financial compliance assistant "
                "specializing in Indian banking regulations, particularly the Reserve Bank of India (RBI) "
                "Key Facts Statement (KFS) circular (DOR.MCS.REC.21/01.01.001/2024-25) and Digital Lending Guidelines. "
                "Your mission is to protect borrowers, clarify loan contracts, calculate/explain APR vs nominal rate, "
                "and explain their legal consumer rights under RBI circulars.\n\n"
                "STRICT GROUNDING INSTRUCTIONS:\n"
                "1. Always cite official circular numbers and specific clause IDs (e.g., [RBI KFS-05 Cooling-off Window]).\n"
                "2. Provide clear, empathetic, practical borrower advice.\n"
                "3. Reference the following verified official RBI regulatory clauses:\n"
                f"{context_text}"
            )

            messages = [{"role": "system", "content": system_prompt}]
            if conversation_history:
                for msg in conversation_history[-6:]:
                    messages.append({"role": msg.get("role", "user"), "content": msg.get("content", "")})
            messages.append({"role": "user", "content": user_message})

            completion = client.chat.completions.create(
                model=OPENAI_MODEL or "gpt-4o-mini",
                messages=messages,
                temperature=0.2,
                max_tokens=800
            )

            reply = completion.choices[0].message.content
            latency = round((time.time() - start_time) * 1000, 1)

            return ChatMessageResponse(
                reply=reply,
                mode_used="openai_api",
                citations=citations,
                latency_ms=latency
            )
        except Exception as e:
            # Graceful fallback to local grounded engine if OpenAI API throws quota/auth error
            local_reply = generate_local_grounded_reply(user_message, relevant_clauses)
            local_reply += f"\n\n*(Note: OpenAI API request fell back to Local RBI Knowledge Base: {str(e)[:120]})*"
            latency = round((time.time() - start_time) * 1000, 1)
            return ChatMessageResponse(
                reply=local_reply,
                mode_used="local_grounded",
                citations=citations,
                latency_ms=latency
            )

    # Local Grounded Mode
    local_reply = generate_local_grounded_reply(user_message, relevant_clauses)
    latency = round((time.time() - start_time) * 1000, 1)
    return ChatMessageResponse(
        reply=local_reply,
        mode_used="local_grounded",
        citations=citations,
        latency_ms=latency
    )
